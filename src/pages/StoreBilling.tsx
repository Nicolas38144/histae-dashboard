import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { AdminSession, RevenuePeriod } from '../api/types';
import { getStoreBilling } from '../api/store-billing';
import { PageHeader } from '../components/PageHeader';
import { AsyncState } from '../components/AsyncState';
import { useAsyncData } from '../hooks/useAsyncData';
import { t } from '../i18n/core';
import { useLocale } from '../i18n/useLocale';
import { StoreBillingPanels } from '../features/store-billing/status-panels';
import { StoreFinanceImport } from '../features/store-billing/finance-import';

export default function StoreBilling() {
  useLocale();
  const session = useOutletContext<AdminSession>();
  const [period, setPeriod] = useState<RevenuePeriod>('last_30_days');
  const load = useCallback(() => getStoreBilling(period), [period]);
  const { data, loading, error, reload } = useAsyncData(load);
  useEffect(() => {
    const interval = window.setInterval(reload, 30_000);
    return () => window.clearInterval(interval);
  }, [reload]);
  return <>
    <PageHeader title={t('storeBilling.title')} description={t('storeBilling.description')} />
    <AsyncState loading={loading && !data} error={error} onRetry={reload} />
    {data && <StoreBillingPanels data={data} period={period} setPeriod={setPeriod} />}
    {session.role === 'superadmin' && <StoreFinanceImport onImported={reload} />}
  </>;
}
