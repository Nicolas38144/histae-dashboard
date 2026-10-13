import { Box, Paper, Typography } from '@mui/material';
import type { ContinuationQuota } from '../api/types';

type ContinuationCreditsProps = { quota: ContinuationQuota };

export function ContinuationCredits({ quota }: ContinuationCreditsProps) {
  const unlimited = quota.weekly_limit === undefined;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={750}>Crédits de continuation</Typography>
      {unlimited ? (
        <Typography sx={{ mt: 2 }}>Continuations illimitées, sans débit de crédit ni publicité.</Typography>
      ) : (
        <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
          <Typography>Disponibles : {quota.remaining ?? 0}</Typography>
          <Typography>Crédits gratuits disponibles : {quota.free_remaining} sur {quota.weekly_credits}</Typography>
          <Typography>
            Stock publicitaire : {quota.advertising_balance} sur {quota.advertising_stock_limit} · disponibles : {quota.advertising_remaining}
          </Typography>
          <Typography>Réservés : {quota.reserved}</Typography>
          <Typography>Continuations confirmées cette semaine : {quota.used} sur {quota.weekly_limit}</Typography>
        </Box>
      )}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Chaque personne Free réserve son propre crédit. Le débit intervient après les deux accords.
        Un refus ou une expiration libère la réservation. Les crédits gratuits se renouvellent le lundi à 00:00 UTC ; le stock publicitaire reste acquis.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Pendant les 24 heures de décision, l’envoi est suspendu et l’historique reste lisible. Les choix restent privés jusqu’à l’accord mutuel.
      </Typography>
    </Paper>
  );
}
