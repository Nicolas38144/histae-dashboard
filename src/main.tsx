import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { NotifierProvider } from './components/Notifier';
import './main.css';
import { initializeLocale } from './i18n/core';

const disposeLocale = initializeLocale();
if (import.meta.hot) import.meta.hot.dispose(disposeLocale);

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><NotifierProvider><App /></NotifierProvider></React.StrictMode>);
