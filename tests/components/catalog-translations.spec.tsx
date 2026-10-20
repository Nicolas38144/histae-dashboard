import { http, HttpResponse } from 'msw';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Traits from '../../src/pages/Traits';
import ProfileQuestions from '../../src/pages/ProfileQuestions';
import { translationForm, translationPatch } from '../../src/components/catalog-translations';
import { profileQuestion } from '../fixtures';
import { renderDashboard } from '../helpers/render';
import { server } from '../mocks/server';
const apiUrl = 'http://localhost/api';

describe('catalogue translations', () => {
  it('prepares explicit removals and preserves optional language values', () => {
    expect(translationForm({ fr: 'Français', en: 'English' })).toEqual({ en: 'English', es: '', it: '' });
    expect(translationPatch({ en: ' English ', es: '', it: '   ' })).toEqual({ en: 'English', es: null, it: null });
  });
  it('edits canonical French and removes a translated trait without changing its identifier', async () => {
    const user = userEvent.setup();
    const id = '79904c52-2545-4b43-996c-b50226f9308d';
    let input: unknown;
    server.use(
      http.get(`${apiUrl}/admin/traits`, ({ request }) => {
        expect(request.headers.get('accept-language')).toBe('fr');
        return HttpResponse.json({ traits: [{ id, name: 'Curious', translations: { fr: 'Curieux', en: 'Curious', es: 'Curioso' } }] });
      }),
      http.patch(`${apiUrl}/admin/traits/${id}`, async ({ request }) => {
        input = await request.json();
        return HttpResponse.json({ message: 'Trait updated.' });
      }),
    );
    renderDashboard(<Traits />);
    await user.click(await screen.findByRole('button', { name: 'Renommer Curious' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByLabelText('Nom (français)')).toHaveValue('Curieux');
    await user.clear(dialog.getByLabelText('Anglais'));
    await user.type(dialog.getByLabelText('Italien'), 'Curioso');
    await user.click(dialog.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(input).toEqual({ name: 'Curieux', translations: { en: null, es: 'Curioso', it: 'Curioso' } }));
  });
  it('keeps the French question when editing a translated projection', async () => {
    const user = userEvent.setup();
    let input: unknown;
    server.use(
      http.get(`${apiUrl}/admin/profile-questions`, () => HttpResponse.json({ questions: [{ ...profileQuestion, prompt: 'Your ideal day?', translations: { fr: 'Ta journée idéale ?', en: 'Your ideal day?' } }] })),
      http.patch(`${apiUrl}/admin/profile-questions/${profileQuestion.id}`, async ({ request }) => {
        input = await request.json();
        return HttpResponse.json(profileQuestion);
      }),
    );
    renderDashboard(<ProfileQuestions />);
    await user.click(await screen.findByRole('button', { name: 'Modifier Your ideal day?' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByLabelText('Question (français)')).toHaveValue('Ta journée idéale ?');
    await user.type(dialog.getByLabelText('Espagnol'), '¿Tu día ideal?');
    await user.click(dialog.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(input).toMatchObject({ prompt: 'Ta journée idéale ?', translations: { en: 'Your ideal day?', es: '¿Tu día ideal?', it: null } }));
  });
});
