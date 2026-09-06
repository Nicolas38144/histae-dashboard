import { http, HttpResponse } from 'msw';
import {
  addCredential,
  loginWithPasskey,
  registerWithBootstrap,
  revokeCredential,
  revokeOtherSessions,
} from '../../src/api/auth';
import { adminSession, fixtureIds } from '../fixtures';
import { server } from '../mocks/server';

const webauthn = vi.hoisted(() => ({
  supports: vi.fn(),
  authenticate: vi.fn(),
  register: vi.fn(),
}));

vi.mock('@simplewebauthn/browser', () => ({
  browserSupportsWebAuthn: webauthn.supports,
  startAuthentication: webauthn.authenticate,
  startRegistration: webauthn.register,
}));

const apiUrl = 'http://localhost/api';
const options = { challenge_id: 'challenge-fixture', options: { challenge: 'Y2hhbGxlbmdl' } };
const credential = { id: 'credential-fixture', rawId: 'credential-fixture', type: 'public-key', response: {} };

describe('native WebAuthn client', () => {
  beforeEach(() => {
    webauthn.supports.mockReturnValue(true);
    webauthn.authenticate.mockResolvedValue(credential);
    webauthn.register.mockResolvedValue(credential);
  });

  it('performs passkey login without persisting a token', async () => {
    let verification: unknown;
    server.use(
      http.post(`${apiUrl}/admin/auth/login/options`, () => HttpResponse.json(options)),
      http.post(`${apiUrl}/admin/auth/login/verify`, async ({ request }) => {
        verification = await request.json();
        return HttpResponse.json(adminSession);
      }),
    );

    await expect(loginWithPasskey()).resolves.toEqual(adminSession);
    expect(verification).toEqual({ challenge_id: options.challenge_id, credential });
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });

  it('registers bootstrap and additional credentials with the browser response', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(`${apiUrl}/admin/auth/bootstrap/options`, () => HttpResponse.json(options)),
      http.post(`${apiUrl}/admin/auth/bootstrap/verify`, async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(adminSession);
      }),
      http.post(`${apiUrl}/admin/auth/credentials/options`, () => HttpResponse.json(options)),
      http.post(`${apiUrl}/admin/auth/credentials/verify`, async ({ request }) => {
        bodies.push(await request.json());
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await registerWithBootstrap('bootstrap-fixture', 'Clé principale');
    await addCredential('Clé de secours');

    expect(bodies).toEqual([
      { bootstrap_token: 'bootstrap-fixture', challenge_id: options.challenge_id, credential, name: 'Clé principale' },
      { challenge_id: options.challenge_id, credential, name: 'Clé de secours' },
    ]);
    expect(localStorage).toHaveLength(0);
    expect(sessionStorage).toHaveLength(0);
  });

  it('revokes a credential and other sessions through explicit mutations', async () => {
    const requests: string[] = [];
    server.use(
      http.delete(`${apiUrl}/admin/auth/credentials/${fixtureIds.credential}`, () => {
        requests.push('credential');
        return new HttpResponse(null, { status: 204 });
      }),
      http.post(`${apiUrl}/admin/auth/sessions/revoke-others`, () => {
        requests.push('sessions');
        return HttpResponse.json({ revoked_sessions: 2 });
      }),
    );

    await revokeCredential(fixtureIds.credential);
    await expect(revokeOtherSessions()).resolves.toBe(2);
    expect(requests).toEqual(['credential', 'sessions']);
  });

  it('turns an authenticator cancellation into a stable French message', async () => {
    webauthn.authenticate.mockRejectedValue(new DOMException('cancelled', 'NotAllowedError'));
    server.use(http.post(`${apiUrl}/admin/auth/login/options`, () => HttpResponse.json(options)));

    await expect(loginWithPasskey()).rejects.toThrow('La demande a été annulée ou aucune passkey compatible n’est disponible.');
  });
});
