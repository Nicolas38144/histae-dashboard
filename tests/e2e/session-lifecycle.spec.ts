import { expect, test } from '@playwright/test';
import { adminMetrics, adminSession, smsSafety } from '../fixtures';

test('removes the console when a periodic check detects a revoked session', async ({ page }) => {
  await page.clock.install();
  let valid = true;
  await page.route('**/api/admin/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/session')) return route.fulfill(valid
      ? { json: adminSession }
      : { status: 401, json: { error: { code: 'admin_session_invalid' } } });
    if (path.endsWith('/metrics')) return route.fulfill({ json: adminMetrics });
    if (path.endsWith('/phone-blocklist')) return route.fulfill({ json: { entries: [], total: 0, ready: true, sources: [] } });
    if (path.endsWith('/sms-safety')) return route.fulfill({ json: smsSafety });
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto('/overview');
  await expect(page.getByRole('heading', { name: 'Vue d’ensemble' })).toBeVisible();
  valid = false;
  await page.clock.runFor(60_000);
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Administration Histae' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Vue d’ensemble' })).toHaveCount(0);
});
