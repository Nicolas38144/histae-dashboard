import { useRememberedState } from '../hooks/list-memory';
import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import {
  BrokenImageOutlined,
  DeleteSweepOutlined,
  HourglassTopOutlined,
  PhotoOutlined,
  ReplayOutlined,
  ReportProblemOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  getMetrics,
  getPhotoReconciliation,
  retryPhotoReconciliation,
} from '../api/admin';
import { errorMessage } from '../api/client';
import type {
  AdminSession,
  AdminMetrics,
  PhotoReconciliationFilter,
  PhotoReconciliationIssue,
  PhotoReconciliationItem,
} from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { CursorPaginationControls } from '../components/CursorPaginationControls';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { UserLink } from '../components/UserLink';
import { useNotification } from '../components/notification-context';
import { useAsyncData } from '../hooks/useAsyncData';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { compactId, formatDate, formatNumber } from '../utils/format';

const issueLabels = (): Record<PhotoReconciliationIssue, string> => ({
  stale_processing: t("common.stalledProcessing"),
  deletion_queued: t("common.deletionQueued"),
  deletion_processing: t("common.deletionInProgress"),
  deletion_retry_scheduled: t("photoReconciliation.retryScheduled"),
  deletion_dead_letter: t("common.permanentFailure"),
  deletion_event_missing: t("common.eventMissing"),
  deletion_event_completed: t("common.inconsistentState"),
});

const retryableIssues = new Set<PhotoReconciliationIssue>([
  'stale_processing',
  'deletion_dead_letter',
  'deletion_event_missing',
  'deletion_event_completed',
]);
const photoKey = (photo: PhotoReconciliationItem) => photo.photo_id;

export default function PhotoReconciliation() {
  useLocale();
  const session = useOutletContext<AdminSession>();
  const [filter, setFilter] = useRememberedState<PhotoReconciliationFilter>('photos:filter','all');
  const [selected, setSelected] = useState<PhotoReconciliationItem | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const loadMetrics = useCallback(() => getMetrics(), []);
  const metrics = useAsyncData(loadMetrics);
  const loadPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getPhotoReconciliation(filter, cursor, signal);
    return { items: page.photos, nextCursor: page.next_cursor };
  }, [filter]);
  const pagination = useCursorPagination(loadPage, photoKey, undefined, 'photos:'+filter);
  const initialLoading = pagination.loading || (metrics.loading && !metrics.data);
  const initialError = pagination.error ?? (metrics.data ? null : metrics.error);
  const reloadAll = () => {
    metrics.reload();
    pagination.reload();
  };

  const reconcile = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await retryPhotoReconciliation(selected.photo_id, reason.trim());
      showNotification(t("photoReconciliation.photoReconciliationHasBeenScheduled"), 'success');
      setSelected(null);
      setReason('');
      reloadAll();
    } catch (reconcileError) {
      showNotification(errorMessage(reconcileError), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("photoReconciliation.photoReconciliation")}
        description={t("photoReconciliation.monitorTheUserPhotoLifecycleAndAuditRetriesOf")}
        actions={<PhotoFilter value={filter} onChange={setFilter} />}
      />
      {metrics.data && <PhotoMetricGrid metrics={metrics.data.photos} />}
      <AsyncState loading={initialLoading} error={initialError} onRetry={reloadAll} />
      {!initialLoading && !initialError && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead><TableRow><TableCell>{t("common.photo")}</TableCell><TableCell>{t("common.user")}</TableCell><TableCell>{t("common.status")}</TableCell><TableCell>{t("common.diagnostic")}</TableCell><TableCell>{t("common.metadata")}</TableCell><TableCell>{t("common.attempts")}</TableCell><TableCell>{t("common.lastUpdate")}</TableCell><TableCell align="right">{t("common.action")}</TableCell></TableRow></TableHead>
            <TableBody>
              {pagination.items.map((photo) => (
                <TableRow key={photo.photo_id} hover>
                  <TableCell>{compactId(photo.photo_id)}</TableCell>
                  <TableCell><UserLink id={photo.user_id} /></TableCell>
                  <TableCell><StatusChip value={photo.status} /></TableCell>
                  <TableCell><IssueChip issue={photo.issue} /></TableCell>
                  <TableCell>{photoMetadata(photo)}</TableCell>
                  <TableCell>{formatNumber(photo.outbox_attempts)}</TableCell>
                  <TableCell>{formatDate(photo.updated_at)}</TableCell>
                  <TableCell align="right">
                    {retryableIssues.has(photo.issue)
                      ? <Button size="small" startIcon={<ReplayOutlined />} onClick={() => setSelected(photo)}>{t("common.reconcile")}</Button>
                      : <Typography variant="caption" color="text.secondary">{t("common.observation")}</Typography>}
                  </TableCell>
                </TableRow>
              ))}
              {!pagination.items.length && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5 }}>{t("photoReconciliation.noPhotosInThisQueue")}</TableCell></TableRow>}
            </TableBody>
          </Table>
          <CursorPaginationControls nextCursor={pagination.nextCursor} loading={pagination.loadingMore} error={pagination.loadMoreError} onLoadMore={pagination.loadMore} onReload={pagination.reload} />
        </TableContainer>
      )}
      <ConfirmActionDialog
        open={Boolean(selected)}
        title={t("photoReconciliation.reconcileThisPhoto")}
        description={t("photoReconciliation.theApiWillRestartProcessingAccordingToThisPhoto")}
        confirmLabel={t("common.requeue")}
        value={reason}
        onValueChange={setReason}
        valueLabel={session.role === 'superadmin' ? undefined : t("common.operationalReason")}
        requireValue={session.role !== 'superadmin'}
        minValueLength={3}
        maxValueLength={500}
        loading={saving}
        onCancel={() => { setSelected(null); setReason(''); }}
        onConfirm={() => void reconcile()}
      />
    </>
  );
}

function PhotoFilter({
  value,
  onChange,
}: {
  value: PhotoReconciliationFilter;
  onChange: (value: PhotoReconciliationFilter) => void;
}) {
  useLocale();
  return (
    <FormControl size="small" sx={{ minWidth: 210 }}>
      <InputLabel>{t("common.queue")}</InputLabel>
      <Select label={t("common.queue")} value={value} onChange={(event) => onChange(event.target.value as PhotoReconciliationFilter)}>
        <MenuItem value="all">{t("photoReconciliation.allOperations")}</MenuItem>
        <MenuItem value="stale_processing">{t("common.stalledOperations")}</MenuItem>
        <MenuItem value="deleting">{t("common.deletions")}</MenuItem>
        <MenuItem value="dead_letter">{t("common.permanentFailures")}</MenuItem>
      </Select>
    </FormControl>
  );
}

function PhotoMetricGrid({ metrics }: { metrics: AdminMetrics['photos'] }) {
  useLocale();
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
      <MetricCard label={t("common.readyPhotos")} value={metrics.ready} icon={<PhotoOutlined color="success" />} accent="success.main" />
      <MetricCard label={t("common.activeProcessing")} value={metrics.pending + metrics.processing} icon={<HourglassTopOutlined color="info" />} accent="info.main" />
      <MetricCard label={t("common.stalledOperations")} value={metrics.stale_processing} icon={<ReportProblemOutlined color="warning" />} accent="warning.main" />
      <MetricCard label={t("photoReconciliation.deletionsInProgress")} value={metrics.deleting} icon={<DeleteSweepOutlined color="primary" />} />
      <MetricCard label={t("common.permanentFailures")} value={metrics.deletion_dead_letters} icon={<BrokenImageOutlined color="error" />} accent="error.main" />
      <MetricCard label={t("common.withoutAnActiveEvent")} value={metrics.deletion_without_active_event} icon={<ReportProblemOutlined color="error" />} accent="error.main" />
    </Box>
  );
}

function IssueChip({ issue }: { issue: PhotoReconciliationIssue }) {
  useLocale();
  const color = issue === 'deletion_dead_letter' || issue === 'deletion_event_missing' || issue === 'deletion_event_completed'
    ? 'error'
    : issue === 'stale_processing' || issue === 'deletion_retry_scheduled'
      ? 'warning'
      : 'info';
  return <Chip size="small" label={issueLabels()[issue]} color={color} variant="outlined" />;
}

function photoMetadata(photo: PhotoReconciliationItem): string {
  if (photo.size_bytes === null || photo.width === null || photo.height === null) return t("common.missing");
  return t("common.valueValueValueKb", { value0: photo.width, value1: photo.height, value2: Math.ceil(photo.size_bytes / 1_000) });
}
