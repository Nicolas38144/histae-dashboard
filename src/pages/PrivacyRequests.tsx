import { useRememberedState } from '../hooks/list-memory';
import { domainLabel } from '../i18n/domain';
import { useLocale } from '../i18n/useLocale';
import { LocalizedError, t } from '../i18n/core';
import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getDataRequests, retryErasure, updateDataRequest } from '../api/admin';
import { errorMessage } from '../api/client';
import type { AdminSession, DataRequestStatus, DataSubjectRequest } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { CursorPaginationControls } from '../components/CursorPaginationControls';
import { PageHeader } from '../components/PageHeader';
import { PrivacyRequestMessage } from '../components/PrivacyRequestMessage';
import { StatusChip } from '../components/StatusChip';
import { UserLink } from '../components/UserLink';
import { useNotification } from '../components/notification-context';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { formatDate } from '../utils/format';

type NextStatus = Exclude<DataRequestStatus, 'pending'> | 'retry';
type Action = { request: DataSubjectRequest; status: NextStatus };
const steps = () => ({ stripe: t("common.stripe"), photos: t("common.privatePhotos"), swipes: t("privacyRequests.discoveryDecisions"), postgres: t("privacyRequests.postgresqlAnonymisation"), completed: t("common.erasureCompleted") });
const requestKey = (request: DataSubjectRequest) => request.id;

export default function PrivacyRequests() {
  useLocale();
  const session = useOutletContext<AdminSession>();
  const [filter, setFilter] = useRememberedState<'' | DataRequestStatus>('privacy:filter','');
  const [action, setAction] = useState<Action | null>(null);
  const [notes, setNotes] = useState('');
  const [response, setResponse] = useState('');
  const needsReply = action?.request.type === 'rectification' && (action.status === 'completed' || action.status === 'rejected');
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();
  const loadPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getDataRequests(filter || undefined, cursor, signal);
    return { items: page.requests, nextCursor: page.next_cursor };
  }, [filter]);
  const pagination = useCursorPagination(loadPage, requestKey, undefined, 'privacy:'+filter);
  const close = () => { setAction(null); setNotes(''); setResponse(''); };
  const startAction = (request: DataSubjectRequest, status: NextStatus) => {
    setAction({ request, status });
    setNotes(status === 'retry' ? '' : request.notes || '');
    setResponse(request.response || '');
  };

  const update = async () => {
    if (!action || (needsReply && (!response.trim() || [...response.trim()].length > 2000))) return;
    if (session.role !== 'superadmin' && action.status === 'retry' && (notes.trim().length < 3 || notes.trim().length > 500)) {
      showNotification(t("privacyRequests.theRetryReasonMustContainBetween3And500"), 'error');
      return;
    }
    setSaving(true);
    try {
      if (action.status === 'retry') {
        const eventId = action.request.erasure?.event_id;
        if (!eventId) throw new LocalizedError("privacyRequests.thisJobIsNoLongerAvailableRefreshTheList");
        await retryErasure(eventId, notes);
      } else {
        await updateDataRequest(action.request.id, action.status, notes, needsReply ? response : undefined);
      }
      showNotification(action.status === 'completed' && action.request.type === 'erasure'
        ? t("privacyRequests.erasureScheduledTheRequestRemainsInProgressUntilProcessing")
        : action.status === 'retry' ? t("privacyRequests.retryQueued") : t("privacyRequests.gdprRequestUpdated"), 'success');
      close(); pagination.reload();
    } catch (reason) { showNotification(errorMessage(reason), 'error'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <PageHeader title={t("common.gdprRequests")} description={t("privacyRequests.trackAccessErasurePortabilityAndRectificationRights")} actions={
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button disabled={pagination.loading || saving} onClick={pagination.reload}>{t("common.refresh")}</Button>
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
          <TableCell align="right">{request.type !== 'restriction' && request.type !== 'objection' && <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            {request.status === 'pending' && <Button disabled={saving} size="small" onClick={() => startAction(request, 'in_progress')}>{t("common.takeOwnership")}</Button>}
            {request.status === 'in_progress' && !request.erasure && <Button disabled={saving} size="small" color="success" onClick={() => startAction(request, 'completed')}>{request.type === 'erasure' ? t("common.startErasure") : t("privacyRequests.resolve")}</Button>}
            {!request.erasure && (request.status === 'pending' || request.status === 'in_progress') && <Button disabled={saving} size="small" color="error" onClick={() => startAction(request, 'rejected')}>{t("common.reject")}</Button>}
            {request.erasure?.status === 'dead_letter' && request.erasure.event_id && <Button disabled={saving} size="small" onClick={() => startAction(request, 'retry')}>{t("common.retry")}</Button>}
          </Box>}</TableCell>
        </TableRow>)}{!pagination.items.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>{t("privacyRequests.noRequestsInThisQueue")}</TableCell></TableRow>}</TableBody>
      </Table><CursorPaginationControls nextCursor={pagination.nextCursor} loading={pagination.loadingMore} error={pagination.loadMoreError} onLoadMore={pagination.loadMore} onReload={pagination.reload} /></Paper>}
      <ConfirmActionDialog
        open={Boolean(action)}
        title={dialogTitle(action)}
        description={dialogDescription(action)}
        confirmLabel={t("common.confirm")}
        danger={action?.status === 'rejected' || (action?.status === 'completed' && action.request.type === 'erasure')}
        value={notes}
        onValueChange={setNotes}
        valueLabel={session.role === 'superadmin'
          ? undefined
          : action?.status === 'retry' ? t("privacyRequests.retryReason3To500Characters") : t("privacyRequests.internalNotes")}
        requireValue={session.role !== 'superadmin' && (action?.status === 'rejected' || action?.status === 'retry')}
        minValueLength={action?.status === 'retry' ? 3 : 1}
        maxValueLength={action?.status === 'retry' ? 500 : 2000}
        loading={saving}
        confirmDisabled={Boolean(needsReply && (!response.trim() || [...response.trim()].length > 2000))}
        onCancel={close}
        onConfirm={() => void update()}
      >
        {action && <PrivacyRequestMessage details={action.request.details} />}
        {needsReply && <>
          <Alert severity="info" sx={{ mb: 2 }}>{t('privacyRequests.resolveGuidance')}</Alert>
          <TextField fullWidth required multiline minRows={3} label={t('privacyRequests.publicReply')} helperText={t('privacyRequests.publicReplyHelp')} value={response} onChange={(event) => setResponse(event.target.value)} inputProps={{ maxLength: 2000 }} disabled={saving} sx={{ mb: 2 }} />
        </>}
      </ConfirmActionDialog>
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

function dialogTitle(action: Action | null): string {
  if (!action) return '';
  if (action.status === 'retry') return t("privacyRequests.retryThisErasure");
  if (action.status === 'in_progress') return t("privacyRequests.takeOwnershipOfThisRequest");
  if (action.status === 'rejected') return t("privacyRequests.rejectThisRequest");
  return action.request.type === 'erasure' ? t("privacyRequests.startPermanentErasure") : t("privacyRequests.completeThisRequest");
}

function dialogDescription(action: Action | null): string {
  if (action?.status === 'retry') return t("privacyRequests.checkThatTheCauseOfTheFailureIsResolved");
  if (action?.status === 'completed' && action.request.type === 'erasure') return t("privacyRequests.theErasureWorkflowWillBeScheduledStripePhotosDiscovery");
  return t("privacyRequests.theTransitionAndTheResponsibleAdministratorWillBeRecorded");
}
