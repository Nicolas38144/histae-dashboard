import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, TextField, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { getExportGrant, getRightsMessages, grantExport, sendRightsMessage, validCaseMessage, type RightsMessage } from '../../api/casework';
import { errorMessage } from '../../api/client';
import type { DataSubjectRequest } from '../../api/types';
import { AsyncState } from '../../components/AsyncState';
import { CursorPaginationControls } from '../../components/CursorPaginationControls';
import { useNotification } from '../../components/notification-context';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useCursorPagination } from '../../hooks/useCursorPagination';
import { t } from '../../i18n/core';
import { useLocale } from '../../i18n/useLocale';
import { formatDate } from '../../utils/format';

const messageKey = (message: RightsMessage) => message.id;

export function RightsConversation({ request, onClose, onReply }: { request: DataSubjectRequest; onClose: () => void; onReply: () => void }) {
  useLocale();
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();
  const load = useCallback(async (before: string | undefined, signal: AbortSignal) => {
    const page = await getRightsMessages(request.id, before, signal);
    return { items: page.messages, nextCursor: page.next_cursor };
  }, [request.id]);
  const page = useCursorPagination(load, messageKey);
  const canReply = !request.erasure && request.type !== 'restriction' && request.type !== 'objection';

  const send = async () => {
    if (saving || !validCaseMessage(draft)) return;
    setSaving(true);
    try {
      await sendRightsMessage(request.id, draft);
      setDraft('');
      page.reload();
      onReply();
    } catch (error) {
      showNotification(errorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };
  return <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="md" aria-labelledby="rights-conversation-title">
    <DialogTitle id="rights-conversation-title">{t('casework.thread')}</DialogTitle>
    <DialogContent dividers>
      <AsyncState loading={page.loading} error={page.error} onRetry={page.reload} />
      {!page.loading && !page.error && <>
        <CursorPaginationControls nextCursor={page.nextCursor} loading={page.loadingMore} error={page.loadMoreError} onLoadMore={page.loadMore} onReload={page.reload} />
        <Box sx={{ display: 'grid', gap: 1.5, my: 2 }}>
          {request.details && <ThreadEntry label={t('privacyRequests.userMessage')} body={request.details} date={request.requested_at} />}
          {[...page.items].reverse().map(message => <ThreadEntry key={message.id} label={t(message.author === 'team' ? 'casework.team' : 'privacyRequests.userMessage')} body={message.body} date={message.created_at} />)}
          {!request.details && !page.items.length && <Typography color="text.secondary">{t('casework.noMessages')}</Typography>}
        </Box>
      </>}
      {canReply && <TextField fullWidth multiline minRows={3} label={t('privacyRequests.publicReply')} helperText={t('casework.replyLimit')} value={draft}
        disabled={saving} onChange={event => setDraft(event.target.value)} />}
      {(request.type === 'access' || request.type === 'portability') && (request.status === 'in_progress' || request.status === 'completed')
        && <AssistedExport requestId={request.id} />}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={saving}>{t('common.close')}</Button>
      {canReply && <Button variant="contained" onClick={() => void send()} disabled={saving || !validCaseMessage(draft)}>{t('casework.sendReply')}</Button>}
    </DialogActions>
  </Dialog>;
}

function ThreadEntry({ label, body, date }: { label: string; body: string; date: string }) {
  return <Paper variant="outlined" sx={{ p: 1.5 }}>
    <Typography variant="caption" color="text.secondary">{label} · {formatDate(date)}</Typography>
    <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{body}</Typography>
  </Paper>;
}

function AssistedExport({ requestId }: { requestId: string }) {
  const load = useCallback(() => getExportGrant(requestId), [requestId]);
  const grant = useAsyncData(load);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();
  const authorize = async () => {
    setSaving(true);
    try {
      await grantExport(requestId);
      grant.reload();
      showNotification(t('casework.exportGranted'), 'success');
    } catch (error) {
      showNotification(errorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };
  return <Box sx={{ mt: 3 }}>
    <Alert severity="info">{t('casework.exportHelp')}</Alert>
    <AsyncState loading={grant.loading} error={grant.error} onRetry={grant.reload} />
    {!grant.loading && !grant.error && (grant.data
      ? <Typography sx={{ mt: 1 }}>{t('casework.exportExpiry', { date: formatDate(grant.data.expires_at) })}</Typography>
      : <Button sx={{ mt: 1 }} variant="outlined" disabled={saving} onClick={() => void authorize()}>{t('casework.grantExport')}</Button>)}
  </Box>;
}
