import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PhotoReconciliationItem } from '../../src/api/types';
import PhotoReconciliation from '../../src/pages/PhotoReconciliation';
import { adminMetrics, adminSession, fixtureIds, photoReconciliation } from '../fixtures';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const apiUrl = 'http://localhost/api';

describe('photo maintenance', () => {
  it('explains abandoned-upload deletion and requires an administrator reason before scheduling it', async () => {
    const user = userEvent.setup();
    const requests: unknown[] = [];
    const photo: PhotoReconciliationItem = {
      ...photoReconciliation,
      status: 'processing',
      issue: 'stale_processing',
      outbox_status: null,
      outbox_attempts: null,
    };
    server.use(
      http.get(`${apiUrl}/admin/metrics`, () => HttpResponse.json(adminMetrics)),
      http.get(`${apiUrl}/admin/photo-reconciliation`, () => HttpResponse.json({ photos: [photo], next_cursor: null })),
      http.post(`${apiUrl}/admin/photo-reconciliation/${fixtureIds.photo}/retry`, async ({ request }) => {
        requests.push(await request.json());
        return new HttpResponse(null, { status: 202 });
      }),
    );
    renderDashboard(<PhotoReconciliation />, { session: { ...adminSession, role: 'admin' } });

    await user.click(await screen.findByRole('button', { name: 'Nettoyer l’envoi abandonné' }));
    const dialog = screen.getByRole('dialog', { name: 'Nettoyer cet envoi abandonné ?' });
    expect(within(dialog).getByText(/supprimer définitivement le fichier éventuel/)).toHaveTextContent(/La photo actuellement utilisée sur le profil sera conservée/);
    const confirm = within(dialog).getByRole('button', { name: 'Programmer le nettoyage' });
    expect(confirm).toBeDisabled();
    expect(requests).toEqual([]);
    await user.type(within(dialog).getByRole('textbox', { name: 'Motif opérationnel' }), 'Envoi interrompu confirmé');
    await user.click(confirm);

    await waitFor(() => expect(requests).toEqual([{ reason: 'Envoi interrompu confirmé' }]));
    expect(await screen.findByText('Suppression de la photo programmée.')).toBeVisible();
  });

  it('separates recent uploads from abandoned ones and refreshes both the metrics and operation list', async () => {
    const user = userEvent.setup();
    let metricsCalls = 0;
    let listCalls = 0;
    server.use(
      http.get(`${apiUrl}/admin/metrics`, () => {
        metricsCalls += 1;
        return HttpResponse.json({
          ...adminMetrics,
          photos: { ...adminMetrics.photos, ready: 3, processing: 3, stale_processing: 2 },
        });
      }),
      http.get(`${apiUrl}/admin/photo-reconciliation`, () => {
        listCalls += 1;
        return HttpResponse.json({ photos: [], next_cursor: null });
      }),
    );
    renderDashboard(<PhotoReconciliation />);

    expect(await screen.findByText(/Aucune opération dans cette sélection/)).toHaveTextContent(/Les photos disponibles ne sont pas listées ici/);
    expect(within(screen.getByText('Photos disponibles').parentElement!).getByRole('heading', { name: '3' })).toBeVisible();
    expect(within(screen.getByText('Envois en cours').parentElement!).getByRole('heading', { name: '1' })).toBeVisible();
    expect(within(screen.getByText('Envois abandonnés à nettoyer').parentElement!).getByRole('heading', { name: '2' })).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent(/sans tâche Outbox active/);

    await user.click(screen.getByRole('button', { name: 'Actualiser' }));
    await waitFor(() => expect([metricsCalls, listCalls]).toEqual([2, 2]));
  });

  it.each([
    ['deletion_event_missing', null, 'Suppression sans tâche Outbox'],
    ['deletion_event_completed', 'completed', 'Tâche terminée, suppression à vérifier'],
    ['deletion_event_discarded', 'discarded', 'Tâche abandonnée, suppression à vérifier'],
  ] as const)('offers deletion recovery for %s without exposing a conversion action', async (issue, outboxStatus, label) => {
    const user = userEvent.setup();
    server.use(
      http.get(`${apiUrl}/admin/metrics`, () => HttpResponse.json(adminMetrics)),
      http.get(`${apiUrl}/admin/photo-reconciliation`, () => HttpResponse.json({
        photos: [{ ...photoReconciliation, issue, outbox_status: outboxStatus }],
        next_cursor: null,
      })),
    );
    renderDashboard(<PhotoReconciliation />);

    expect(await screen.findByText(label)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Nettoyer l’envoi abandonné' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Relancer la suppression' }));
    const dialog = screen.getByRole('dialog', { name: 'Relancer la suppression de cette photo ?' });
    expect(within(dialog).getByText(/La suppression définitive du fichier sera reprogrammée/)).toBeVisible();
  });
});
