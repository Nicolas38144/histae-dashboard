import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserLink } from '../../src/components/UserLink';
import UserDetails from '../../src/pages/UserDetails';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const firstId = '90000000-0000-4000-8000-000000000001';
const secondId = '90000000-0000-4000-8000-000000000002';
const unnamedId = '90000000-0000-4000-8000-000000000003';
const unavailableId = '90000000-0000-4000-8000-000000000004';

describe('user identity links', () => {
  it('batches name lookups, preserves links for unnamed users and hides links to missing accounts', async () => {
    const user = userEvent.setup();
    const batches: string[][] = [];
    server.use(http.get('http://localhost/api/admin/user-names', ({ request }) => {
      const ids = new URL(request.url).searchParams.get('ids')?.split(',') ?? [];
      batches.push(ids);
      return HttpResponse.json({ users: [
        { user_id: firstId, firstname: 'Alice' },
        { user_id: secondId, firstname: 'Bob' },
        { user_id: unnamedId, firstname: null },
      ] });
    }));
    renderDashboard(<><UserLink id={firstId} /><UserLink id={secondId} /><UserLink id={unnamedId} /><UserLink id={unavailableId} /></>);

    const alice = await screen.findByRole('link', { name: 'Alice' });
    expect(await screen.findByRole('link', { name: 'Bob' })).toBeVisible();
    expect(await screen.findByRole('link', { name: 'Prénom non renseigné' })).toHaveAttribute('href', `/users/${unnamedId}`);
    expect(screen.getByText('Compte supprimé ou introuvable').closest('a')).toBeNull();
    expect(batches).toEqual([[firstId, secondId, unnamedId, unavailableId]]);
    await user.hover(alice);
    await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent(firstId));
  });

  it('shows an unavailable account message from a profile URL without a retry button', async () => {
    server.use(http.get(`http://localhost/api/admin/users/${unavailableId}`, () => HttpResponse.json({
      error: { code: 'account_not_found' },
    }, { status: 404 })));
    renderDashboard(<UserDetails />, { route: `/users/${unavailableId}`, routePath: '/users/:id' });

    expect(await screen.findByRole('alert')).toHaveTextContent('Compte supprimé ou introuvable');
    expect(screen.queryByRole('button', { name: 'Réessayer' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Retour aux demandes RGPD' })).toHaveAttribute('href', '/privacy-requests');
  });
});
