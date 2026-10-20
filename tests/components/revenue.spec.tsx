import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { RevenuePanel } from '../../src/components/RevenuePanel';
import { formatMoney } from '../../src/utils/format';
import { adminMetrics } from '../fixtures';
import { server } from '../mocks/server';

function card(label: string) {
  return within(screen.getByText(label).parentElement!.parentElement!);
}

describe('RevenuePanel', () => {
  it('shows invoice amounts and counts without inventing a monthly price', () => {
    render(<RevenuePanel initialRevenue={{ ...adminMetrics.revenue, estimated_revenue_cents: 6100, paid_invoices: 4, premium_subscriptions: 3 }} />);
    expect(card('Montant brut enregistré').getByText(formatMoney(6100, 'EUR'), { normalizer: (value) => value })).toBeInTheDocument();
    expect(card('Factures payées').getByText('4')).toBeInTheDocument();
    expect(card('Abonnements avec paiement').getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('Tarif mensuel utilisé')).not.toBeInTheDocument();
    expect(screen.getByText(/Frais Stripe et remboursements non déduits/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('uses the selected period and exact amount returned by the API', async () => {
    const user = userEvent.setup();
    server.use(http.get('http://localhost/api/admin/revenue', ({ request }) => {
      expect(new URL(request.url).searchParams.get('revenue_period')).toBe('previous_month');
      return HttpResponse.json({ ...adminMetrics.revenue, period: 'previous_month', estimated_revenue_cents: 4800, paid_invoices: 1, premium_subscriptions: 1 });
    }));
    render(<RevenuePanel initialRevenue={adminMetrics.revenue} />);
    await user.click(screen.getByRole('button', { name: 'Mois dernier' }));
    expect(await screen.findByText(formatMoney(4800, 'EUR'), { normalizer: (value) => value })).toBeInTheDocument();
    expect(card('Factures payées').getByText('1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mois dernier' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('warns about currencies excluded from the total', () => {
    render(<RevenuePanel initialRevenue={{ ...adminMetrics.revenue, excluded_currency_invoices: 2 }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('2 factures payées dans une autre devise exclues du total EUR');
    expect(screen.getByRole('alert')).toHaveTextContent('Aucune conversion');
  });
});
