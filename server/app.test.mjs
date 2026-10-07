import { test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { createApp, errorHandler } from './app.mjs';
import { identity, MemoryTrialStore } from './trial-store.mjs';

const secret = 'test-only-secret-that-is-at-least-32-characters';
const image = `data:image/png;base64,${(await sharp({ create: { width: 10, height: 10, channels: 3, background: '#cccccc' } }).png().toBuffer()).toString('base64')}`;
async function fixture(t, options = {}) {
  const logs = []; let calls = 0;
  const store = new MemoryTrialStore(options.limit || 50);
  const app = createApp({ store, secret, origins: ['https://aparatai.pl'], logger: value => logs.push(value), generate: async () => { calls++; if (options.fail) throw new Error('PRIVATE_API_SECRET'); return image; } });
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`;
  const post = (body = { image, scene: 'white' }, headers = {}) => fetch(`${url}/api/trial`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  return { url, post, logs, store, calls: () => calls };
}
test('one trial survives refresh and a new HTTP request; spoofed forwarding does not reset it', async t => {
  const f = await fixture(t);
  assert.equal((await f.post()).status, 200);
  assert.equal((await (await fetch(`${f.url}/api/trial`)).json()).state, 'succeeded');
  assert.equal((await f.post(undefined, { 'X-Forwarded-For': '198.51.100.6' })).status, 409);
  assert.equal(f.calls(), 1);
});
test('parallel submissions create one provider invocation', async t => {
  const f = await fixture(t);
  const results = await Promise.all(Array.from({ length: 8 }, () => f.post()));
  assert.equal(results.filter(r => r.status === 200).length, 1);
  assert.equal(results.filter(r => r.status === 409).length, 7);
  assert.equal(f.calls(), 1);
});
test('invalid file and scene do not consume trial', async t => {
  const f = await fixture(t);
  assert.equal((await f.post({ image: 'data:image/png;base64,aGVsbG8=', scene: 'white' })).status, 400);
  assert.equal((await f.post({ image, scene: '__proto__' })).status, 400);
  assert.equal((await f.post()).status, 200);
});
test('cross-site requests cannot start a generation', async t => {
  const f = await fixture(t);
  assert.equal((await f.post(undefined, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await f.post(undefined, { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  assert.equal(f.calls(), 0);
});
test('provider failures do not permit unlimited retries or leak private errors', async t => {
  const f = await fixture(t, { fail: true });
  const response = await f.post();
  assert.equal(response.status, 503);
  const data = await response.json();
  assert.ok(data.error.requestId);
  assert.ok(!JSON.stringify(data).includes('PRIVATE_API_SECRET'));
  assert.equal((await f.post()).status, 409);
  assert.ok(!f.logs.join('').includes('PRIVATE_API_SECRET'));
  assert.ok(!f.logs.join('').includes(image));
});
test('daily budget rejects another network without calling provider', async () => {
  const store = new MemoryTrialStore(1);
  await store.reserve('network-one', 'r1');
  await assert.rejects(store.reserve('network-two', 'r2'), e => e.code === 'DAILY_LIMIT');
});
test('canonical IPv4 and mapped IPv6 match; IPv6 privacy rotation shares /64', () => {
  assert.equal(identity('192.0.2.1', secret), identity('::ffff:192.0.2.1', secret));
  assert.equal(identity('2001:db8:1234:1::1', secret), identity('2001:db8:1234:1::abcd', secret));
  assert.notEqual(identity('2001:db8:1234:1::1', secret), identity('2001:db8:1234:2::1', secret));
});
