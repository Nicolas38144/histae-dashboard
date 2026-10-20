import { formatNumber } from '../utils/format';
import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { Box, Paper, Typography } from '@mui/material';
import type { AdminMetrics } from '../api/types';

export function SubscriptionDistribution({ subscription_offers }: Pick<AdminMetrics, 'subscription_offers'>) {
  useLocale();
  const counts = new Map(subscription_offers.map((entry) => [entry.offer, entry.users]));
  const unspecified = counts.get('premium_unspecified');
  const rows = [
    { code: 'free', label: t("common.free"), users: counts.get('free') },
    { code: 'premium_monthly', label: t("common.premiumMonthly"), users: counts.get('premium_monthly') },
    { code: 'premium_annual', label: t("common.premiumAnnual"), users: counts.get('premium_annual') },
    ...(unspecified ? [{ code: 'premium_unspecified', label: t("subscriptionDistribution.premiumWithoutABillingPeriod"), users: unspecified }] : []),
  ];

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>{t("subscriptionDistribution.subscriptionBreakdown")}</Typography>
      {rows.map((row) => (
        <Box key={row.code} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
          <Typography>{row.label}</Typography><Typography fontWeight={800}>{formatNumber(row.users)}</Typography>
        </Box>
      ))}
      {!!unspecified && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {t("subscriptionDistribution.somePremiumAccountsHaveNoRecordedBillingPeriodFor")}</Typography>
      )}
    </Paper>
  );
}
