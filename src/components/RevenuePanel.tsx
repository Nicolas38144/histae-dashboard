import { EuroOutlined, SellOutlined, WorkspacePremiumOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Chip, CircularProgress, Paper, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { getRevenue } from '../api/admin';
import { errorMessage } from '../api/client';
import type { AdminRevenue, RevenuePeriod } from '../api/types';
import { formatDate, formatMoney } from '../utils/format';

const revenuePeriods: Array<{ value: RevenuePeriod; label: string }> = [
  { value: 'last_7_days', label: '7 derniers jours' },
  { value: 'last_30_days', label: '30 derniers jours' },
  { value: 'month_to_date', label: 'Mois en cours' },
  { value: 'previous_month', label: 'Mois dernier' },
  { value: 'year_to_date', label: 'Année en cours' },
  { value: 'all_time', label: 'Depuis le début' },
];

export function RevenuePanel({ initialRevenue }: { initialRevenue: AdminRevenue }) {
  const [revenue, setRevenue] = useState(initialRevenue);
  const [selectedPeriod, setSelectedPeriod] = useState<RevenuePeriod>(initialRevenue.period);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      if (!controller.signal.aborted && requestId === requestIdRef.current) setError(errorMessage(reason));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [error, revenue.period]);

  return (
    <Paper variant="outlined" aria-busy={loading} sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', lg: 'center' }, flexDirection: { xs: 'column', lg: 'row' }, gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" fontWeight={700}>Chiffre d’affaires estimé</Typography>
            <Chip label="Estimation" color="warning" size="small" variant="outlined" />
            <Box sx={{ width: 20, height: 20, display: 'grid', placeItems: 'center' }}>
              {loading && <CircularProgress size={18} aria-label="Chargement du chiffre d’affaires" />}
            </Box>
            {loading && <Typography variant="caption" color="text.secondary">Mise à jour…</Typography>}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Abonnements Premium mis à jour sur la période × tarif mensuel Premium actuel.
          </Typography>
        </Box>
        <Box role="group" aria-label="Période du chiffre d’affaires" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {revenuePeriods.map((period) => (
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

      {error && (
        <Alert
          severity="error"
          sx={{ mt: 2 }}
          action={<Button color="inherit" onClick={() => { void selectPeriod(selectedPeriod); }}>Réessayer</Button>}
        >
          Impossible de mettre à jour le CA estimé. {error}
        </Alert>
      )}

      <Box sx={{ opacity: loading ? 0.55 : 1, transition: 'opacity 150ms ease' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, mt: 3 }}>
          <RevenueValue
            label="CA estimé"
            value={formatMoney(revenue.estimated_revenue_cents, revenue.currency)}
            icon={<EuroOutlined color="success" />}
          />
          <RevenueValue
            label="Abonnements Premium retenus"
            value={String(revenue.premium_subscriptions)}
            icon={<WorkspacePremiumOutlined color="primary" />}
          />
          <RevenueValue
            label="Tarif mensuel utilisé"
            value={formatMoney(revenue.price_per_subscription_cents, revenue.currency)}
            icon={<SellOutlined color="secondary" />}
          />
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          {revenue.period_start
            ? `Période calculée du ${formatDate(revenue.period_start)} au ${formatDate(revenue.period_end)}.`
            : `Calcul depuis le début des abonnements enregistrés jusqu’au ${formatDate(revenue.period_end)}.`}
          {' '}Cette valeur ne tient pas compte des renouvellements non enregistrés, remboursements, taxes, commissions ou charges.
        </Typography>
      </Box>
    </Paper>
  );
}

function RevenueValue({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
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
