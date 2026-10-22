import { expect, test } from '@playwright/test';
import { adminSession } from '../fixtures';
const status = {
  enabled: { app_store: true, google_play: true }, sources: [], period: 'last_30_days',
  finance: [{ provider: 'app_store', currency: 'EUR', gross_cents: 500, net_cents: null, rows: 1, last_imported_at: '2026-10-01T00:00:00Z' }],
  recent: [], pending_notifications: 0, dead_letters: 0, finance_basis: 'imported_store_reports',
};
test('superadmin reviews provider, report and integer amounts before importing', async ({ page }) => {
  const imports: unknown[] = [];
  await page.route('**/api/admin/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/session')) return route.fulfill({ json: { ...adminSession, role: 'superadmin' } });
    if (path.endsWith('/store-billing/finance')) { imports.push(route.request().postDataJSON()); return route.fulfill({ status: 204 }); }
    if (path.endsWith('/store-billing')) return route.fulfill({ json: status });
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto('/store-billing');
  await expect(page.getByRole('heading', { name: 'Abonnements stores' })).toBeVisible();
  await page.getByLabel('Identifiant stable du rapport').fill('2026-10-synthetic');
  await page.locator('input[type=file]').setInputFiles({ name: 'synthetic.csv', mimeType: 'text/csv', buffer: Buffer.from('row_id,paid_at,currency,gross_cents,net_cents\nline1,2026-10-01T00:00:00Z,EUR,500,425') });
  await page.getByRole('button', { name: 'Importer un rapport', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('App Store'); await expect(dialog).toContainText('2026-10-synthetic');
  expect(imports).toHaveLength(0);
  await dialog.getByRole('button', { name: 'Confirmer', exact: true }).click();
  await expect(page.getByText('Le rapport a été importé.')).toBeVisible();
  expect(imports).toEqual([{ provider: 'app_store', report_id: '2026-10-synthetic', rows: [{ row_id: 'line1', paid_at: '2026-10-01T00:00:00Z', currency: 'EUR', gross_cents: 500, net_cents: 425 }] }]);
});
test('admin can read native reports but cannot import', async ({ page }) => {
  await page.route('**/api/admin/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/session')) return route.fulfill({ json: { ...adminSession, role: 'admin' } });
    if (path.endsWith('/store-billing')) return route.fulfill({ json: status });
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto('/store-billing');
  await expect(page.getByRole('heading', { name: 'Abonnements stores' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Importer un rapport' })).toHaveCount(0);
  await expect(page.locator('input[type=file]')).toHaveCount(0);
});
