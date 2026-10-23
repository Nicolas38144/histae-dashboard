import { expect, test, type Page } from '@playwright/test';
import { adminMetrics, adminSession, smsSafety } from '../fixtures';

async function mockConsole(page: Page, valid: () => boolean = () => true) {
  await page.route('**/api/admin/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/session')) return route.fulfill(valid()
      ? { json: adminSession }
      : { status: 401, json: { error: { code: 'admin_session_invalid' } } });
    if (path.endsWith('/metrics')) return route.fulfill({ json: adminMetrics });
    if (path.endsWith('/sms-safety')) return route.fulfill({ json: smsSafety });
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto('/overview');
  await expect(page.getByRole('heading', { name: 'Vue d’ensemble' })).toBeVisible();
}

test('removes the console when a periodic check detects a revoked session', async ({ page }) => {
  await page.clock.install();
  let valid = true;
  await mockConsole(page, () => valid);
  valid = false;
  await page.clock.runFor(60_000);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Administration Histae' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Vue d’ensemble' })).toHaveCount(0);
});

test('locks an idle console even if the API session is still valid', async ({ page }) => {
  await page.clock.install();
  await mockConsole(page);
  await page.clock.fastForward(15 * 60_000);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Vue d’ensemble' })).toHaveCount(0);
});

test('hides data while logout is pending and explains an unconfirmed server revocation', async ({ page }) => {
  await mockConsole(page);
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  await page.route('**/api/admin/auth/logout', async (route) => {
    await pending;
    await route.fulfill({ status: 503, json: { error: { code: 'unavailable' } } });
  });
  try {
    await page.getByRole('button', { name: 'Se déconnecter', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Déconnexion du serveur en cours…')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Vue d’ensemble' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Se connecter avec une passkey' })).toBeDisabled();
    finish();
    await expect(page.getByText(/la révocation de la session sur le serveur n’a pas pu être confirmée/)).toBeVisible();
  } finally {
    finish();
  }
});
