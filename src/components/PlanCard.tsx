import { CheckCircleOutline } from '@mui/icons-material';
import { Box, Chip, Paper, Typography } from '@mui/material';
import type { Plan, PlanOffer } from '../api/types';
import { formatMoney } from '../utils/format';

type PlanCardProps = { plan: Plan; offer: PlanOffer };

export function PlanCard({ plan, offer }: PlanCardProps) {
  const continuationLimit = plan.weekly_continuation_limit === undefined
    ? 'illimitées'
    : `${plan.weekly_continuation_limit} maximum par semaine`;
  const continuationDescription = plan.ads_removed
    ? 'Sans publicité ni crédit à consommer. L’accord des deux personnes reste nécessaire.'
    : `${plan.weekly_included_credits ?? 0} crédits gratuits renouvelés le lundi à 00:00 UTC. Une vidéo facultative donne 1 crédit supplémentaire ; stock publicitaire limité à ${plan.advertising_credit_stock_limit}, conservé entre les semaines. Chaque participant Free consomme son crédit après les deux accords.`;

  return (
    <Paper variant="outlined" sx={{ p: 3, borderTop: 4, borderTopColor: plan.code === 'premium' ? 'primary.main' : 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>{offer.display_name}</Typography>
          <Typography color="text.secondary">Offre : {offer.code}</Typography>
        </Box>
        {offer.trial_days > 0 && <Chip color="primary" label={`${offer.trial_days} jours d’essai selon éligibilité`} />}
      </Box>
      <Box sx={{ my: 3 }}>
        <PlanPrice cents={offer.price_cents} currency={offer.currency} period={offer.billing_period === 'annual' ? 'par an' : offer.billing_period === 'monthly' ? 'par mois' : 'sans abonnement payant'} />
        {offer.billing_period === 'annual' && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Équivalent à environ {formatMoney(Math.round(offer.price_cents / 12), offer.currency)} par mois. Facturé en une fois chaque année.
        </Typography>}
        {offer.billing_period !== null && <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Renouvellement automatique {offer.billing_period === 'annual' ? 'annuel' : 'mensuel'}. Résiliation depuis le portail client.
        </Typography>}
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
