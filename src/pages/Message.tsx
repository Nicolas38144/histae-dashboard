import { useMemo } from 'react';
import { useMessageStore } from '../stores/message.store';
import { CircularProgress, Typography, Box } from '@mui/material';
import DataTable from '../components/DataTable';
import { formatDateFromDate } from '../utils/formatDate';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';

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
    { field: 'match_id', headerName: 'Match' },
    { field: 'created_at', headerName: 'Date' },
    { field: 'sender_firstname', headerName: 'Expéditeur' },
    { field: 'receiver_firstname', headerName: 'Destinataire' },
    { field: 'content', headerName: 'Message' },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center" mt={4}>
        {error}
      </Typography>
    );
  }

  return (
    <Box
      className="page-message"
      sx={{ display: 'flex', flexDirection: 'column'}}
    >
      <Typography variant="h4" align="left" gutterBottom>
        Messages
      </Typography>

      <DataTable
        columns={columns}
        rows={formattedMessages}
        searchLabel="Recherche de messages"
      />
    </Box>
  );
};

export default Message;
