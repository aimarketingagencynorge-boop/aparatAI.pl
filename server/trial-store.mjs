import { createHmac } from 'node:crypto';
import ipaddr from 'ipaddr.js';

export class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

export function identity(ip, secret) {
  let address = ipaddr.process(ip);
  // Group IPv6 privacy addresses by network to avoid address rotation resets.
  const normalized = address.kind() === 'ipv6'
    ? `${address.toByteArray().slice(0, 8).join('.')}/64`
    : address.toString();
  return createHmac('sha256', secret).update(normalized).digest('hex');
}

export class FirestoreTrialStore {
  constructor(db, dailyLimit) { this.db = db; this.dailyLimit = dailyLimit; }
  async status(key) {
    const doc = await this.db.collection('publicTrials').doc(key).get();
    return doc.exists ? doc.data().state : 'available';
  }
  async reserve(key, requestId) {
    const ref = this.db.collection('publicTrials').doc(key);
    const day = new Date().toISOString().slice(0, 10);
    const budget = this.db.collection('trialBudgets').doc(day);
    await this.db.runTransaction(async tx => {
      const [trial, quota] = await Promise.all([tx.get(ref), tx.get(budget)]);
      if (trial.exists) throw new ApiError(409, 'TRIAL_USED', 'Darmowy test z tej sieci został już wykorzystany. Zaloguj się, aby kontynuować.');
      const used = quota.exists ? quota.data().used : 0;
      if (used >= this.dailyLimit) throw new ApiError(429, 'DAILY_LIMIT', 'Dzisiejsza pula darmowych testów została wykorzystana. Wróć jutro.');
      tx.create(ref, { state: 'processing', requestId, createdAt: new Date().toISOString() });
      tx.set(budget, { used: used + 1, day });
    });
  }
  async complete(key, requestId, state) {
    const ref = this.db.collection('publicTrials').doc(key);
    await this.db.runTransaction(async tx => {
      const doc = await tx.get(ref);
      if (doc.data()?.requestId === requestId) tx.update(ref, { state, finishedAt: new Date().toISOString() });
    });
  }
}

// Explicitly local development only; production always requires Firestore.
export class MemoryTrialStore {
  trials = new Map(); used = 0;
  constructor(dailyLimit = 20) { this.dailyLimit = dailyLimit; }
  async status(key) { return this.trials.get(key)?.state || 'available'; }
  async reserve(key, requestId) {
    if (this.trials.has(key)) throw new ApiError(409, 'TRIAL_USED', 'Darmowy test z tej sieci został już wykorzystany.');
    if (this.used >= this.dailyLimit) throw new ApiError(429, 'DAILY_LIMIT', 'Dzisiejsza pula testów została wykorzystana.');
    this.trials.set(key, { requestId, state: 'processing' }); this.used++;
  }
  async complete(key, requestId, state) {
    if (this.trials.get(key)?.requestId === requestId) this.trials.set(key, { requestId, state });
  }
}
