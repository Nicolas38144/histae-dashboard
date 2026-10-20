import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { Box, Paper, Typography } from '@mui/material';
import type { ContinuationQuota } from '../api/types';

type ContinuationCreditsProps = { quota: ContinuationQuota };

export function ContinuationCredits({ quota }: ContinuationCreditsProps) {
  useLocale();
  const unlimited = quota.weekly_limit === undefined;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={750}>{t("continuationCredits.continuationCredits")}</Typography>
      {unlimited ? (
        <Typography sx={{ mt: 2 }}>{t("continuationCredits.unlimitedContinuationsWithoutCreditsOrAdvertising")}</Typography>
      ) : (
        <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
          <Typography>{t("credits.available", { count: quota.remaining ?? 0 })}</Typography>
          <Typography>{t("credits.free", { remaining: quota.free_remaining, included: quota.weekly_credits })}</Typography>
          <Typography>{t("credits.advertising", { balance: quota.advertising_balance, limit: quota.advertising_stock_limit, remaining: quota.advertising_remaining })}</Typography>
          <Typography>{t("credits.reserved", { count: quota.reserved })}</Typography>
          <Typography>{t("credits.used", { count: quota.used, limit: quota.weekly_limit ?? 0 })}</Typography>
        </Box>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t("continuationCredits.eachFreeParticipantReservesTheirOwnCreditCreditsAre")}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {t("continuationCredits.duringThe24HourDecisionPeriodSendingIsPaused")}</Typography>
    </Paper>
  );
}
