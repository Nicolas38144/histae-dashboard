import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserDetails from '../../src/pages/UserDetails';
import { ComplimentaryPremiumPanel } from '../../src/features/users/complimentary-premium-panel';
import { adminSession, adminUser, fixtureIds } from '../fixtures';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const apiUrl = 'http://localhost/api';
const endpoint = `${apiUrl}/admin/users/${fixtureIds.user}/complimentary-premium`;

describe('complimentary Premium', () => {
  it('lets the superadmin grant and revoke a gift from the user file without a reason', async () => {
    const user = userEvent.setup();
    let enabled = false;
    const changes: unknown[] = [];
    server.use(
      http.get(`${apiUrl}/admin/users/${fixtureIds.user}`, () => HttpResponse.json({
        ...adminUser,
        complimentary_premium: enabled,
        plan: enabled ? 'premium' : 'free',
        continuation_quota: { ...adminUser.continuation_quota, plan: enabled ? 'premium' : 'free' },
      })),
      http.get(`${apiUrl}/matches/${fixtureIds.user}`, () => HttpResponse.json({ matches: [], next_cursor: null })),
      http.patch(endpoint, async ({ request }) => {
        const body = await request.json() as { enabled: boolean };
        changes.push(body);
        enabled = body.enabled;
        return HttpResponse.json({ message: 'updated' });
      }),
    );
    renderDashboard(<UserDetails />, { route: `/users/${fixtureIds.user}`, routePath: '/users/:id' });
    await user.click(await screen.findByRole('button', { name: 'Offrir Premium' }));
    const grant = screen.getByRole('dialog', { name: 'Offrir Premium à ce compte ?' });
    expect(within(grant).queryByRole('textbox')).not.toBeInTheDocument();
    await user.click(within(grant).getByRole('button', { name: 'Offrir Premium' }));
    await user.click(await screen.findByRole('button', { name: 'Retirer l’offre' }));
    const revoke = screen.getByRole('dialog', { name: 'Retirer le Premium offert ?' });
    expect(within(revoke).getByText(/Un abonnement payant actif restera valable/)).toBeVisible();
    await user.click(within(revoke).getByRole('button', { name: 'Retirer l’offre' }));
    await waitFor(() => expect(changes).toEqual([{ enabled: true }, { enabled: false }]));
    expect(await screen.findByRole('button', { name: 'Offrir Premium' })).toBeVisible();
  });

  it('hides gift mutations from an ordinary administrator', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`${apiUrl}/admin/users/${fixtureIds.user}`, () => HttpResponse.json(adminUser)),
      http.get(`${apiUrl}/matches/${fixtureIds.user}`, () => HttpResponse.json({ matches: [], next_cursor: null })),
    );
    renderDashboard(<UserDetails />, {
      route: `/users/${fixtureIds.user}`, routePath: '/users/:id', session: { ...adminSession, role: 'admin' },
    });
    await user.type(screen.getByLabelText('Motif d’accès (3 à 500 caractères)'), 'Consultation du compte utilisateur');
    await user.click(screen.getByRole('button', { name: 'Consulter le dossier' }));
    expect(await screen.findByText('Premium offert par Histae')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Offrir Premium' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retirer l’offre' })).not.toBeInTheDocument();
  });

  it('keeps automatic review access read-only', () => {
    renderDashboard(<ComplimentaryPremiumPanel user={{ ...adminUser, is_review_account: true }} canManage onUpdated={vi.fn()} />);
    expect(screen.getByText('Premium de revue (automatique)')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Offrir Premium' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retirer l’offre' })).not.toBeInTheDocument();
  });

  it('blocks a new gift to a banned account while allowing removal of an existing gift', () => {
    const panel = renderDashboard(<ComplimentaryPremiumPanel user={{ ...adminUser, is_banned: true }} canManage onUpdated={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Offrir Premium' })).toBeDisabled();
    panel.unmount();
    renderDashboard(<ComplimentaryPremiumPanel user={{ ...adminUser, is_banned: true, complimentary_premium: true }} canManage onUpdated={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Retirer l’offre' })).toBeEnabled();
  });

  it('keeps the current gift state and surfaces a failed mutation', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    server.use(http.patch(endpoint, () => HttpResponse.json({ error: { code: 'admin_action_forbidden' } }, { status: 403 })));
    renderDashboard(<ComplimentaryPremiumPanel user={adminUser} canManage onUpdated={reload} />);
    await user.click(screen.getByRole('button', { name: 'Offrir Premium' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Offrir Premium' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('admin_action_forbidden');
    expect(reload).not.toHaveBeenCalled();
    expect(within(dialog).getByRole('button', { name: 'Offrir Premium' })).toBeEnabled();
  });
});
