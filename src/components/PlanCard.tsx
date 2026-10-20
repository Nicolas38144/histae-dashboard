import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { CheckCircleOutline } from '@mui/icons-material';
import { Box, Chip, Paper, Typography } from '@mui/material';
import type { Plan, PlanOffer } from '../api/types';
import { formatMoney } from '../utils/format';

type PlanCardProps = { plan: Plan; offer: PlanOffer };

export function PlanCard({ plan, offer }: PlanCardProps) {
  useLocale();
  const continuationLimit = plan.weekly_continuation_limit === undefined
    ? t("common.unlimited")
    : t("planCard.valueMaximumPerWeek", { value0: plan.weekly_continuation_limit });
  const continuationDescription = plan.ads_removed
    ? t("planCard.noAdvertisingOrCreditsToSpendBothParticipantsMust")
    : t("planCard.valueFreeCreditsRenewOnMondayAt0000", { value0: plan.weekly_included_credits ?? 0, value1: plan.advertising_credit_stock_limit });

  return (
    <Paper variant="outlined" sx={{ p: 3, borderTop: 4, borderTopColor: plan.code === 'premium' ? 'primary.main' : 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>{offer.display_name}</Typography>
          <Typography color="text.secondary">{t("plan.offerCode", { code: offer.code })}</Typography>
        </Box>
      </Box>
      <Box sx={{ my: 3 }}>
        <PlanPrice cents={offer.price_cents} currency={offer.currency} period={offer.billing_period === 'annual' ? t("common.perYear") : offer.billing_period === 'monthly' ? t("common.perMonth") : t("planCard.noPaidSubscription")} />
        {offer.billing_period === 'annual' && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t("plan.equivalent", { amount: formatMoney(Math.round(offer.price_cents / 12), offer.currency) })}</Typography>}
        {offer.billing_period !== null && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t(offer.billing_period === "annual" ? "plan.annualRenewal" : "plan.monthlyRenewal")}</Typography>}
      </Box>
      <Typography fontWeight={700} sx={{ mb: 1 }}>{t("plan.continuations", { limit: continuationLimit })}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {continuationDescription}
      </Typography>
      {!plan.ads_removed && (
        <Chip
          size="small"
          variant="outlined"
          sx={{ mb: 2 }}
          label={plan.rewarded_advertising_enabled ? t("planCard.advertisingRewardsEnabled") : t("planCard.advertisingRewardsDisabled")}
        />
      )}
      {plan.features.map((feature) => (
        <Box key={feature.code} sx={{ display: 'flex', gap: 1.5, py: 1 }}>
          <CheckCircleOutline color="success" fontSize="small" />
          <Box>
            <Typography fontWeight={650}>{feature.display_name || feature.code}</Typography>
            {feature.description && (
              <Typography variant="body2" color="text.secondary">{feature.description}</Typography>
            )}
          </Box>
        </Box>
      ))}
    </Paper>
  );
}

type PlanPriceProps = { cents: number; currency: string; period: string };

function PlanPrice({ cents, currency, period }: PlanPriceProps) {
  useLocale();
  return (
    <Box>
      <Typography variant="h4" fontWeight={850}>{formatMoney(cents, currency)}</Typography>
      <Typography variant="caption">{period}</Typography>
    </Box>
  );
}
