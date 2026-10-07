import express from 'express';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import sharp from 'sharp';
import { rateLimit } from 'express-rate-limit';
import { identity, ApiError } from './trial-store.mjs';

export const scenes = {
  white: 'Clean white seamless product photography background, soft studio lighting, natural contact shadow.',
  beige: 'Warm beige studio background, subtle natural window lighting, minimal composition.',
  dark: 'Dark charcoal satin studio surface, elegant rim lighting, premium commercial composition.',
};

export async function validateImage(image) {
  const match = typeof image === 'string' && image.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || match[2].length > 7 * 1024 * 1024) throw new ApiError(400, 'INVALID_IMAGE', 'Wybierz zdjęcie JPG, PNG lub WebP, do 5 MB.');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 5 * 1024 * 1024) throw new ApiError(413, 'IMAGE_TOO_LARGE', 'Zdjęcie może mieć maksymalnie 5 MB.');
  try {
    const image = sharp(bytes, { limitInputPixels: 40_000_000, animated: false });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format) || (metadata.pages || 1) > 1) throw new Error('format');
    const normalized = await image.rotate().resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 90 }).toBuffer();
    return normalized;
  } catch { throw new ApiError(400, 'INVALID_IMAGE', 'Nie udało się odczytać zdjęcia. Wybierz inny plik JPG, PNG lub WebP.'); }
}

export function createApp({ store, secret, generate, origins, trustProxy = false, localPreview = false, logger = console.log }) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use('/api', (req, res, next) => {
    req.requestId = randomUUID(); res.setHeader('X-Request-Id', req.requestId);
    res.setHeader('Cache-Control', 'no-store');
    const started = Date.now();
    res.on('finish', () => logger(JSON.stringify({ event: 'request', requestId: req.requestId, method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - started })));
    const origin = req.get('origin');
    if ((origin && !origins.includes(origin)) || req.get('sec-fetch-site') === 'cross-site') return next(new ApiError(403, 'ORIGIN_BLOCKED', 'To żądanie nie pochodzi ze strony AparatAI.'));
    next();
  });
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 30, ipv6Subnet: 64, standardHeaders: 'draft-8', legacyHeaders: false, skip: req => req.path === '/stripe/webhook', validate: { xForwardedForHeader: false }, handler: (_req, _res, next) => next(new ApiError(429, 'RATE_LIMIT', 'Zbyt wiele żądań. Spróbuj ponownie za minutę.')) }));
  const json = express.json({ limit: '8mb' });
  app.use('/api', (req, res, next) => req.path === '/stripe/webhook' ? next() : json(req, res, next));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/trial', async (req, res, next) => {
    try {
      if (!isIP(req.ip)) throw new ApiError(503, 'IP_UNAVAILABLE', 'Test jest chwilowo niedostępny.');
      res.json({ state: await store.status(identity(req.ip, secret)), localPreview });
    } catch (e) { next(e); }
  });
  app.post('/api/trial', async (req, res, next) => {
    let key, reserved = false;
    try {
      if (!isIP(req.ip)) throw new ApiError(503, 'IP_UNAVAILABLE', 'Test jest chwilowo niedostępny.');
      if (!req.body || !Object.hasOwn(scenes, req.body.scene)) throw new ApiError(400, 'INVALID_SCENE', 'Wybierz dostępne tło.');
      key = identity(req.ip, secret);
      if (await store.status(key) !== 'available') throw new ApiError(409, 'TRIAL_USED', 'Darmowy test z tej sieci został już wykorzystany. Zaloguj się, aby kontynuować.');
      const bytes = await validateImage(req.body.image);
      await store.reserve(key, req.requestId); reserved = true;
      logger(JSON.stringify({ event: 'trial_started', requestId: req.requestId, network: key.slice(0, 16), scene: req.body.scene }));
      const image = await generate(bytes, req.body.scene);
      await store.complete(key, req.requestId, 'succeeded');
      logger(JSON.stringify({ event: 'trial_succeeded', requestId: req.requestId }));
      res.json({ image, state: 'succeeded', localPreview });
    } catch (error) {
      if (reserved) {
        // Keep the reservation after uncertain provider failures: retries must not create unlimited paid calls.
        try { await store.complete(key, req.requestId, 'failed'); } catch { /* reservation remains locked */ }
        logger(JSON.stringify({ event: 'trial_failed', requestId: req.requestId }));
      }
      next(error);
    }
  });
  // The public API deliberately offers no generic model/proxy or account upgrade endpoint.
  return app;
}

export function errorHandler(error, req, res, _next) {
  const status = error instanceof ApiError ? error.status : error.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 503;
  const message = error instanceof ApiError ? error.message : status === 413 ? 'Zdjęcie jest za duże.' : status === 400 ? 'Nieprawidłowe żądanie.' : 'Nie udało się dokończyć testu. Zachowaj numer zgłoszenia i skontaktuj się z obsługą.';
  res.status(status).json({ error: { code: error instanceof ApiError ? error.code : 'REQUEST_FAILED', message, requestId: req.requestId } });
}
