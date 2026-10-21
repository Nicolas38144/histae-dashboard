import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { smsSafety } from '../fixtures';

export const server = setupServer(
  http.get('http://localhost/api/admin/sms-safety', () => HttpResponse.json(smsSafety)),
  http.get('http://localhost/api/admin/user-names', () => HttpResponse.json({ users: [] })),
);
