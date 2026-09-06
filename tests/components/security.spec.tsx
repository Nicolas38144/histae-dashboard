import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
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
});
