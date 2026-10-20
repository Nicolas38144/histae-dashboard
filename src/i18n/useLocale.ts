import { useSyncExternalStore } from 'react';
import { defaultLocale } from './catalogs';
import { getLocale, subscribeLocale } from './core';

export function useLocale() {
  return useSyncExternalStore(subscribeLocale, getLocale, () => defaultLocale);
}
