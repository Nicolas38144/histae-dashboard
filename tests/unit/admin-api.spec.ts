import { http, HttpResponse } from 'msw';
import {
  deleteProfileQuestion,
  retryErasure,
  retryOutboxEvent,
  retryPhotoReconciliation,
  reviewModerationCase,
  setUserBanned,
  updateDataRequest,
  updateReport,
} from '../../src/api/admin';
import { fixtureIds, moderationDetail } from '../fixtures';
import { server } from '../mocks/server';

const apiUrl = 'http://localhost/api';

describe('critical administration mutations', () => {
  it('uses the documented methods, paths and minimized bodies', async () => {
    const received: Array<{ method: string; path: string; body: unknown }> = [];
    const capture = (method: string) => async ({ request }: { request: Request }) => {
      received.push({ method, path: new URL(request.url).pathname, body: await request.json().catch(() => null) });
      return new HttpResponse(null, { status: 204 });
    };
    server.use(
      http.patch(`${apiUrl}/admin/users/${fixtureIds.user}/status`, capture('PATCH')),
      http.patch(`${apiUrl}/admin/reports/${fixtureIds.report}`, capture('PATCH')),
      http.delete(`${apiUrl}/admin/profile-questions/${fixtureIds.question}`, capture('DELETE')),
      http.patch(`${apiUrl}/admin/content-moderation/${fixtureIds.moderation}`, capture('PATCH')),
      http.post(`${apiUrl}/admin/photo-reconciliation/${fixtureIds.photo}/retry`, capture('POST')),
      http.post(`${apiUrl}/admin/outbox/${fixtureIds.event}/retry`, capture('POST')),
      http.patch(`${apiUrl}/admin/data-subject-requests/${fixtureIds.request}`, capture('PATCH')),
    );

    await setUserBanned(fixtureIds.user, true, 'Motif de test contrôlé');
    await updateReport(fixtureIds.report, 'reviewed');
    await deleteProfileQuestion(fixtureIds.question);
    await reviewModerationCase(moderationDetail, 'approved', 'Décision de test');
    await retryPhotoReconciliation(fixtureIds.photo, 'Stockage rétabli');
    await retryOutboxEvent(fixtureIds.event, '  Dépendance rétablie  ');
    await retryErasure(fixtureIds.event, 'Reprise contrôlée');
    await updateDataRequest(fixtureIds.request, 'rejected', 'Demande non recevable');

    expect(received).toEqual([
      { method: 'PATCH', path: `/api/admin/users/${fixtureIds.user}/status`, body: { is_banned: true, reason: 'Motif de test contrôlé' } },
      { method: 'PATCH', path: `/api/admin/reports/${fixtureIds.report}`, body: { status: 'reviewed' } },
      { method: 'DELETE', path: `/api/admin/profile-questions/${fixtureIds.question}`, body: null },
      { method: 'PATCH', path: `/api/admin/content-moderation/${fixtureIds.moderation}`, body: { version: 3, decision: 'approved', reason: 'Décision de test' } },
      { method: 'POST', path: `/api/admin/photo-reconciliation/${fixtureIds.photo}/retry`, body: { reason: 'Stockage rétabli' } },
      { method: 'POST', path: `/api/admin/outbox/${fixtureIds.event}/retry`, body: { reason: 'Dépendance rétablie' } },
      { method: 'POST', path: `/api/admin/outbox/${fixtureIds.event}/retry`, body: { reason: 'Reprise contrôlée' } },
      { method: 'PATCH', path: `/api/admin/data-subject-requests/${fixtureIds.request}`, body: { status: 'rejected', notes: 'Demande non recevable' } },
    ]);
  });

  it('preserves optimistic moderation version and explicit photo checks', async () => {
    let body: unknown;
    server.use(http.patch(`${apiUrl}/admin/content-moderation/${fixtureIds.moderation}`, async ({ request }) => {
      body = await request.json();
      return new HttpResponse(null, { status: 204 });
    }));

    await reviewModerationCase(
      { ...moderationDetail, content_type: 'photo' },
      'rejected',
      'Photo non conforme',
      { face_detectable: false, sharp_enough: true, content_allowed: true },
    );

    expect(body).toEqual({
      version: 3,
      decision: 'rejected',
      reason: 'Photo non conforme',
      photo_checks: { face_detectable: false, sharp_enough: true, content_allowed: true },
    });
  });
});
