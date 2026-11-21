import { expect, test } from '@playwright/test';
import { adminMetrics, adminSession, smsSafety } from '../fixtures';

test('persists English from login through the authenticated console', async ({ page }) => {
  const requestedLanguages: string[] = [];
  await page.route('**/api/admin/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname.endsWith('/phone-blocklist')) return route.fulfill({ json: { entries: [], total: 0, ready: true, sources: [] } });
    if (pathname.endsWith('/sms-safety')) return route.fulfill({ json: smsSafety });
    if (pathname.endsWith('/auth/session')) return route.fulfill({ json: adminSession });
    if (pathname.endsWith('/metrics')) {
      requestedLanguages.push(route.request().headers()['accept-language']);
      return route.fulfill({ json: adminMetrics });
    }
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto('/login');
  await page.getByRole('button', { name: 'Changer de langue' }).click();
  await page.getByRole('menuitem', { name: 'English' }).click();
  await expect(page.getByRole('heading', { name: 'Histae Administration' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Change language' })).toBeVisible();
  await page.goto('/overview');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Change language' })).toBeVisible();
  expect(requestedLanguages.length).toBeGreaterThan(0);
  expect(requestedLanguages.every((value) => value === 'en')).toBe(true);
  const initialRequests = [...requestedLanguages];
  await page.getByRole('button', { name: 'Change language' }).click();
  await page.getByRole('menuitem', { name: 'Français' }).click();
  await expect(page.getByRole('heading', { name: 'Vue d’ensemble' })).toBeVisible();
  await expect.poll(() => requestedLanguages).toEqual([...initialRequests, 'fr']);
  await expect(page).toHaveURL(/\/overview$/);
});
