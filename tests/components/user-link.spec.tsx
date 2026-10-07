import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserLink } from '../../src/components/UserLink';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';

const firstId = '90000000-0000-4000-8000-000000000001';
const secondId = '90000000-0000-4000-8000-000000000002';

describe('user identity links', () => {
  it('resolves first names in one request and reveals the UUID on hover', async () => {
    const user = userEvent.setup();
    const batches: string[][] = [];
    server.use(http.get('http://localhost/api/admin/user-names', ({ request }) => {
      const ids = new URL(request.url).searchParams.get('ids')?.split(',') ?? [];
      batches.push(ids);
      return HttpResponse.json({ users: ids.map((user_id, index) => ({ user_id, firstname: index === 0 ? 'Alice' : 'Bob' })) });
    }));
    renderDashboard(<><UserLink id={firstId} /><UserLink id={secondId} /></>);

    const alice = await screen.findByRole('link', { name: 'Alice' });
    expect(await screen.findByRole('link', { name: 'Bob' })).toBeVisible();
    expect(batches).toEqual([[firstId, secondId]]);
    await user.hover(alice);
    await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent(firstId));
  });
});
