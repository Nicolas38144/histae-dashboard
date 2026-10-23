import { http, HttpResponse } from 'msw';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditLogs from '../../src/pages/AuditLogs';
import { adminUser, fixtureIds } from '../fixtures';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';
import * as admin from '../../src/api/admin';
import type { DataAccessLog } from '../../src/api/types';
import { ACCESS_LOG_EXPORT_TIMEOUT_MS } from '../../src/utils/accessLogsExport';
import { notifyAdminSessionExpired } from '../../src/auth/session';

const apiUrl = 'http://localhost/api';
const csvDownload = vi.hoisted(() => vi.fn());

vi.mock('../../src/utils/accessLogsCsv', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../src/utils/accessLogsCsv')>(),
  downloadAccessLogsCsv: csvDownload,
}));

describe('access journal administrator directory', () => {
  function directory() {
    server.use(http.get(`${apiUrl}/admin/users`, ({ request }) => HttpResponse.json({
      users: new URL(request.url).searchParams.get('role') === 'superadmin'
        ? [{ ...adminUser, user_id: fixtureIds.admin, firstname: 'Alex', role: 'superadmin' }] : [],
      next_cursor: null,
    })));
  }

  it('does not download a CSV if the screen is closed during an export', async () => {
    directory();
    const user = userEvent.setup();
    let resolve!: (page: { logs: DataAccessLog[]; next_cursor: null }) => void;
    const read = vi.spyOn(admin, 'getAccessLogs').mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const { unmount } = renderDashboard(<AuditLogs />);
    await user.click(await screen.findByRole('button', { name: 'Exporter le journal de Alex en CSV' }));
    const signal = read.mock.calls[0][2];
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => resolve({ logs: [], next_cursor: null }));
    expect(csvDownload).not.toHaveBeenCalled();
  });

  it('cancels immediately if the session expires in the same batch as the last page', async () => {
    directory();
    const user = userEvent.setup();
    let resolve!: (page: { logs: DataAccessLog[]; next_cursor: null }) => void;
    vi.spyOn(admin, 'getAccessLogs').mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    renderDashboard(<AuditLogs />);
    await user.click(await screen.findByRole('button', { name: 'Exporter le journal de Alex en CSV' }));
    await act(async () => {
      notifyAdminSessionExpired();
      resolve({ logs: [], next_cursor: null });
    });
    expect(csvDownload).not.toHaveBeenCalled();
  });

  it('cancels an export at the deadline without producing a partial file', async () => {
    directory();
    const { unmount } = renderDashboard(<AuditLogs />);
    const button = await screen.findByRole('button', { name: 'Exporter le journal de Alex en CSV' });
    vi.spyOn(admin, 'getAccessLogs').mockImplementation((_id, _cursor, signal) => new Promise((_resolve, reject) => {
      signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
    }));
    vi.useFakeTimers();
    try {
      fireEvent.click(button);
      await act(() => vi.advanceTimersByTimeAsync(ACCESS_LOG_EXPORT_TIMEOUT_MS));
    } finally {
      vi.useRealTimers();
    }
    expect(await screen.findByText('Export annulé après 60 secondes. Aucun fichier n’a été téléchargé.')).toBeVisible();
    expect(csvDownload).not.toHaveBeenCalled();
    unmount();
  });

  it('lists admin and superadmin accounts while keeping the UUID search above them', async () => {
    const user = userEvent.setup();
    const roles: string[] = [];
    let searchedUserId: string | null = null;
    server.use(
      http.get(`${apiUrl}/admin/users`, ({ request }) => {
        const role = new URL(request.url).searchParams.get('role') ?? '';
        roles.push(role);
        const account = { ...adminUser, user_id: role === 'superadmin' ? fixtureIds.admin : fixtureIds.secondUser, firstname: role === 'superadmin' ? 'Alex' : 'Sam', role };
        return HttpResponse.json({ users: [account], next_cursor: null });
      }),
      http.get(`${apiUrl}/admin/data-access-logs`, ({ request }) => {
        searchedUserId = new URL(request.url).searchParams.get('user_id');
        return HttpResponse.json({ logs: [], next_cursor: null });
      }),
    );
    renderDashboard(<AuditLogs />);

    expect(await screen.findByText('Alex')).toBeVisible();
    expect(await screen.findByText('Sam')).toBeVisible();
    expect(roles.sort()).toEqual(['admin', 'superadmin']);
    expect(searchedUserId).toBeNull();
    expect(screen.getByRole('button', { name: 'Voir le journal de Alex' }).querySelector('[data-testid="VisibilityOffOutlinedIcon"]')).toBeInTheDocument();
    await user.type(screen.getByLabelText('UUID de l’utilisateur concerné'), fixtureIds.user);
    await user.click(screen.getByRole('button', { name: 'Rechercher' }));
    await waitFor(() => expect(searchedUserId).toBe(fixtureIds.user));

    await user.click(screen.getByRole('button', { name: 'Voir le journal de Alex' }));
    await waitFor(() => expect(searchedUserId).toBe(fixtureIds.admin));
    expect(screen.getByLabelText('UUID de l’utilisateur concerné')).toHaveValue(fixtureIds.admin);
    const close = screen.getByRole('button', { name: 'Fermer le journal de Alex' });
    expect(close.querySelector('[data-testid="VisibilityOutlinedIcon"]')).toBeInTheDocument();
    expect(await screen.findByText('Aucune entrée pour cet utilisateur.')).toBeVisible();

    await user.click(close);
    expect(screen.getByRole('button', { name: 'Voir le journal de Alex' }).querySelector('[data-testid="VisibilityOffOutlinedIcon"]')).toBeInTheDocument();
    expect(screen.queryByText('Aucune entrée pour cet utilisateur.')).not.toBeInTheDocument();
  });

  it('exports every page of an administrator journal without opening it', async () => {
    const user = userEvent.setup();
    const firstLog = {
      id: 'a0000000-0000-4000-8000-000000000001',
      accessed_user_id: fixtureIds.admin,
      accessor_id: fixtureIds.secondUser,
      accessor_role: 'admin',
      action: 'user_detail',
      reason: 'Vérification',
      accessed_at: '2026-10-06T08:00:00.000Z',
    };
    const secondLog = { ...firstLog, id: 'a0000000-0000-4000-8000-000000000002' };
    const cursors: Array<string | null> = [];
    server.use(
      http.get(`${apiUrl}/admin/users`, ({ request }) => HttpResponse.json({
        users: new URL(request.url).searchParams.get('role') === 'superadmin'
          ? [{ ...adminUser, user_id: fixtureIds.admin, firstname: 'Alex', role: 'superadmin' }]
          : [],
        next_cursor: null,
      })),
      http.get(`${apiUrl}/admin/data-access-logs`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('user_id')).toBe(fixtureIds.admin);
        expect(url.searchParams.get('limit')).toBe('100');
        const cursor = url.searchParams.get('cursor');
        cursors.push(cursor);
        return HttpResponse.json(cursor
          ? { logs: [secondLog], next_cursor: null }
          : { logs: [firstLog], next_cursor: 'page-2' });
      }),
    );
    renderDashboard(<AuditLogs />);

    await user.click(await screen.findByRole('button', { name: 'Exporter le journal de Alex en CSV' }));
    await waitFor(() => expect(csvDownload).toHaveBeenCalledWith(fixtureIds.admin, [firstLog, secondLog]));
    expect(cursors).toEqual([null, 'page-2']);
    expect(screen.getByRole('button', { name: 'Voir le journal de Alex' })).toBeVisible();
  });
});
