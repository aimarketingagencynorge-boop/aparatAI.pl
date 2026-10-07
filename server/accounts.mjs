import Stripe from 'stripe';
import express from 'express';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { ApiError } from './trial-store.mjs';
import { scenes, validateImage } from './app.mjs';

export function installAccounts(app, { db, generate, origin, stripeClient, verifyToken = token => getAuth().verifyIdToken(token, true), configuredPlans, webhookSecret = process.env.STRIPE_WEBHOOK_SECRET }) {
  const stripe = stripeClient === undefined ? (process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null) : stripeClient;
  const plans = configuredPlans || [
    { id: 'starter', credits: 100, price: process.env.STRIPE_STARTER_PRICE_ID },
    { id: 'pro', credits: 500, price: process.env.STRIPE_PRO_PRICE_ID },
  ].filter(plan => plan.price);

  // Raw body parsing must precede JSON parsing for signature verification.
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res, next) => {
    try {
      if (!stripe || !webhookSecret) throw new ApiError(503, 'PAYMENTS_DISABLED', 'Płatności nie są jeszcze uruchomione.');
      let event;
      try { event = stripe.webhooks.constructEvent(req.body, req.get('stripe-signature'), webhookSecret); }
      catch { throw new ApiError(400, 'INVALID_SIGNATURE', 'Nieprawidłowy podpis.'); }
      if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
        const session = event.data.object;
        if (session.payment_status === 'paid') {
          const plan = plans.find(p => p.id === session.metadata?.plan);
          const uid = session.client_reference_id;
          if (!plan || !uid || uid.includes('/') || uid.length > 128) throw new ApiError(400, 'INVALID_ORDER', 'Nieprawidłowe zamówienie.');
          const items = await stripe.checkout.sessions.listLineItems(session.id);
          if (items.data.length !== 1 || items.data[0].price?.id !== plan.price || items.data[0].quantity !== 1) throw new ApiError(400, 'INVALID_ORDER', 'Nieprawidłowe zamówienie.');
          await db.runTransaction(async tx => {
            const receipt = db.collection('paymentReceipts').doc(session.id);
            const userRef = db.collection('users').doc(uid);
            const [exists, user] = await Promise.all([tx.get(receipt), tx.get(userRef)]);
            if (exists.exists) return;
            if (!user.exists) throw new Error('Account missing');
            tx.create(receipt, { uid, plan: plan.id, credits: plan.credits, eventId: event.id, createdAt: new Date().toISOString() });
            tx.update(userRef, { credits: FieldValue.increment(plan.credits), totalCredits: FieldValue.increment(plan.credits), plan: plan.id });
          });
        }
      }
      res.json({ received: true });
    } catch (e) { next(e); }
  });

  const authenticate = async (req, _res, next) => {
    try {
      const token = req.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
      if (!token) throw new Error('Missing token');
      req.account = await verifyToken(token);
      next();
    } catch { next(new ApiError(401, 'LOGIN_REQUIRED', 'Zaloguj się, aby kontynuować.')); }
  };
  app.get('/api/account', authenticate, async (req, res, next) => {
    try {
      const ref = db.collection('users').doc(req.account.uid);
      const user = await db.runTransaction(async tx => {
        const doc = await tx.get(ref);
        if (doc.exists) return doc.data();
        const initial = { uid: req.account.uid, email: req.account.email || '', credits: 0, totalCredits: 0, plan: 'free', createdAt: new Date().toISOString() };
        tx.create(ref, initial); return initial;
      });
      res.json({ credits: user.credits, plan: user.plan });
    } catch (e) { next(e); }
  });
  app.get('/api/plans', async (_req, res, next) => {
    try {
      if (!stripe || !webhookSecret) return res.json({ plans: [] });
      const prices = await Promise.all(plans.map(async plan => {
        const price = await stripe.prices.retrieve(plan.price);
        if (!price.active || price.recurring || price.unit_amount == null) throw new Error('Only active one-time prices are supported');
        return { id: plan.id, credits: plan.credits, amount: price.unit_amount, currency: price.currency };
      }));
      res.json({ plans: prices });
    } catch (e) { next(e); }
  });
  app.post('/api/checkout', authenticate, async (req, res, next) => {
    try {
      const plan = plans.find(p => p.id === req.body?.plan);
      if (!stripe || !webhookSecret || !plan) throw new ApiError(503, 'PAYMENTS_DISABLED', 'Płatności nie są jeszcze uruchomione.');
      const price = await stripe.prices.retrieve(plan.price);
      if (!price.active || price.recurring || price.unit_amount == null) throw new Error('Invalid price');
      const account = await db.collection('users').doc(req.account.uid).get();
      if (!account.exists) throw new ApiError(409, 'ACCOUNT_REQUIRED', 'Odśwież panel konta.');
      const session = await stripe.checkout.sessions.create({ mode: 'payment', line_items: [{ price: plan.price, quantity: 1 }], client_reference_id: req.account.uid, metadata: { plan: plan.id }, success_url: `${origin}/?payment=success`, cancel_url: `${origin}/?payment=cancelled` });
      res.json({ url: session.url });
    } catch (e) { next(e); }
  });
  app.post('/api/studio', authenticate, async (req, res, next) => {
    const jobId = randomUUID();
    const userRef = db.collection('users').doc(req.account.uid);
    const jobRef = db.collection('generationJobs').doc(jobId);
    let reserved = false;
    try {
      if (!req.body || !Object.hasOwn(scenes, req.body.scene)) throw new ApiError(400, 'INVALID_SCENE', 'Wybierz dostępne tło.');
      const image = await validateImage(req.body.image);
      await db.runTransaction(async tx => {
        const user = await tx.get(userRef);
        if (!user.exists || user.data().credits < 1) throw new ApiError(402, 'NO_CREDITS', 'Wybierz pakiet zdjęć, aby kontynuować.');
        // One active generation per account, even across tabs and server instances.
        if (user.data().activeGeneration) throw new ApiError(409, 'BUSY', 'Poprzednie zdjęcie jest jeszcze przetwarzane.');
        tx.update(userRef, { credits: FieldValue.increment(-1), activeGeneration: jobId });
        tx.create(jobRef, { uid: req.account.uid, state: 'processing', createdAt: new Date().toISOString() });
      }); reserved = true;
      console.log(JSON.stringify({ event: 'studio_started', requestId: req.requestId, jobId }));
      const result = await generate(image, req.body.scene);
      await db.runTransaction(async tx => {
        const user = await tx.get(userRef);
        tx.update(jobRef, { state: 'succeeded', finishedAt: new Date().toISOString() });
        if (user.data()?.activeGeneration === jobId) tx.update(userRef, { activeGeneration: FieldValue.delete() });
      });
      console.log(JSON.stringify({ event: 'studio_succeeded', requestId: req.requestId, jobId }));
      res.json({ image: result, jobId });
    } catch (e) {
      if (reserved) {
        console.log(JSON.stringify({ event: 'studio_failed', requestId: req.requestId, jobId }));
        try { await db.runTransaction(async tx => {
          const [job, user] = await Promise.all([tx.get(jobRef), tx.get(userRef)]);
          if (job.data()?.state !== 'processing') return;
          tx.update(jobRef, { state: 'failed', refunded: true, finishedAt: new Date().toISOString() });
          tx.update(userRef, { credits: FieldValue.increment(1), ...(user.data()?.activeGeneration === jobId ? { activeGeneration: FieldValue.delete() } : {}) });
        }); } catch { /* Fail closed; reconciliation can inspect durable job. */ }
      }
      next(e);
    }
  });
}
