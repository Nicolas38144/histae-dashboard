import { http, HttpResponse } from 'msw';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneBlocklistPanel } from '../../src/components/PhoneBlocklistPanel';
import { server } from '../mocks/server';

const syntheticPhone = ['+33', '6', '0'.repeat(8)].join('');
const path = 'http://localhost/api/admin/sms-safety/phone-blocklist';
const entry = { id: '90000000-0000-4000-8000-000000000001', phone_hint: '+33……0000', decision: 'automatic', decision_until: null, version: 3, blocked: true, observations: [] };
describe('public phone number policies', () => {
  it('uses the same page size for list requests and navigation', async () => {
    const user = userEvent.setup();
    const pages: Array<{ limit: string | null; offset: string | null }> = [];
    server.use(http.get(path, ({ request }) => {
      const params = new URL(request.url).searchParams;
      pages.push({ limit: params.get('limit'), offset: params.get('offset') });
      return HttpResponse.json({ entries: [], total: 26, ready: true, sources: [] });
    }));
    render(<PhoneBlocklistPanel isSuperadmin />);
    await user.click(await screen.findByRole('button', { name: 'Suivant' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled());
    await user.click(screen.getByRole('button', { name: 'Précédent' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Précédent' })).toBeDisabled());
    expect(pages).toEqual([{ limit: '25', offset: '0' }, { limit: '25', offset: '25' }, { limit: '25', offset: '0' }]);
  });

  it('requires an administrator reason and submits one versioned temporary exception', async () => {
    const user = userEvent.setup(); let current = { ...entry }; let body: unknown; let calls = 0;
    server.use(
      http.get(path, () => HttpResponse.json({ entries: [current], total: 1, ready: true, sources: [] })),
      http.patch(path, async ({ request }) => { body = await request.json(); calls += 1; current = { ...current, blocked: false, version: 4 }; return new HttpResponse(null, { status: 204 }); }),
    );
    render(<PhoneBlocklistPanel isSuperadmin={false} />);
    await user.click(await screen.findByRole('button', { name: 'Examiner' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByRole('button', { name: 'Confirmer' })).toBeDisabled();
    await user.type(dialog.getByLabelText(/Justification/), 'Numéro réattribué et réexaminé');
    await user.click(dialog.getByRole('button', { name: 'Confirmer' }));
    await waitFor(() => expect(calls).toBe(1));
    expect(body).toEqual({ entry_id: entry.id, decision: 'allow', version: 3, valid_days: 30, reason: 'Numéro réattribué et réexaminé' });
    expect(await screen.findByText('Non bloqué')).toBeVisible();
  });
  it('does not request a superadmin reason and resolves an uncertain write by reading', async () => {
    const user = userEvent.setup(); let current = { ...entry }; let body: unknown; let calls = 0;
    server.use(
      http.get(path, () => HttpResponse.json({ entries: [current], total: 1, ready: true, sources: [] })),
      http.patch(path, async ({ request }) => { body = await request.json(); calls += 1; current = { ...current, blocked: false, version: 4 }; return HttpResponse.error(); }),
    );
    render(<PhoneBlocklistPanel isSuperadmin />);
    await user.click(await screen.findByRole('button', { name: 'Examiner' }));
    expect(screen.queryByLabelText(/Justification/)).not.toBeInTheDocument();
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmer' }));
    expect(await screen.findByText('Non bloqué')).toBeVisible();
    expect(calls).toBe(1);
    expect(body).toEqual({ entry_id: entry.id, decision: 'allow', version: 3, valid_days: 30 });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('looks up a phone in the request body and can add a temporary manual block', async () => {
    const user = userEvent.setup(); let lookup: unknown; let body: unknown;
    server.use(
      http.post(`${path}/lookup`, async ({ request }) => { lookup = await request.json(); expect(new URL(request.url).search).toBe(''); return HttpResponse.json({ ...entry, id: null, blocked: false, version: 0 }); }),
      http.patch(path, async ({ request }) => { body = await request.json(); return new HttpResponse(null, { status: 204 }); }),
    );
    render(<PhoneBlocklistPanel isSuperadmin />);
    await user.type(await screen.findByLabelText('Numéro de téléphone'), syntheticPhone);
    expect(screen.queryByRole('button', { name: 'Rechercher un numéro' })).not.toBeInTheDocument();
    await waitFor(() => expect(lookup).toEqual({ phone_number: syntheticPhone }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Examiner' }));
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Confirmer' }));
    await waitFor(() => expect(body).toBeDefined());
    expect(lookup).toEqual({ phone_number: syntheticPhone });
    expect(body).toEqual({ phone_number: syntheticPhone, decision: 'block', version: 0, valid_days: 30 });
  });

  it('filters the table while typing and restores the list when cleared', async () => {
    const user = userEvent.setup();
    let lookups = 0;
    server.use(
      http.get(path, () => HttpResponse.json({ entries: [entry, { ...entry, id: 'second-entry', phone_hint: '+33……1111' }], total: 2, ready: true, sources: [] })),
      http.post(`${path}/lookup`, () => { lookups += 1; return HttpResponse.json(entry); }),
    );
    render(<PhoneBlocklistPanel isSuperadmin />);
    expect(await screen.findAllByRole('button', { name: 'Examiner' })).toHaveLength(2);
    const input = screen.getByLabelText('Numéro de téléphone');
    await user.type(input, syntheticPhone);
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Examiner' })).toHaveLength(1));
    expect(lookups).toBe(1);
    expect(screen.queryByText('+33……1111')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Suivant' })).not.toBeInTheDocument();
    await user.clear(input);
    expect(screen.getAllByRole('button', { name: 'Examiner' })).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled();
  });
});
