import { randomUUID } from 'node:crypto';
import { ApiError } from './trial-store.mjs';
import { grantPurchase } from './credit-ledger.mjs';

export function paypalClient({ clientId = process.env.PAYPAL_CLIENT_ID, secret = process.env.PAYPAL_CLIENT_SECRET, mode = process.env.PAYPAL_MODE || 'sandbox' } = {}) {
  if (!clientId || !secret) return null;
  if (!['sandbox', 'live'].includes(mode)) throw new Error('Invalid PAYPAL_MODE');
  const base = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  let token, expires = 0;
  return async (path, method = 'GET', body, requestId) => {
    if (Date.now() >= expires) {
      const response = await fetch(`${base}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials', signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new ApiError(503, 'PAYPAL_UNAVAILABLE', 'PayPal jest chwilowo niedostępny.');
      const data = await response.json(); token = data.access_token; expires = Date.now() + (data.expires_in - 60) * 1000;
    }
    const response = await fetch(base + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(requestId ? { 'PayPal-Request-Id': requestId } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(25000) });
    if (!response.ok) throw new ApiError(503, 'PAYPAL_UNAVAILABLE', 'Nie udało się potwierdzić płatności PayPal. Spróbuj ponownie.');
    return response.json();
  };
}

export function installPayPal(app, { db, authenticate, client, getPlans, origin }) {
  app.post('/api/paypal/checkout', authenticate, async (req, res, next) => {
    try {
      if (!client) throw new ApiError(503, 'PAYMENTS_DISABLED', 'PayPal nie jest jeszcze uruchomiony.');
      const plan = (await getPlans()).find(p => p.id === req.body?.plan);
      if (!plan || !['PLN', 'EUR', 'USD', 'NOK'].includes(plan.currency.toUpperCase())) throw new ApiError(400, 'INVALID_PLAN', 'Wybierz dostępny pakiet.');
      const ref = db.collection('users').doc(req.account.uid);
      if (!(await ref.get()).exists) throw new ApiError(409, 'ACCOUNT_REQUIRED', 'Odśwież panel konta.');
      const order = await client('/v2/checkout/orders', 'POST', { intent: 'CAPTURE', purchase_units: [{ description: `AparatAI: ${plan.credits} kredytów`, amount: { currency_code: plan.currency.toUpperCase(), value: (plan.amount / 100).toFixed(2) } }], payment_source: { paypal: { experience_context: { brand_name: 'AparatAI', user_action: 'PAY_NOW', shipping_preference: 'NO_SHIPPING', return_url: `${origin}/?payment=paypal`, cancel_url: `${origin}/?payment=cancelled` } } } }, randomUUID());
      if (!/^[A-Z0-9]{5,40}$/.test(order.id)) throw new Error('Invalid PayPal ID');
      const link = order.links?.find(l => ['payer-action', 'approve'].includes(l.rel))?.href;
      const url = new URL(link);
      if (url.protocol !== 'https:' || !['www.paypal.com', 'www.sandbox.paypal.com'].includes(url.hostname)) throw new Error('Invalid PayPal redirect');
      await db.runTransaction(async tx => tx.create(db.collection('paypalOrders').doc(order.id), { uid: req.account.uid, plan: plan.id, credits: plan.credits, amount: plan.amount, currency: plan.currency.toUpperCase(), createdAt: new Date().toISOString() }));
      res.json({ url: link });
    } catch (e) { next(e); }
  });
  app.post('/api/paypal/confirm', authenticate, async (req, res, next) => {
    try {
      if (!client) throw new ApiError(503, 'PAYMENTS_DISABLED', 'PayPal nie jest jeszcze uruchomiony.');
      const id = req.body?.orderId;
      if (typeof id !== 'string' || !/^[A-Z0-9]{5,40}$/.test(id)) throw new ApiError(400, 'INVALID_ORDER', 'Nieprawidłowe zamówienie.');
      const saved = await db.collection('paypalOrders').doc(id).get();
      if (!saved.exists || saved.data().uid !== req.account.uid) throw new ApiError(404, 'ORDER_MISSING', 'Nie znaleziono zamówienia na Twoim koncie.');
      const expected = saved.data();
      let order = await client(`/v2/checkout/orders/${id}`);
      if (order.status === 'APPROVED') order = await client(`/v2/checkout/orders/${id}/capture`, 'POST', {}, `capture-${id}`);
      const units = order.purchase_units;
      const capture = units?.[0]?.payments?.captures;
      if (order.id !== id || order.intent !== 'CAPTURE' || order.status !== 'COMPLETED' || units?.length !== 1 || capture?.length !== 1 || capture[0].status !== 'COMPLETED' || capture[0].amount?.currency_code !== expected.currency || capture[0].amount?.value !== (expected.amount / 100).toFixed(2)) throw new ApiError(409, 'PAYMENT_PENDING', 'Płatność nie została jeszcze potwierdzona.');
      await grantPurchase(db, { receiptId: `paypal-${id}`, ...expected, provider: 'paypal' });
      res.json({ status: 'credited', credits: expected.credits });
    } catch (e) { next(e); }
  });
}
