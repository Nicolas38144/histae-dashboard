import { catalogs, defaultLocale, intlLocales, isLocale, type Locale, type MessageKey } from './catalogs';

type MessageParams = Readonly<Record<string, string | number>>;
export const localeStorageKey = 'histae_locale';
let currentLocale: Locale = defaultLocale;
const listeners = new Set<() => void>();

export function translate(locale: Locale, key: MessageKey, params: MessageParams = {}): string {
  const message = catalogs[locale][key];
  const pattern = typeof message === 'string' ? message
    : new Intl.PluralRules(intlLocales[locale]).select(Number(params.count)) === 'one'
      ? message.one : message.other;
  return pattern.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
    const value = params[name];
    return typeof value === 'number' ? new Intl.NumberFormat(intlLocales[locale]).format(value)
      : value ?? placeholder;
  });
}

export const getLocale = (): Locale => currentLocale;
export const getIntlLocale = (): string => intlLocales[currentLocale];
export const t = (key: MessageKey, params?: MessageParams): string => translate(currentLocale, key, params);
export function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function updateDocument() {
  document.documentElement.lang = currentLocale;
  document.title = t('login.histaeAdministration');
}

export function setLocale(locale: Locale, options: { persist?: boolean } = {}) {
  if (!isLocale(locale)) return;
  if (options.persist !== false) {
    try { localStorage.setItem(localeStorageKey, locale); } catch { /* Preferences are optional. */ }
  }
  const changed = currentLocale !== locale;
  currentLocale = locale;
  updateDocument();
  if (changed) listeners.forEach((listener) => listener());
}

export function initializeLocale(): () => void {
  let saved: unknown;
  try { saved = localStorage.getItem(localeStorageKey); } catch { /* Use the default locale. */ }
  setLocale(isLocale(saved) ? saved : defaultLocale, { persist: false });
  const onStorage = (event: StorageEvent) => {
    if (event.key === localeStorageKey || event.key === null) {
      setLocale(isLocale(event.newValue) ? event.newValue : defaultLocale, { persist: false });
    }
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

/** Retain the message identity so errors can be rendered in the current language. */
export class LocalizedError extends Error {
  readonly key: MessageKey;
  readonly params: MessageParams;
  constructor(key: MessageKey, params: MessageParams = {}) {
    super(t(key, params));
    this.name = 'LocalizedError';
    this.key = key;
    this.params = params;
  }
}
