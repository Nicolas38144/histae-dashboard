import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

const apiUrl = process.env.HISTAE_REAL_API_URL;

test('local API and storage readiness remains private', {
  skip: !apiUrl && 'Set HISTAE_REAL_API_URL to the local API origin.',
}, async () => {
  const target = new URL(apiUrl);
  assert.ok(['http:', 'https:'].includes(target.protocol) && ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname),
    'HISTAE_REAL_API_URL must point to a local HTTP API.');
  const read = (path) => fetch(new URL(path, target.origin), { redirect: 'manual', signal: AbortSignal.timeout(10_000) });

  const readiness = await read('/health/ready');
  assert.equal(readiness.status, 200);
  assert.equal((await readiness.json()).status, 'ready');

  const anonymousSession = await read('/api/admin/auth/session');
  assert.equal(anonymousSession.status, 401);

  const privateUser = await read(`/api/admin/users/${randomUUID()}`);
  assert.equal(privateUser.status, 401);
});
