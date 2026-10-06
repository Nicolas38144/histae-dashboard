import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AuditLogs from '../../src/pages/AuditLogs';
import { adminUser, fixtureIds } from '../fixtures';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const apiUrl = 'http://localhost/api';

describe('access journal administrator directory', () => {
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
});
