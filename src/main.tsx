import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NotifierProvider } from './components/Notifier';
import './main.css';

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><NotifierProvider><App /></NotifierProvider></React.StrictMode>);
