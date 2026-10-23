import { act, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import * as auth from '../../src/api/auth';
import { ADMIN_SESSION_EXPIRED_EVENT, isAdminSessionLocked } from '../../src/auth/session';
import { api } from '../../src/api/client';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import userEvent from '@testing-library/user-event';
import { NotifierProvider } from '../../src/components/Notifier';
import AppRoutes from '../../src/routes/AppRoutes';
import { adminSession } from '../fixtures';

vi.mock('../../src/pages/Overview', () => ({ default: () => <p>Sensitive account fixture</p> }));

it('keeps a revoked session invalid when an older session check completes in the same batch', async () => {
  let resolve!: (value: typeof adminSession) => void;
  const pending = new Promise<typeof adminSession>((done) => { resolve = done; });
  const getSession = vi.spyOn(auth, 'getAdminSession').mockReturnValue(pending);
  window.history.replaceState({}, '', '/overview');
  render(<NotifierProvider><AppRoutes mode="light" toggleMode={() => undefined} /></NotifierProvider>);
  await waitFor(() => expect(getSession).toHaveBeenCalled());

  await act(async () => {
    window.dispatchEvent(new Event(ADMIN_SESSION_EXPIRED_EVENT));
    resolve(adminSession);
  });

  expect(await screen.findByRole('heading', { name: 'Administration Histae' })).toBeVisible();
  expect(window.location.pathname).toBe('/login');
});

it('clears the view before logout completes and reports a server failure on the login screen', async () => {
  const user = userEvent.setup();
  vi.spyOn(auth, 'getAdminSession').mockResolvedValue(adminSession);
  let reject!: (reason: Error) => void;
  const post = vi.spyOn(api, 'post').mockImplementation(() => new Promise((_resolve, fail) => { reject = fail; }));
  window.history.replaceState({}, '', '/overview');
  render(<NotifierProvider><AppRoutes mode="light" toggleMode={() => undefined} /></NotifierProvider>);
  expect(await screen.findByText('Sensitive account fixture')).toBeVisible();

  await user.click(screen.getAllByText('Se déconnecter')[0]);

  expect(screen.queryByText('Sensitive account fixture')).not.toBeInTheDocument();
  expect(await screen.findByText('Déconnexion du serveur en cours…')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Se connecter avec une passkey' })).toBeDisabled();
  expect(isAdminSessionLocked()).toBe(true);
  await act(async () => reject(new Error('offline')));
  expect(await screen.findByText(/la révocation de la session sur le serveur n’a pas pu être confirmée/)).toBeVisible();
  expect(window.location.pathname).toBe('/login');

  post.mockRestore();
  server.use(http.post('http://localhost/api/admin/auth/logout', () => new HttpResponse(null, { status: 204 })));
  await user.click(screen.getByRole('button', { name: 'Se déconnecter' }));
  await waitFor(() => expect(screen.queryByText(/la révocation de la session sur le serveur n’a pas pu être confirmée/)).not.toBeInTheDocument());
});
