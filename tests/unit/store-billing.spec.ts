import { LocalizedError } from '../../src/i18n/core';
import { parseStoreBillingStatus } from '../../src/api/store-billing-codec';
import { describe, expect, it } from 'vitest';
import { parseStoreFinanceCsv, financeTotals } from '../../src/features/store-billing/finance-csv';
const header = 'row_id,paid_at,currency,gross_cents,net_cents';
describe('store financial report normalization', () => {
  it('keeps integer cents, refunds and missing net amounts distinct', () => {
    expect(parseStoreFinanceCsv(`${header}\na,2026-10-01T00:00:00Z,EUR,500,425\nb,2026-10-02T00:00:00Z,USD,-500,`)).toEqual([
      { row_id: 'a', paid_at: '2026-10-01T00:00:00Z', currency: 'EUR', gross_cents: 500, net_cents: 425 },
      { row_id: 'b', paid_at: '2026-10-02T00:00:00Z', currency: 'USD', gross_cents: -500, net_cents: null },
    ]);
  });
  it('rejects duplicate row IDs and noninteger or oversized amounts', () => {
    for (const csv of [
      `${header}\na,2026-10-01T00:00:00Z,EUR,500,\na,2026-10-01T00:00:00Z,EUR,500,`,
      `${header}\na,2026-10-01T00:00:00Z,EUR,5.5,`,
      `${header}\na,2026-10-01T00:00:00Z,EUR,1000000000001,`,
      `${header}\na,2026-10-01,EUR,500,`,
      `${header}\na,2026-10-01T00:00:00Z,eur,500,`,
    ]) expect(() => parseStoreFinanceCsv(csv)).toThrow();
  });
});

describe('store report boundaries', () => {
  it('keeps currencies and unknown net totals separate', () => {
    const rows = parseStoreFinanceCsv(`${header}\na,2026-10-01T00:00:00Z,EUR,500,425\nb,2026-10-01T00:00:00Z,EUR,-100,\nc,2026-10-01T00:00:00Z,USD,900,700`);
    expect(financeTotals(rows)).toEqual([{ currency: 'EUR', gross: 400, net: null }, { currency: 'USD', gross: 900, net: 700 }]);
  });
  it('rejects malformed transport objects with a controlled error', () => {
    const valid = { enabled: { app_store: true, google_play: false }, sources: [], recent: [], finance: [], period: 'last_30_days', finance_basis: 'imported_store_reports', pending_notifications: 0, dead_letters: 0 };
    expect(parseStoreBillingStatus(valid, 'last_30_days')).toEqual(valid);
    const recent = { provider: 'app_store', user_id: '11111111-1111-4111-8111-111111111111', billing_period: 'monthly', status: { toString: {} }, expires_at: '2026-10-01T00:00:00Z', verified_at: '2026-10-01T00:00:00Z', auto_renew: true };
    for (const value of [{ ...valid, recent: [recent] }, null, { ...valid, sources: [null] }, { ...valid, finance: [5] }, { ...valid, recent: [{}] }, { ...valid, pending_notifications: -1 }, { ...valid, period: 'all_time' }]) {
      expect(() => parseStoreBillingStatus(value, 'last_30_days')).toThrow(LocalizedError);
    }
  });
});
