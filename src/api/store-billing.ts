import { api } from './client';
import type { RevenuePeriod } from './types';
import type { StoreBillingStatus, StoreFinanceRow, StoreProvider } from '../features/store-billing/types';
import { parseStoreBillingStatus } from './store-billing-codec';

export async function getStoreBilling(period: RevenuePeriod): Promise<StoreBillingStatus> {
  const { data } = await api.get<unknown>('/admin/store-billing', { params: { period } });
  return parseStoreBillingStatus(data, period);
}
export async function importStoreFinance(provider: StoreProvider, report_id: string, rows: StoreFinanceRow[]): Promise<void> {
  await api.post('/admin/store-billing/finance', { provider, report_id, rows });
}
