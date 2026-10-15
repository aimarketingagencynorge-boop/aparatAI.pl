import { getAuth } from 'firebase-admin/auth';
import { ApiError } from './trial-store.mjs';

export function adminAuthorizer(emails) {
  const allowed = new Set(emails.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
  return token => token?.email_verified === true && allowed.has(token.email?.toLowerCase());
}

export function installAdmin(app, { db, authenticate, isAdmin, findIdentity = email => getAuth().getUserByEmail(email) }) {
  const admin = (req, _res, next) => isAdmin(req.account) ? next() : next(new ApiError(403, 'ADMIN_REQUIRED', 'Ta funkcja jest dostępna tylko dla administratora.'));
  app.post('/api/admin/account', authenticate, admin, async (req, res, next) => {
    try {
      const email = req.body?.email;
      if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'INVALID_EMAIL', 'Podaj pełny adres e-mail konta.');
      let identity;
      try { identity = await findIdentity(email.trim().toLowerCase()); }
      catch (e) { if (e.code === 'auth/user-not-found') throw new ApiError(404, 'ACCOUNT_MISSING', 'Nie znaleziono konta.'); throw e; }
      const doc = await db.collection('users').doc(identity.uid).get();
      if (!doc.exists) throw new ApiError(404, 'ACCOUNT_MISSING', 'Użytkownik nie otworzył jeszcze konta AparatAI.');
      const data = doc.data();
      const activeJob = data.activeGeneration ? await db.collection('generationJobs').doc(data.activeGeneration).get() : null;
      res.json({ uid: identity.uid, email: identity.email, credits: data.credits, totalCredits: data.totalCredits, plan: data.plan, createdAt: data.createdAt, activeGeneration: data.activeGeneration || null, activeJob: activeJob?.exists ? { state: activeJob.data().state, createdAt: activeJob.data().createdAt } : null });
    } catch(e) { next(e); }
  });
  app.post('/api/admin/credits', authenticate, admin, async (req, res, next) => {
    try {
      const { uid, delta, reason, requestId } = req.body || {};
      if (typeof uid !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(uid) || !Number.isSafeInteger(delta) || delta === 0 || Math.abs(delta) > 5000 || typeof reason !== 'string' || reason.trim().length < 10 || reason.length > 500 || !/^[a-f0-9-]{36}$/i.test(requestId || '')) throw new ApiError(400, 'INVALID_ADJUSTMENT', 'Podaj konto, zmianę od -5000 do 5000 i uzasadnienie (10–500 znaków).');
      const result = await db.runTransaction(async tx => {
        const ref = db.collection('users').doc(uid), audit = db.collection('adminAudit').doc(requestId);
        const [user, previous] = await Promise.all([tx.get(ref), tx.get(audit)]);
        if (previous.exists) {
          const p = previous.data();
          if (p.adminUid !== req.account.uid || p.uid !== uid || p.delta !== delta || p.reason !== reason.trim()) throw new ApiError(409, 'ADJUSTMENT_CONFLICT', 'Ten numer operacji był już użyty.');
          return { credits: p.after, repeated: true };
        }
        if (!user.exists) throw new ApiError(404, 'ACCOUNT_MISSING', 'Nie znaleziono konta.');
        const before = user.data().credits, after = before + delta;
        if (!Number.isSafeInteger(before) || !Number.isSafeInteger(after) || after < 0) throw new ApiError(409, 'INVALID_BALANCE', 'Saldo nie może spaść poniżej zera.');
        if (user.data().activeGeneration && delta < 0) throw new ApiError(409, 'BUSY', 'Poczekaj na zakończenie aktywnej generacji.');
        tx.update(ref, { credits: after });
        tx.create(audit, { action: 'credit_adjustment', uid, adminUid: req.account.uid, before, after, delta, reason: reason.trim(), createdAt: new Date().toISOString() });
        return { credits: after, repeated: false };
      });
      res.json(result);
    } catch(e) { next(e); }
  });
}
