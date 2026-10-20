import App from '../../src/App';
import { NotifierProvider } from '../../src/components/Notifier';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse, delay } from 'msw';
import { LanguageSelector } from '../../src/components/LanguageSelector';
import { localeStorageKey, setLocale, translate } from '../../src/i18n/core';
import { locales } from '../../src/i18n/catalogs';
import { useAsyncData } from '../../src/hooks/useAsyncData';
import { useCursorPagination } from '../../src/hooks/useCursorPagination';
import Login from '../../src/pages/Login';
import Traits from '../../src/pages/Traits';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';
import { api } from '../../src/api/client';

it('switches the login interface across all languages without losing enrollment input', async () => {
  const user = userEvent.setup();
  renderDashboard(<Login />);
  await user.click(screen.getByText('Enregistrer la première passkey'));
  await user.clear(screen.getByLabelText('Nom de la passkey'));
  await user.type(screen.getByLabelText('Nom de la passkey'), 'Ma clé personnelle');
  await user.type(screen.getByLabelText('Jeton d’enrôlement temporaire'), 'private-enrollment-fixture');
  for (const locale of locales) {
    await user.click(screen.getByRole('button', { name: translate(locale === 'fr' ? 'fr' : locales[locales.indexOf(locale) - 1], 'language.change') }));
    await user.click(screen.getByRole('menuitem', { name: translate(locale, `language.${({ fr: 'french', en: 'english', es: 'spanish', it: 'italian' } as const)[locale]}`) }));
    expect(screen.getByRole('heading', { name: translate(locale, 'login.histaeAdministration') })).toBeVisible();
    expect(screen.getByLabelText(translate(locale, 'common.passkeyName'))).toHaveValue('Ma clé personnelle');
    expect(screen.getByLabelText(translate(locale, 'login.temporaryEnrollmentToken'))).toHaveValue('private-enrollment-fixture');
    expect(document.documentElement.lang).toBe(locale);
  }
  expect(localStorage.getItem(localeStorageKey)).toBe('it');
  expect(Object.values(localStorage)).not.toContain('private-enrollment-fixture');
});

it('translates untouched default names and preserves canonical French catalogue edits across language switches', async () => {
  const user = userEvent.setup();
  const id = '79904c52-2545-4b43-996c-b50226f9308d';
  const requested: string[] = [];
  server.use(http.get('http://localhost/api/admin/traits', ({ request }) => {
    const language = request.headers.get('accept-language') ?? '';
    requested.push(language);
    return HttpResponse.json({ traits: [{ id, name: language === 'fr' ? 'Curieux' : 'Curious', translations: { fr: 'Curieux', en: 'Curious' } }] });
  }));
  renderDashboard(<><LanguageSelector /><Traits /></>);
  await user.click(await screen.findByRole('button', { name: 'Renommer Curieux' }));
  await user.clear(screen.getByLabelText('Nom (français)'));
  await user.type(screen.getByLabelText('Nom (français)'), 'Mon brouillon');
  act(() => setLocale('en'));
  await waitFor(() => expect(requested).toEqual(['fr', 'en']));
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByLabelText(translate('en', 'common.nameFrench'))).toHaveValue('Mon brouillon');
  expect(dialog.getByRole('button', { name: 'Save' })).toBeVisible();
});

it('updates a default passkey name while it is untouched', async () => {
  const user = userEvent.setup();
  renderDashboard(<Login />);
  await user.click(screen.getByText('Enregistrer la première passkey'));
  act(() => setLocale('en'));
  expect(screen.getByLabelText(translate('en', 'common.passkeyName'))).toHaveValue(translate('en', 'common.primaryKey'));
});

const loader = async () => (await api.get<{ value: string }>('/localized-data')).data;
function AsyncView() {
  const { data, error } = useAsyncData(loader);
  return <output>{error ?? data?.value}</output>;
}
const key = (item: string) => item;
const pageLoader = async (_cursor: string | undefined, signal: AbortSignal) => {
  const data = await api.get<{ value: string }>('/localized-data', { signal });
  return { items: [data.data.value], nextCursor: null };
};
function CursorView() {
  const { items } = useCursorPagination(pageLoader, key);
  return <output>{items.join(',')}</output>;
}

it.each([AsyncView, CursorView])('ignores stale responses when switching language during a load', async (View) => {
  let started = false;
  server.use(http.get('http://localhost/api/localized-data', async ({ request }) => {
    const language = request.headers.get('accept-language');
    if (language === 'fr') { started = true; await delay(150); }
    return HttpResponse.json({ value: language === 'fr' ? 'Ancien résultat' : 'New result' });
  }));
  renderDashboard(<View />);
  await waitFor(() => expect(started).toBe(true));
  act(() => setLocale('en'));
  expect(await screen.findByText('New result')).toBeVisible();
  await act(() => new Promise((resolve) => setTimeout(resolve, 180)));
  expect(screen.queryByText('Ancien résultat')).not.toBeInTheDocument();
});

it('keeps the complete application and selector usable when preference storage is denied', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('', 'SecurityError'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('', 'SecurityError'); });
  window.history.replaceState({}, '', '/login');
  const user = userEvent.setup();
  render(<NotifierProvider><App /></NotifierProvider>);
  await user.click(await screen.findByRole('button', { name: 'Changer de langue' }));
  await user.click(screen.getByRole('menuitem', { name: 'English' }));
  expect(screen.getByRole('heading', { name: 'Histae Administration' })).toBeVisible();
});
