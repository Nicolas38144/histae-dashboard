import { http, HttpResponse } from 'msw';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getMetrics, getOutboxDeadLetters } from '../../src/api/admin';
import type { StoreBillingStatus } from '../../src/features/store-billing/types';
import { navigationGroups } from '../../src/navigation/navigation';
import Overview from '../../src/pages/Overview';
import StoreBilling from '../../src/pages/StoreBilling';
import { adminMetrics, adminSession } from '../fixtures';
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

describe('store financial report imports', () => {
  beforeEach(() => {
    const status: StoreBillingStatus = {
      enabled: { app_store: true, google_play: true },
      period: 'last_30_days',
      sources: [],
      finance: [{ provider: 'app_store', currency: 'EUR', gross_cents: 500, net_cents: null, rows: 1, last_imported_at: '2026-10-01T00:00:00Z' }],
      recent: [],
      pending_notifications: 0,
      dead_letters: 0,
      finance_basis: 'imported_store_reports',
    };
    server.use(http.get(`${apiUrl}/admin/store-billing`, () => HttpResponse.json(status)));
  });

  it('lets an admin read imported reports and hides the import form', async () => {
    renderDashboard(<StoreBilling />, { session: { ...adminSession, role: 'admin' } });
    expect(await screen.findByRole('heading', { name: 'Rapports financiers importés' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'App Store' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Importer un rapport' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Fichier CSV normalisé')).not.toBeInTheDocument();
  });

  it('imports App Store and Google Play reports only after a superadmin confirms each preview', async () => {
    const user = userEvent.setup();
    const imports: unknown[] = [];
    server.use(http.post(`${apiUrl}/admin/store-billing/finance`, async ({ request }) => {
      imports.push(await request.json());
      return new HttpResponse(null, { status: 204 });
    }));
    renderDashboard(<StoreBilling />);
    const providers = [['App Store', 'app_store'], ['Google Play', 'google_play']] as const;
    const row = { row_id: 'line1', paid_at: '2026-10-01T00:00:00Z', currency: 'EUR', gross_cents: 500, net_cents: 425 };
    const csv = 'row_id,paid_at,currency,gross_cents,net_cents\nline1,2026-10-01T00:00:00Z,EUR,500,425';
    const preview = screen.getByRole('button', { name: 'Importer un rapport' });
    const reportId = screen.getByLabelText('Identifiant stable du rapport');

    for (const [index, [label, provider]] of providers.entries()) {
      await user.click(await screen.findByRole('combobox', { name: 'Fournisseur' }));
      await user.click(screen.getByRole('option', { name: label }));
      const id = `2026-10-${provider}`;
      await user.clear(reportId);
      await user.type(reportId, id);
      const file = Object.assign(new File([csv], `${provider}.csv`, { type: 'text/csv' }), { text: async () => csv });
      await user.upload(screen.getByLabelText('Fichier CSV normalisé'), file);
      expect(await screen.findByRole('cell', { name: /4,25/ })).toBeVisible();
      await user.click(preview);

      const dialog = await screen.findByRole('dialog');
      expect(dialog).toHaveTextContent(label);
      expect(dialog).toHaveTextContent(id);
      expect(imports).toHaveLength(index);
      await user.click(within(dialog).getByRole('button', { name: 'Confirmer' }));
      expect(await screen.findByText('Le rapport a été importé.')).toBeVisible();
      expect(imports).toHaveLength(index + 1);
      expect(imports[index]).toEqual({ provider, report_id: id, rows: [row] });
    }
  });
});
