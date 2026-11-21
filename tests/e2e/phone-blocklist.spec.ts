import { expect, test } from '@playwright/test';
import { adminSession, smsSafety } from '../fixtures';

test('searches dynamically without opening the review dialog and refreshes the result after saving', async ({ page }) => {
  const phone = ['+33', '6', '0'.repeat(8)].join('');
  let entry = { id: '90000000-0000-4000-8000-000000000001', phone_hint: '+33……0000', decision: 'automatic', decision_until: null, version: 2, blocked: true, observations: [] };
  const lookups: unknown[] = [];
  const changes: unknown[] = [];
  await page.route('**/api/admin/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith('/auth/session')) return route.fulfill({ json: adminSession });
    if (path.endsWith('/sms-safety')) return route.fulfill({ json: smsSafety });
    if (path.endsWith('/phone-blocklist/lookup')) {
      lookups.push(request.postDataJSON());
      return route.fulfill({ json: entry });
    }
    if (path.endsWith('/phone-blocklist')) {
      if (request.method() === 'PATCH') {
        changes.push(request.postDataJSON());
        entry = { ...entry, blocked: false, version: 3 };
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: { entries: [entry, { ...entry, id: 'second-entry', phone_hint: '+33……1111' }], total: 2, ready: true, sources: [] } });
    }
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto('/sms-safety');
  await expect(page.getByRole('button', { name: 'Rechercher un numéro' })).toHaveCount(0);
  await page.getByLabel('Numéro de téléphone', { exact: true }).fill(phone);
  await expect(page.getByRole('button', { name: 'Examiner', exact: true })).toHaveCount(1);
  await expect(page.getByText('+33……1111', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(lookups).toEqual([{ phone_number: phone }]);
  await page.getByRole('button', { name: 'Examiner', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel(/Justification/)).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Confirmer', exact: true }).click();
  await expect(page.getByText('Non bloqué', { exact: true })).toBeVisible();
  expect(changes).toEqual([{ entry_id: entry.id, decision: 'allow', version: 2, valid_days: 30 }]);
  expect(lookups).toEqual([{ phone_number: phone }, { phone_number: phone }]);
  await page.getByLabel('Numéro de téléphone', { exact: true }).clear();
  await expect(page.getByRole('button', { name: 'Examiner', exact: true })).toHaveCount(2);
});

test('requires an administrator to justify a temporary phone exception', async ({ page }) => {
  let entry = { id: '90000000-0000-4000-8000-000000000001', phone_hint: '+33……0000', decision: 'automatic', decision_until: null, version: 2, blocked: true, observations: [] };
  const changes: unknown[] = [];
  await page.route('**/api/admin/**', async (route) => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    if (path.endsWith('/auth/session')) return route.fulfill({ json: { ...adminSession, role: 'admin' } });
    if (path.endsWith('/sms-safety')) return route.fulfill({ json: smsSafety });
    if (path.endsWith('/phone-blocklist')) {
      if (request.method() === 'PATCH') {
        changes.push(request.postDataJSON()); entry = { ...entry, blocked: false, version: 3 };
        return route.fulfill({ status: 204 });
      }
      return route.fulfill({ json: { entries: [entry], total: 1, ready: true, sources: [] } });
    }
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto('/sms-safety');
  await page.getByRole('button', { name: 'Examiner', exact: true }).click();
  const dialog = page.getByRole('dialog');
  const confirm = dialog.getByRole('button', { name: 'Confirmer', exact: true });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel(/Justification/).fill('Réattribution vérifiée par le support');
  await confirm.click();
  await expect(page.getByText('Non bloqué', { exact: true })).toBeVisible();
  expect(changes).toEqual([{ entry_id: entry.id, decision: 'allow', version: 2, valid_days: 30,
    reason: 'Réattribution vérifiée par le support',
  }]);
  await expect(dialog).toHaveCount(0);
});
