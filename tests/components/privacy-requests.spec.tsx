import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrivacyRequests from '../../src/pages/PrivacyRequests';
import { adminSession, erasureRequest, fixtureIds } from '../fixtures';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const apiUrl = 'http://localhost/api';

describe('privacy request messages', () => {
  it('shows user text safely and keeps it separate from editable internal notes', async () => {
    const user = userEvent.setup();
    const details = 'Corriger ma date de naissance.\n<img src=x onerror=alert(1)>';
    let mutation: unknown;
    server.use(
      http.get(`${apiUrl}/admin/data-subject-requests`, () => HttpResponse.json({
        requests: [{ ...erasureRequest, type: 'rectification', status: 'pending', erasure: null, details, notes: 'Note réservée aux administrateurs.' }], next_cursor: null,
      })),
      http.patch(`${apiUrl}/admin/data-subject-requests/${fixtureIds.request}`, async ({ request }) => {
        mutation = await request.json();
        return HttpResponse.json({ message: 'data subject request updated' });
      }),
    );
    const { container } = renderDashboard(<PrivacyRequests />, { session: { ...adminSession, role: 'admin' } });
    await user.click(await screen.findByText('Message de l’utilisateur'));
    expect(screen.getByText(/Corriger ma date de naissance/)).toBeVisible();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('columnheader', { name: 'Notes internes' })).toBeVisible();
    expect(screen.getByText('Note réservée aux administrateurs.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Prendre en charge' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Corriger ma date de naissance/)).toBeVisible();
    const notes = within(dialog).getByRole('textbox', { name: 'Notes internes' });
    expect(notes).toHaveValue('Note réservée aux administrateurs.');
    await user.clear(notes);
    await user.type(notes, 'Vérification en cours.');
    await user.click(within(dialog).getByRole('button', { name: 'Confirmer' }));
    await waitFor(() => expect(mutation).toEqual({ status: 'in_progress', notes: 'Vérification en cours.' }));
  });

  it('keeps old requests without a user message readable', async () => {
    const user = userEvent.setup();
    server.use(http.get(`${apiUrl}/admin/data-subject-requests`, () => HttpResponse.json({ requests: [erasureRequest], next_cursor: null })));
    renderDashboard(<PrivacyRequests />);
    await user.click(await screen.findByText('Message de l’utilisateur'));
    expect(screen.getByText('Aucune précision n’accompagnait cette demande.')).toBeVisible();
  });
  it('requires a public reply before resolving a correction request', async () => {
    const user = userEvent.setup();
    let mutation: unknown;
    server.use(
      http.get(`${apiUrl}/admin/data-subject-requests`, () => HttpResponse.json({ requests: [{ ...erasureRequest, type: 'rectification', erasure: null, details: 'Une donnée historique est incorrecte.' }], next_cursor: null })),
      http.patch(`${apiUrl}/admin/data-subject-requests/${fixtureIds.request}`, async ({ request }) => {
        mutation = await request.json();
        return HttpResponse.json({ message: 'data subject request updated' });
      }),
    );
    renderDashboard(<PrivacyRequests />);
    await user.click(await screen.findByRole('button', { name: 'Résoudre' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Confirmer' });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByRole('textbox', { name: /Réponse à l’utilisateur/ }), 'La donnée historique a été corrigée après vérification.');
    await user.click(confirm);
    await waitFor(() => expect(mutation).toEqual({ status: 'completed', notes: null, response: 'La donnée historique a été corrigée après vérification.' }));
  });

  it.each(['restriction', 'objection'])('keeps retired %s requests read-only', async (type) => {
    server.use(http.get(`${apiUrl}/admin/data-subject-requests`, () => HttpResponse.json({ requests: [{ ...erasureRequest, type, erasure: null }], next_cursor: null })));
    renderDashboard(<PrivacyRequests />);
    const row = (await screen.findByText(fixtureIds.request)).closest('tr')!;
    expect(within(row).queryByRole('button')).not.toBeInTheDocument();
  });

});
