import { getIntlLocale, t } from '../i18n/core';

export function formatDate(value: string | null | undefined): string {
  if (!value) return t('common.missing');
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? t('common.missing')
    : new Intl.DateTimeFormat(getIntlLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return t('common.missing');
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? t('common.missing')
    : new Intl.DateTimeFormat(getIntlLocale(), { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

export function formatNumber(value: number | null | undefined, options?: Intl.NumberFormatOptions): string {
  return value === null || value === undefined || !Number.isFinite(value) ? t('common.missing')
    : new Intl.NumberFormat(getIntlLocale(), options).format(value);
}

export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat(getIntlLocale(), { style: 'currency', currency }).format(cents / 100);
}

export function compactId(value: string): string {
  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}
