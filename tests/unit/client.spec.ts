import { http, HttpResponse, delay } from 'msw';
import { ADMIN_SESSION_EXPIRED_EVENT } from '../../src/auth/session';
import { createTrait, getRevenue } from '../../src/api/admin';
import { api, errorMessage } from '../../src/api/client';
import { server } from '../mocks/server';

const apiUrl = 'http://localhost/api';

describe('HTTP client', () => {
  it('uses a bounded timeout, cookies and no automatic retry adapter', () => {
    expect(api.defaults.timeout).toBe(15_000);
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.adapter).toBeDefined();
  });

  it('normalizes API envelopes and unreachable-server failures', async () => {
    server.use(
      http.get(`${apiUrl}/failure`, () => HttpResponse.json({ error: { code: 'denied', message: 'Action refusée.' } }, { status: 403 })),
      http.get(`${apiUrl}/offline`, () => HttpResponse.error()),
    );

    const denied = await api.get('/failure').catch((error: unknown) => error);
    const offline = await api.get('/offline').catch((error: unknown) => error);

    expect(errorMessage(denied)).toBe('Action refusée.');
    expect(errorMessage(offline)).toBe('Le serveur est momentanément inaccessible.');
  });

  it('expires the local view on a private 401 but not on public authentication routes', async () => {
    const expired = vi.fn();
    window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, expired);
    server.use(
      http.get(`${apiUrl}/admin/metrics`, () => HttpResponse.json({ error: { code: 'unauthorized', message: 'Session expirée.' } }, { status: 401 })),
      http.post(`${apiUrl}/admin/auth/login/options`, () => HttpResponse.json({ error: { code: 'unauthorized', message: 'Connexion refusée.' } }, { status: 401 })),
    );

    await expect(api.get('/admin/metrics')).rejects.toBeDefined();
    expect(expired).toHaveBeenCalledOnce();
    await expect(api.post('/admin/auth/login/options')).rejects.toBeDefined();
    expect(expired).toHaveBeenCalledOnce();
    window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, expired);
  });

  it('never retries a failed mutation automatically', async () => {
    let calls = 0;
    server.use(http.post(`${apiUrl}/admin/traits`, () => {
      calls += 1;
      return HttpResponse.json({ error: { code: 'temporarily_unavailable', message: 'Réessayez plus tard.' } }, { status: 503 });
    }));

    await expect(createTrait('Trait fictif')).rejects.toBeDefined();
    expect(calls).toBe(1);
  });

  it('propagates cancellation through AbortSignal', async () => {
    server.use(http.get(`${apiUrl}/admin/revenue`, async () => {
      await delay(60_000);
      return HttpResponse.json({});
    }));
    const controller = new AbortController();
    const request = getRevenue('last_7_days', controller.signal);
    controller.abort();

    await expect(request).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  });
});
