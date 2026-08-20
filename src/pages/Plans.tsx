import { CheckCircleOutline } from '@mui/icons-material';
import { Box, Chip, Paper, Typography } from '@mui/material';
import { useCallback } from 'react';
import { getPlans } from '../api/admin';
import { AsyncState } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatMoney } from '../utils/format';

export default function Plans() {
  const load = useCallback(() => getPlans(), []);
  const { data, loading, error, reload } = useAsyncData(load);
  return <><PageHeader title="Plans" description="Catalogue commercial exposé par l’API. L’activation Premium reste sous le contrôle du fournisseur de facturation." /><AsyncState loading={loading} error={error} onRetry={reload} />{data && <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>{data.map((plan) => <Paper key={plan.code} variant="outlined" sx={{ p: 3, borderTop: 4, borderTopColor: plan.code === 'premium' ? 'primary.main' : 'divider' }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}><Box><Typography variant="h5" fontWeight={800}>{plan.display_name}</Typography><Typography color="text.secondary">Code : {plan.code}</Typography></Box>{plan.trial_days > 0 && <Chip color="primary" label={`${plan.trial_days} jours d’essai`} />}</Box><Box sx={{ display: 'flex', gap: 3, my: 3 }}><Box><Typography variant="h4" fontWeight={850}>{formatMoney(plan.monthly_price_cents, plan.currency)}</Typography><Typography variant="caption">par mois</Typography></Box><Box><Typography variant="h4" fontWeight={850}>{formatMoney(plan.annual_price_cents, plan.currency)}</Typography><Typography variant="caption">par an</Typography></Box></Box><Typography fontWeight={700} sx={{ mb: 1 }}>Continuations : {plan.weekly_continuation_limit === undefined ? 'illimitées' : `${plan.weekly_continuation_limit} par semaine`}</Typography>{plan.features.map((feature) => <Box key={feature.code} sx={{ display: 'flex', gap: 1.5, py: 1 }}><CheckCircleOutline color="success" fontSize="small" /><Box><Typography fontWeight={650}>{feature.display_name || feature.code}</Typography>{feature.description && <Typography variant="body2" color="text.secondary">{feature.description}</Typography>}</Box></Box>)}</Paper>)}</Box>}</>;
}

