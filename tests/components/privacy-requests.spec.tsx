import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PrivacyRequests from '../../src/pages/PrivacyRequests';
import { clearUserNames } from '../../src/utils/userNames';
import { adminSession, erasureRequest, fixtureIds } from '../fixtures';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const apiUrl = 'http://localhost/api';

describe('privacy request messages', () => {
  afterEach(clearUserNames);

  it('labels an erased account across its request history and hides links to its profile', async () => {
    const user = userEvent.setup();
    const erasure = { ...erasureRequest, status: 'completed', erasure: { ...erasureRequest.erasure, step: 'completed', status: 'completed' } };
    const rectification = { ...erasureRequest, id: fixtureIds.secondUser, type: 'rectification', erasure: null,
      details: 'Précision au dépôt.', response: 'Réponse au traitement.' };
    server.use(
      http.get(`${apiUrl}/admin/data-subject-requests`, () => HttpResponse.json({ requests: [erasure, rectification], next_cursor: null })),
      http.get(`${apiUrl}/admin/data-subject-requests/${rectification.id}/messages`, () => HttpResponse.json({
        messages: [{ id: 'archived', author: 'team', body: 'Échange conservé.', created_at: rectification.requested_at }],
        next_cursor: null,
        status: rectification.status,
      })),
    );
    renderDashboard(<PrivacyRequests />);

    const accountLabels = await screen.findAllByText('Compte supprimé', { exact: true });
    expect(accountLabels).toHaveLength(2);
    for (const label of accountLabels) expect(label.closest('a')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Corriger le profil' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Historique des échanges' })).toHaveLength(2);
    const row = within(screen.getByText(rectification.id).closest('tr')!);
    expect(row.queryByText('Message de l’utilisateur')).not.toBeInTheDocument();
    expect(row.queryByText('Réponse à l’utilisateur')).not.toBeInTheDocument();
    await user.click(row.getByRole('button', { name: 'Historique des échanges' }));
    const history = within(await screen.findByRole('dialog', { name: 'Historique des échanges' }));
    expect(await history.findByText('Échange conservé.')).toBeVisible();
    expect(history.getByText(rectification.details)).toBeVisible();
    expect(history.getByText(rectification.response)).toBeVisible();
    expect(history.queryByRole('textbox')).not.toBeInTheDocument();
    expect(history.queryByRole('button', { name: 'Envoyer la réponse' })).not.toBeInTheDocument();
    await user.click(history.getByRole('button', { name: 'Fermer' }));
    await user.click(await screen.findByRole('button', { name: 'Résoudre' }));
    const dialog = within(await screen.findByRole('dialog'));
    expect(dialog.queryByRole('link', { name: 'Corriger le profil' })).not.toBeInTheDocument();
  });

  it('keeps completed and rejected requests readable without offering a reply', async () => {
    const user = userEvent.setup();
    const completed = { ...erasureRequest, type: 'rectification', status: 'completed', erasure: null,
      response: 'Réponse déjà envoyée.' };
    const outdated = { ...completed, id: fixtureIds.secondUser, status: 'in_progress' };
    const requestsUrl = `${apiUrl}/admin/data-subject-requests`;
    server.use(
      http.get(requestsUrl, () => HttpResponse.json({ requests: [completed, outdated], next_cursor: null })),
      http.get(`${requestsUrl}/:id/messages`, ({ params }) => HttpResponse.json({
        messages: [{ id: 'previous', author: 'team', body: 'Réponse déjà envoyée.', created_at: completed.requested_at }],
        next_cursor: null,
        status: params.id === completed.id ? 'completed' : 'rejected',
      })),
    );
    renderDashboard(<PrivacyRequests />);

    for (const label of ['Historique des échanges', 'Échanges']) {
      await user.click(await screen.findByRole('button', { name: label }));
      const history = within(await screen.findByRole('dialog', { name: 'Historique des échanges' }));
      expect(await history.findByText('Réponse déjà envoyée.')).toBeVisible();
      expect(history.queryByText('Réponse à l’utilisateur')).not.toBeInTheDocument();
      expect(history.queryByRole('textbox')).not.toBeInTheDocument();
      expect(history.queryByRole('button', { name: 'Envoyer la réponse' })).not.toBeInTheDocument();
      await user.click(history.getByRole('button', { name: 'Fermer' }));
    }
  });

  it('authorizes and paginates an admin thread while preserving the initial message', async () => {
    const user = userEvent.setup();
    const request = { ...erasureRequest, type: 'access', erasure: null, details: 'Demande initiale.',
      response: 'Première réponse.' };
    const message = (id: string, body: string) => ({ id, body, author: 'team', created_at: request.requested_at });
    const latest = message('latest', 'Dernière réponse.');
    const middle = message('middle', 'Réponse suivante.');
    const earliest = message('earliest', 'Première réponse.');
    const reads: Array<{ before: string | null; reason: string | null }> = [];
    const exportReads: Array<string | null> = [];
    const accessReason = 'Vérification de la demande';
    server.use(
      http.get(`${apiUrl}/admin/data-subject-requests`, () => HttpResponse.json({ requests: [request], next_cursor: null })),
      http.get(`${apiUrl}/admin/data-subject-requests/${request.id}/messages`, ({ request: read }) => {
        const params = new URL(read.url).searchParams;
        const before = params.get('before');
        reads.push({ before, reason: params.get('reason') });
        return before === middle.id
          ? HttpResponse.json({ messages: [middle, earliest], next_cursor: null, status: request.status })
          : HttpResponse.json({ messages: [latest, middle], next_cursor: middle.id, status: request.status });
      }),
      http.get(`${apiUrl}/admin/data-subject-requests/${request.id}/assisted-export`, ({ request: read }) => {
        exportReads.push(new URL(read.url).searchParams.get('reason'));
        return HttpResponse.json(null);
      }),
    );
    renderDashboard(<PrivacyRequests />, { session: { ...adminSession, role: 'admin' } });
    await user.click(await screen.findByRole('button', { name: 'Échanges' }));
    const access = within(await screen.findByRole('dialog', { name: 'Justifier l’accès à la conversation' }));
    const open = access.getByRole('button', { name: 'Ouvrir la conversation' });
    expect(open).toBeDisabled();
    expect(reads).toEqual([]);
    await user.type(access.getByRole('textbox', { name: 'Motif obligatoire' }), ` ${accessReason} `);
    await user.click(open);
    const thread = within(await screen.findByRole('dialog', { name: 'Échanges' }));
    expect(await thread.findByText(earliest.body)).toBeVisible();
    await user.click(await thread.findByRole('button', { name: 'Charger les messages précédents' }));
    await waitFor(() => expect(thread.getAllByText(/^(Demande initiale|Première réponse|Réponse suivante|Dernière réponse)\.$/).map((element) => element.textContent))
      .toEqual([request.details, earliest.body, middle.body, latest.body]));
    expect(reads).toEqual([{ before: null, reason: accessReason }, { before: middle.id, reason: accessReason }]);
    expect(exportReads).toEqual([accessReason]);
    expect(thread.getByRole('textbox', { name: /Réponse à l’utilisateur/ })).toBeEnabled();
  });

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
    renderDashboard(<PrivacyRequests />, { session: { ...adminSession, role: 'admin' } });
    await screen.findByText(fixtureIds.request);
    expect(screen.queryByText('Message de l’utilisateur')).not.toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Notes internes' })).toBeVisible();
    expect(screen.getByText('Note réservée aux administrateurs.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Prendre en charge' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Corriger ma date de naissance/)).toBeVisible();
    expect(dialog.querySelector('img')).toBeNull();
    const notes = within(dialog).getByRole('textbox', { name: 'Notes internes' });
    expect(notes).toHaveValue('Note réservée aux administrateurs.');
    await user.clear(notes);
    await user.type(notes, 'Vérification en cours.');
    await user.click(within(dialog).getByRole('button', { name: 'Confirmer' }));
    await waitFor(() => expect(mutation).toEqual({ status: 'in_progress', notes: 'Vérification en cours.' }));
  });

  it('opens an empty history for a request without a user message', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${apiUrl}/admin/data-subject-requests`, () => HttpResponse.json({ requests: [erasureRequest], next_cursor: null })),
      http.get(`${apiUrl}/admin/data-subject-requests/${erasureRequest.id}/messages`, () => HttpResponse.json({
        messages: [], next_cursor: null, status: erasureRequest.status,
      })),
    );
    renderDashboard(<PrivacyRequests />);
    await user.click(await screen.findByRole('button', { name: 'Historique des échanges' }));
    expect(await screen.findByText('Aucun message.')).toBeVisible();
  });

  it('sends the optional public reply when resolving a portability request', async () => {
    const user = userEvent.setup();
    let mutation: unknown;
    server.use(
      http.get(`${apiUrl}/admin/data-subject-requests`, () => HttpResponse.json({
        requests: [{ ...erasureRequest, type: 'portability', status: 'in_progress', erasure: null }],
        next_cursor: null,
      })),
      http.patch(`${apiUrl}/admin/data-subject-requests/${fixtureIds.request}`, async ({ request }) => {
        mutation = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderDashboard(<PrivacyRequests />);

    await user.click(await screen.findByRole('button', { name: 'Résoudre' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Confirmer' });
    expect(confirm).toBeEnabled();
    await user.type(within(dialog).getByRole('textbox', { name: /Réponse à l’utilisateur/ }), ' Une réponse à votre demande. ');
    await user.click(confirm);
    await waitFor(() => expect(mutation).toEqual({ status: 'completed', notes: null, response: 'Une réponse à votre demande.' }));
  });

  it('warns that account access ends when erasure is scheduled', async () => {
    const user = userEvent.setup();
    server.use(http.get(`${apiUrl}/admin/data-subject-requests`, () => HttpResponse.json({ requests: [{ ...erasureRequest, erasure: null }], next_cursor: null })));
    renderDashboard(<PrivacyRequests />);
    await user.click(await screen.findByRole('button', { name: 'Lancer l’effacement' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/ferme immédiatement l’accès au compte/)).toBeVisible();
    expect(within(dialog).queryByRole('textbox', { name: /Réponse à l’utilisateur/ })).not.toBeInTheDocument();
  });
  it('requires a public reply before resolving a correction request', async () => {
    const user = userEvent.setup();
    let mutation: unknown;
    server.use(
      http.get(`${apiUrl}/admin/user-names`, () => HttpResponse.json({ users: [{ user_id: erasureRequest.user_id, firstname: 'Camille' }] })),
      http.get(`${apiUrl}/admin/data-subject-requests`, () => HttpResponse.json({ requests: [{ ...erasureRequest, type: 'rectification', erasure: null, details: 'Une donnée historique est incorrecte.' }], next_cursor: null })),
      http.patch(`${apiUrl}/admin/data-subject-requests/${fixtureIds.request}`, async ({ request }) => {
        mutation = await request.json();
        return HttpResponse.json({ message: 'data subject request updated' });
      }),
    );
    renderDashboard(<PrivacyRequests />);
    await user.click(await screen.findByRole('button', { name: 'Résoudre' }));
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByRole('link', { name: 'Corriger le profil' })).toHaveAttribute('href', `/users/${erasureRequest.user_id}`);
    const confirm = within(dialog).getByRole('button', { name: 'Confirmer' });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByRole('textbox', { name: /Réponse à l’utilisateur/ }), 'La donnée historique a été corrigée après vérification.');
    await user.click(confirm);
    await waitFor(() => expect(mutation).toEqual({ status: 'completed', notes: null, response: 'La donnée historique a été corrigée après vérification.' }));
  });

  it('keeps retired restriction and objection requests read-only', async () => {
    const requests = [
      { ...erasureRequest, type: 'restriction', erasure: null, details: 'Précision de la demande de limitation.' },
      { ...erasureRequest, id: fixtureIds.secondUser, type: 'objection', erasure: null, details: 'Précision de la demande d’opposition.' },
    ];
    server.use(http.get(`${apiUrl}/admin/data-subject-requests`, () => HttpResponse.json({ requests, next_cursor: null })));
    renderDashboard(<PrivacyRequests />);
    for (const { id, details } of requests) {
      const row = (await screen.findByText(id)).closest('tr')!;
      expect(within(row).queryByRole('button')).not.toBeInTheDocument();
      expect(within(row).getByText('Message de l’utilisateur')).toBeVisible();
      expect(within(row).getByText(details)).toBeInTheDocument();
    }
  });

  it('requires separate internal notes and a public reply when an admin rejects a correction', async () => {
    const user = userEvent.setup();
    let mutation: unknown;
    server.use(
      http.get(`${apiUrl}/admin/data-subject-requests`, () => HttpResponse.json({ requests: [{ ...erasureRequest, type: 'rectification', erasure: null }], next_cursor: null })),
      http.patch(`${apiUrl}/admin/data-subject-requests/${fixtureIds.request}`, async ({ request }) => {
        mutation = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderDashboard(<PrivacyRequests />, { session: { ...adminSession, role: 'admin' } });
    await user.click(await screen.findByRole('button', { name: 'Refuser' }));
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Confirmer' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Notes internes' }), 'Justificatif insuffisant.');
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByRole('textbox', { name: /Réponse à l’utilisateur/ }), ' Merci de préciser la correction demandée. ');
    await user.click(confirm);
    await waitFor(() => expect(mutation).toEqual({ status: 'rejected', notes: 'Justificatif insuffisant.', response: 'Merci de préciser la correction demandée.' }));
  });

  it('retains the reply after a failed mutation and allows an explicit retry', async () => {
    const user = userEvent.setup();
    let calls = 0;
    server.use(
      http.get(`${apiUrl}/admin/data-subject-requests`, () => HttpResponse.json({ requests: [{ ...erasureRequest, type: 'rectification', erasure: null }], next_cursor: null })),
      http.patch(`${apiUrl}/admin/data-subject-requests/${fixtureIds.request}`, () => {
        calls += 1;
        return calls === 1 ? HttpResponse.json({ error: { code: 'unavailable' } }, { status: 503 }) : new HttpResponse(null, { status: 204 });
      }),
    );
    renderDashboard(<PrivacyRequests />);
    await user.click(await screen.findByRole('button', { name: 'Résoudre' }));
    const dialog = await screen.findByRole('dialog');
    const reply = within(dialog).getByRole('textbox', { name: /Réponse à l’utilisateur/ });
    await user.type(reply, 'La correction a été vérifiée.');
    await user.click(within(dialog).getByRole('button', { name: 'Confirmer' }));
    expect(await screen.findByText('La requête a échoué (unavailable).')).toBeVisible();
    expect(calls).toBe(1);
    expect(reply).toHaveValue('La correction a été vérifiée.');
    await user.click(within(dialog).getByRole('button', { name: 'Confirmer' }));
    await waitFor(() => expect(calls).toBe(2));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

});
