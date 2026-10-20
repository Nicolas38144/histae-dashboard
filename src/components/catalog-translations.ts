import type { TranslationPatch, Translations } from '../api/types';

export const translatedLanguages = ['en', 'es', 'it'] as const;
export type TranslationForm = Record<(typeof translatedLanguages)[number], string>;
export const labels = { en: 'Anglais', es: 'Espagnol', it: 'Italien' };

export function translationForm(values?: Translations): TranslationForm {
  return { en: values?.en ?? '', es: values?.es ?? '', it: values?.it ?? '' };
}

export function translationPatch(values: TranslationForm): TranslationPatch {
  return Object.fromEntries(translatedLanguages.map((language) => [language, values[language].trim() || null]));
}

