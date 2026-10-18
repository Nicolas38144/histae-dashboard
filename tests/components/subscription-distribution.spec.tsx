import { http, HttpResponse } from 'msw';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SubscriptionDistribution } from '../../src/components/SubscriptionDistribution';
import type { AdminMetrics } from '../../src/api/types';
import Overview from '../../src/pages/Overview';
import { adminMetrics } from '../fixtures';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const offers: AdminMetrics['subscription_offers'] = [
  { offer: 'free', users: 4 },
  { offer: 'premium_monthly', users: 2 },
  { offer: 'premium_annual', users: 1 },
  { offer: 'premium_unspecified', users: 0 },
];

const countFor = (label: string) => within(screen.getByText(label).parentElement!);

describe('subscription distribution', () => {
  it('connects overview to the API counts for all three offers', async () => {
    server.use(http.get('http://localhost/api/admin/metrics', () => HttpResponse.json({
      ...adminMetrics, subscription_offers: offers,
    })));
    renderDashboard(<Overview />);
    await screen.findByText('Premium Mensuel');
    expect(countFor('Free').getByText('4')).toBeVisible();
    expect(countFor('Premium Mensuel').getByText('2')).toBeVisible();
    expect(countFor('Premium Annuel').getByText('1')).toBeVisible();
    expect(screen.queryByText('Premium sans périodicité')).not.toBeInTheDocument();
  });

  it('keeps manual Premium access separate from monthly and annual purchases', () => {
    renderDashboard(<SubscriptionDistribution subscription_offers={[
      ...offers.slice(0, 3), { offer: 'premium_unspecified', users: 3 },
    ]} />);
    expect(countFor('Premium sans périodicité').getByText('3')).toBeVisible();
    expect(countFor('Premium Mensuel').getByText('2')).toBeVisible();
  });

  it('shows the three zero counts supplied by the current API', () => {
    renderDashboard(<SubscriptionDistribution subscription_offers={offers.map((entry) => ({ ...entry, users: 0 }))} />);
    expect(countFor('Free').getByText('0')).toBeVisible();
    expect(countFor('Premium Mensuel').getByText('0')).toBeVisible();
    expect(countFor('Premium Annuel').getByText('0')).toBeVisible();
    expect(screen.queryByText('Premium sans périodicité')).not.toBeInTheDocument();
  });

  for (const counts of [undefined, [], [offers[0], offers[0], offers[2], offers[3]], [{ ...offers[0], users: -1 }, ...offers.slice(1)]]) {
    it('rejects missing or invalid offer metrics: ' + JSON.stringify(counts), async () => {
      server.use(http.get('http://localhost/api/admin/metrics', () => HttpResponse.json({
        ...adminMetrics, subscription_offers: counts,
      })));
      renderDashboard(<Overview />);
      expect(await screen.findByRole('alert')).toHaveTextContent('La répartition des abonnements renvoyée par l’API est incomplète.');
      expect(screen.queryByText('Premium Mensuel')).not.toBeInTheDocument();
    });
  }
});
