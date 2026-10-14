import { FieldValue } from 'firebase-admin/firestore';
import { ApiError } from './trial-store.mjs';

export async function grantPurchase(db, { receiptId, uid, plan, credits, provider, amount, currency }) {
  if (!/^[A-Za-z0-9_-]{1,200}$/.test(receiptId) || !uid || uid.includes('/') || uid.length > 128 || !Number.isSafeInteger(credits) || credits < 1) throw new ApiError(400, 'INVALID_ORDER', 'Nieprawidłowe zamówienie.');
  return db.runTransaction(async tx => {
    const receipt = db.collection('paymentReceipts').doc(receiptId);
    const ref = db.collection('users').doc(uid);
    const [existing, user] = await Promise.all([tx.get(receipt), tx.get(ref)]);
    if (existing.exists) {
      if (existing.data().uid !== uid) throw new ApiError(403, 'ORDER_OWNER', 'To zamówienie należy do innego konta.');
      return false;
    }
    if (!user.exists) throw new ApiError(409, 'ACCOUNT_REQUIRED', 'Odśwież panel konta.');
    tx.create(receipt, { uid, plan, credits, provider, amount: amount ?? null, currency: currency ?? null, createdAt: new Date().toISOString() });
    tx.update(ref, { credits: FieldValue.increment(credits), totalCredits: FieldValue.increment(credits), plan });
    return true;
  });
}
