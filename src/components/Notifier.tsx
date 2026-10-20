import { useLocale } from '../i18n/useLocale';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { NotificationContext, type NotificationSeverity } from './notification-context';

export const NotifierProvider = ({ children }: { children: ReactNode }) => {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { setOpen(false); }, [locale]);
  const [severity, setSeverity] = useState<NotificationSeverity>('info');

  const showNotification = useCallback((msg: string, sev: NotificationSeverity = 'info') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  const handleClose = () => {
    setOpen(false);
  };

  const value = useMemo(() => ({ showNotification }), [showNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
