import { useCallback, useMemo } from 'react';
import { useMessageStore } from '../stores/message.store';
import { Box } from '@mui/material';
import { formatDateFromDate } from '../utils/general';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import Loader from '../components/Loader';
import Error from '../components/Error';
import Title from '../components/Title';
import { t } from 'i18next';
import ChatMessages from '../components/ChatMessage';

const Message = () => {
  const { messages, loading, error, lastFetched, fetchMessages } = useMessageStore();
  const match_id = "842ff9cc-9c22-4055-a210-2823fa59177d";

  const fetchFn = useCallback(async () => {
    await fetchMessages(match_id);
  }, [fetchMessages]);

  useAutoFetchStore({
    lastFetched,
    fetchFn,
    maxAge: MAX_CACHE_DURATION,
  });

  const formattedMessages = useMemo(() => {
    if (messages.length === 0) return [];
    const firstSenderId = messages[0].sender_id;
    return messages.map((m) => ({
      ...m,
      created_at: formatDateFromDate(m.created_at),
      isRight: m.sender_id === firstSenderId,
    }));
  }, [messages]);

  if (loading) return <Loader />;
  if (error) return <Error error={error} />;

  return (
    <Box
      className="page-message"
      sx={{ display: 'flex', flexDirection: 'column', height: '80vh' }}
    >
      <Title title={t('messagePage.title')} />
      <ChatMessages messages={formattedMessages} />
    </Box>
  );
};

export default Message;
