import { http, HttpResponse } from 'msw';
import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { PlanCatalog } from '../../src/api/types';
import { parsePlanCatalog } from '../../src/api/plan-catalog';
import Plans from '../../src/pages/Plans';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const catalog: PlanCatalog = {
  plans: [
    { code: 'free', display_name: 'Free', monthly_price_cents: 0, annual_price_cents: 0, currency: 'EUR', weekly_continuation_limit: 5, weekly_included_credits: 2, advertising_credit_stock_limit: 3, ads_removed: false, rewarded_advertising_enabled: false, features: [] },
    { code: 'premium', display_name: 'Premium', monthly_price_cents: 500, annual_price_cents: 4800, currency: 'EUR', advertising_credit_stock_limit: 3, ads_removed: true, rewarded_advertising_enabled: false, features: [] },
  ],
  offers: [
    { code: 'free', plan_code: 'free', display_name: 'Free', billing_period: null, price_cents: 0, currency: 'EUR' },
    { code: 'premium_monthly', plan_code: 'premium', display_name: 'Premium Mensuel', billing_period: 'monthly', price_cents: 500, currency: 'EUR' },
    { code: 'premium_annual', plan_code: 'premium', display_name: 'Premium Annuel', billing_period: 'annual', price_cents: 4800, currency: 'EUR' },
  ],
};

describe('commercial offers', () => {
  it('renders three distinct API offers with the correct billing periods', async () => {
    server.use(http.get('http://localhost/api/plans', () => HttpResponse.json(catalog)));
    renderDashboard(<Plans />);
    const monthly = (await screen.findByRole('heading', { name: 'Premium Mensuel' })).closest('.MuiPaper-root')!;
    const annual = screen.getByRole('heading', { name: 'Premium Annuel' }).closest('.MuiPaper-root')!;
    const free = screen.getByRole('heading', { name: 'Free' }).closest('.MuiPaper-root')!;
    expect(within(free as HTMLElement).getByText('Continuations : 5 maximum par semaine')).toBeVisible();
    expect(within(free as HTMLElement).getByText(/2 crédits gratuits renouvelés le lundi à 00:00 UTC/))
      .toHaveTextContent('les crédits publicitaires inutilisés expirent le lundi à 00:00 UTC');
    expect(within(monthly as HTMLElement).getByText(/5,00/)).toBeVisible();
    expect(within(monthly as HTMLElement).getByText('par mois')).toBeVisible();
    expect(within(annual as HTMLElement).getByText(/48,00/)).toBeVisible();
    expect(within(annual as HTMLElement).getByText('par an')).toBeVisible();
    expect(screen.getAllByText('Continuations : illimitées')).toHaveLength(2);
  });

  it('uses changed API prices instead of embedding the website amounts', async () => {
    const updated = structuredClone(catalog);
    updated.offers[2].price_cents = 9900;
    server.use(http.get('http://localhost/api/plans', () => HttpResponse.json(updated)));
    renderDashboard(<Plans />);
    expect(await screen.findByText(/99,00/)).toBeVisible();
    expect(screen.queryByText(/48,00/)).not.toBeInTheDocument();
  });

  it('rejects an offer whose entitlement plan is missing', async () => {
    server.use(http.get('http://localhost/api/plans', () => HttpResponse.json({ ...catalog, plans: [] })));
    renderDashboard(<Plans />);
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Premium Annuel' })).not.toBeInTheDocument();
  });

  it('rejects a plans-only API response instead of reconstructing offers', async () => {
    server.use(http.get('http://localhost/api/plans', () => HttpResponse.json({ plans: catalog.plans })));
    renderDashboard(<Plans />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Le catalogue des offres est incomplet.');
    expect(screen.queryByRole('heading', { name: 'Premium Mensuel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Premium Annuel' })).not.toBeInTheDocument();
  });

  it('respects explicitly empty offers without reconstructing them', () => {
    expect(parsePlanCatalog({ ...catalog, offers: [] }).offers).toEqual([]);
    expect(parsePlanCatalog({ plans: [catalog.plans[0]], offers: [] }).offers).toEqual([]);
    expect(parsePlanCatalog({ plans: [], offers: [] }).offers).toEqual([]);
  });

  for (const offers of [null, {}, [{ ...catalog.offers[2], billing_period: 'monthly' }], [catalog.offers[0], catalog.offers[0]]]) {
    it(`rejects malformed present offers without falling back: ${JSON.stringify(offers)}`, () => {
      expect(() => parsePlanCatalog({ ...catalog, offers })).toThrow();
    });
  }

  it('rejects malformed plan prices', () => {
    const plans = structuredClone(catalog.plans);
    plans[1].annual_price_cents = -1;
    expect(() => parsePlanCatalog({ ...catalog, plans })).toThrow();
  });
});
