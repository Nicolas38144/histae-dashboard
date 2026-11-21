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
import { getUserMatches } from '../api/admin';
import type { AdminSession, Match } from '../api/types';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { compactId, formatDate } from '../utils/format';
import { AsyncState } from './AsyncState';
import { MatchAccessDialog, MatchConversation } from './MatchConversation';
import { CursorPaginationControls } from './CursorPaginationControls';
import { StatusChip } from './StatusChip';
import { UserLink } from './UserLink';

type ActiveConversation = {
  accessReason: string;
  match: Match;
};

type ConversationState = ActiveConversation & { status: 'pending' | 'active' };

const matchKey = (match: Match) => match.id;

export function UserMatches({ userId, profileReason }: { userId: string; profileReason: string }) {
  useLocale();
  const session = useOutletContext<AdminSession>();
  const loadMatchPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getUserMatches(userId, profileReason, cursor, signal);
    return { items: page.matches, nextCursor: page.next_cursor };
  }, [userId, profileReason]);
  const matches = useCursorPagination(loadMatchPage, matchKey);
  const [conversation, setConversation] = useState<ConversationState | null>(null);
  const pendingConversation = conversation?.status === 'pending' ? conversation : null;
  const activeConversation = conversation?.status === 'active' ? conversation : null;

  const openConversation = (match: Match) => {
    if (match.can_view_messages !== true) return;
    setConversation({ match, accessReason: '', status: session.role === 'superadmin' ? 'active' : 'pending' });
  };

  const closeConversation = () => {
    setConversation(null);
  };

  const authorizeConversation = () => {
    if (pendingConversation?.match.can_view_messages !== true) return;
    setConversation({ ...pendingConversation, status: 'active', accessReason: pendingConversation.accessReason.trim() });
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
          matchId={activeConversation.match.id}
          firstParticipantId={activeConversation.match.user1_id}
          accessReason={activeConversation.accessReason}
          onClose={closeConversation}
        />
      )}
      {session.role !== 'superadmin' && <MatchAccessDialog
        open={Boolean(pendingConversation)}
        reason={pendingConversation?.accessReason ?? ''}
        onReasonChange={(accessReason) => setConversation((current) => current?.status === 'pending' ? { ...current, accessReason } : current)}
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

