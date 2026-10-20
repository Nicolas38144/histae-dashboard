import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { EuroOutlined, ReceiptLongOutlined, WorkspacePremiumOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Chip, CircularProgress, Paper, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { getRevenue } from '../api/admin';
import { errorMessage } from '../api/client';
import type { AdminRevenue, RevenuePeriod } from '../api/types';
import { formatDate, formatMoney, formatNumber } from '../utils/format';

const revenuePeriods = (): Array<{ value: RevenuePeriod; label: string }> => ([
  { value: 'last_7_days', label: t("common.last7Days") },
  { value: 'last_30_days', label: t("common.last30Days") },
  { value: 'month_to_date', label: t("common.currentMonth") },
  { value: 'previous_month', label: t("common.previousMonth") },
  { value: 'year_to_date', label: t("common.currentYear") },
  { value: 'all_time', label: t("common.allTime") },
]);

export function RevenuePanel({ initialRevenue }: { initialRevenue: AdminRevenue }) {
  useLocale();
  const [revenue, setRevenue] = useState(initialRevenue);
  const [selectedPeriod, setSelectedPeriod] = useState<RevenuePeriod>(initialRevenue.period);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => () => {
    requestIdRef.current += 1;
    controllerRef.current?.abort();
  }, []);

  const selectPeriod = useCallback(async (period: RevenuePeriod) => {
    setSelectedPeriod(period);
    if (period === revenue.period && !error) return;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const nextRevenue = await getRevenue(period, controller.signal);
      if (requestId === requestIdRef.current) setRevenue(nextRevenue);
    } catch (reason) {
      if (!controller.signal.aborted && requestId === requestIdRef.current) setError(reason);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [error, revenue.period]);

  return (
    <Paper variant="outlined" aria-busy={loading} sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', lg: 'center' }, flexDirection: { xs: 'column', lg: 'row' }, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" fontWeight={700}>{t("revenuePanel.estimatedGrossRevenue")}</Typography>
            <Chip label={t("common.estimate")} color="warning" size="small" variant="outlined" />
            <Box sx={{ width: 20, height: 20, display: 'grid', placeItems: 'center' }}>
              {loading && <CircularProgress size={18} aria-label={t("revenuePanel.loadingRevenue")} />}
            </Box>
            {loading && <Typography variant="caption" color="text.secondary">{t("common.updating")}</Typography>}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t("revenuePanel.stripeSubscriptionInvoicesPaidDuringThePeriodInThe")}</Typography>
        </Box>
        <Box role="group" aria-label={t("revenuePanel.revenuePeriod")} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {revenuePeriods().map((period) => (
            <Button
              key={period.value}
              size="small"
              variant={selectedPeriod === period.value ? 'contained' : 'outlined'}
              onClick={() => { void selectPeriod(period.value); }}
              aria-pressed={selectedPeriod === period.value}
              disabled={loading}
            >
              {period.label}
            </Button>
          ))}
        </Box>
      </Box>

      {error !== null && (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          action={<Button color="inherit" onClick={() => { void selectPeriod(selectedPeriod); }}>{t("common.tryAgain")}</Button>}
        >
          {t("revenue.failure", { error: errorMessage(error) })}
        </Alert>
      )}

      <Box sx={{ opacity: loading ? 0.55 : 1, transition: 'opacity 150ms ease' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mt: 3 }}>
          <RevenueValue
            label={t("revenuePanel.recordedGrossAmount")}
            value={formatMoney(revenue.estimated_revenue_cents, revenue.currency)}
            icon={<EuroOutlined color="success" />}
          />
          <RevenueValue
            label={t("revenuePanel.subscriptionsWithPayment")}
            value={formatNumber(revenue.premium_subscriptions)}
            icon={<WorkspacePremiumOutlined color="primary" />}
          />
          <RevenueValue
            label={t("common.paidInvoices")}
            value={formatNumber(revenue.paid_invoices)}
            icon={<ReceiptLongOutlined color="secondary" />}
          />
        </Box>

        {revenue.excluded_currency_invoices > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {t("revenue.excluded", { count: revenue.excluded_currency_invoices, currency: revenue.currency })}</Alert>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          {revenue.period_start
            ? t("revenuePanel.periodCalculatedFromValueToValue", { value0: formatDate(revenue.period_start), value1: formatDate(revenue.period_end) })
            : t("revenuePanel.calculatedFromTheFirstRecordedPaidInvoiceUpTo", { value0: formatDate(revenue.period_end) })}
          {' '}{t("revenuePanel.paymentDatesAreUsedZeroValueTrialsAndUnpaid")}</Typography>
      </Box>
    </Paper>
  );
}

function RevenueValue({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  useLocale();
  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2, minWidth: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        {icon}
      </Box>
      <Typography variant="h4" fontWeight={800} sx={{ mt: 1, overflowWrap: 'anywhere' }}>{value}</Typography>
    </Box>
  );
}
