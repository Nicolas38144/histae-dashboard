import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './main.css'
import Box from '@mui/material/Box';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Box sx={{ m:2 }}>
      <App />
    </Box>
  </React.StrictMode>
);
