import { http, HttpResponse } from 'msw';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SmsSafetyPanel } from '../../src/components/SmsSafetyPanel';
import { smsSafety } from '../fixtures';
import { server } from '../mocks/server';

const endpoint = 'http://localhost/api/admin/sms-safety';

describe('SMS sending protection', () => {
  it('shows per-phone limits without exposing phone identifiers or controls to ordinary admins', async () => {
    render(<SmsSafetyPanel canManage={false} />);
    expect(await screen.findByText(/5 tentatives sur une heure et 10 sur 24 heures/)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Suspendre les SMS' })).not.toBeInTheDocument();
  });

  it('confirms explicit suspension with the read version and reloads its state', async () => {
    const user = userEvent.setup();
    let current = { ...smsSafety };
    const calls: unknown[] = [];
    server.use(
      http.get(endpoint, () => HttpResponse.json(current)),
      http.patch(endpoint, async ({ request }) => {
        calls.push(await request.json());
        current = { ...current, suspended: true, manual_suspended: true, version: 1 };
        return new HttpResponse(null, { status: 204 });
      }),
    );
    render(<SmsSafetyPanel canManage />);
    await user.click(await screen.findByRole('button', { name: 'Suspendre les SMS' }));
    expect(calls).toHaveLength(0);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmer' }));
    expect(await screen.findByText('Les envois SMS sont suspendus.')).toBeVisible();
    expect(calls).toEqual([{ suspended: true, version: 0 }]);
    expect(await screen.findByRole('button', { name: 'Reprendre les SMS' })).toBeEnabled();
  });

  it('keeps a forced server suspension effective and reports traffic spikes', async () => {
    server.use(http.get(endpoint, () => HttpResponse.json({ ...smsSafety, suspended: true, environment_suspended: true, traffic_spike: true })));
    render(<SmsSafetyPanel canManage />);
    expect(await screen.findByText(/La configuration du serveur impose la suspension/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Suspendre les SMS' })).toBeDisabled();
    expect(screen.getByText(/Hausse anormale/)).toBeVisible();
  });

  it('rejects malformed state before offering a sending control', async () => {
    server.use(http.get(endpoint, () => HttpResponse.json({ ...smsSafety, manual_suspended: 'false' })));
    render(<SmsSafetyPanel canManage />);
    expect(await screen.findByText(/La réponse de protection SMS est invalide/)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Suspendre les SMS' })).not.toBeInTheDocument();
  });

  it('resolves a lost mutation response by reading without retrying the mutation', async () => {
    const user = userEvent.setup();
    let current = { ...smsSafety };
    let calls = 0;
    server.use(
      http.get(endpoint, () => HttpResponse.json(current)),
      http.patch(endpoint, () => {
        calls += 1;
        current = { ...current, suspended: true, manual_suspended: true, version: 1 };
        return HttpResponse.error();
      }),
    );
    render(<SmsSafetyPanel canManage />);
    await user.click(await screen.findByRole('button', { name: 'Suspendre les SMS' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmer' }));
    expect(await screen.findByText('Les envois SMS sont suspendus.')).toBeVisible();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Reprendre les SMS' })).toBeEnabled());
    expect(calls).toBe(1);
  });
});
