import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditLogs from '../../src/pages/AuditLogs';
import BillingReconciliation from '../../src/pages/BillingReconciliation';
import ContentModeration from '../../src/pages/ContentModeration';
import PhotoReconciliation from '../../src/pages/PhotoReconciliation';
import PrivacyRequests from '../../src/pages/PrivacyRequests';
import ProfileQuestions from '../../src/pages/ProfileQuestions';
import Reports from '../../src/pages/Reports';
import UserDetails from '../../src/pages/UserDetails';
import {
  adminMetrics,
  adminUser,
  billingReconciliation,
  erasureRequest,
  fixtureIds,
  moderationDetail,
  photoReconciliation,
  profileQuestion,
  report,
} from '../fixtures';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const apiUrl = 'http://localhost/api';

describe('critical dashboard actions', () => {
  it('renders an explicit empty state for a catalogue without questions', async () => {
    server.use(http.get(`${apiUrl}/admin/profile-questions`, () => HttpResponse.json({ questions: [] })));
    renderDashboard(<ProfileQuestions />);

    expect(await screen.findByText('Aucune question configurée.')).toBeVisible();
  });

  it('shows the cascade impact before deleting a profile question', async () => {
    const user = userEvent.setup();
    let deleteCalls = 0;
    server.use(
      http.get(`${apiUrl}/admin/profile-questions`, () => HttpResponse.json({ questions: [profileQuestion] })),
      http.delete(`${apiUrl}/admin/profile-questions/${fixtureIds.question}`, () => {
        deleteCalls += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderDashboard(<ProfileQuestions />);

    await user.click(await screen.findByRole('button', { name: `Supprimer ${profileQuestion.prompt}` }));
    expect(screen.getByText(/ses 12 réponse\(s\) utilisateur seront supprimées définitivement/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Supprimer définitivement' }));

    await waitFor(() => expect(deleteCalls).toBe(1));
    expect(await screen.findByText('Question et réponses associées supprimées.')).toBeVisible();
  });

  it('requires a reason and sends one ban mutation', async () => {
    const user = userEvent.setup();
    let body: unknown;
    server.use(
      http.get(`${apiUrl}/admin/users/${fixtureIds.user}`, () => HttpResponse.json(adminUser)),
      http.get(`${apiUrl}/matches/${fixtureIds.user}`, () => HttpResponse.json({ matches: [], next_cursor: null })),
      http.patch(`${apiUrl}/admin/users/${fixtureIds.user}/status`, async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderDashboard(<UserDetails />, { route: `/users/${fixtureIds.user}`, routePath: '/users/:id' });

    await user.click(await screen.findByRole('button', { name: 'Bannir' }));
    const confirm = screen.getByRole('button', { name: 'Bannir' });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText('Motif obligatoire'), 'Abus confirmé pendant le test');
    await user.click(confirm);

    await waitFor(() => expect(body).toEqual({ is_banned: true, reason: 'Abus confirmé pendant le test' }));
    expect(await screen.findByText('Compte banni et sessions révoquées.')).toBeVisible();
  });

  it('surfaces an optimistic-concurrency conflict during moderation', async () => {
    const user = userEvent.setup();
    let submitted: unknown;
    server.use(
      http.get(`${apiUrl}/admin/content-moderation`, () => HttpResponse.json({ cases: [moderationDetail], next_cursor: null })),
      http.get(`${apiUrl}/admin/content-moderation/${fixtureIds.moderation}`, () => HttpResponse.json(moderationDetail)),
      http.patch(`${apiUrl}/admin/content-moderation/${fixtureIds.moderation}`, async ({ request }) => {
        submitted = await request.json();
        return HttpResponse.json({ error: { code: 'moderation_version_conflict', message: 'Cette décision a déjà changé.' } }, { status: 409 });
      }),
    );
    renderDashboard(<ContentModeration />);

    await user.click(await screen.findByRole('button', { name: 'Examiner' }));
    const accessDialog = await screen.findByRole('dialog', { name: 'Justifier l’accès au contenu' });
    await user.type(within(accessDialog).getByRole('textbox', { name: /Motif de consultation/ }), 'Vérification manuelle');
    await user.click(within(accessDialog).getByRole('button', { name: 'Ouvrir le contenu' }));
    expect(await screen.findByText(moderationDetail.content!)).toBeVisible();
    const reviewDialog = await screen.findByRole('dialog', { name: 'Examiner : Bio' });
    await user.type(within(reviewDialog).getByRole('textbox', { name: /Motif de la décision/ }), 'Contenu acceptable');
    await user.click(within(reviewDialog).getByRole('button', { name: 'Approuver' }));

    expect(await screen.findByText('Cette décision a déjà changé.')).toBeVisible();
    expect(submitted).toEqual({ version: 3, decision: 'approved', reason: 'Contenu acceptable' });
  });

  it('retries photo and Stripe dead letters only after an explicit reason', async () => {
    const user = userEvent.setup();
    const retries: Array<{ path: string; body: unknown }> = [];
    server.use(
      http.get(`${apiUrl}/admin/metrics`, () => HttpResponse.json(adminMetrics)),
      http.get(`${apiUrl}/admin/photo-reconciliation`, () => HttpResponse.json({ photos: [photoReconciliation], next_cursor: null })),
      http.post(`${apiUrl}/admin/photo-reconciliation/${fixtureIds.photo}/retry`, async ({ request }) => {
        retries.push({ path: new URL(request.url).pathname, body: await request.json() });
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const photoView = renderDashboard(<PhotoReconciliation />);
    await user.click(await screen.findByRole('button', { name: 'Réconcilier' }));
    const photoDialog = await screen.findByRole('dialog', { name: 'Réconcilier cette photo ?' });
    await user.type(within(photoDialog).getByLabelText('Motif opérationnel'), 'Stockage de nouveau disponible');
    await user.click(within(photoDialog).getByRole('button', { name: 'Remettre en file' }));
    await waitFor(() => expect(retries).toHaveLength(1));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    photoView.unmount();

    server.use(
      http.get(`${apiUrl}/admin/billing-reconciliation`, () => HttpResponse.json({ events: [billingReconciliation], next_cursor: null })),
      http.post(`${apiUrl}/admin/outbox/${fixtureIds.event}/retry`, async ({ request }) => {
        retries.push({ path: new URL(request.url).pathname, body: await request.json() });
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderDashboard(<BillingReconciliation />);
    await user.click(await screen.findByRole('button', { name: 'Revérifier' }));
    const billingDialog = await screen.findByRole('dialog', { name: 'Revérifier cette anomalie Stripe ?' });
    const billingReason = within(billingDialog).getByLabelText('Motif opérationnel');
    await user.clear(billingReason);
    await user.type(billingReason, 'Anomalie Stripe examinée');
    await user.click(within(billingDialog).getByRole('button', { name: 'Remettre en file' }));

    await waitFor(() => expect(retries).toEqual([
      { path: `/api/admin/photo-reconciliation/${fixtureIds.photo}/retry`, body: { reason: 'Stockage de nouveau disponible' } },
      { path: `/api/admin/outbox/${fixtureIds.event}/retry`, body: { reason: 'Anomalie Stripe examinée' } },
    ]));
  });

  it('retries an erasure without presenting it as account reactivation', async () => {
    const user = userEvent.setup();
    let retryBody: unknown;
    server.use(
      http.get(`${apiUrl}/admin/data-subject-requests`, () => HttpResponse.json({ requests: [erasureRequest], next_cursor: null })),
      http.post(`${apiUrl}/admin/outbox/${fixtureIds.event}/retry`, async ({ request }) => {
        retryBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderDashboard(<PrivacyRequests />);

    await user.click(await screen.findByRole('button', { name: 'Reprendre' }));
    expect(screen.getByText(/elle ne réactive pas le compte/)).toBeVisible();
    const retryDialog = await screen.findByRole('dialog', { name: 'Reprendre cet effacement ?' });
    const retryReason = within(retryDialog).getByLabelText('Motif de reprise (3 à 500 caractères)');
    await user.clear(retryReason);
    await user.type(retryReason, 'Incident de stockage résolu');
    await user.click(within(retryDialog).getByRole('button', { name: 'Confirmer' }));

    await waitFor(() => expect(retryBody).toEqual({ reason: 'Incident de stockage résolu' }));
    expect(await screen.findByText('Reprise mise en file.')).toBeVisible();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('updates report filters and status without replaying the mutation', async () => {
    const user = userEvent.setup();
    const filters: Array<string | null> = [];
    let updates = 0;
    server.use(
      http.get(`${apiUrl}/admin/reports`, ({ request }) => {
        filters.push(new URL(request.url).searchParams.get('status'));
        return HttpResponse.json({ reports: [report], next_cursor: null });
      }),
      http.patch(`${apiUrl}/admin/reports/${fixtureIds.report}`, async ({ request }) => {
        updates += 1;
        expect(await request.json()).toEqual({ status: 'reviewed' });
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderDashboard(<Reports />);

    const row = (await screen.findByText(report.reason)).closest('tr')!;
    await user.click(within(row).getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Traité' }));
    await waitFor(() => expect(updates).toBe(1));

    const filtersSelect = screen.getAllByRole('combobox')[0];
    await user.click(filtersSelect);
    await user.click(await screen.findByRole('option', { name: 'Rejetés' }));
    await waitFor(() => expect(filters).toContain('dismissed'));
  });

  it('appends cursor pages without losing the original access-log search', async () => {
    const user = userEvent.setup();
    const cursors: Array<string | null> = [];
    server.use(http.get(`${apiUrl}/admin/data-access-logs`, ({ request }) => {
      const url = new URL(request.url);
      const cursor = url.searchParams.get('cursor');
      cursors.push(cursor);
      const second = cursor === 'cursor-fixture';
      return HttpResponse.json({
        logs: [{
          id: second ? 'log-2' : 'log-1',
          accessed_user_id: fixtureIds.user,
          accessor_id: fixtureIds.admin,
          accessor_role: 'admin',
          action: second ? 'second_page_action' : 'first_page_action',
          reason: 'Motif de test',
          accessed_at: '2026-09-06T08:00:00.000Z',
        }],
        next_cursor: second ? null : 'cursor-fixture',
      });
    }));
    renderDashboard(<AuditLogs />);

    await user.type(screen.getByLabelText('UUID de l’utilisateur concerné'), fixtureIds.user);
    await user.click(screen.getByRole('button', { name: 'Rechercher' }));
    expect(await screen.findByText('first_page_action')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Charger la suite' }));

    expect(await screen.findByText('second_page_action')).toBeVisible();
    expect(screen.getByText('first_page_action')).toBeVisible();
    expect(cursors).toEqual([null, 'cursor-fixture']);
  });
});
