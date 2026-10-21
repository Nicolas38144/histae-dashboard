import { expect, test } from '@playwright/test';
import { adminMetrics, adminSession, smsSafety } from '../fixtures';

const languages = [
  { code: 'en', label: 'English', change: 'Change language', heading: 'Overview', login: 'Histae Administration' },
  { code: 'es', label: 'Español', change: 'Cambiar idioma', heading: 'Resumen', login: 'Administración Histae' },
  { code: 'it', label: 'Italiano', change: 'Cambia lingua', heading: 'Panoramica', login: 'Amministrazione Histae' },
] as const;

for (const language of languages) {
  test(`persists ${language.code} from login through the authenticated console`, async ({ page }) => {
    const requestedLanguages: string[] = [];
    await page.route('**/api/admin/**', async (route) => {
      const pathname = new URL(route.request().url()).pathname;
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
    await page.getByRole('menuitem', { name: language.label }).click();
    await expect(page.getByRole('heading', { name: language.login })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', language.code);
    await page.reload();
    await expect(page.getByRole('button', { name: language.change })).toBeVisible();
    await page.goto('/overview');
    await expect(page.getByRole('heading', { name: language.heading })).toBeVisible();
    await expect(page.getByRole('button', { name: language.change })).toBeVisible();
    expect(requestedLanguages.length).toBeGreaterThan(0);
    expect(requestedLanguages.every((value) => value === language.code)).toBe(true);
    const initialRequests = [...requestedLanguages];
    await page.getByRole('button', { name: language.change }).click();
    await page.getByRole('menuitem', { name: 'Français' }).click();
    await expect(page.getByRole('heading', { name: 'Vue d’ensemble' })).toBeVisible();
    await expect.poll(() => requestedLanguages).toEqual([...initialRequests, 'fr']);
    await expect(page).toHaveURL(/\/overview$/);
  });
}
