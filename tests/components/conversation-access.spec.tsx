import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserMatches } from '../../src/components/UserMatches';
import { adminSession, fixtureIds } from '../fixtures';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const apiUrl = 'http://localhost/api';
const match = { id: fixtureIds.event, user1_id: fixtureIds.user, user2_id: fixtureIds.secondUser, status: 'confirmed', created_at: '2026-10-30T10:00:00Z', expires_at: '2026-11-30T10:00:00Z' };

describe.each(['admin', 'superadmin'] as const)('conversation access for %s', (role) => {
  it.each([false, undefined, 'true'])('does not request messages unless the API explicitly authorizes access (%s)', async (permission) => {
    let reads = 0;
    server.use(
      http.get(`${apiUrl}/matches/${fixtureIds.user}`, () => HttpResponse.json({ matches: [{ ...match, can_view_messages: permission }], next_cursor: null })),
      http.get(`${apiUrl}/admin/matches/${match.id}/messages`, () => { reads += 1; return HttpResponse.json({ messages: [], next_cursor: null }); }),
    );
    renderDashboard(<UserMatches userId={fixtureIds.user} profileReason="Contrôle du profil" />, { session: { ...adminSession, role } });
    expect(await screen.findByRole('button', { name: 'Consulter' })).toBeDisabled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(reads).toBe(0);
  });

  it('opens a reported conversation with the existing audit reason rules', async () => {
    const user = userEvent.setup();
    let reason: string | null | undefined;
    server.use(
      http.get(`${apiUrl}/matches/${fixtureIds.user}`, () => HttpResponse.json({ matches: [{ ...match, can_view_messages: true }], next_cursor: null })),
      http.get(`${apiUrl}/admin/matches/${match.id}/messages`, ({ request }) => {
        reason = new URL(request.url).searchParams.get('reason');
        return HttpResponse.json({ messages: [], next_cursor: null });
      }),
    );
    renderDashboard(<UserMatches userId={fixtureIds.user} profileReason="Contrôle du profil" />, { session: { ...adminSession, role } });
    await user.click(await screen.findByRole('button', { name: 'Consulter' }));
    if (role === 'admin') {
      const dialog = await screen.findByRole('dialog');
      expect(reason).toBeUndefined();
      await user.type(within(dialog).getByRole('textbox'), 'Examen du signalement');
      await user.click(within(dialog).getByRole('button', { name: 'Ouvrir la conversation' }));
    }
    await waitFor(() => expect(reason).toBe(role === 'admin' ? 'Examen du signalement' : null));
  });
});
