import { Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { getSupportCases, replyToSupport, validCaseMessage, type SupportCase, type SupportStatus } from '../api/casework';
import { errorMessage } from '../api/client';
import { AsyncState } from '../components/AsyncState';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { CursorPaginationControls } from '../components/CursorPaginationControls';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { UserLink } from '../components/UserLink';
import { useNotification } from '../components/notification-context';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { t } from '../i18n/core';
import { useLocale } from '../i18n/useLocale';
import { formatDate } from '../utils/format';

const caseKey = (entry: SupportCase) => entry.id;

export default function SupportCases() {
  useLocale();
  const [draft, setDraft] = useState<{ id: string; status: Exclude<SupportStatus, 'pending'>; response: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();
  const load = useCallback(async (before: string | undefined, signal: AbortSignal) => {
    const result = await getSupportCases(before, signal);
    return { items: result.cases, nextCursor: result.next_cursor };
  }, []);
  const page = useCursorPagination(load, caseKey);

  const send = async () => {
    if (!draft || saving || !validCaseMessage(draft.response)) return;
    setSaving(true);
    try {
      await replyToSupport(draft.id, draft.status, draft.response);
      setDraft(null);
      showNotification(t('casework.replySent'), 'success');
      page.reload();
    } catch (error) {
      showNotification(errorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  return <>
    <PageHeader title={t('casework.support')} description={t('casework.supportDescription')}
      actions={<Button disabled={page.loading} onClick={page.reload}>{t('common.refresh')}</Button>} />
    <AsyncState loading={page.loading} error={page.error} onRetry={page.reload} />
    {!page.loading && !page.error && <Stack spacing={2}>
      {page.items.map(entry => <Paper key={entry.id} variant="outlined" sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          <Typography component="h2" variant="h6">{t(`casework.category.${entry.category}`)}</Typography>
          <StatusChip value={entry.status === 'closed' ? 'completed' : entry.status} />
          {entry.user_id ? <UserLink id={entry.user_id} /> : <Typography variant="caption">{t('casework.guest')}</Typography>}
          <Typography variant="caption">{formatDate(entry.created_at)}</Typography>
        </Box>
        <Typography sx={{ mt: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{entry.body}</Typography>
        {entry.response && <Typography sx={{ mt: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          <strong>{t('casework.team')}</strong> · {entry.response}</Typography>}
        {entry.status !== 'closed' && <Button sx={{ mt: 1 }} disabled={saving} onClick={() => setDraft({ id: entry.id, status: 'closed', response: '' })}>{t('casework.sendReply')}</Button>}
      </Paper>)}
      {!page.items.length && <Typography>{t('casework.noCases')}</Typography>}
      <CursorPaginationControls nextCursor={page.nextCursor} loading={page.loadingMore} error={page.loadMoreError} onLoadMore={page.loadMore} onReload={page.reload} />
    </Stack>}
    {draft && <ConfirmActionDialog open title={t('casework.sendReply')} description={t('casework.supportReplyHelp')}
      confirmLabel={t('casework.sendReply')} confirmDisabled={!validCaseMessage(draft.response)} loading={saving}
      onCancel={() => setDraft(null)} onConfirm={() => void send()}>
      <TextField select fullWidth sx={{ mt: 2 }} label={t('common.status')} value={draft.status} disabled={saving}
        onChange={event => setDraft({ ...draft, status: event.target.value as typeof draft.status })}>
        <MenuItem value="in_progress">{t('common.inProgress')}</MenuItem>
        <MenuItem value="closed">{t('common.completed')}</MenuItem>
      </TextField>
      <TextField fullWidth required multiline minRows={3} sx={{ mt: 2 }} label={t('privacyRequests.publicReply')}
        helperText={t('casework.replyLimit')} value={draft.response} disabled={saving} onChange={event => setDraft({ ...draft, response: event.target.value })} />
    </ConfirmActionDialog>}
  </>;
}
