import { useEffect } from 'react';
import { useMessageStore } from '../stores/message.store';
import { CircularProgress, Typography, Box } from '@mui/material';
import DataTable from '../components/DataTable';
import { formatDate } from '../utils/formatDate';

const Message = () => {
  const { messages, loading, error, fetchMessages } = useMessageStore();

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const columns = [
    { field: 'match_id', headerName: 'Match' },
    { field: 'created_at', headerName: 'Date', valueFormatter: (date: string) => formatDate(date), },
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
        rows={messages}
        searchableField="content"
        searchLabel="Recherche de messages"
      />
    </Box>
  );
};

export default Message;
