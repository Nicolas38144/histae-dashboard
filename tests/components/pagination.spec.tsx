import { http, HttpResponse } from 'msw';
import { screen, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ChatMessage, Match } from '../../src/api/types';
import UserDetails from '../../src/pages/UserDetails';
import { compactId } from '../../src/utils/format';
import { adminUser, fixtureIds } from '../fixtures';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const apiUrl = 'http://localhost/api';
const olderParticipant = '20000000-0000-4000-8000-000000000003';

const recentMatch: Match = {
  id: 'a0000000-0000-4000-8000-000000000001',
  user1_id: fixtureIds.user,
  user2_id: fixtureIds.secondUser,
  status: 'confirmed',
  expires_at: '2026-09-10T08:00:00.000Z',
  created_at: '2026-09-06T08:00:00.000Z',
  last_message_at: '2026-09-06T08:03:00.000Z',
};

const olderMatch: Match = {
  ...recentMatch,
  id: 'b0000000-0000-4000-8000-000000000002',
  user2_id: olderParticipant,
  created_at: '2026-09-05T08:00:00.000Z',
  last_message_at: '2026-09-05T08:00:00.000Z',
};

const recentMessage: ChatMessage = {
  id: 'c0000000-0000-4000-8000-000000000003',
  match_id: recentMatch.id,
  sender_id: fixtureIds.secondUser,
  content: 'Message récent fictif',
  created_at: '2026-09-06T08:03:00.000Z',
};

const middleMessage: ChatMessage = {
  ...recentMessage,
  id: 'c0000000-0000-4000-8000-000000000002',
  sender_id: fixtureIds.user,
  content: 'Message intermédiaire fictif',
  created_at: '2026-09-06T08:02:00.000Z',
};

const oldestMessage: ChatMessage = {
  ...recentMessage,
  id: 'c0000000-0000-4000-8000-000000000001',
  content: 'Message ancien fictif',
  created_at: '2026-09-06T08:01:00.000Z',
};

describe('administrative match and message pagination', () => {
  it('loads every match and prepends older messages in chronological order without duplicates', async () => {
    const user = userEvent.setup();
    const matchCursors: Array<string | null> = [];
    const messageQueries: Array<{ cursor: string | null; reason: string | null }> = [];
    server.use(
      http.get(`${apiUrl}/admin/users/${fixtureIds.user}`, () => HttpResponse.json({
        ...adminUser,
        matches_count: 2,
      })),
      http.get(`${apiUrl}/matches/${fixtureIds.user}`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        matchCursors.push(cursor);
        return cursor
          ? HttpResponse.json({ matches: [recentMatch, olderMatch], next_cursor: null })
          : HttpResponse.json({ matches: [recentMatch], next_cursor: 'match-page-2' });
      }),
      http.get(`${apiUrl}/admin/matches/${recentMatch.id}/messages`, ({ request }) => {
        const url = new URL(request.url);
        const cursor = url.searchParams.get('cursor');
        messageQueries.push({ cursor, reason: url.searchParams.get('reason') });
        return cursor
          ? HttpResponse.json({ messages: [middleMessage, oldestMessage], next_cursor: null })
          : HttpResponse.json({ messages: [recentMessage, middleMessage], next_cursor: 'message-page-2' });
      }),
    );
    renderDashboard(<UserDetails />, { route: `/users/${fixtureIds.user}`, routePath: '/users/:id' });

    expect(await screen.findByText(compactId(recentMatch.id))).toBeVisible();
    expect(screen.queryByText(compactId(olderMatch.id))).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Charger la suite' }));
    expect(await screen.findByText(compactId(olderMatch.id))).toBeVisible();
    expect(screen.getAllByText(compactId(recentMatch.id))).toHaveLength(1);
    expect(matchCursors).toEqual([null, 'match-page-2']);

    const recentRow = screen.getByText(compactId(recentMatch.id)).closest('tr')!;
    await user.click(within(recentRow).getByRole('button', { name: 'Consulter' }));
    const accessDialog = await screen.findByRole('dialog', { name: 'Justifier l’accès à la conversation' });
    await user.type(within(accessDialog).getByLabelText('Motif obligatoire'), 'Contrôle de pagination fictif');
    await user.click(within(accessDialog).getByRole('button', { name: 'Ouvrir la conversation' }));

    await screen.findByText(recentMessage.content);
    await waitForElementToBeRemoved(accessDialog);
    expectDocumentOrder([middleMessage.content, recentMessage.content]);
    await user.click(screen.getByRole('button', { name: 'Charger les messages précédents' }));
    await screen.findByText(oldestMessage.content);
    expectDocumentOrder([oldestMessage.content, middleMessage.content, recentMessage.content]);
    expect(screen.getAllByText(middleMessage.content)).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Charger les messages précédents' })).not.toBeInTheDocument();
    await waitFor(() => expect(messageQueries).toEqual([
      { cursor: null, reason: 'Contrôle de pagination fictif' },
      { cursor: 'message-page-2', reason: 'Contrôle de pagination fictif' },
    ]));
  });
});

function expectDocumentOrder(labels: string[]): void {
  const elements = labels.map((label) => screen.getByText(label));
  for (let index = 0; index < elements.length - 1; index += 1) {
    const position = elements[index].compareDocumentPosition(elements[index + 1]);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
  }
}
