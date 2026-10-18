import { Box, Paper, Typography } from '@mui/material';
import type { AdminMetrics } from '../api/types';

export function SubscriptionDistribution({ subscription_offers }: Pick<AdminMetrics, 'subscription_offers'>) {
  const counts = new Map(subscription_offers.map((entry) => [entry.offer, entry.users]));
  const unspecified = counts.get('premium_unspecified');
  const rows = [
    { code: 'free', label: 'Free', users: counts.get('free') },
    { code: 'premium_monthly', label: 'Premium Mensuel', users: counts.get('premium_monthly') },
    { code: 'premium_annual', label: 'Premium Annuel', users: counts.get('premium_annual') },
    ...(unspecified ? [{ code: 'premium_unspecified', label: 'Premium sans périodicité', users: unspecified }] : []),
  ];

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>Répartition des abonnements</Typography>
      {rows.map((row) => (
        <Box key={row.code} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: 1, borderColor: 'divider' }}>
          <Typography>{row.label}</Typography><Typography fontWeight={800}>{row.users ?? '—'}</Typography>
        </Box>
      ))}
      {!!unspecified && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Certains accès Premium n’ont aucune périodicité enregistrée, par exemple un accès attribué manuellement.
        </Typography>
      )}
    </Paper>
  );
}
