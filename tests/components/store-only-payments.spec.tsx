import { http, HttpResponse } from 'msw';
import { screen } from '@testing-library/react';
import { getMetrics, getOutboxDeadLetters } from '../../src/api/admin';
import { navigationGroups } from '../../src/navigation/navigation';
import Overview from '../../src/pages/Overview';
import { adminMetrics } from '../fixtures';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const apiUrl = 'http://localhost/api';

describe('native store payments', () => {
  it.each(['admin', 'superadmin'] as const)('keeps only plans and store billing in the payment navigation for %s', (role) => {
    expect(navigationGroups(role, '').find((group) => group.id === 'payments')?.entries.map((entry) => entry.path))
      .toEqual(['/plans', '/store-billing']);
  });

  it('loads the overview without invoice metrics and links to imported store reports', async () => {
    server.use(http.get(`${apiUrl}/admin/metrics`, () => HttpResponse.json(adminMetrics)));
    renderDashboard(<Overview />);
    expect(await screen.findByRole('link', { name: 'Abonnements stores' })).toHaveAttribute('href', '/store-billing');
    expect(screen.getByText(/revenus bruts et nets importés/)).toBeVisible();
  });

  it('ignores unsupported maintenance tasks returned during a server migration', async () => {
    const job = { status: 'failed', started_at: null, finished_at: null, last_succeeded_at: null, duration_ms: null, processed_count: 0, batch_count: 0, work_remaining: true, last_error_code: null, missing: false, overdue: true };
    server.use(http.get(`${apiUrl}/admin/metrics`, () => HttpResponse.json({
      ...adminMetrics,
      operations: { ...adminMetrics.operations, maintenance: [{ ...job, job_name: 'retired-provider' }, { ...job, job_name: 'photos' }] },
    })));
    expect((await getMetrics()).operations.maintenance.map((entry) => entry.job_name)).toEqual(['photos']);
  });

  it('keeps all native payment retry types and the pagination cursor while excluding other payment providers', async () => {
    const types = ['billing.external.reconcile', 'billing.store.notification', 'billing.store.acknowledge', 'billing.store.reconcile', 'photo.delete'];
    server.use(http.get(`${apiUrl}/admin/outbox/dead-letters`, () => HttpResponse.json({
      events: types.map((event_type, index) => ({ event_id: String(index), event_type })), next_cursor: 'next-page',
    })));
    const page = await getOutboxDeadLetters();
    expect(page.events.map((entry) => entry.event_type)).toEqual(types.slice(1));
    expect(page.next_cursor).toBe('next-page');
  });
});
