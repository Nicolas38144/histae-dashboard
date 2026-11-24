import { expect, test } from '@playwright/test';
import { adminSession, adminUser, erasureRequest, fixtureIds } from '../fixtures';

test('admin corrects a profile before resolving the rectification request', async ({ page }) => {
  let profile = { ...adminUser };
  let request = { ...erasureRequest, type: 'rectification', status: 'pending', erasure: null, details: 'Merci de corriger les informations de mon profil.', response: null as string | null };
  const writes: Array<{ kind: string; body: unknown }> = [];
  await page.route('**/api/**', async (route) => {
    const http = route.request();
    const path = new URL(http.url()).pathname;
    if (!path.startsWith('/api/')) return route.continue();
    if (path.endsWith('/auth/session')) return route.fulfill({ json: { ...adminSession, role: 'admin' } });
    if (path.endsWith(`/users/${fixtureIds.user}/profile-identity`)) {
      const body = http.postDataJSON();
      writes.push({ kind: 'identity', body });
      profile = { ...profile, firstname: body.firstname, birthdate: body.birthdate, sex: body.sex };
      return route.fulfill({ json: { message: 'profile identity corrected' } });
    }
    if (path.endsWith(`/users/${fixtureIds.user}`)) return route.fulfill({ json: profile });
    if (path.endsWith(`/matches/${fixtureIds.user}`)) return route.fulfill({ json: { matches: [], next_cursor: null } });
    if (path.endsWith(`/data-subject-requests/${fixtureIds.request}`)) {
      const body = http.postDataJSON();
      writes.push({ kind: 'request', body });
      request = { ...request, status: body.status, response: body.response ?? null };
      return route.fulfill({ json: { message: 'data subject request updated' } });
    }
    if (path.endsWith('/data-subject-requests')) return route.fulfill({ json: { requests: [request], next_cursor: null } });
    if (path.endsWith('/user-names')) return route.fulfill({ json: { users: [] } });
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto('/privacy-requests');
  await page.getByRole('button', { name: 'Prendre en charge', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirmer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Résoudre', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Corriger le profil', exact: true }).click();
  await page.getByLabel('Motif d’accès (3 à 500 caractères)').fill('Traitement de la demande de rectification');
  await page.getByRole('button', { name: 'Consulter le dossier', exact: true }).click();
  await page.getByRole('button', { name: 'Corriger le profil', exact: true }).click();
  const editor = page.getByRole('dialog');
  await editor.getByLabel('Prénom', { exact: false }).fill('Camille corrigée');
  await editor.getByLabel('Naissance', { exact: false }).fill('1995-05-13');
  await editor.getByRole('combobox', { name: /^Sexe/ }).click();
  await page.getByRole('option', { name: 'Femme', exact: true }).click();
  await editor.getByLabel('Motif de la correction', { exact: false }).fill('Demande de rectification vérifiée');
  await editor.getByRole('button', { name: 'Enregistrer la correction', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Camille corrigée', exact: true }).first()).toBeVisible();
  expect(request.status).toBe('in_progress');
  await page.getByRole('link', { name: 'Retour aux demandes RGPD', exact: true }).click();
  await page.getByRole('button', { name: 'Résoudre', exact: true }).click();
  const resolution = page.getByRole('dialog');
  await resolution.getByLabel(/Réponse à l’utilisateur/).fill('Les informations demandées ont été corrigées après vérification.');
  await resolution.getByRole('button', { name: 'Confirmer', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(writes.map(({ kind }) => kind)).toEqual(['request', 'identity', 'request']);
  expect(writes[1].body).toEqual({ firstname: 'Camille corrigée', birthdate: '1995-05-13', sex: 'female', reason: 'Demande de rectification vérifiée' });
  expect(request.status).toBe('completed');
  expect(request.response).toBe('Les informations demandées ont été corrigées après vérification.');
});
