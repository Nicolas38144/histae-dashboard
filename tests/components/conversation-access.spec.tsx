import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserMatches } from '../../src/components/UserMatches';
import Reports from '../../src/pages/Reports';
import { adminSession, fixtureIds, report } from '../fixtures';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const apiUrl = 'http://localhost/api';
const match = { id: fixtureIds.event, user1_id: fixtureIds.user, user2_id: fixtureIds.secondUser, status: 'confirmed', created_at: '2026-10-30T10:00:00Z', expires_at: '2026-11-30T10:00:00Z' };

it('opens only the conversation linked by the report and sends the administrator’s audit reason', async () => {
  const user = userEvent.setup();
  const reads: Array<string | null> = [];
  const profileReport = { ...report, id: fixtureIds.secondUser };
  server.use(
    http.get(`${apiUrl}/admin/reports`, () => HttpResponse.json({ reports: [{ ...report, match_id: match.id }, profileReport], next_cursor: null })),
    http.get(`${apiUrl}/admin/matches/${match.id}/messages`, ({ request }) => {
      reads.push(new URL(request.url).searchParams.get('reason'));
      return HttpResponse.json({ error: { code: 'match_not_found' } }, { status: 404 });
    }),
  );
  renderDashboard(<Reports />, { session: { ...adminSession, role: 'admin' } });
  const profileOnly = (await screen.findByText('Aucune conversation liée')).closest('tr')!;
  expect(within(profileOnly).queryByRole('button', { name: /Ouvrir la conversation/ })).not.toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /Ouvrir la conversation .+/ }));
  const prompt = screen.getByRole('dialog', { name: 'Justifier l’accès à la conversation' });
  const confirm = within(prompt).getByRole('button', { name: 'Ouvrir la conversation' });
  expect(confirm).toBeDisabled();
  expect(reads).toEqual([]);
  await user.type(within(prompt).getByRole('textbox'), 'Vérification du signalement');
  await user.click(confirm);

  expect(await screen.findByText('Cette conversation signalée n’est plus accessible.')).toBeVisible();
  expect(reads).toEqual(['Vérification du signalement']);
});

it.each([
  ['admin', false],
  ['superadmin', false],
  ['admin', undefined],
  ['superadmin', 'true'],
] as const)('denies conversation access to %s unless the API explicitly authorizes it (%s)', async (role, permission) => {
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

describe.each(['admin', 'superadmin'] as const)('conversation access for %s', (role) => {

  it('clears the reason on cancellation and closes an opened conversation', async () => {
    const user = userEvent.setup();
    const reasons: Array<string | null> = [];
    server.use(
      http.get(`${apiUrl}/matches/${fixtureIds.user}`, () => HttpResponse.json({ matches: [{ ...match, can_view_messages: true }], next_cursor: null })),
      http.get(`${apiUrl}/admin/matches/${match.id}/messages`, ({ request }) => {
        reasons.push(new URL(request.url).searchParams.get('reason'));
        return HttpResponse.json({ messages: [], next_cursor: null });
      }),
    );
    renderDashboard(<UserMatches userId={fixtureIds.user} profileReason="Contrôle du profil" />, { session: { ...adminSession, role } });
    await user.click(await screen.findByRole('button', { name: 'Consulter' }));

    if (role === 'admin') {
      const cancelled = screen.getByRole('dialog');
      await user.type(within(cancelled).getByRole('textbox'), 'Motif abandonné');
      await user.click(within(cancelled).getByRole('button', { name: 'Annuler' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(reasons).toEqual([]);

      await user.click(screen.getByRole('button', { name: 'Consulter' }));
      const reopened = screen.getByRole('dialog');
      expect(within(reopened).getByRole('textbox')).toHaveValue('');
      expect(within(reopened).getByRole('button', { name: 'Ouvrir la conversation' })).toBeDisabled();
      await user.type(within(reopened).getByRole('textbox'), 'Nouveau motif');
      await user.click(within(reopened).getByRole('button', { name: 'Ouvrir la conversation' }));
    }

    expect(await screen.findByText('Aucun message conservé.')).toBeVisible();
    expect(reasons).toEqual([role === 'admin' ? 'Nouveau motif' : null]);
    await user.click(await screen.findByRole('button', { name: 'Fermer' }));
    expect(screen.queryByText('Aucun message conservé.')).not.toBeInTheDocument();
  });
});
