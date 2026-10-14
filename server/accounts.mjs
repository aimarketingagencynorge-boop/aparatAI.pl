import Stripe from 'stripe';
import express from 'express';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import { ApiError } from './trial-store.mjs';
import { scenes, validateImage } from './app.mjs';
import { validateLegacyRequest } from './legacy-settings.mjs';
import { grantPurchase } from './credit-ledger.mjs';
import { installPayPal, paypalClient } from './paypal.mjs';
import { installVideo } from './video.mjs';

export function installAccounts(app, { db, generate, analyze, origin, stripeClient, verifyToken = token => getAuth().verifyIdToken(token, true), configuredPlans, webhookSecret = process.env.STRIPE_WEBHOOK_SECRET, paypal = paypalClient(), videoProvider, videoEnabled = process.env.VIDEO_ENABLED === 'true', videoCost = Number(process.env.VIDEO_CREDIT_COST || 10), stripeMode = process.env.STRIPE_MODE || (/^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY || '') ? 'test' : 'live'), testEmails = (process.env.STRIPE_TEST_EMAILS || '').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean) }) {
  if (!['test','live'].includes(stripeMode)) throw new Error('Invalid STRIPE_MODE');
  if (process.env.STRIPE_SECRET_KEY && !new RegExp(`^(sk|rk)_${stripeMode}_`).test(process.env.STRIPE_SECRET_KEY)) throw new Error('Stripe key and mode do not match');
  const testing = stripeMode === 'test';
  const canTest = account => !testing || (account?.email_verified === true && testEmails.includes(account.email?.toLowerCase()));
  const stripe = stripeClient === undefined ? (process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null) : stripeClient;
  const plans = configuredPlans || (process.env.CREDIT_PACKAGES_JSON ? JSON.parse(process.env.CREDIT_PACKAGES_JSON) : [
    { id: 'mini', credits: 20, price: process.env.STRIPE_MINI_PRICE_ID, amount: 4900, currency: 'pln' },
    { id: 'starter', credits: 100, price: process.env.STRIPE_STARTER_PRICE_ID, amount: 19900, currency: 'pln' },
    { id: 'pro', credits: 500, price: process.env.STRIPE_PRO_PRICE_ID, amount: 79900, currency: 'pln' },
  ].filter(plan => plan.price));
  if (!Array.isArray(plans) || plans.some(p => !/^[a-z0-9_-]{1,40}$/.test(p.id) || !Number.isSafeInteger(p.credits) || p.credits < 1)) throw new Error('Invalid credit packages');
  const getPlans = async () => Promise.all(plans.map(async plan => {
    if (plan.price && stripe && webhookSecret) {
      const price = await stripe.prices.retrieve(plan.price);
      if (!price.active || price.recurring || price.unit_amount == null || (price.livemode !== undefined && price.livemode !== !testing) || (plan.amount !== undefined && (price.unit_amount !== plan.amount || price.currency !== plan.currency))) throw new Error('Stripe price does not match approved package');
      return { id: plan.id, credits: plan.credits, amount: price.unit_amount, currency: price.currency, methods: ['stripe', ...(paypal ? ['paypal'] : [])] };
    }
    if (!Number.isSafeInteger(plan.amount) || plan.amount < 1 || !['pln','eur','usd','nok'].includes(plan.currency)) throw new Error('Invalid package amount');
    return { id: plan.id, credits: plan.credits, amount: plan.amount, currency: plan.currency, methods: paypal ? ['paypal'] : [] };
  }));
  const fulfillStripe = async (session, uid) => {
    if (uid && session.client_reference_id !== uid) throw new ApiError(404, 'ORDER_MISSING', 'Nie znaleziono zamówienia na Twoim koncie.');
    if (session.payment_status !== 'paid') return false;
    if (session.livemode !== undefined && session.livemode !== !testing) throw new ApiError(400, 'STRIPE_MODE_MISMATCH', 'Nieprawidłowy tryb płatności.');
    const plan = plans.find(p => p.id === session.metadata?.plan);
    const owner = session.client_reference_id;
    if (!plan || !plan.price || !owner) throw new ApiError(400, 'INVALID_ORDER', 'Nieprawidłowe zamówienie.');
    const saved = await db.collection('stripeOrders').doc(session.id).get();
    const order = saved.exists ? saved.data() : null;
    if (testing && (!order?.testAuthorized || order.stripeMode !== 'test')) throw new ApiError(403, 'TEST_ACCOUNT_REQUIRED', 'Zakupy testowe nie są dostępne na tym koncie.');
    if (order && (order.uid !== owner || order.plan !== plan.id || session.amount_total !== order.amount || session.currency !== order.currency)) throw new ApiError(400, 'INVALID_ORDER', 'Nieprawidłowe zamówienie.');
    const items = await stripe.checkout.sessions.listLineItems(session.id);
    if (items.data.length !== 1 || items.data[0].price?.id !== (order?.price || plan.price) || items.data[0].quantity !== 1) throw new ApiError(400, 'INVALID_ORDER', 'Nieprawidłowe zamówienie.');
    await grantPurchase(db, { receiptId: session.id, uid: owner, plan: plan.id, credits: order?.credits || plan.credits, provider: 'stripe', amount: session.amount_total, currency: session.currency });
    return true;
  };

  // Raw body parsing must precede JSON parsing for signature verification.
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), async (req, res, next) => {
    try {
      if (!stripe || !webhookSecret) throw new ApiError(503, 'PAYMENTS_DISABLED', 'Płatności nie są jeszcze uruchomione.');
      let event;
      try { event = stripe.webhooks.constructEvent(req.body, req.get('stripe-signature'), webhookSecret); }
      catch { throw new ApiError(400, 'INVALID_SIGNATURE', 'Nieprawidłowy podpis.'); }
      if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
        const session = event.data.object;
        if (session.payment_status === 'paid') await fulfillStripe(session);
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
  installPayPal(app, { db, authenticate, client: paypal, getPlans, origin });
  installVideo(app, { db, authenticate, provider: videoProvider, cost: videoCost, enabled: videoEnabled });
  app.post('/api/checkout/confirm', authenticate, async (req, res, next) => {
    try {
      if (!stripe || !webhookSecret) throw new ApiError(503, 'PAYMENTS_DISABLED', 'Płatności nie są jeszcze uruchomione.');
      const id = req.body?.sessionId;
      if (typeof id !== 'string' || !/^cs_[a-zA-Z0-9_]{5,200}$/.test(id)) throw new ApiError(400, 'INVALID_ORDER', 'Nieprawidłowe zamówienie.');
      const session = await stripe.checkout.sessions.retrieve(id);
      res.json({ status: await fulfillStripe(session, req.account.uid) ? 'credited' : 'pending' });
    } catch (e) { next(e); }
  });
  app.get('/api/account', authenticate, async (req, res, next) => {
    try {
      const ref = db.collection('users').doc(req.account.uid);
      const user = await db.runTransaction(async tx => {
        const doc = await tx.get(ref);
        if (doc.exists) return doc.data();
        const initial = { uid: req.account.uid, email: req.account.email || '', credits: 0, totalCredits: 0, plan: 'free', createdAt: new Date().toISOString() };
        tx.create(ref, initial); return initial;
      });
      res.json({ credits: user.credits, plan: user.plan, activeGeneration: user.activeGeneration || null });
    } catch (e) { next(e); }
  });
  app.get('/api/plans', async (_req, res, next) => {
    try {
      if (testing) {
        const token = _req.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
        let account;
        if (token) { try { account = await verifyToken(token); } catch { /* Public visitors do not see test checkout. */ } }
        if (!canTest(account)) return res.json({ plans: [], testMode: true });
      }
      res.json({ plans: (await getPlans()).filter(p => p.methods.length), testMode: testing });
    } catch (e) { next(e); }
  });
  app.post('/api/checkout', authenticate, async (req, res, next) => {
    try {
      if (!canTest(req.account)) throw new ApiError(403, 'TEST_ACCOUNT_REQUIRED', 'Zakupy testowe nie są dostępne na tym koncie.');
      const plan = plans.find(p => p.id === req.body?.plan);
      if (!stripe || !webhookSecret || !plan?.price) throw new ApiError(503, 'PAYMENTS_DISABLED', 'Płatności nie są jeszcze uruchomione.');
      const price = await stripe.prices.retrieve(plan.price);
      if (!price.active || price.recurring || price.unit_amount == null || (price.livemode !== undefined && price.livemode !== !testing) || (plan.amount !== undefined && (price.unit_amount !== plan.amount || price.currency !== plan.currency))) throw new Error('Invalid price');
      const account = await db.collection('users').doc(req.account.uid).get();
      if (!account.exists) throw new ApiError(409, 'ACCOUNT_REQUIRED', 'Odśwież panel konta.');
      const session = await stripe.checkout.sessions.create({ mode: 'payment', locale: 'pl', line_items: [{ price: plan.price, quantity: 1 }], client_reference_id: req.account.uid, metadata: { plan: plan.id }, success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${origin}/?payment=cancelled` });
      await db.runTransaction(async tx => tx.create(db.collection('stripeOrders').doc(session.id), { uid: req.account.uid, plan: plan.id, credits: plan.credits, price: plan.price, amount: price.unit_amount, currency: price.currency, stripeMode, testAuthorized: testing && canTest(req.account), createdAt: new Date().toISOString() }));
      res.json({ url: session.url });
    } catch (e) { next(e); }
  });
  app.post('/api/studio/analyze', authenticate, async (req, res, next) => {
    try {
      const user = await db.collection('users').doc(req.account.uid).get();
      if (!user.exists || user.data().credits < 1) throw new ApiError(402,'NO_CREDITS','Brak zdjęć na koncie.');
      const image = await validateImage(req.body?.image);
      if (!analyze) throw new ApiError(503,'ANALYSIS_UNAVAILABLE','Analiza jest chwilowo niedostępna.');
      res.json({ analysis: await analyze(image.toString('base64')) });
    } catch(e) { next(e); }
  });
  app.post('/api/studio', authenticate, async (req, res, next) => {
    const jobId = randomUUID();
    const userRef = db.collection('users').doc(req.account.uid);
    const jobRef = db.collection('generationJobs').doc(jobId);
    let reserved = false;
    try {
      const legacy = req.body && validateLegacyRequest(req.body);
      if (!req.body || (!legacy && !Object.hasOwn(scenes, req.body.scene))) throw new ApiError(400, 'INVALID_SCENE', 'Wybierz dostępne tło.');
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
      const result = await generate(image, req.body.scene, legacy);
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
