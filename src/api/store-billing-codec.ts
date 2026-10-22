import { LocalizedError } from '../i18n/core';
import type { RevenuePeriod } from './types';
import type { StoreBillingStatus, StoreProvider } from '../features/store-billing/types';

function invalid(): never { throw new LocalizedError('storeBilling.invalid'); }
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
function rows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return invalid();
  return value.map(object);
}
const provider = (value: unknown): value is StoreProvider => value === 'app_store' || value === 'google_play';
const date = (value: unknown) => typeof value === 'string' && !Number.isNaN(Date.parse(value));
const count = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;

export function parseStoreBillingStatus(value: unknown, period: RevenuePeriod): StoreBillingStatus {
  const data = object(value), enabled = object(data.enabled);
  const sources = rows(data.sources), recent = rows(data.recent), finance = rows(data.finance);
  if (data.finance_basis !== 'imported_store_reports' || data.period !== period
    || typeof enabled.app_store !== 'boolean' || typeof enabled.google_play !== 'boolean'
    || !count(data.pending_notifications) || !count(data.dead_letters)
    || !sources.every((row) => provider(row.provider) && [row.subscriptions, row.active_accounts, row.unacknowledged].every(count) && (row.last_verified_at === null || date(row.last_verified_at)))
    || !recent.every((row) => provider(row.provider) && typeof row.user_id === 'string' && /^[0-9a-f-]{36}$/i.test(row.user_id)
      && typeof row.billing_period === 'string' && ['monthly', 'annual'].includes(row.billing_period)
      && typeof row.status === 'string' && ['pending','active','grace_period','past_due','on_hold','paused','canceled','expired','revoked'].includes(row.status)
      && date(row.expires_at) && date(row.verified_at) && typeof row.auto_renew === 'boolean')
    || !finance.every((row) => provider(row.provider) && date(row.last_imported_at) && count(row.rows) && Number(row.rows) > 0
      && Number.isSafeInteger(row.gross_cents) && (row.net_cents === null || Number.isSafeInteger(row.net_cents))
      && typeof row.currency === 'string' && /^[A-Z]{3}$/.test(row.currency))) return invalid();
  return value as StoreBillingStatus;
}
