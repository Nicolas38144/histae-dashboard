import { ChatOutlined } from '@mui/icons-material';
import { Box, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getMatchMessages, getUserMatches } from '../api/admin';
import { errorMessage } from '../api/client';
import type { ChatMessage, Match } from '../api/types';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { compactId, formatDate } from '../utils/format';
import { prependUniqueBy, uniqueBy } from '../utils/pagination';
import { AsyncState } from './AsyncState';
import { ConfirmActionDialog } from './ConfirmActionDialog';
import { CursorPaginationControls } from './CursorPaginationControls';
import { StatusChip } from './StatusChip';
import { UserLink } from './UserLink';
import { useNotification } from './notification-context';

type ConversationData = {
  messages: ChatMessage[];
  nextCursor: string | null;
  accessReason: string;
};

const matchKey = (match: Match) => match.id;
const messageKey = (message: ChatMessage) => message.id;

export function UserMatches({ userId }: { userId: string }) {
  const loadMatchPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getUserMatches(userId, cursor, signal);
    return { items: page.matches, nextCursor: page.next_cursor };
  }, [userId]);
  const matches = useCursorPagination(loadMatchPage, matchKey);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [accessReason, setAccessReason] = useState('');
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const requestSequence = useRef(0);
  const activeController = useRef<AbortController | null>(null);
  const { showNotification } = useNotification();

  useEffect(() => () => {
    activeController.current?.abort();
    requestSequence.current += 1;
  }, []);

  const loadMessages = async (cursor?: string) => {
    if (!selectedMatch) return;
    const append = cursor !== undefined;
    const reason = conversation?.accessReason ?? accessReason.trim();
    const requestId = ++requestSequence.current;
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    if (append) {
      setLoadingMore(true);
      setLoadMoreError(null);
    } else {
      setLoading(true);
      setLoadMoreError(null);
    }
    try {
      const page = await getMatchMessages(selectedMatch.id, reason, cursor, controller.signal);
      if (controller.signal.aborted || requestId !== requestSequence.current) return;
      const chronologicalPage = [...page.messages].reverse();
      setConversation((current) => append && current
        ? {
            messages: prependUniqueBy(chronologicalPage, current.messages, messageKey),
            nextCursor: page.next_cursor,
            accessReason: current.accessReason,
          }
        : {
            messages: uniqueBy(chronologicalPage, messageKey),
            nextCursor: page.next_cursor,
            accessReason: reason,
          });
    } catch (requestError) {
      if (controller.signal.aborted || requestId !== requestSequence.current) return;
      if (append) setLoadMoreError(errorMessage(requestError));
      else showNotification(errorMessage(requestError), 'error');
    } finally {
      if (!controller.signal.aborted && requestId === requestSequence.current) {
        if (append) setLoadingMore(false);
        else setLoading(false);
      }
    }
  };

  const openConversation = (match: Match) => {
    activeController.current?.abort();
    requestSequence.current += 1;
    setSelectedMatch(match);
    setAccessReason('');
    setConversation(null);
    setLoadMoreError(null);
    setLoading(false);
    setLoadingMore(false);
  };

  const closeConversation = () => {
    activeController.current?.abort();
    requestSequence.current += 1;
    setSelectedMatch(null);
    setAccessReason('');
    setConversation(null);
    setLoadMoreError(null);
    setLoading(false);
    setLoadingMore(false);
  };

  return (
    <>
      <Paper variant="outlined" sx={{ mt: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={750}>Matchs</Typography>
          <Typography variant="body2" color="text.secondary">La consultation est inscrite au journal d’accès.</Typography>
        </Box>
        <AsyncState loading={matches.loading} error={matches.error} onRetry={matches.reload} />
        {!matches.loading && !matches.error && (
          <>
            <Table size="small">
              <TableHead>
                <TableRow><TableCell>Match</TableCell><TableCell>Autre participant</TableCell><TableCell>État</TableCell><TableCell>Dernière activité</TableCell><TableCell align="right">Conversation</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {matches.items.map((match) => {
                  const other = match.user1_id === userId ? match.user2_id : match.user1_id;
                  return (
                    <TableRow key={match.id}>
                      <TableCell>{compactId(match.id)}</TableCell>
                      <TableCell><UserLink id={other} /></TableCell>
                      <TableCell><StatusChip value={match.status} /></TableCell>
                      <TableCell>{formatDate(match.last_message_at || match.created_at)}</TableCell>
                      <TableCell align="right">
                        <Button size="small" startIcon={<ChatOutlined />} onClick={() => openConversation(match)}>Consulter</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!matches.items.length && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>Aucun match conservé.</TableCell></TableRow>}
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
      {selectedMatch && conversation && (
        <Conversation
          match={selectedMatch}
          data={conversation}
          loading={loading}
          loadingMore={loadingMore}
          loadMoreError={loadMoreError}
          onLoadMore={() => void loadMessages(conversation.nextCursor ?? undefined)}
          onReload={() => void loadMessages()}
          onClose={closeConversation}
        />
      )}
      <ConfirmActionDialog
        open={Boolean(selectedMatch && !conversation)}
        title="Justifier l’accès à la conversation"
        description="Les deux participants verront cet accès représenté dans le journal de traçabilité."
        confirmLabel="Ouvrir la conversation"
        value={accessReason}
        onValueChange={setAccessReason}
        valueLabel="Motif obligatoire"
        requireValue
        loading={loading}
        onCancel={closeConversation}
        onConfirm={() => void loadMessages()}
      />
    </>
  );
}

function Conversation({
  match,
  data,
  loading,
  loadingMore,
  loadMoreError,
  onLoadMore,
  onReload,
  onClose,
}: {
  match: Match;
  data: ConversationData;
  loading: boolean;
  loadingMore: boolean;
  loadMoreError: string | null;
  onLoadMore: () => void;
  onReload: () => void;
  onClose: () => void;
}) {
  return (
    <Paper variant="outlined" sx={{ mt: 2, p: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6">Conversation {compactId(match.id)}</Typography>
          <Typography variant="caption" color="text.secondary">Accès justifié et journalisé</Typography>
        </Box>
        <Button onClick={onClose}>Fermer</Button>
      </Box>
      <AsyncState loading={loading} error={null} />
      <CursorPaginationControls
        nextCursor={data.nextCursor}
        loading={loading || loadingMore}
        error={loadMoreError}
        onLoadMore={onLoadMore}
        onReload={onReload}
        loadLabel="Charger les messages précédents"
      />
      <Box sx={{ maxHeight: 520, overflowY: 'auto', bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>
        {data.messages.map((message) => (
          <Box key={message.id} sx={{ display: 'flex', justifyContent: message.sender_id === match.user1_id ? 'flex-start' : 'flex-end', mb: 1 }}>
            <Paper sx={{ p: 1.5, maxWidth: '75%' }}>
              <Typography variant="caption" color="text.secondary">{compactId(message.sender_id)} · {formatDate(message.created_at)}</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.content}</Typography>
            </Paper>
          </Box>
        ))}
        {!data.messages.length && <Typography textAlign="center" color="text.secondary">Aucun message conservé.</Typography>}
      </Box>
    </Paper>
  );
}
