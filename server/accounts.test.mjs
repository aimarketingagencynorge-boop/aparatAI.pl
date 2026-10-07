import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import Stripe from 'stripe';
import { createApp, errorHandler } from './app.mjs';
import { installAccounts } from './accounts.mjs';
import { MemoryTrialStore, FirestoreTrialStore } from './trial-store.mjs';
import { TestDB } from './test-db.mjs';

const secret = 'test-secret-that-is-at-least-32-characters';
const image = `data:image/png;base64,${(await sharp({ create: { width: 8, height: 8, channels: 3, background: 'white' } }).png().toBuffer()).toString('base64')}`;
const webhookSecret = 'whsec_test_fixture';
const stripeSDK = new Stripe('sk_test_not_real');
async function fixture(t, options = {}) {
  const db = new TestDB(); let calls = 0;
  const generate = async () => { calls++; await new Promise(r => setTimeout(r, 20)); if (options.fail) throw new Error('Provider failed'); return image; };
  const app = createApp({ store: new MemoryTrialStore(), secret, origins: ['https://aparatai.pl'], generate, logger: () => {} });
  const stripe = { webhooks: stripeSDK.webhooks, checkout: { sessions: { listLineItems: async () => ({ data: [{ price: { id: 'price_starter' }, quantity: 1 }] }) } } };
  installAccounts(app, { db, generate, origin: 'https://aparatai.pl', stripeClient: stripe, configuredPlans: [{ id: 'starter', credits: 100, price: 'price_starter' }], webhookSecret, verifyToken: async token => { if (token !== 'valid') throw new Error(); return { uid: 'u1', email: 'test@example.com' }; } });
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1'); await new Promise(r => server.once('listening', r));
  t.after(() => new Promise(r => server.close(r)));
  const url = `http://127.0.0.1:${server.address().port}`;
  const auth = { Authorization: 'Bearer valid' };
  const post = (path, body, headers = auth) => fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  return { db, url, post, auth, calls: () => calls };
}
test('new accounts have zero credits; an invalid token cannot generate', async t => {
  const f = await fixture(t);
  assert.equal((await f.post('/api/studio', { image, scene: 'white' }, { Authorization: 'Bearer forged' })).status, 401);
  const account = await (await fetch(f.url + '/api/account', { headers: f.auth })).json();
  assert.equal(account.credits, 0);
  assert.equal((await f.post('/api/studio', { image, scene: 'white' })).status, 402);
  assert.equal(f.calls(), 0);
});
test('one purchased credit cannot fund two concurrent generations', async t => {
  const f = await fixture(t);
  f.db.documents.set('users/u1', { uid: 'u1', credits: 1, totalCredits: 1, plan: 'starter' });
  const responses = await Promise.all([f.post('/api/studio', { image, scene: 'white' }), f.post('/api/studio', { image, scene: 'white' })]);
  assert.equal(responses.filter(r => r.status === 200).length, 1);
  assert.equal(f.db.documents.get('users/u1').credits, 0);
  assert.equal(f.calls(), 1);
});
test('failed paid generation refunds exactly one credit and releases account lock', async t => {
  const f = await fixture(t, { fail: true });
  f.db.documents.set('users/u1', { uid: 'u1', credits: 2, totalCredits: 2, plan: 'starter' });
  assert.equal((await f.post('/api/studio', { image, scene: 'white' })).status, 503);
  assert.equal(f.db.documents.get('users/u1').credits, 2);
  assert.equal(f.db.documents.get('users/u1').activeGeneration, undefined);
  assert.equal([...f.db.documents.entries()].find(([key]) => key.startsWith('generationJobs/'))[1].refunded, true);
});
test('signed Stripe event credits once across duplicate and async-completed deliveries; unsigned event denied', async t => {
  const f = await fixture(t);
  f.db.documents.set('users/u1', { uid: 'u1', credits: 0, totalCredits: 0, plan: 'free' });
  const event = { id: 'evt_test1', type: 'checkout.session.completed', data: { object: { id: 'cs_test_1', payment_status: 'paid', client_reference_id: 'u1', metadata: { plan: 'starter' } } } };
  const send = event => f.post('/api/stripe/webhook', event, { 'stripe-signature': stripeSDK.webhooks.generateTestHeaderString({ payload: JSON.stringify(event), secret: webhookSecret }) });
  assert.equal((await f.post('/api/stripe/webhook', event, {})).status, 400);
  assert.equal((await send(event)).status, 200);
  assert.equal((await send(event)).status, 200);
  assert.equal((await send({ ...event, id: 'evt_test2', type: 'checkout.session.async_payment_succeeded' })).status, 200);
  assert.equal(f.db.documents.get('users/u1').credits, 100);
  assert.equal(f.db.documents.get('users/u1').totalCredits, 100);
});
test('unpaid or unknown-plan Stripe event does not grant credits', async t => {
  const f = await fixture(t);
  f.db.documents.set('users/u1', { uid: 'u1', credits: 0, totalCredits: 0, plan: 'free' });
  for (const [paid, plan, expected] of [['unpaid', 'starter', 200], ['paid', 'forged', 400]]) {
    const event = { id: 'evt_bad', type: 'checkout.session.completed', data: { object: { id: 'cs_bad', payment_status: paid, client_reference_id: 'u1', metadata: { plan } } } };
    const signature = stripeSDK.webhooks.generateTestHeaderString({ payload: JSON.stringify(event), secret: webhookSecret });
    assert.equal((await f.post('/api/stripe/webhook', event, { 'stripe-signature': signature })).status, expected);
  }
  assert.equal(f.db.documents.get('users/u1').credits, 0);
});
test('Firestore-backed trial survives a new store instance and serializes reservations', async () => {
  const db = new TestDB();
  const first = new FirestoreTrialStore(db, 2), restarted = new FirestoreTrialStore(db, 2);
  const results = await Promise.allSettled([first.reserve('network', 'one'), restarted.reserve('network', 'two')]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(await restarted.status('network'), 'processing');
  await restarted.reserve('another', 'three');
  await assert.rejects(first.reserve('third', 'four'), e => e.code === 'DAILY_LIMIT');
});
