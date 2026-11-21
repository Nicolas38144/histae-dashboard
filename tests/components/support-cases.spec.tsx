import { http, HttpResponse } from 'msw';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SupportCases from '../../src/pages/SupportCases';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const url = 'http://localhost/api/admin/support-cases';

it('rejects duplicate support submissions and preserves the reply for explicit retry', async () => {
  const user = userEvent.setup();
  let entry = {
    id: 'support-fixture', user_id: null, category: 'login', status: 'pending',
    body: 'Ma demande de test.', response: null as string | null, created_at: '2026-11-21T10:00:00Z',
  };
  const writes: unknown[] = [];
  let finishFirst!: () => void;
  const firstResponse = new Promise<void>((resolve) => { finishFirst = resolve; });
  server.use(
    http.get(url, () => HttpResponse.json({ cases: [entry], next_cursor: null })),
    http.patch(`${url}/${entry.id}`, async ({ request }) => {
      const body = await request.json() as { status: string; response: string };
      writes.push(body);
      if (writes.length === 1) {
        await firstResponse;
        return HttpResponse.json({ error: { code: 'unavailable' } }, { status: 503 });
      }
      entry = { ...entry, ...body };
      return new HttpResponse(null, { status: 204 });
    }),
  );
  renderDashboard(<SupportCases />);
  await user.click(await screen.findByRole('button', { name: 'Envoyer la réponse' }));
  const dialog = within(await screen.findByRole('dialog'));
  const submit = dialog.getByRole('button', { name: 'Envoyer la réponse' });
  const reply = dialog.getByRole('textbox', { name: /Réponse à l’utilisateur/ });
  expect(submit).toBeDisabled();
  await user.type(reply, ' Nous avons examiné votre demande. ');
  act(() => {
    fireEvent.click(submit);
    fireEvent.click(submit);
  });
  expect(submit).toBeDisabled();
  finishFirst();
  expect(await screen.findByText('La requête a échoué (unavailable).')).toBeVisible();
  expect(writes).toEqual([{ status: 'closed', response: 'Nous avons examiné votre demande.' }]);
  expect(reply).toHaveValue(' Nous avons examiné votre demande. ');
  await user.click(submit);
  expect(await screen.findByText(/Nous avons examiné votre demande\./)).toBeVisible();
  expect(writes).toEqual([
    { status: 'closed', response: 'Nous avons examiné votre demande.' },
    { status: 'closed', response: 'Nous avons examiné votre demande.' },
  ]);
  expect(screen.queryByRole('button', { name: 'Envoyer la réponse' })).not.toBeInTheDocument();
});
