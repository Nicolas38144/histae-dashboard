import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import {
  Box, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography,
} from '@mui/material';
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
const reportStatuses = ['pending', 'reviewed', 'dismissed'] as const satisfies readonly ReportStatus[];

export default function Reports() {
  useLocale();
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
    try {
      await updateReport(id, status);
      showNotification(t("reports.reportStatusUpdated"), 'success');
      pagination.reload();
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title={t("common.reports")}
        description={t("reports.reviewUserReportsAndAccessTheirContext")}
        actions={(
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel>{t("common.status")}</InputLabel>
            <Select label={t("common.status")} value={filter} onChange={(event) => setFilter(event.target.value as '' | ReportStatus)}>
              <MenuItem value="">{t("common.all")}</MenuItem>
              <MenuItem value="pending">{t("common.pending")}</MenuItem>
              <MenuItem value="reviewed">{t("reports.reviewed")}</MenuItem>
              <MenuItem value="dismissed">{t("reports.dismissed")}</MenuItem>
            </Select>
          </FormControl>
        )}
      />
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
                  <TableCell>{report.reason}</TableCell>
                  <TableCell sx={{ maxWidth: 300 }}>
                    <Tooltip title={report.description || ''}>
                      <Typography variant="body2" noWrap>{report.description || t("common.missing")}</Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{report.match_id ? compactId(report.match_id) : t("common.missing")}</TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={report.status}
                      disabled={savingId === report.id}
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
    </>
  );
}
