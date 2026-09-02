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
import { useCallback, useEffect, useState } from 'react';
import {
  getMetrics,
  getPhotoReconciliation,
  retryPhotoReconciliation,
} from '../api/admin';
import { errorMessage } from '../api/client';
import type {
  AdminMetrics,
  PhotoReconciliationFilter,
  PhotoReconciliationIssue,
  PhotoReconciliationItem,
} from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { MetricCard } from '../components/MetricCard';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { UserLink } from '../components/UserLink';
import { useNotification } from '../components/notification-context';
import { compactId, formatDate } from '../utils/format';

const issueLabels: Record<PhotoReconciliationIssue, string> = {
  stale_processing: 'Traitement bloqué',
  deletion_queued: 'Suppression en file',
  deletion_processing: 'Suppression en cours',
  deletion_retry_scheduled: 'Nouvel essai planifié',
  deletion_dead_letter: 'Échec définitif',
  deletion_event_missing: 'Événement absent',
  deletion_event_completed: 'État incohérent',
};

const retryableIssues = new Set<PhotoReconciliationIssue>([
  'stale_processing',
  'deletion_dead_letter',
  'deletion_event_missing',
  'deletion_event_completed',
]);

export default function PhotoReconciliation() {
  const [filter, setFilter] = useState<PhotoReconciliationFilter>('all');
  const [metrics, setMetrics] = useState<AdminMetrics['photos'] | null>(null);
  const [photos, setPhotos] = useState<PhotoReconciliationItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PhotoReconciliationItem | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const load = useCallback(async (nextCursor?: string) => {
    if (nextCursor) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const [metricResult, queue] = await Promise.all([
        nextCursor ? Promise.resolve(null) : getMetrics(),
        getPhotoReconciliation(filter, nextCursor),
      ]);
      if (metricResult) setMetrics(metricResult.photos);
      setPhotos((current) => nextCursor ? [...current, ...queue.photos] : queue.photos);
      setCursor(queue.next_cursor);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => { void load(); }, [load]);

  const reconcile = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await retryPhotoReconciliation(selected.photo_id, reason.trim());
      showNotification('La photo a été remise dans la file de suppression.', 'success');
      setSelected(null);
      setReason('');
      await load();
    } catch (reconcileError) {
      showNotification(errorMessage(reconcileError), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Réconciliation des photos"
        description="Surveillance du cycle de vie user_photo et relance auditée des opérations bloquées."
        actions={<PhotoFilter value={filter} onChange={setFilter} />}
      />
      {metrics && <PhotoMetricGrid metrics={metrics} />}
      <AsyncState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && !error && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead><TableRow><TableCell>Photo</TableCell><TableCell>Utilisateur</TableCell><TableCell>État</TableCell><TableCell>Diagnostic</TableCell><TableCell>Métadonnées</TableCell><TableCell>Tentatives</TableCell><TableCell>Dernière mise à jour</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
            <TableBody>
              {photos.map((photo) => (
                <TableRow key={photo.photo_id} hover>
                  <TableCell>{compactId(photo.photo_id)}</TableCell>
                  <TableCell><UserLink id={photo.user_id} /></TableCell>
                  <TableCell><StatusChip value={photo.status} /></TableCell>
                  <TableCell><IssueChip issue={photo.issue} /></TableCell>
                  <TableCell>{photoMetadata(photo)}</TableCell>
                  <TableCell>{photo.outbox_attempts ?? '—'}</TableCell>
                  <TableCell>{formatDate(photo.updated_at)}</TableCell>
                  <TableCell align="right">
                    {retryableIssues.has(photo.issue)
                      ? <Button size="small" startIcon={<ReplayOutlined />} onClick={() => setSelected(photo)}>Réconcilier</Button>
                      : <Typography variant="caption" color="text.secondary">Surveillance</Typography>}
                  </TableCell>
                </TableRow>
              ))}
              {!photos.length && <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5 }}>Aucune photo dans cette file.</TableCell></TableRow>}
            </TableBody>
          </Table>
          {cursor && <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><Button onClick={() => void load(cursor)} disabled={loadingMore}>{loadingMore ? 'Chargement…' : 'Charger la suite'}</Button></Box>}
        </TableContainer>
      )}
      <ConfirmActionDialog
        open={Boolean(selected)}
        title="Réconcilier cette photo ?"
        description="La photo sera rendue invisible si nécessaire puis sa suppression sera remise en file. L’action et son motif seront journalisés."
        confirmLabel="Remettre en file"
        value={reason}
        onValueChange={setReason}
        valueLabel="Motif opérationnel"
        requireValue
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
  return (
    <FormControl size="small" sx={{ minWidth: 210 }}>
      <InputLabel>File</InputLabel>
      <Select label="File" value={value} onChange={(event) => onChange(event.target.value as PhotoReconciliationFilter)}>
        <MenuItem value="all">Toutes les opérations</MenuItem>
        <MenuItem value="stale_processing">Traitements bloqués</MenuItem>
        <MenuItem value="deleting">Suppressions</MenuItem>
        <MenuItem value="dead_letter">Échecs définitifs</MenuItem>
      </Select>
    </FormControl>
  );
}

function PhotoMetricGrid({ metrics }: { metrics: AdminMetrics['photos'] }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
      <MetricCard label="Photos prêtes" value={metrics.ready} icon={<PhotoOutlined color="success" />} accent="success.main" />
      <MetricCard label="Traitements actifs" value={metrics.pending + metrics.processing} icon={<HourglassTopOutlined color="info" />} accent="info.main" />
      <MetricCard label="Traitements bloqués" value={metrics.stale_processing} icon={<ReportProblemOutlined color="warning" />} accent="warning.main" />
      <MetricCard label="Suppressions en cours" value={metrics.deleting} icon={<DeleteSweepOutlined color="primary" />} />
      <MetricCard label="Échecs définitifs" value={metrics.deletion_dead_letters} icon={<BrokenImageOutlined color="error" />} accent="error.main" />
      <MetricCard label="Sans événement actif" value={metrics.deletion_without_active_event} icon={<ReportProblemOutlined color="error" />} accent="error.main" />
    </Box>
  );
}

function IssueChip({ issue }: { issue: PhotoReconciliationIssue }) {
  const color = issue === 'deletion_dead_letter' || issue === 'deletion_event_missing' || issue === 'deletion_event_completed'
    ? 'error'
    : issue === 'stale_processing' || issue === 'deletion_retry_scheduled'
      ? 'warning'
      : 'info';
  return <Chip size="small" label={issueLabels[issue]} color={color} variant="outlined" />;
}

function photoMetadata(photo: PhotoReconciliationItem): string {
  if (photo.size_bytes === null || photo.width === null || photo.height === null) return '—';
  return `${photo.width} × ${photo.height} · ${Math.ceil(photo.size_bytes / 1_000)} ko`;
}
