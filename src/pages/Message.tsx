import { useMemo } from 'react';
import { useMessageStore } from '../stores/message.store';
import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import { formatDateFromDate } from '../utils/general';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import Loader from '../components/Loader';
import Error from '../components/Error';
import Title from '../components/Title';
import { t } from 'i18next';

const Message = () => {
  const { messages, loading, error, lastFetched, fetchMessages } = useMessageStore();

  useAutoFetchStore({
      lastFetched,
      fetchFn: fetchMessages,
      maxAge: MAX_CACHE_DURATION,
    });

  const formattedMessages = useMemo(() => {
    return messages.map((message) => ({
      ...message,
      created_at: formatDateFromDate(message.created_at),
    }));
  }, [messages]);

  const columns = [
    { field: 'match_id', headerName: t("messagePage.match") },
    { field: 'created_at', headerName: t("messagePage.date") },
    { field: 'sender_info', headerName: t("messagePage.sender") },
    { field: 'receiver_info', headerName: t("messagePage.receiver") },
    { field: 'content', headerName: t("messagePage.message") },
  ];

  if (loading) { return <Loader /> }

  if (error) { return <Error error={error} /> }

  return (
    <Box
      className="page-message"
      sx={{ display: 'flex', flexDirection: 'column'}}
    >
      <Title title={t("messagePage.title")} />

      <DataTable
        columns={columns}
        rows={formattedMessages}
      />
    </Box>
  );
};

export default Message;
