import { LocalizedError } from '../i18n/core';
import { createContext, useContext } from 'react';

export type NotificationSeverity = 'success' | 'error' | 'info' | 'warning';
export type NotificationContextValue = { showNotification: (message: string, severity?: NotificationSeverity) => void };

export const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) throw new LocalizedError("notification-context.usenotificationMustBeUsedWithinANotifierprovider");
  return context;
}
