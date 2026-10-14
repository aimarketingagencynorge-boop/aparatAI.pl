import { FieldValue } from 'firebase-admin/firestore';
import { ApiError } from './trial-store.mjs';
import { validateImage } from './app.mjs';

export function createVideoProvider(ai, apiKey) {
  return {
    async start(image, { aspectRatio, productName }) {
      const op = await ai.models.generateVideos({ model: 'veo-3.1-lite-generate-preview', prompt: `Professional cinematic product commercial of ${productName || 'product'}. Gentle camera movement. Preserve the exact product, label, logo, shape and color. No added text or new products. High quality.`, image: { imageBytes: image.toString('base64'), mimeType: 'image/jpeg' }, config: { numberOfVideos: 1, resolution: '1080p', durationSeconds: 8, aspectRatio } });
      if (!op.name) throw new Error('Video operation missing');
      return op.name;
    },
    async poll(name) {
      const op = await ai.operations.getVideosOperation({ operation: { name } });
      if (!op.done) return { done: false };
      const uri = op.response?.generatedVideos?.[0]?.video?.uri;
      return uri && !op.error ? { done: true, uri } : { done: true, failed: true };
    },
    async download(uri) {
      const url = new URL(uri);
      if (url.protocol !== 'https:' || url.hostname !== 'generativelanguage.googleapis.com') throw new Error('Invalid video location');
      const response = await fetch(url, { headers: { 'x-goog-api-key': apiKey }, redirect: 'error', signal: AbortSignal.timeout(60000) });
      if (!response.ok) throw new ApiError(410, 'VIDEO_EXPIRED', 'Film nie jest już dostępny u dostawcy.');
      const reader = response.body.getReader(); const chunks = []; let size = 0;
      for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 80 * 1024 * 1024) { await reader.cancel(); throw new Error('Video too large'); } chunks.push(value); }
      return Buffer.concat(chunks);
    },
  };
}

export function installVideo(app, { db, authenticate, provider, cost = 10, enabled = false }) {
  if (!Number.isSafeInteger(cost) || cost < 1 || cost > 10000) throw new Error('Invalid video credit cost');
  app.get('/api/studio/capabilities', (_req, res) => res.json({ photoCredits: 1, videoEnabled: enabled && !!provider, videoCredits: cost, videoSeconds: 8, videoResolution: '1080p', videoFormats: ['9:16', '16:9'] }));
  const ownedJob = async (req) => {
    if (!/^[A-Za-z0-9-]{10,80}$/.test(req.params.id)) throw new ApiError(404, 'JOB_MISSING', 'Nie znaleziono filmu.');
    const ref = db.collection('generationJobs').doc(req.params.id); const doc = await ref.get();
    if (!doc.exists || doc.data().uid !== req.account.uid || doc.data().kind !== 'video') throw new ApiError(404, 'JOB_MISSING', 'Nie znaleziono filmu.');
    return { ref, job: doc.data() };
  };
  const finish = async (ref, result) => db.runTransaction(async tx => {
    const doc = await tx.get(ref); const job = doc.data();
    if (job.state !== 'processing') return;
    const userRef = db.collection('users').doc(job.uid); const user = await tx.get(userRef);
    tx.update(ref, { state: result.failed ? 'failed' : 'succeeded', finishedAt: new Date().toISOString(), ...(result.failed ? { refunded: true } : { uri: result.uri }) });
    tx.update(userRef, { ...(result.failed ? { credits: FieldValue.increment(job.cost) } : {}), ...(user.data()?.activeGeneration === job.jobId ? { activeGeneration: FieldValue.delete() } : {}) });
  });
  app.post('/api/studio/video', authenticate, async (req, res, next) => {
    let ref;
    try {
      if (!enabled || !provider) throw new ApiError(503, 'VIDEO_DISABLED', 'Generowanie filmów nie jest jeszcze uruchomione.');
      const { requestId, aspectRatio, productName = '' } = req.body || {};
      if (!/^[a-f0-9-]{36}$/.test(requestId || '') || !['16:9', '9:16'].includes(aspectRatio) || typeof productName !== 'string' || productName.length > 200) throw new ApiError(400, 'INVALID_VIDEO', 'Wybierz pionowy lub poziomy format filmu.');
      const bytes = await validateImage(req.body.image);
      // The caller reuses this ID after a lost response; ownership is checked before returning it.
      ref = db.collection('generationJobs').doc(requestId);
      const userRef = db.collection('users').doc(req.account.uid);
      const existing = await db.runTransaction(async tx => {
        const [job, user] = await Promise.all([tx.get(ref), tx.get(userRef)]);
        if (job.exists) {
          if (job.data().uid !== req.account.uid || job.data().kind !== 'video') throw new ApiError(409, 'JOB_CONFLICT', 'Nieprawidłowe zlecenie.');
          return true;
        }
        if (!user.exists || user.data().credits < cost) throw new ApiError(402, 'NO_CREDITS', `Film wymaga ${cost} kredytów.`);
        if (user.data().activeGeneration) throw new ApiError(409, 'BUSY', 'Poprzednie ujęcie jest jeszcze przetwarzane.');
        tx.update(userRef, { credits: FieldValue.increment(-cost), activeGeneration: requestId });
        tx.create(ref, { uid: req.account.uid, jobId: requestId, kind: 'video', cost, state: 'starting', createdAt: new Date().toISOString() });
        return false;
      });
      if (existing) return res.json({ jobId: requestId });
      let operation;
      try { operation = await provider.start(bytes, { aspectRatio, productName }); }
      catch (e) {
        // Uncertain timeouts can still create a billable provider operation. Keep them for reconciliation.
        const uncertain = /timeout|abort|socket|network|fetch failed/i.test(e.message || '');
        await db.runTransaction(async tx => {
          const job = await tx.get(ref); const user = await tx.get(userRef);
          if (job.data()?.state !== 'starting') return;
          tx.update(ref, { state: uncertain ? 'needs_review' : 'failed', refunded: !uncertain });
          if (!uncertain) tx.update(userRef, { credits: FieldValue.increment(cost), ...(user.data()?.activeGeneration === requestId ? { activeGeneration: FieldValue.delete() } : {}) });
        });
        throw e;
      }
      await db.runTransaction(async tx => tx.update(ref, { state: 'processing', operation }));
      res.json({ jobId: requestId });
    } catch (e) { next(e); }
  });
  app.get('/api/studio/video/:id', authenticate, async (req, res, next) => {
    try {
      let { ref, job } = await ownedJob(req);
      if (job.state === 'processing') {
        if (!provider) throw new ApiError(503, 'VIDEO_UNAVAILABLE', 'Film jest chwilowo niedostępny.');
        const result = await provider.poll(job.operation);
        if (result.done) { await finish(ref, result); job = (await ref.get()).data(); }
      }
      res.json({ jobId: req.params.id, state: job.state, refunded: job.refunded === true, cost: job.cost });
    } catch (e) { next(e); }
  });
  app.get('/api/studio/video/:id/content', authenticate, async (req, res, next) => {
    try {
      const { job } = await ownedJob(req);
      if (job.state !== 'succeeded' || !provider) throw new ApiError(409, 'VIDEO_PENDING', 'Film nie jest jeszcze gotowy.');
      res.type('video/mp4').send(await provider.download(job.uri));
    } catch (e) { next(e); }
  });
}
