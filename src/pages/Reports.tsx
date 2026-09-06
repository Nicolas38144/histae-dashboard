import { Box, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { getReports, updateReport } from '../api/admin';
import { errorMessage } from '../api/client';
import type { Report, ReportStatus } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { CursorPaginationControls } from '../components/CursorPaginationControls';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { UserLink } from '../components/UserLink';
import { useNotification } from '../components/notification-context';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { compactId, formatDate } from '../utils/format';

const reportKey = (report: Report) => report.id;

export default function Reports() {
  const [filter, setFilter] = useState<'' | ReportStatus>('pending');
  const [savingId, setSavingId] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const loadPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getReports(filter || undefined, cursor, signal);
    return { items: page.reports, nextCursor: page.next_cursor };
  }, [filter]);
  const pagination = useCursorPagination(loadPage, reportKey);

  const changeStatus = async (id: string, status: ReportStatus) => {
    setSavingId(id);
    try { await updateReport(id, status); showNotification('Statut du signalement mis à jour.', 'success'); pagination.reload(); }
    catch (reason) { showNotification(errorMessage(reason), 'error'); }
    finally { setSavingId(null); }
  };

  return (
    <>
      <PageHeader title="Signalements" description="Qualification des signalements d’utilisateurs et accès aux éléments de contexte." actions={<FormControl size="small" sx={{ minWidth: 190 }}><InputLabel>État</InputLabel><Select label="État" value={filter} onChange={(event) => setFilter(event.target.value as '' | ReportStatus)}><MenuItem value="">Tous</MenuItem><MenuItem value="pending">En attente</MenuItem><MenuItem value="reviewed">Traités</MenuItem><MenuItem value="dismissed">Rejetés</MenuItem></Select></FormControl>} />
      <AsyncState loading={pagination.loading} error={pagination.error} onRetry={pagination.reload} />
      {!pagination.loading && !pagination.error && <TableContainer component={Paper} variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Émetteur</TableCell><TableCell>Compte signalé</TableCell><TableCell>Motif</TableCell><TableCell>Description</TableCell><TableCell>Match</TableCell><TableCell>État</TableCell></TableRow></TableHead><TableBody>
        {pagination.items.map((report) => <TableRow key={report.id} hover><TableCell>{formatDate(report.created_at)}</TableCell><TableCell><UserLink id={report.reporter_id} /></TableCell><TableCell><UserLink id={report.reported_id} /></TableCell><TableCell>{report.reason}</TableCell><TableCell sx={{ maxWidth: 300 }}><Tooltip title={report.description || ''}><Typography variant="body2" noWrap>{report.description || '—'}</Typography></Tooltip></TableCell><TableCell>{report.match_id ? compactId(report.match_id) : '—'}</TableCell><TableCell><Select size="small" value={report.status} disabled={savingId === report.id} onChange={(event) => void changeStatus(report.id, event.target.value as ReportStatus)} sx={{ minWidth: 130 }}><MenuItem value="pending"><Box sx={{ display: 'flex' }}><StatusChip value="pending" /></Box></MenuItem><MenuItem value="reviewed"><StatusChip value="reviewed" /></MenuItem><MenuItem value="dismissed"><StatusChip value="dismissed" /></MenuItem></Select></TableCell></TableRow>)}
        {!pagination.items.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>Aucun signalement dans cette file.</TableCell></TableRow>}
      </TableBody></Table><CursorPaginationControls nextCursor={pagination.nextCursor} loading={pagination.loadingMore} error={pagination.loadMoreError} onLoadMore={pagination.loadMore} onReload={pagination.reload} /></TableContainer>}
    </>
  );
}
