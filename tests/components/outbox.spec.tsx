import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OutboxDeadLetters from '../../src/pages/OutboxDeadLetters';
import { adminSession } from '../fixtures';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const apiUrl = 'http://localhost/api';
const createdAt = '2026-09-06T08:00:00.000Z';

describe('dead-letter operations', () => {
  it('only offers discard for eligible event types and sends an audited reason', async () => {
    const user = userEvent.setup();
    let submitted: unknown;
    const events = ['billing.subscription.reconcile', 'account.erase', 'notification.push', 'photo.delete'].map((event_type, index) => ({
      event_id: `80000000-0000-4000-8000-00000000000${index + 1}`,
      event_type,
      attempts: 10,
      last_error_code: 'delivery_failed',
      created_at: createdAt,
      dead_lettered_at: createdAt,
    }));
    server.use(
      http.get(`${apiUrl}/admin/outbox/dead-letters`, () => HttpResponse.json({ events, next_cursor: null })),
      http.post(`${apiUrl}/admin/outbox/${events[2].event_id}/discard`, async ({ request }) => {
        submitted = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderDashboard(<OutboxDeadLetters />, { session: { ...adminSession, role: 'admin' } });

    const discardButtons = await screen.findAllByRole('button', { name: 'Abandonner' });
    expect(discardButtons).toHaveLength(2);
    await user.click(discardButtons[0]);
    const dialog = screen.getByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Abandonner' });
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText('Motif opérationnel (3 à 500 caractères)'), 'ab');
    expect(confirm).toBeDisabled();
    await user.type(within(dialog).getByLabelText('Motif opérationnel (3 à 500 caractères)'), 'andon contrôlé');
    await user.click(confirm);

    await waitFor(() => expect(submitted).toEqual({ reason: 'abandon contrôlé' }));
    expect(await screen.findByText('L’événement a été abandonné.')).toBeVisible();
  });
});
