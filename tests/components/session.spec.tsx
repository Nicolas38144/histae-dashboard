import { act, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import * as auth from '../../src/api/auth';
import { ADMIN_SESSION_EXPIRED_EVENT } from '../../src/auth/session';
import { NotifierProvider } from '../../src/components/Notifier';
import AppRoutes from '../../src/routes/AppRoutes';
import { adminSession } from '../fixtures';

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
