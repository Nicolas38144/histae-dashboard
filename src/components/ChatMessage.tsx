import { Box, Typography, Paper } from '@mui/material';

interface IChatMessage {
  id: string;
  content: string;
  created_at: string;
  isRight: boolean;
}

interface ChatMessageProps {
  messages: IChatMessage[];
}

const ChatMessage = ({ messages }: ChatMessageProps) => {
  return (
    <Paper
      elevation={3}
      sx={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        gap: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 2,
      }}
    >
      {messages.map((msg) => (
        <Box
          key={msg.id}
          sx={{
            display: 'flex',
            justifyContent: msg.isRight ? 'flex-end' : 'flex-start',
          }}
        >
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              maxWidth: '60%',
              backgroundColor: msg.isRight ? '#DCF8C6' : 'white',
              borderRadius: 3,
            }}
          >
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
              {msg.content}
            </Typography>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ display: 'block', textAlign: 'right' }}
            >
              {msg.created_at}
            </Typography>
          </Paper>
        </Box>
      ))}
    </Paper>
  );
}

export default ChatMessage;