import { Box, Typography, Paper, Link } from '@mui/material';
import type { IMessage } from '../types/message.interface';
import { formatDateFromDate } from '../utils/general';
import { Link as RouterLink } from 'react-router-dom';

interface IChatMessage extends IMessage {
  isRight: boolean;
}

interface ChatMessageProps {
  messages: IChatMessage[];
}

const ChatMessage = ({ messages }: ChatMessageProps) => {
  if (messages.length === 0) return null;

  const firstMsg = messages[0];
  const rightUserId = firstMsg.sender_id;
  const leftUserId = firstMsg.receiver_id;
  const rightUserName = firstMsg.sender_info;
  const leftUserName = firstMsg.receiver_info;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        backgroundColor: '#fff', 
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid #ddd',
          backgroundColor: '#f0f0f0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Link
          component={RouterLink}
          to={`/users/${leftUserId}`}
          underline="hover"
          sx={{ fontWeight: 'bold', color: 'black' }}
        >
          {leftUserName}
        </Link>
        <Link
          component={RouterLink}
          to={`/users/${rightUserId}`}
          underline="hover"
          sx={{ fontWeight: 'bold', color: 'black' }}
        >
          {rightUserName}
        </Link>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          gap: 1,
          backgroundColor: '#f5f5f5',
        }}
      >
        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              justifyContent: msg.sender_id === rightUserId ? 'flex-end' : 'flex-start',
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 1.5,
                maxWidth: '60%',
                backgroundColor: msg.sender_id === rightUserId ? '#DCF8C6' : 'white',
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
                {formatDateFromDate(msg.created_at)}
              </Typography>
            </Paper>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default ChatMessage;
