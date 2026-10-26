import { useRememberedState } from '../hooks/list-memory';
import { domainLabel } from '../i18n/domain';
import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getDataRequests } from '../api/admin';
import type { AdminSession, DataRequestStatus, DataSubjectRequest } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { CursorPaginationControls } from '../components/CursorPaginationControls';
import { PageHeader } from '../components/PageHeader';
import { PrivacyRequestMessage } from '../components/PrivacyRequestMessage';
import { StatusChip } from '../components/StatusChip';
import { UserLink } from '../components/UserLink';
import { PrivacyRequestActionDialog, PrivacyRequestActions } from '../features/privacy-requests/request-actions';
import { usePrivacyRequestAction } from '../features/privacy-requests/use-request-action';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { formatDate } from '../utils/format';

const steps = () => ({ stripe: t("common.stripe"), photos: t("common.privatePhotos"), swipes: t("privacyRequests.discoveryDecisions"), postgres: t("privacyRequests.postgresqlAnonymisation"), completed: t("common.erasureCompleted") });
const requestKey = (request: DataSubjectRequest) => request.id;

export default function PrivacyRequests() {
  useLocale();
  const session = useOutletContext<AdminSession>();
  const [filter, setFilter] = useRememberedState<'' | DataRequestStatus>('privacy:filter','');
  const loadPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getDataRequests(filter || undefined, cursor, signal);
    return { items: page.requests, nextCursor: page.next_cursor };
  }, [filter]);
  const pagination = useCursorPagination(loadPage, requestKey, undefined, 'privacy:'+filter);
  const action = usePrivacyRequestAction(session.role, pagination.reload);

  return (
    <>
      <PageHeader title={t("common.gdprRequests")} description={t("privacyRequests.trackAccessErasurePortabilityAndRectificationRights")} actions={
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button disabled={pagination.loading || action.saving} onClick={pagination.reload}>{t("common.refresh")}</Button>
          <FormControl size="small" sx={{ minWidth: 190 }}><InputLabel>{t("common.status")}</InputLabel><Select label={t("common.status")} value={filter} onChange={(event) => setFilter(event.target.value as '' | DataRequestStatus)}>
            <MenuItem value="">{t("common.all")}</MenuItem><MenuItem value="pending">{t("common.pending")}</MenuItem><MenuItem value="in_progress">{t("common.inProgress")}</MenuItem><MenuItem value="completed">{t("privacyRequests.completed")}</MenuItem><MenuItem value="rejected">{t("privacyRequests.rejected")}</MenuItem>
          </Select></FormControl>
        </Box>
      } />
      <Alert severity="info" sx={{ mb: 2 }}>{t("privacyRequests.recentAdministratorAuthenticationIsRequiredForTransitionsAndRetries")}</Alert>
      <AsyncState loading={pagination.loading} error={pagination.error} onRetry={pagination.reload} />
      {!pagination.loading && !pagination.error && <Paper variant="outlined" sx={{ overflowX: 'auto' }}><Table size="small">
        <TableHead><TableRow><TableCell>{t("common.request")}</TableCell><TableCell>{t("common.user")}</TableCell><TableCell>{t("privacyRequests.requestAndMessage")}</TableCell><TableCell>{t("common.date")}</TableCell><TableCell>{t("common.statusProgress")}</TableCell><TableCell>{t("privacyRequests.internalNotes")}</TableCell><TableCell align="right">{t("common.action")}</TableCell></TableRow></TableHead>
        <TableBody>{pagination.items.map((request) => <TableRow key={request.id}>
          <TableCell>{request.id}</TableCell><TableCell><UserLink id={request.user_id} /></TableCell><TableCell>{domainLabel(request.type)}<PrivacyRequestMessage details={request.details} collapsible /></TableCell><TableCell>{formatDate(request.requested_at)}</TableCell>
          <TableCell><StatusChip value={request.status} /><ErasureProgress request={request} />{request.response && <PrivacyRequestMessage details={request.response} label={t("privacyRequests.publicReply")} collapsible />}</TableCell><TableCell>{request.notes || t("common.missing")}</TableCell>
          <TableCell align="right"><PrivacyRequestActions request={request} disabled={action.saving} onSelect={action.start} /></TableCell>
        </TableRow>)}{!pagination.items.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>{t("privacyRequests.noRequestsInThisQueue")}</TableCell></TableRow>}</TableBody>
      </Table><CursorPaginationControls nextCursor={pagination.nextCursor} loading={pagination.loadingMore} error={pagination.loadMoreError} onLoadMore={pagination.loadMore} onReload={pagination.reload} /></Paper>}
      {action.draft && <PrivacyRequestActionDialog
        draft={action.draft}
        role={session.role}
        saving={action.saving}
        onNotesChange={action.setNotes}
        onResponseChange={action.setResponse}
        onCancel={action.close}
        onConfirm={() => void action.submit()}
      />}
    </>
  );
}

function ErasureProgress({ request }: { request: DataSubjectRequest }) {
  useLocale();
  const erasure = request.erasure;
  if (!erasure) return null;
  return <Box sx={{ mt: 1 }}>
    <Typography variant="body2">{steps()[erasure.step]}</Typography>
    <Typography variant="caption">{t("privacy.attempts", { status: erasure.status === 'dead_letter' ? t("privacyRequests.interventionRequired") : erasure.status === 'processing' ? t("common.processingInProgress") : erasure.step === 'completed' ? t("common.completed") : t("privacyRequests.waitingForRetry"), count: erasure.attempts })}</Typography>
    <Typography variant="caption" display="block">{t("privacy.progress", { date: formatDate(erasure.updated_at) })}</Typography>
    {erasure.last_error_code && <Typography variant="caption" color="error" display="block">{erasure.last_error_code}</Typography>}
  </Box>;
}
