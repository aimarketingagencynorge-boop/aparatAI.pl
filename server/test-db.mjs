import { FieldValue } from 'firebase-admin/firestore';
// A serializable transaction double for deterministic races, without cloud credentials.
export class TestDB {
  documents = new Map(); queue = Promise.resolve();
  collection(name) { return { doc: id => ({ key: `${name}/${id}`, get: async () => this.snapshot(`${name}/${id}`) }) }; }
  snapshot(key) { const value = this.documents.get(key); return { exists: value !== undefined, data: () => value && { ...value } }; }
  async runTransaction(callback) {
    const run = this.queue.then(async () => {
      const staged = [];
      const result = await callback({ get: async ref => this.snapshot(ref.key), create: (ref, data) => staged.push(['create', ref.key, data]), set: (ref, data) => staged.push(['set', ref.key, data]), update: (ref, data) => staged.push(['update', ref.key, data]) });
      for (const [type, key, data] of staged) {
        const previous = this.documents.get(key);
        if (type === 'create' && previous) throw new Error('Exists');
        if (type === 'update' && !previous) throw new Error('Missing');
        const updated = type === 'update' ? { ...previous } : {};
        for (const [field, value] of Object.entries(data)) {
          if (value?.isEqual?.(FieldValue.delete())) { delete updated[field]; continue; }
          const increment = [-1, 1, 100, 500].find(n => value?.isEqual?.(FieldValue.increment(n)));
          updated[field] = increment !== undefined ? (updated[field] || 0) + increment : value;
        }
        this.documents.set(key, updated);
      }
      return result;
    });
    this.queue = run.catch(() => {});
    return run;
  }
}
