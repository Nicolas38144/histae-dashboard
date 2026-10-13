import { CheckCircleOutline } from '@mui/icons-material';
import { Box, Chip, Paper, Typography } from '@mui/material';
import type { Plan } from '../api/types';
import { formatMoney } from '../utils/format';

type PlanCardProps = { plan: Plan };

export function PlanCard({ plan }: PlanCardProps) {
  const continuationLimit = plan.weekly_continuation_limit === undefined
    ? 'illimitées'
    : `${plan.weekly_continuation_limit} maximum par semaine`;
  const continuationDescription = plan.ads_removed
    ? 'Sans publicité ni crédit à consommer. L’accord des deux personnes reste nécessaire.'
    : `${plan.weekly_included_credits ?? 0} crédits gratuits renouvelés le lundi à 00:00 UTC. Une vidéo facultative donne 1 crédit supplémentaire ; stock publicitaire limité à ${plan.advertising_credit_stock_limit}, conservé entre les semaines. Chaque participant Free consomme son crédit après les deux accords.`;

  return (
    <Paper variant="outlined" sx={{ p: 3, borderTop: 4, borderTopColor: plan.code === 'premium' ? 'primary.main' : 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>{plan.display_name}</Typography>
          <Typography color="text.secondary">Code : {plan.code}</Typography>
        </Box>
        {plan.trial_days > 0 && <Chip color="primary" label={`${plan.trial_days} jours d’essai`} />}
      </Box>
      <Box sx={{ display: 'flex', gap: 3, my: 3 }}>
        <PlanPrice cents={plan.monthly_price_cents} currency={plan.currency} period="par mois" />
        <PlanPrice cents={plan.annual_price_cents} currency={plan.currency} period="par an" />
      </Box>
      <Typography fontWeight={700} sx={{ mb: 1 }}>Continuations : {continuationLimit}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {continuationDescription}
      </Typography>
      {!plan.ads_removed && (
        <Chip
          size="small"
          variant="outlined"
          sx={{ mb: 2 }}
          label={plan.rewarded_advertising_enabled ? 'Récompenses publicitaires activées' : 'Récompenses publicitaires désactivées'}
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
  return (
    <Box>
      <Typography variant="h4" fontWeight={850}>{formatMoney(cents, currency)}</Typography>
      <Typography variant="caption">{period}</Typography>
    </Box>
  );
}
