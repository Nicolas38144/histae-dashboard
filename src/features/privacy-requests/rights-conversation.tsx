import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, TextField, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { getExportGrant, getRightsMessages, grantExport, sendRightsMessage, type RightsMessage } from '../../api/casework';
import type { DataSubjectRequest } from '../../api/types';
import { AsyncState } from '../../components/AsyncState';
import { CursorPaginationControls } from '../../components/CursorPaginationControls';
import { useNotification } from '../../components/notification-context';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useCursorPagination } from '../../hooks/useCursorPagination';
import { t } from '../../i18n/core';
import { useLocale } from '../../i18n/useLocale';
import { formatDate } from '../../utils/format';
import { prependUniqueBy } from '../../utils/pagination';
import { validateCaseReply } from '../casework/reply';
import { useCaseworkAction } from '../casework/use-casework-action';
import { canReplyToPrivacyRequest } from './actions';

const messageKey = (message: RightsMessage) => message.id;

export function RightsConversation({ request, accountDeleted, onClose, onReply }: {
  request: DataSubjectRequest;
  accountDeleted: boolean;
  onClose: () => void;
  onReply: () => void;
}) {
  useLocale();
  const [draft, setDraft] = useState('');
  const [threadClosed, setThreadClosed] = useState(false);
  const { saving, run } = useCaseworkAction();
  const load = useCallback(async (before: string | undefined, signal: AbortSignal) => {
    const page = await getRightsMessages(request.id, before, signal);
    if (!signal.aborted && (page.status === 'completed' || page.status === 'rejected')) setThreadClosed(true);
    return { items: [...page.messages].reverse(), nextCursor: page.next_cursor };
  }, [request.id]);
  const page = useCursorPagination(load, messageKey, prependUniqueBy);
  const canReply = !threadClosed && canReplyToPrivacyRequest(request, accountDeleted);
  const replyDisabled = saving || page.loading;
  const validReply = validateCaseReply(draft) === null;

  const send = () => {
    if (!canReply || replyDisabled || !validReply) return;
    void run(() => sendRightsMessage(request.id, draft), () => {
      setDraft('');
      page.reload();
      onReply();
    });
  };
  return <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="md" aria-labelledby="rights-conversation-title">
    <DialogTitle id="rights-conversation-title">{t(canReply ? 'casework.thread' : 'privacyRequests.exchangeHistory')}</DialogTitle>
    <DialogContent dividers>
      <AsyncState loading={page.loading} error={page.error} onRetry={page.reload} />
      {!page.loading && !page.error && <>
        <CursorPaginationControls nextCursor={page.nextCursor} loading={page.loadingMore} error={page.loadMoreError} onLoadMore={page.loadMore} onReload={page.reload} loadLabel={t('userMatches.loadEarlierMessages')} />
        <Box sx={{ display: 'grid', gap: 1.5, my: 2 }}>
          {request.details && <ThreadEntry label={t('privacyRequests.userMessage')} body={request.details} date={request.requested_at} />}
          {page.items.map(message => <ThreadEntry key={message.id} label={t(message.author === 'team' ? 'casework.team' : 'privacyRequests.userMessage')} body={message.body} date={message.created_at} />)}
          {!request.details && !page.items.length && <Typography color="text.secondary">{t('casework.noMessages')}</Typography>}
        </Box>
      </>}
      {canReply && <TextField fullWidth multiline minRows={3} label={t('privacyRequests.publicReply')} helperText={t('casework.replyLimit')} value={draft}
        disabled={replyDisabled} onChange={event => setDraft(event.target.value)} />}
      {(request.type === 'access' || request.type === 'portability') && (request.status === 'in_progress' || request.status === 'completed')
        && <AssistedExport requestId={request.id} />}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={saving}>{t('common.close')}</Button>
      {canReply && <Button variant="contained" onClick={send} disabled={replyDisabled || !validReply}>{t('casework.sendReply')}</Button>}
    </DialogActions>
  </Dialog>;
}

function ThreadEntry({ label, body, date }: { label: string; body: string; date: string }) {
  return <Paper variant="outlined" sx={{ p: 1.5 }}>
    <Typography variant="caption" color="text.secondary">{label} {t('common.separator')} {formatDate(date)}</Typography>
    <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{body}</Typography>
  </Paper>;
}

function AssistedExport({ requestId }: { requestId: string }) {
  const load = useCallback(() => getExportGrant(requestId), [requestId]);
  const grant = useAsyncData(load);
  const { saving, run } = useCaseworkAction();
  const { showNotification } = useNotification();
  const authorize = () => {
    void run(() => grantExport(requestId), () => {
      grant.reload();
      showNotification(t('casework.exportGranted'), 'success');
    });
  };
  return <Box sx={{ mt: 3 }}>
    <Alert severity="info">{t('casework.exportHelp')}</Alert>
    <AsyncState loading={grant.loading} error={grant.error} onRetry={grant.reload} />
    {!grant.loading && !grant.error && (grant.data
      ? <Typography sx={{ mt: 1 }}>{t('casework.exportExpiry', { date: formatDate(grant.data.expires_at) })}</Typography>
      : <Button sx={{ mt: 1 }} variant="outlined" disabled={saving} onClick={authorize}>{t('casework.grantExport')}</Button>)}
  </Box>;
}
