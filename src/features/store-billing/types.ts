import type { RevenuePeriod } from '../../api/types';
export type StoreProvider = 'app_store' | 'google_play';
export type StoreFinanceRow = { row_id: string; paid_at: string; currency: string; gross_cents: number; net_cents: number | null };
export type StoreBillingStatus = {
  enabled: Record<StoreProvider, boolean>;
  sources: Array<{ provider: StoreProvider; subscriptions: number; active_accounts: number; unacknowledged: number; last_verified_at: string | null }>;
  period: RevenuePeriod;
  finance: Array<{ provider: StoreProvider; currency: string; gross_cents: number; net_cents: number | null; rows: number; last_imported_at: string }>;
  recent: Array<{ user_id: string; provider: StoreProvider; billing_period: 'monthly' | 'annual'; status: string; expires_at: string; auto_renew: boolean; verified_at: string }>;
  pending_notifications: number;
  dead_letters: number;
  finance_basis: 'imported_store_reports';
};
