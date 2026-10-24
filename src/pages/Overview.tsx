import { AttentionQueue } from '../components/AttentionQueue';
import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import {
  ChatBubbleOutline,
  GavelOutlined,
  GroupsOutlined,
  PersonAddAltOutlined,
  PhotoOutlined,
  PolicyOutlined,
  VerifiedUserOutlined,
  FactCheckOutlined,
} from '@mui/icons-material';
import { Alert, Box, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useCallback } from 'react';
import { getMetrics } from '../api/admin';
import { AsyncState } from '../components/AsyncState';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { RevenuePanel } from '../components/RevenuePanel';
import { StatusChip } from '../components/StatusChip';
import { SubscriptionDistribution } from '../components/SubscriptionDistribution';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatDate, formatNumber } from '../utils/format';

export default function Overview() {
  useLocale();
  const load = useCallback(() => getMetrics(), []);
  const { data, loading, error, reload } = useAsyncData(load);

  return (
    <>
      <PageHeader title={t("common.overview")} description={t("overview.platformOperationsAndModerationQueues")} />
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {data && (
        <>
          <AttentionQueue data={data} />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
            <MetricCard label={t("common.activeAccounts")} value={data.users.active} icon={<GroupsOutlined color="primary" />} />
            <MetricCard label={t("common.createdInTheLast30Days")} value={data.users.created_last_30_days} icon={<PersonAddAltOutlined color="success" />} accent="success.main" />
            <MetricCard label={t("overview.pendingReports")} value={data.moderation.pending_reports} icon={<GavelOutlined color="warning" />} accent="warning.main" />
            <MetricCard label={t("overview.contentToReview")} value={data.moderation.pending_content} icon={<FactCheckOutlined color="warning" />} accent="warning.main" />
            <MetricCard label={t("overview.openGdprRequests")} value={data.moderation.open_data_requests} icon={<PolicyOutlined color="secondary" />} accent="secondary.main" />
            <MetricCard label={t("common.onboardedAccounts")} value={data.users.onboarded} icon={<VerifiedUserOutlined color="success" />} accent="success.main" />
            <MetricCard label={t("common.bannedAccounts")} value={data.users.banned} icon={<GroupsOutlined color="error" />} accent="error.main" />
            <MetricCard label={t("common.retainedMessages")} value={data.messages.total} icon={<ChatBubbleOutline color="info" />} accent="info.main" />
            <MetricCard label={t("common.confirmedMatches")} value={data.matches.confirmed} icon={<VerifiedUserOutlined color="primary" />} />
            <MetricCard label={t("common.photosToReconcile")} value={data.photos.stale_processing + data.photos.deletion_dead_letters + data.photos.deletion_without_active_event} icon={<PhotoOutlined color="warning" />} accent="warning.main" />
          </Box>

          <RevenuePanel initialRevenue={data.revenue} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 2, mt: 3 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>{t("overview.matchLifecycle")}</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                {Object.entries(data.matches).map(([status, count]) => <Box key={status} sx={{ minWidth: 140 }}><StatusChip value={status} /><Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>{formatNumber(count)}</Typography></Box>)}
              </Box>
            </Paper>
            <SubscriptionDistribution subscription_offers={data.subscription_offers} />
          </Box>

          <Paper id="maintenance" variant="outlined" sx={{ mt: 3, overflowX: 'auto', scrollMarginTop: 90 }}>
            <Box sx={{ p: 3, pb: 1 }}>
              <Typography variant="h6" fontWeight={700}>{t("common.boundedJobs")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t("overview.lastPersistedWorkerRunRetryRequiredMeansTheBatch")}</Typography>
            </Box>
            {data.operations.maintenance.some((job) => job.work_remaining || job.overdue || job.status === 'failed') && (
              <Alert severity="warning" sx={{ mx: 3, mb: 2 }}>
                {t("overview.atLeastOneJobNeedsToBeResumedOr")}</Alert>
            )}
            <Table size="small">
              <TableHead><TableRow><TableCell>{t("common.processing")}</TableCell><TableCell>{t("common.status")}</TableCell><TableCell align="right">{t("common.items")}</TableCell><TableCell align="right">{t("common.batches")}</TableCell><TableCell>{t("common.duration")}</TableCell><TableCell>{t("common.lastCompletion")}</TableCell><TableCell>{t("common.progress")}</TableCell></TableRow></TableHead>
              <TableBody>{data.operations.maintenance.map((job) => (
                <TableRow key={job.job_name}>
                  <TableCell>{maintenanceLabels()[job.job_name]}</TableCell>
                  <TableCell>{job.status ? <StatusChip value={job.status} /> : t("common.neverRun")}</TableCell>
                  <TableCell align="right">{formatNumber(job.processed_count)}</TableCell>
                  <TableCell align="right">{formatNumber(job.batch_count)}</TableCell>
                  <TableCell>{job.duration_ms === null ? t("common.missing") : t("common.valueMs", { value0: job.duration_ms })}</TableCell>
                  <TableCell>{formatDate(job.finished_at)}</TableCell>
                  <TableCell>{job.work_remaining ? t("common.retryRequired") : job.overdue ? t("common.overdue") : t("common.upToDate")}{job.last_error_code ? ` · ${job.last_error_code}` : ''}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </Paper>
        </>
      )}
    </>
  );
}

const maintenanceLabels = () => ({
  matches: t("common.matches"),
  photos: t("common.photos"),
  privacy: t("common.gdprRetention"),
  outbox: t("common.outbox"),
  billing: t("billingReconciliation.stripeReconciliation"),
} as const);
