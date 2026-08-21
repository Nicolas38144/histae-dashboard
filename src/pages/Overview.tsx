import {
  ChatBubbleOutline,
  GavelOutlined,
  GroupsOutlined,
  PersonAddAltOutlined,
  PolicyOutlined,
  VerifiedUserOutlined,
} from '@mui/icons-material';
import { Box, Paper, Typography } from '@mui/material';
import { useCallback } from 'react';
import { getMetrics } from '../api/admin';
import { AsyncState } from '../components/AsyncState';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { RevenuePanel } from '../components/RevenuePanel';
import { StatusChip } from '../components/StatusChip';
import { useAsyncData } from '../hooks/useAsyncData';

export default function Overview() {
  const load = useCallback(() => getMetrics(), []);
  const { data, loading, error, reload } = useAsyncData(load);

  return (
    <>
      <PageHeader title="Vue d’ensemble" description="État opérationnel de la plateforme et files de modération." />
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {data && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
            <MetricCard label="Comptes actifs" value={data.users.active} icon={<GroupsOutlined color="primary" />} />
            <MetricCard label="Créés sur 30 jours" value={data.users.created_last_30_days} icon={<PersonAddAltOutlined color="success" />} accent="success.main" />
            <MetricCard label="Signalements en attente" value={data.moderation.pending_reports} icon={<GavelOutlined color="warning" />} accent="warning.main" />
            <MetricCard label="Demandes RGPD ouvertes" value={data.moderation.open_data_requests} icon={<PolicyOutlined color="secondary" />} accent="secondary.main" />
            <MetricCard label="Comptes onboardés" value={data.users.onboarded} icon={<VerifiedUserOutlined color="success" />} accent="success.main" />
            <MetricCard label="Comptes bannis" value={data.users.banned} icon={<GroupsOutlined color="error" />} accent="error.main" />
            <MetricCard label="Messages conservés" value={data.messages.total} icon={<ChatBubbleOutline color="info" />} accent="info.main" />
            <MetricCard label="Matchs confirmés" value={data.matches.confirmed} icon={<VerifiedUserOutlined color="primary" />} />
          </Box>

          <RevenuePanel initialRevenue={data.revenue} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 2, mt: 3 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Cycle de vie des matchs</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                {Object.entries(data.matches).map(([status, count]) => <Box key={status} sx={{ minWidth: 140 }}><StatusChip value={status} /><Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>{count}</Typography></Box>)}
              </Box>
            </Paper>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Répartition des abonnements</Typography>
              {data.subscriptions.map((subscription) => <Box key={subscription.plan} sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25, borderBottom: 1, borderColor: 'divider' }}><Typography textTransform="capitalize">{subscription.plan}</Typography><Typography fontWeight={800}>{subscription.users}</Typography></Box>)}
            </Paper>
          </Box>
        </>
      )}
    </>
  );
}
