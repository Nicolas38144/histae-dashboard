import { act, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import * as auth from '../../src/api/auth';
import { ADMIN_SESSION_EXPIRED_EVENT, isAdminSessionLocked } from '../../src/auth/session';
import { ADMIN_SESSION_CHECK_INTERVAL_MS } from '../../src/auth/useAdminSession';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import userEvent from '@testing-library/user-event';
import { NotifierProvider } from '../../src/components/Notifier';
import AppRoutes from '../../src/routes/AppRoutes';
import { adminSession } from '../fixtures';

vi.mock('../../src/pages/Overview', () => ({ default: () => <p>Sensitive account fixture</p> }));

it('redirects to login when a periodic session request returns 401', async () => {
  let valid = true;
  server.use(http.get('http://localhost/api/admin/auth/session', () => valid
    ? HttpResponse.json(adminSession)
    : HttpResponse.json({ error: { code: 'admin_session_invalid' } }, { status: 401 })));
  window.history.replaceState({}, '', '/overview');
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  try {
    render(<NotifierProvider><AppRoutes mode="light" toggleMode={() => undefined} /></NotifierProvider>);
    expect(await screen.findByText('Sensitive account fixture')).toBeVisible();

    valid = false;
    await act(() => vi.advanceTimersByTimeAsync(ADMIN_SESSION_CHECK_INTERVAL_MS));
    expect(await screen.findByRole('heading', { name: 'Administration Histae' })).toBeVisible();
    expect(window.location.pathname).toBe('/login');
    expect(screen.queryByText('Sensitive account fixture')).not.toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});

it('keeps a revoked session invalid when an older session check completes in the same batch', async () => {
  let resolve!: (value: typeof adminSession) => void;
  const pending = new Promise<typeof adminSession>((done) => { resolve = done; });
  const getSession = vi.spyOn(auth, 'getAdminSession').mockReturnValue(pending);
  localStorage.setItem('auth_token', 'legacy-fixture');
  sessionStorage.setItem('histae_admin_access_token', 'legacy-fixture');
  window.history.replaceState({}, '', '/overview');
  render(<NotifierProvider><AppRoutes mode="light" toggleMode={() => undefined} /></NotifierProvider>);
  await waitFor(() => expect(getSession).toHaveBeenCalled());

  await act(async () => {
    window.dispatchEvent(new Event(ADMIN_SESSION_EXPIRED_EVENT));
    resolve(adminSession);
  });

  expect(await screen.findByRole('heading', { name: 'Administration Histae' })).toBeVisible();
  expect(window.location.pathname).toBe('/login');
  expect(localStorage.getItem('auth_token')).toBeNull();
  expect(sessionStorage.getItem('histae_admin_access_token')).toBeNull();
});

it('clears the view before logout completes and reports a server failure on the login screen', async () => {
  const user = userEvent.setup();
  vi.spyOn(auth, 'getAdminSession').mockResolvedValue(adminSession);
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  let requests = 0;
  server.use(http.post('http://localhost/api/admin/auth/logout', async () => {
    requests += 1;
    if (requests > 1) return new HttpResponse(null, { status: 204 });
    await pending;
    return HttpResponse.json({ error: { code: 'unavailable' } }, { status: 503 });
  }));
  window.history.replaceState({}, '', '/overview');
  render(<NotifierProvider><AppRoutes mode="light" toggleMode={() => undefined} /></NotifierProvider>);
  expect(await screen.findByText('Sensitive account fixture')).toBeVisible();

  try {
    await user.click(screen.getAllByText('Se déconnecter')[0]);
    expect(screen.queryByText('Sensitive account fixture')).not.toBeInTheDocument();
    expect(await screen.findByText('Déconnexion du serveur en cours…')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Se connecter avec une passkey' })).toBeDisabled();
    expect(isAdminSessionLocked()).toBe(true);
  } finally {
    finish();
  }
  expect(await screen.findByText(/la révocation de la session sur le serveur n’a pas pu être confirmée/)).toBeVisible();
  expect(window.location.pathname).toBe('/login');

  await user.click(screen.getByRole('button', { name: 'Se déconnecter' }));
  await waitFor(() => expect(screen.queryByText(/la révocation de la session sur le serveur n’a pas pu être confirmée/)).not.toBeInTheDocument());
  expect(requests).toBe(2);
});
