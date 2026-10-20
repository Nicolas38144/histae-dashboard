import fr from './messages/fr.json';
import en from './messages/en.json';
import es from './messages/es.json';
import it from './messages/it.json';

export const locales = ['fr', 'en', 'es', 'it'] as const;
export type Locale = typeof locales[number];
export type MessageKey = keyof typeof fr;
type Message = string | { one: string; other: string };
type Dictionary = Record<MessageKey, Message>;
export const catalogs: Record<Locale, Dictionary> = { fr, en, es, it };
export const intlLocales: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', it: 'it-IT' };
export const defaultLocale: Locale = 'fr';
export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && locales.some((locale) => locale === value);
}
