import { t } from '../../i18n/core';
import type { StoreProvider } from './types';
export const storeProviderLabel = (provider: StoreProvider) => provider === 'app_store' ? t('storeBilling.apple') : t('storeBilling.google');
