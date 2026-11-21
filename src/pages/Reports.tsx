import { useRememberedState } from '../hooks/list-memory';
import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import {
  Alert, Box, Button, Dialog, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getReports, updateReport } from '../api/admin';
import { errorMessage } from '../api/client';
import type { AdminSession, Report, ReportStatus } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { CursorPaginationControls } from '../components/CursorPaginationControls';
import { MatchAccessDialog, MatchConversation } from '../components/MatchConversation';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { UserLink } from '../components/UserLink';
import { useNotification } from '../components/notification-context';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { compactId, formatDate } from '../utils/format';
import type { MessageKey } from '../i18n/catalogs';

const reportKey = (report: Report) => report.id;
const reportStatuses = ['pending', 'reviewed', 'dismissed'] as const satisfies readonly ReportStatus[];
const reportReasons: Readonly<Record<string, MessageKey>> = {
  inappropriate_content: 'reports.reasonInappropriateContent',
  fake_profile: 'reports.reasonFakeProfile',
  harassment: 'reports.reasonHarassment',
  spam: 'reports.reasonSpam',
  other: 'reports.reasonOther',
};
type ReportedMatch = { id: string; reporterId: string };

export default function Reports() {
  useLocale();
  const session = useOutletContext<AdminSession>();
  const [filter, setFilter] = useRememberedState<'' | ReportStatus>('reports:filter','pending');
  const [saving, setSaving] = useState(false);
  const [reportedMatch, setReportedMatch] = useState<ReportedMatch | null>(null);
  const { showNotification } = useNotification();
  const loadPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getReports(filter || undefined, cursor, signal);
    return { items: page.reports, nextCursor: page.next_cursor };
  }, [filter]);
  const pagination = useCursorPagination(loadPage, reportKey, undefined, 'reports:'+filter);

  const changeStatus = async (id: string, status: ReportStatus) => {
    setSaving(true);
    try {
      await updateReport(id, status);
      showNotification(t("reports.reportStatusUpdated"), 'success');
      pagination.reload();
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    } finally {
      setSaving(false);
    }
  };

  const openConversation = (report: Report) => {
    if (report.match_id) setReportedMatch({ id: report.match_id, reporterId: report.reporter_id });
  };

  return (
    <>
      <PageHeader
        title={t("common.reports")}
        description={t("reports.reviewUserReportsAndAccessTheirContext")}
        actions={(
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel id="report-status-filter">{t("common.status")}</InputLabel>
            <Select labelId="report-status-filter" label={t("common.status")} value={filter} onChange={(event) => setFilter(event.target.value as '' | ReportStatus)}>
              <MenuItem value="">{t("common.all")}</MenuItem>
              <MenuItem value="pending">{t("common.pending")}</MenuItem>
              <MenuItem value="reviewed">{t("reports.reviewed")}</MenuItem>
              <MenuItem value="dismissed">{t("reports.dismissed")}</MenuItem>
            </Select>
          </FormControl>
        )}
      />
      <Alert severity="info" sx={{ mb: 2 }}>{t('reports.internalStatusHelp')}</Alert>
      <AsyncState loading={pagination.loading} error={pagination.error} onRetry={pagination.reload} />
      {!pagination.loading && !pagination.error && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("common.date")}</TableCell>
                <TableCell>{t("common.reporter")}</TableCell>
                <TableCell>{t("common.reportedAccount")}</TableCell>
                <TableCell>{t("reports.reason")}</TableCell>
                <TableCell>{t("common.description")}</TableCell>
                <TableCell>{t("common.match")}</TableCell>
                <TableCell>{t("common.status")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagination.items.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell>{formatDate(report.created_at)}</TableCell>
                  <TableCell><UserLink id={report.reporter_id} /></TableCell>
                  <TableCell><UserLink id={report.reported_id} /></TableCell>
                  <TableCell>{Object.hasOwn(reportReasons, report.reason) ? t(reportReasons[report.reason]) : report.reason}</TableCell>
                  <TableCell sx={{ minWidth: 150, maxWidth: 300 }}>
                    {report.description ? (
                      <Box component="details">
                        <Box component="summary" sx={{ cursor: 'pointer', color: 'primary.main' }}>{t('reports.readDescription')}</Box>
                        <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{report.description}</Typography>
                      </Box>
                    ) : t("common.missing")}
                  </TableCell>
                  <TableCell>
                    {report.match_id ? (
                      <Button size="small" onClick={() => openConversation(report)}>
                        {t('reports.openReportedConversation', { id: compactId(report.match_id) })}
                      </Button>
                    ) : t('reports.noLinkedConversation')}
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={report.status}
                      inputProps={{ 'aria-label': t('reports.reportStatus') }}
                      disabled={saving}
                      onChange={(event) => void changeStatus(report.id, event.target.value as ReportStatus)}
                      sx={{ minWidth: 130 }}
                    >
                      {reportStatuses.map((status) => (
                        <MenuItem key={status} value={status}>
                          <Box sx={{ display: 'flex' }}><StatusChip value={status} /></Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {!pagination.items.length && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>{t("reports.noReportsInThisQueue")}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <CursorPaginationControls
            nextCursor={pagination.nextCursor}
            loading={pagination.loadingMore}
            error={pagination.loadMoreError}
            onLoadMore={pagination.loadMore}
            onReload={pagination.reload}
          />
        </TableContainer>
      )}
      {reportedMatch && <ReportedConversation
        key={reportedMatch.id}
        match={reportedMatch}
        role={session.role}
        onClose={() => setReportedMatch(null)}
      />}
    </>
  );
}

function ReportedConversation({ match, role, onClose }: {
  match: ReportedMatch;
  role: AdminSession['role'];
  onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [accessReason, setAccessReason] = useState<string | null>(role === 'superadmin' ? '' : null);

  if (accessReason === null) return <MatchAccessDialog
    open
    reason={reason}
    onReasonChange={setReason}
    onCancel={onClose}
    onConfirm={() => setAccessReason(reason.trim())}
  />;

  return <Dialog open fullWidth maxWidth="md" aria-labelledby="reported-conversation-title" onClose={onClose}>
    <MatchConversation
      matchId={match.id}
      firstParticipantId={match.reporterId}
      accessReason={accessReason}
      headingId="reported-conversation-title"
      onClose={onClose}
    />
  </Dialog>;
}
