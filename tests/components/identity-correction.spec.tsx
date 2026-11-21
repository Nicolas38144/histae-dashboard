import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IdentityCorrectionButton } from '../../src/features/users/identity-correction-button';
import { adminUser, fixtureIds } from '../fixtures';
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
});
