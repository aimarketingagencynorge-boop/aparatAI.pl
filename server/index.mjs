import 'dotenv/config';
import { resolve } from 'node:path';
import express from 'express';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';
import { createApp, errorHandler, scenes } from './app.mjs';
import { FirestoreTrialStore, MemoryTrialStore } from './trial-store.mjs';
import { installAccounts } from './accounts.mjs';
import { generateStudioBackground, analyzeFoodImage } from './legacy-gemini.mjs';

const localPreview = process.env.LOCAL_PREVIEW === 'true';
if (localPreview && process.env.NODE_ENV === 'production') throw new Error('Local preview is forbidden in production');
const secret = process.env.TRIAL_IP_SECRET;
if (!secret || secret.length < 32) throw new Error('TRIAL_IP_SECRET must contain at least 32 characters');
const dailyLimit = Number(process.env.TRIAL_DAILY_LIMIT || 50);
if (!Number.isInteger(dailyLimit) || dailyLimit < 1) throw new Error('Invalid TRIAL_DAILY_LIMIT');
let store, db;
if (localPreview) store = new MemoryTrialStore(dailyLimit);
else {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is required on the server');
  const firebase = initializeApp({ credential: applicationDefault(), projectId: process.env.GOOGLE_CLOUD_PROJECT });
  db = getFirestore(firebase, process.env.FIRESTORE_DATABASE_ID || '(default)');
  store = new FirestoreTrialStore(db, dailyLimit);
}
const origins = (process.env.APP_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000').split(',').map(s => s.trim());
if (process.env.NODE_ENV === 'production' && (!process.env.APP_ORIGINS || !process.env.TRUST_PROXY_HOPS)) throw new Error('Production requires explicit APP_ORIGINS and TRUST_PROXY_HOPS');
const hops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (!Number.isInteger(hops) || hops < 0 || hops > 5) throw new Error('Invalid TRUST_PROXY_HOPS');
const ai = localPreview ? null : new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const generate = async (bytes, scene, legacy) => {
    if (localPreview) return `data:image/jpeg;base64,${bytes.toString('base64')}`;
    if (legacy) {
      const analysis = legacy.productName ? { productName: legacy.productName } : null;
      return generateStudioBackground({ originalImage: `data:image/jpeg;base64,${bytes.toString('base64')}`, transformedImage: legacy.isRefresh ? 'previous-take' : null, analysis }, legacy.settings, legacy.forceFlash);
    }
    const result = await ai.models.generateContent({
      model: process.env.TRIAL_IMAGE_MODEL || 'gemini-2.5-flash-image',
      contents: { parts: [
        { inlineData: { mimeType: 'image/jpeg', data: bytes.toString('base64') } },
        { text: `Edit this exact product photograph for an online store. Change only background and lighting. Preserve the product's shape, proportions, color, material, logo, printed text and all identifying details. Do not add products, accessories, claims or text. ${scenes[scene]}` },
      ] },
      config: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: '1:1' }, httpOptions: { timeout: 120000 } },
    });
    const image = result.candidates?.[0]?.content?.parts?.find(part => part.inlineData?.mimeType?.startsWith('image/'))?.inlineData;
    if (!image) throw new Error('No image output');
    return `data:${image.mimeType};base64,${image.data}`;
  };
const app = createApp({ store, secret, origins, trustProxy: hops || false, localPreview, generate });
if (db) installAccounts(app, { db, generate, analyze: analyzeFoodImage, origin: origins[0] });
else {
  app.get('/api/plans', (_req, res) => res.json({ plans: [] }));
}
app.use('/api', (_req, res) => res.status(404).json({ error: { message: 'Nieznana funkcja API.' } }));
app.use(express.static(resolve('dist')));
app.get('/{*path}', (_req, res) => res.sendFile(resolve('dist/index.html')));
app.use(errorHandler);
const port = Number(process.env.PORT || 8080);
app.listen(port, localPreview ? '127.0.0.1' : '0.0.0.0', () => console.log(JSON.stringify({ event: 'server_started', port, localPreview })));
