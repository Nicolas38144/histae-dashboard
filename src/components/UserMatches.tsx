import { ChatOutlined } from '@mui/icons-material';
import {
  Box,
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
import { getMatchMessages, getUserMatches } from '../api/admin';
import type { ChatMessage, Match } from '../api/types';
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

export function UserMatches({ userId }: { userId: string }) {
  const loadMatchPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getUserMatches(userId, cursor, signal);
    return { items: page.matches, nextCursor: page.next_cursor };
  }, [userId]);
  const matches = useCursorPagination(loadMatchPage, matchKey);
  const [pendingMatch, setPendingMatch] = useState<Match | null>(null);
  const [accessReason, setAccessReason] = useState('');
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null);

  const openConversation = (match: Match) => {
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
    if (!pendingMatch) return;
    setActiveConversation({ match: pendingMatch, accessReason: accessReason.trim() });
    setPendingMatch(null);
    setAccessReason('');
  };

  return (
    <>
      <Paper variant="outlined" sx={{ mt: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={750}>Matchs</Typography>
          <Typography variant="body2" color="text.secondary">
            La consultation est inscrite au journal d’accès.
          </Typography>
        </Box>
        <AsyncState loading={matches.loading} error={matches.error} onRetry={matches.reload} />
        {!matches.loading && !matches.error && (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Match</TableCell>
                  <TableCell>Autre participant</TableCell>
                  <TableCell>État</TableCell>
                  <TableCell>Dernière activité</TableCell>
                  <TableCell align="right">Conversation</TableCell>
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
                      Aucun match conservé.
                    </TableCell>
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
      {activeConversation && (
        <MatchConversation
          match={activeConversation.match}
          accessReason={activeConversation.accessReason}
          onClose={closeConversation}
        />
      )}
      <ConfirmActionDialog
        open={Boolean(pendingMatch)}
        title="Justifier l’accès à la conversation"
        description="Les deux participants verront cet accès représenté dans le journal de traçabilité."
        confirmLabel="Ouvrir la conversation"
        value={accessReason}
        onValueChange={setAccessReason}
        valueLabel="Motif obligatoire"
        requireValue
        onCancel={closeConversation}
        onConfirm={authorizeConversation}
      />
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
  const otherParticipant = match.user1_id === userId ? match.user2_id : match.user1_id;
  return (
    <TableRow>
      <TableCell>{compactId(match.id)}</TableCell>
      <TableCell><UserLink id={otherParticipant} /></TableCell>
      <TableCell><StatusChip value={match.status} /></TableCell>
      <TableCell>{formatDate(match.last_message_at || match.created_at)}</TableCell>
      <TableCell align="right">
        <Button size="small" startIcon={<ChatOutlined />} onClick={onOpen}>Consulter</Button>
      </TableCell>
    </TableRow>
  );
}

function MatchConversation({
  match,
  accessReason,
  onClose,
}: ActiveConversation & { onClose: () => void }) {
  const loadMessagePage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getMatchMessages(match.id, accessReason, cursor, signal);
    return { items: [...page.messages].reverse(), nextCursor: page.next_cursor };
  }, [accessReason, match.id]);
  const messages = useCursorPagination(loadMessagePage, messageKey, prependUniqueBy);

  return (
    <Paper variant="outlined" sx={{ mt: 2, p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6">Conversation {compactId(match.id)}</Typography>
          <Typography variant="caption" color="text.secondary">Accès justifié et journalisé</Typography>
        </Box>
        <Button onClick={onClose}>Fermer</Button>
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
            loadLabel="Charger les messages précédents"
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
                    {compactId(message.sender_id)} · {formatDate(message.created_at)}
                  </Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                    {message.content}
                  </Typography>
                </Paper>
              </Box>
            ))}
            {!messages.items.length && (
              <Typography textAlign="center" color="text.secondary">Aucun message conservé.</Typography>
            )}
          </Box>
        </>
      )}
    </Paper>
  );
}
