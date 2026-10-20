import { api, errorMessage } from '../../src/api/client';
import { http, HttpResponse } from 'msw';
import { catalogs, locales } from '../../src/i18n/catalogs';
import { getLocale, initializeLocale, localeStorageKey, LocalizedError, setLocale, translate } from '../../src/i18n/core';
import { domainLabel } from '../../src/i18n/domain';
import { formatDate, formatDateOnly, formatMoney, formatNumber } from '../../src/utils/format';
import { server } from '../mocks/server';

const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();

describe('dashboard language contract', () => {
  it('provides the same keys and interpolation parameters in all four languages', () => {
    for (const locale of locales) {
      expect(Object.keys(catalogs[locale]).sort()).toEqual(Object.keys(catalogs.fr).sort());
      for (const key of Object.keys(catalogs.fr) as Array<keyof typeof catalogs.fr>) {
        const reference = catalogs.fr[key];
        const actual = catalogs[locale][key];
        expect(typeof actual, `${locale}:${key}`).toBe(typeof reference);
        if (typeof reference === 'string' && typeof actual === 'string') {
          expect(actual.trim(), `${locale}:${key}`).not.toBe('');
          expect(placeholders(actual), `${locale}:${key}`).toEqual(placeholders(reference));
        } else if (typeof reference !== 'string' && typeof actual !== 'string') {
          expect(Object.keys(actual).sort()).toEqual(['one', 'other']);
          for (const plural of ['one', 'other'] as const) {
            expect(actual[plural].trim()).not.toBe('');
            expect(placeholders(actual[plural]), `${locale}:${key}:${plural}`).toEqual(placeholders(reference[plural]));
          }
        }
      }
    }
  });

  it('uses plural rules and localized number formatting without translating user text', () => {
    expect(translate('en', 'audit.entriesExported', { count: 1 })).toBe('1 entry exported.');
    expect(translate('en', 'audit.entriesExported', { count: 1000 })).toBe('1,000 entries exported.');
    expect(translate('es', 'audit.entriesExported', { count: 2 })).toBe('2 entradas exportadas.');
    expect(translate('it', 'audit.viewLogFor', { name: '<Marie & Anna>' })).toBe('Visualizza il registro di <Marie & Anna>');
  });

  it('validates persisted preferences and synchronizes document and cross-tab changes', () => {
    localStorage.setItem(localeStorageKey, 'it');
    const dispose = initializeLocale();
    expect(getLocale()).toBe('it');
    expect(document.documentElement.lang).toBe('it');
    expect(document.title).toBe(translate('it', 'login.histaeAdministration'));
    window.dispatchEvent(new StorageEvent('storage', { key: localeStorageKey, newValue: 'es' }));
    expect(getLocale()).toBe('es');
    window.dispatchEvent(new StorageEvent('storage', { key: localeStorageKey, newValue: 'unsupported' }));
    expect(getLocale()).toBe('fr');
    dispose();
    localStorage.setItem(localeStorageKey, '../../arbitrary');
    initializeLocale()();
    expect(getLocale()).toBe('fr');
  });

  it('remains usable if browser preference storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('', 'SecurityError'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('', 'SecurityError'); });
    const dispose = initializeLocale();
    expect(() => setLocale('en')).not.toThrow();
    expect(getLocale()).toBe('en');
    dispose();
  });

  it('uses the current locale on each HTTP request, keeping cookies and payloads intact', async () => {
    const headers: string[] = [];
    server.use(http.post('http://localhost/api/language-contract', async ({ request }) => {
      headers.push(request.headers.get('accept-language') ?? '');
      expect(await request.json()).toEqual({ reason: 'Mon texte privé' });
      return HttpResponse.json({});
    }));
    for (const locale of locales) {
      setLocale(locale);
      await api.post('/language-contract', { reason: 'Mon texte privé' });
    }
    expect(headers).toEqual(locales);
    expect(api.defaults.withCredentials).toBe(true);
  });

  it('retranslates retained errors and domain labels and never exposes unknown raw errors', () => {
    const failure = new LocalizedError('auth.theRequestWasCancelledOrNoCompatiblePasskeyIs');
    const french = errorMessage(failure);
    setLocale('en');
    expect(errorMessage(failure)).not.toBe(french);
    expect(domainLabel('view_profile')).toBe('Profile viewed');
    expect(domainLabel('superadmin')).toBe(translate('en', 'common.superadmin'));
    expect(domainLabel('future_technical_code')).toBe('future_technical_code');
    expect(errorMessage(new Error('private provider diagnostic'))).not.toContain('private');
  });

  it('formats dates, money and counts with the selected locale and handles missing dates', () => {
    setLocale('en');
    expect(formatNumber(1234.5)).toBe('1,234.5');
    const englishMoney = formatMoney(4800, 'EUR');
    const englishDate = formatDateOnly('2026-10-20');
    setLocale('it');
    expect(formatNumber(12345.5)).toBe('12.345,5');
    expect(formatMoney(4800, 'EUR')).not.toBe(englishMoney);
    expect(formatDateOnly('2026-10-20')).not.toBe(englishDate);
    expect(formatDate('invalid')).toBe('—');
    expect(formatDateOnly(null)).toBe('—');
  });
});
