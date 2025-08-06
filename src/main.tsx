import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './main.css'
import Box from '@mui/material/Box';
import { NotifierProvider } from './components/Notifier';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NotifierProvider>
      <Box sx={{ m:2 }}>
        <App />
      </Box>
    </NotifierProvider>
  </React.StrictMode>
);
