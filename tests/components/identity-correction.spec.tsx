import { http, HttpResponse } from 'msw';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';
import type { DataRequestStatus, DataSubjectRequest, ProfileIdentityCorrection } from '../../src/api/types';
import { NotifierProvider } from '../../src/components/Notifier';
import { IdentityCorrectionButton } from '../../src/features/users/identity-correction-button';
import { adminSession, adminUser, erasureRequest, fixtureIds } from '../fixtures';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const path = `http://localhost/api/admin/users/${fixtureIds.user}/profile-identity`;

describe('profile identity corrections', () => {
  it.each(['admin', 'superadmin'] as const)('lets %s correct first name, birthdate and explicitly clear sex after providing a reason', async (role) => {
    const user = userEvent.setup();
    const updated = vi.fn();
    let body: unknown;
    server.use(http.patch(path, async ({ request }) => { body = await request.json(); return HttpResponse.json({ message: 'profile identity corrected' }); }));
    renderDashboard(<IdentityCorrectionButton user={adminUser} role={role} onUpdated={updated} />);
    await user.click(screen.getByRole('button', { name: 'Corriger le profil' }));
    const dialog = within(screen.getByRole('dialog'));
    const save = dialog.getByRole('button', { name: 'Enregistrer la correction' });
    expect(save).toBeDisabled();
    await user.clear(dialog.getByLabelText('Prénom', { exact: false }));
    await user.type(dialog.getByLabelText('Prénom', { exact: false }), ' Camille corrigée ');
    await user.clear(dialog.getByLabelText('Naissance', { exact: false }));
    await user.type(dialog.getByLabelText('Naissance', { exact: false }), '1995-05-13');
    await user.click(dialog.getByRole('combobox', { name: 'Sexe' }));
    await user.click(screen.getByRole('option', { name: 'Non renseigné' }));
    expect(save).toBeDisabled();
    await user.type(dialog.getByLabelText('Motif de la correction', { exact: false }), ' Demande de rectification vérifiée ');
    await user.click(save);
    await waitFor(() => expect(updated).toHaveBeenCalledTimes(1));
    expect(body).toEqual({ firstname: 'Camille corrigée', birthdate: '1995-05-13', sex: null, reason: 'Demande de rectification vérifiée' });
  });

  it.each([
    ['required_consent_missing', /Le consentement requis est absent/],
    ['admin_reauthentication_required', /Reconnectez-vous/],
  ])('retains the draft and does not report success on %s', async (code, message) => {
    const user = userEvent.setup();
    const updated = vi.fn();
    server.use(http.patch(path, () => HttpResponse.json({ error: { code } }, { status: 403 })));
    renderDashboard(<IdentityCorrectionButton user={adminUser} role="superadmin" onUpdated={updated} />);
    await user.click(screen.getByRole('button', { name: 'Corriger le profil' }));
    const dialog = within(screen.getByRole('dialog'));
    await user.type(dialog.getByLabelText('Motif de la correction', { exact: false }), 'Référence de la demande');
    await user.click(dialog.getByRole('button', { name: 'Enregistrer la correction' }));
    expect(await dialog.findByText(message)).toBeVisible();
    expect(dialog.getByLabelText('Motif de la correction', { exact: false })).toHaveValue('Référence de la demande');
    expect(updated).not.toHaveBeenCalled();
  });

  it('hides corrections of privileged accounts from an ordinary admin', () => {
    renderDashboard(<IdentityCorrectionButton user={{ ...adminUser, role: 'admin' }} role="admin" onUpdated={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Corriger le profil' })).not.toBeInTheDocument();
  });

  it('takes ownership, corrects the profile and resolves the rectification request as an admin', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const api = 'http://localhost/api';
    const requests = `${api}/admin/data-subject-requests`;
    const accessReason = 'Traitement de la demande de rectification';
    const correctionReason = 'Demande de rectification vérifiée';
    const response = 'Les informations demandées ont été corrigées après vérification.';
    let profile = { ...adminUser };
    let rectification: DataSubjectRequest = { ...erasureRequest, type: 'rectification', status: 'pending', erasure: null, response: null };
    const writes: Array<{ kind: 'request' | 'identity'; body: unknown }> = [];
    server.use(
      http.get(`${api}/admin/auth/session`, () => HttpResponse.json({ ...adminSession, role: 'admin' })),
      http.get(requests, () => HttpResponse.json({ requests: [rectification], next_cursor: null })),
      http.patch(`${requests}/${rectification.id}`, async ({ request }) => {
        const update = await request.json() as { status: DataRequestStatus; response?: string };
        writes.push({ kind: 'request', body: update });
        rectification = { ...rectification, status: update.status, response: update.response ?? null };
        return new HttpResponse(null, { status: 204 });
      }),
      http.get(`${api}/admin/users/${profile.user_id}`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('reason')).toBe(accessReason);
        return HttpResponse.json(profile);
      }),
      http.patch(path, async ({ request }) => {
        const update = await request.json() as ProfileIdentityCorrection;
        writes.push({ kind: 'identity', body: update });
        profile = { ...profile, firstname: update.firstname, birthdate: update.birthdate, sex: update.sex };
        return new HttpResponse(null, { status: 204 });
      }),
      http.get(`${api}/matches/${profile.user_id}`, () => HttpResponse.json({ matches: [], next_cursor: null })),
      http.get(`${api}/admin/user-names`, () => HttpResponse.json({ users: [{ user_id: profile.user_id, firstname: profile.firstname }] })),
    );
    window.history.replaceState({}, '', '/privacy-requests');
    render(<NotifierProvider><App /></NotifierProvider>);

    await user.click(await screen.findByRole('button', { name: 'Prendre en charge' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Confirmer' }));
    expect(await screen.findByRole('button', { name: 'Résoudre' })).toBeVisible();
    await user.click(await screen.findByRole('link', { name: 'Corriger le profil' }));
    await user.type(await screen.findByLabelText('Motif d’accès (3 à 500 caractères)'), accessReason);
    await user.click(screen.getByRole('button', { name: 'Consulter le dossier' }));
    await user.click(await screen.findByRole('button', { name: 'Corriger le profil' }));

    const editor = within(await screen.findByRole('dialog'));
    const firstName = editor.getByLabelText(/Prénom/);
    const birthdate = editor.getByLabelText(/Naissance/);
    await user.clear(firstName);
    await user.type(firstName, 'Camille corrigée');
    await user.clear(birthdate);
    await user.type(birthdate, '1995-05-13');
    await user.click(editor.getByRole('combobox', { name: 'Sexe' }));
    await user.click(screen.getByRole('option', { name: 'Femme' }));
    await user.type(editor.getByLabelText(/Motif de la correction/), correctionReason);
    await user.click(editor.getByRole('button', { name: 'Enregistrer la correction' }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Camille corrigée'));
    expect(rectification.status).toBe('in_progress');

    await user.click(screen.getByRole('link', { name: 'Retour aux demandes RGPD' }));
    await user.click(await screen.findByRole('button', { name: 'Résoudre' }));
    const resolution = within(await screen.findByRole('dialog'));
    await user.type(resolution.getByLabelText(/Réponse à l’utilisateur/), response);
    await user.click(resolution.getByRole('button', { name: 'Confirmer' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(writes).toEqual([
      { kind: 'request', body: { status: 'in_progress', notes: null } },
      { kind: 'identity', body: { firstname: 'Camille corrigée', birthdate: '1995-05-13', sex: 'female', reason: correctionReason } },
      { kind: 'request', body: { status: 'completed', notes: null, response } },
    ]);
  });
});
