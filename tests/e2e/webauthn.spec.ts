import { expect, test } from '@playwright/test';
import { adminMetrics, adminSession } from '../fixtures';

test('redirects an expired session and clears legacy browser tokens', async ({ page }) => {
  await page.route('**/api/admin/auth/session', (route) => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ error: { code: 'unauthorized', message: 'Session expirée.' } }),
  }));
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('auth_token', 'legacy-fixture');
    localStorage.setItem('user_id', 'legacy-user-fixture');
    sessionStorage.setItem('histae_admin_access_token', 'legacy-fixture');
  });

  await page.goto('/overview');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Administration Histae' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })))
    .toEqual({ local: 0, session: 0 });
});

test('registers and reuses a discoverable passkey with a virtual authenticator', async ({ page, context }) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });

  const challenge = Buffer.from('histae-dashboard-challenge').toString('base64url');
  const userId = Buffer.from(adminSession.user_id).toString('base64url');
  const creationOptions = {
    challenge,
    rp: { id: 'localhost', name: 'Histae Administration' },
    user: { id: userId, name: 'admin-fixture', displayName: 'Admin Fixture' },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    timeout: 30_000,
    attestation: 'none',
    excludeCredentials: [],
    authenticatorSelection: {
      residentKey: 'required',
      requireResidentKey: true,
      userVerification: 'required',
    },
  };
  const requestOptions = {
    challenge: Buffer.from('histae-login-challenge').toString('base64url'),
    rpId: 'localhost',
    timeout: 30_000,
    userVerification: 'required',
    allowCredentials: [],
  };
  const verifications: unknown[] = [];

  await page.route('**/api/admin/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/bootstrap/options')) {
      return route.fulfill({ json: { challenge_id: 'bootstrap-challenge', options: creationOptions } });
    }
    if (url.pathname.endsWith('/bootstrap/verify')) {
      verifications.push(route.request().postDataJSON());
      return route.fulfill({ json: adminSession });
    }
    if (url.pathname.endsWith('/login/options')) {
      return route.fulfill({ json: { challenge_id: 'login-challenge', options: requestOptions } });
    }
    if (url.pathname.endsWith('/login/verify')) {
      verifications.push(route.request().postDataJSON());
      return route.fulfill({ json: adminSession });
    }
    if (url.pathname.endsWith('/auth/session')) return route.fulfill({ json: adminSession });
    if (url.pathname.endsWith('/metrics')) return route.fulfill({ json: adminMetrics });
    return route.fulfill({ status: 404, json: { error: { code: 'fixture_missing', message: 'Fixture absente.' } } });
  });

  await page.goto('/login');
  await page.getByText('Enregistrer la première passkey').click();
  await page.getByLabel('Nom de la passkey').fill('Clé virtuelle de test');
  await page.getByLabel('Jeton d’enrôlement temporaire').fill('bootstrap-fixture');
  await page.getByRole('button', { name: 'Enregistrer cette passkey' }).click();
  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.getByRole('heading', { name: 'Vue d’ensemble' })).toBeVisible();

  await page.goto('/login');
  await page.getByRole('button', { name: 'Se connecter avec une passkey' }).click();
  await expect(page).toHaveURL(/\/overview$/);

  expect(verifications).toHaveLength(2);
  expect(verifications[0]).toMatchObject({ bootstrap_token: 'bootstrap-fixture', challenge_id: 'bootstrap-challenge' });
  expect(verifications[1]).toMatchObject({ challenge_id: 'login-challenge' });
  expect(JSON.stringify(verifications)).toContain('public-key');
  await expect.poll(() => page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })))
    .toEqual({ local: 0, session: 0 });
});
