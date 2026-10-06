import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Security from '../../src/pages/Security';
import { adminCredential } from '../fixtures';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const webauthn = vi.hoisted(() => ({ register: vi.fn() }));

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: () => true,
  startAuthentication: vi.fn(),
  startRegistration: webauthn.register,
}));

const apiUrl = 'http://localhost/api';

describe('passkey management screen', () => {
  beforeEach(() => {
    webauthn.register.mockResolvedValue({
      id: 'new-credential-fixture',
      rawId: 'new-credential-fixture',
      type: 'public-key',
      response: {},
    });
  });

  it('protects the current passkey and confirms revocation of another one', async () => {
    const user = userEvent.setup();
    let revoked = 0;
    server.use(
      http.get(`${apiUrl}/admin/auth/credentials`, () => HttpResponse.json([
        adminCredential,
        { ...adminCredential, id: '30000000-0000-4000-8000-000000000002', name: 'Clé courante', current: true },
      ])),
      http.delete(`${apiUrl}/admin/auth/credentials/${adminCredential.id}`, () => {
        revoked += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderDashboard(<Security />);

    const revokeButtons = await screen.findAllByRole('button', { name: 'Révoquer' });
    expect(revokeButtons[0]).toBeEnabled();
    expect(revokeButtons[1]).toBeDisabled();
    await user.click(revokeButtons[0]);
    expect(screen.getByText(/ne pourra plus se connecter/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Révoquer' }));

    await waitFor(() => expect(revoked).toBe(1));
    expect(await screen.findByText('La passkey a été révoquée et les autres sessions ont été fermées.')).toBeVisible();
  });

  it('uses a browser ceremony before adding a named backup passkey', async () => {
    const user = userEvent.setup();
    let verification: unknown;
    server.use(
      http.get(`${apiUrl}/admin/auth/credentials`, () => HttpResponse.json([adminCredential])),
      http.post(`${apiUrl}/admin/auth/credentials/options`, () => HttpResponse.json({
        challenge_id: 'challenge-fixture',
        options: { challenge: 'Y2hhbGxlbmdl' },
      })),
      http.post(`${apiUrl}/admin/auth/credentials/verify`, async ({ request }) => {
        verification = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderDashboard(<Security />);

    await user.click(await screen.findByRole('button', { name: 'Ajouter une passkey' }));
    const name = screen.getByLabelText('Nom de la passkey');
    await user.clear(name);
    await user.type(name, 'Clé physique de secours');
    await user.click(screen.getByRole('button', { name: 'Continuer' }));

    await waitFor(() => expect(verification).toMatchObject({
      challenge_id: 'challenge-fixture',
      name: 'Clé physique de secours',
    }));
    expect(webauthn.register).toHaveBeenCalledOnce();
    expect(await screen.findByText('La nouvelle passkey a été enregistrée.')).toBeVisible();
  });

  it('renames a passkey and revokes another session through the admin routes', async () => {
    const user = userEvent.setup();
    const sessionId = 'a0000000-0000-4000-8000-000000000001';
    let renamed: unknown;
    let revoked = 0;
    server.use(
      http.get(`${apiUrl}/admin/auth/credentials`, () => HttpResponse.json([adminCredential])),
      http.get(`${apiUrl}/admin/auth/sessions`, () => HttpResponse.json([{
        id: sessionId,
        credential_id: adminCredential.id,
        credential_name: adminCredential.name,
        authenticated_at: adminCredential.created_at,
        last_seen_at: adminCredential.created_at,
        expires_at: adminCredential.created_at,
        current: false,
      }])),
      http.get(`${apiUrl}/admin/auth/events`, () => HttpResponse.json({ events: [], next_cursor: null })),
      http.patch(`${apiUrl}/admin/auth/credentials/${adminCredential.id}`, async ({ request }) => {
        renamed = await request.json();
        return HttpResponse.json({ message: 'administrator credential renamed' });
      }),
      http.delete(`${apiUrl}/admin/auth/sessions/${sessionId}`, () => {
        revoked += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderDashboard(<Security />);

    await user.click(await screen.findByRole('button', { name: 'Renommer' }));
    const name = screen.getByLabelText('Nom de la passkey');
    await user.clear(name);
    await user.type(name, 'Clé de secours');
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Renommer' }));
    await waitFor(() => expect(renamed).toEqual({ name: 'Clé de secours' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Renommer cette passkey' })).not.toBeInTheDocument());

    await user.click(screen.getAllByRole('button', { name: 'Révoquer' }).find((button) => !button.hasAttribute('disabled'))!);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Révoquer' }));
    await waitFor(() => expect(revoked).toBe(1));
  });
});
