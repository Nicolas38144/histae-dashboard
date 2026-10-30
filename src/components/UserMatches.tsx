import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { ChatOutlined } from '@mui/icons-material';
import {
  Box,
  Chip,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getMatchMessages, getUserMatches } from '../api/admin';
import type { AdminSession, ChatMessage, Match } from '../api/types';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { compactId, formatDate } from '../utils/format';
import { prependUniqueBy } from '../utils/pagination';
import { AsyncState } from './AsyncState';
import { ConfirmActionDialog } from './ConfirmActionDialog';
import { CursorPaginationControls } from './CursorPaginationControls';
import { StatusChip } from './StatusChip';
import { UserLink } from './UserLink';

type ActiveConversation = {
  accessReason: string;
  match: Match;
};

const matchKey = (match: Match) => match.id;
const messageKey = (message: ChatMessage) => message.id;

export function UserMatches({ userId, profileReason }: { userId: string; profileReason: string }) {
  useLocale();
  const session = useOutletContext<AdminSession>();
  const loadMatchPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getUserMatches(userId, profileReason, cursor, signal);
    return { items: page.matches, nextCursor: page.next_cursor };
  }, [userId, profileReason]);
  const matches = useCursorPagination(loadMatchPage, matchKey);
  const [pendingMatch, setPendingMatch] = useState<Match | null>(null);
  const [accessReason, setAccessReason] = useState('');
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null);

  const openConversation = (match: Match) => {
    if (match.can_view_messages !== true) return;
    if (session.role === 'superadmin') {
      setActiveConversation({ match, accessReason: '' });
      return;
    }
    setPendingMatch(match);
    setAccessReason('');
    setActiveConversation(null);
  };

  const closeConversation = () => {
    setPendingMatch(null);
    setAccessReason('');
    setActiveConversation(null);
  };

  const authorizeConversation = () => {
    if (pendingMatch?.can_view_messages !== true) return;
    setActiveConversation({ match: pendingMatch, accessReason: accessReason.trim() });
    setPendingMatch(null);
    setAccessReason('');
  };

  return (
    <>
      <Paper variant="outlined" sx={{ mt: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={750}>{t("common.matches")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t("userMatches.viewingIsRecordedInTheAccessLog")}</Typography>
          <Typography variant="body2" color="text.secondary">{t('userMatches.reportRequired')}</Typography>
        </Box>
        <AsyncState loading={matches.loading} error={matches.error} onRetry={matches.reload} />
        {!matches.loading && !matches.error && (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t("common.match")}</TableCell>
                  <TableCell>{t("common.otherParticipant")}</TableCell>
                  <TableCell>{t("common.status")}</TableCell>
                  <TableCell>{t("common.lastActivity")}</TableCell>
                  <TableCell align="right">{t("common.conversation")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matches.items.map((match) => (
                  <MatchRow
                    key={match.id}
                    match={match}
                    userId={userId}
                    onOpen={() => openConversation(match)}
                  />
                ))}
                {!matches.items.length && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      {t("userMatches.noRetainedMatches")}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <CursorPaginationControls
              nextCursor={matches.nextCursor}
              loading={matches.loadingMore}
              error={matches.loadMoreError}
              onLoadMore={matches.loadMore}
              onReload={matches.reload}
            />
          </>
        )}
      </Paper>
      {activeConversation?.match.can_view_messages === true && (
        <MatchConversation
          key={activeConversation.match.id}
          match={activeConversation.match}
          accessReason={activeConversation.accessReason}
          onClose={closeConversation}
        />
      )}
      {session.role !== 'superadmin' && <ConfirmActionDialog
        open={Boolean(pendingMatch)}
        title={t("userMatches.justifyAccessToTheConversation")}
        description={t("userMatches.bothParticipantsWillSeeThisAccessInTheTraceability")}
        confirmLabel={t("userMatches.openConversation")}
        value={accessReason}
        onValueChange={setAccessReason}
        valueLabel={t("userMatches.requiredReason3To500Characters")}
        requireValue
        minValueLength={3}
        maxValueLength={500}
        onCancel={closeConversation}
        onConfirm={authorizeConversation}
      />}
    </>
  );
}

function MatchRow({
  match,
  userId,
  onOpen,
}: {
  match: Match;
  userId: string;
  onOpen: () => void;
}) {
  useLocale();
  const otherParticipant = match.user1_id === userId ? match.user2_id : match.user1_id;
  return (
    <TableRow>
      <TableCell>{compactId(match.id)}</TableCell>
      <TableCell><UserLink id={otherParticipant} /></TableCell>
      <TableCell>
        <StatusChip value={match.status} />
        {match.archived && <Chip size="small" sx={{ ml: 1 }} label={t('matches.archived')} />}
        {match.inactivity_expires_at && <Typography variant="caption" display="block">
          {t('matches.inactivityDeadline', { date: formatDate(match.inactivity_expires_at) })}
        </Typography>}
      </TableCell>
      <TableCell>{formatDate(match.last_message_at || match.created_at)}</TableCell>
      <TableCell align="right">
        <Button size="small" startIcon={<ChatOutlined />} disabled={match.can_view_messages !== true} onClick={onOpen}>{t("common.view")}</Button>
      </TableCell>
    </TableRow>
  );
}

function MatchConversation({
  match,
  accessReason,
  onClose,
}: ActiveConversation & { onClose: () => void }) {
  useLocale();
  const loadMessagePage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getMatchMessages(match.id, accessReason, cursor, signal);
    return { items: [...page.messages].reverse(), nextCursor: page.next_cursor };
  }, [accessReason, match.id]);
  const messages = useCursorPagination(loadMessagePage, messageKey, prependUniqueBy);

  return (
    <Paper variant="outlined" sx={{ mt: 2, p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6">{t("matches.conversation", { id: compactId(match.id) })}</Typography>
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
                  justifyContent: message.sender_id === match.user1_id ? 'flex-start' : 'flex-end',
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
