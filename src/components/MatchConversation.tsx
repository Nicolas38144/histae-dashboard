import { Box, Button, Paper, Typography } from '@mui/material';
import { useCallback } from 'react';
import { getMatchMessages } from '../api/admin';
import type { ChatMessage } from '../api/types';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { t } from '../i18n/core';
import { useLocale } from '../i18n/useLocale';
import { compactId, formatDate } from '../utils/format';
import { prependUniqueBy } from '../utils/pagination';
import { AsyncState } from './AsyncState';
import { ConfirmActionDialog } from './ConfirmActionDialog';
import { CursorPaginationControls } from './CursorPaginationControls';
import { UserLink } from './UserLink';

const messageKey = (message: ChatMessage) => message.id;

export function MatchConversation({
  matchId,
  firstParticipantId,
  headingId,
  accessReason,
  onClose,
}: { matchId: string; firstParticipantId: string; accessReason: string; headingId?: string; onClose: () => void }) {
  useLocale();
  const loadMessagePage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getMatchMessages(matchId, accessReason, cursor, signal);
    return { items: [...page.messages].reverse(), nextCursor: page.next_cursor };
  }, [accessReason, matchId]);
  const messages = useCursorPagination(loadMessagePage, messageKey, prependUniqueBy);

  return (
    <Paper variant="outlined" sx={{ mt: 2, p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography component="h2" id={headingId} variant="h6">{t("matches.conversation", { id: compactId(matchId) })}</Typography>
          <Typography variant="caption" color="text.secondary">{t("common.accessLogged")}</Typography>
        </Box>
        <Button onClick={onClose}>{t("common.close")}</Button>
      </Box>
      <AsyncState loading={messages.loading} error={messages.error} onRetry={messages.reload} />
      {!messages.loading && !messages.error && (
        <>
          <CursorPaginationControls
            nextCursor={messages.nextCursor}
            loading={messages.loadingMore}
            error={messages.loadMoreError}
            onLoadMore={messages.loadMore}
            onReload={messages.reload}
            loadLabel={t("userMatches.loadEarlierMessages")}
          />
          <Box sx={{ maxHeight: 520, overflowY: 'auto', bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
            {messages.items.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender_id === firstParticipantId ? 'flex-start' : 'flex-end',
                  mb: 1,
                }}
              >
                <Paper sx={{ p: 1.5, maxWidth: '75%' }}>
                  <Typography variant="caption" color="text.secondary">
                    <UserLink id={message.sender_id} /> {' '}{t("common.separator")}{' '}{formatDate(message.created_at)}
                  </Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {message.content}
                  </Typography>
                </Paper>
              </Box>
            ))}
            {!messages.items.length && (
              <Typography textAlign="center" color="text.secondary">{t("userMatches.noRetainedMessages")}</Typography>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
}

export function MatchAccessDialog({ open, reason, onReasonChange, onCancel, onConfirm }: {
  open: boolean;
  reason: string;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useLocale();
  return (
    <ConfirmActionDialog
      open={open}
      title={t("userMatches.justifyAccessToTheConversation")}
      description={t("userMatches.bothParticipantsWillSeeThisAccessInTheTraceability")}
      confirmLabel={t("userMatches.openConversation")}
      value={reason}
      onValueChange={onReasonChange}
      valueLabel={t("userMatches.requiredReason3To500Characters")}
      requireValue
      minValueLength={3}
      maxValueLength={500}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
