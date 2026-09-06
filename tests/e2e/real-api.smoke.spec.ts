import { expect, test } from '@playwright/test';

test('local API and storage readiness remains private @real', async ({ request }) => {
  const apiUrl = process.env.HISTAE_REAL_API_URL;
  test.skip(!apiUrl, 'Set HISTAE_REAL_API_URL to the local API origin.');
  const target = new URL(apiUrl!);
  expect(['localhost', '127.0.0.1', '::1']).toContain(target.hostname);

  const readiness = await request.get(`${target.origin}/health/ready`);
  expect(readiness.status()).toBe(200);
  expect(await readiness.json()).toMatchObject({ status: 'ready' });

  const anonymousSession = await request.get(`${target.origin}/api/admin/auth/session`);
  expect(anonymousSession.status()).toBe(401);

  const randomUserId = crypto.randomUUID();
  const privateUser = await request.get(`${target.origin}/api/admin/users/${randomUserId}`);
  expect(privateUser.status()).toBe(401);
});
