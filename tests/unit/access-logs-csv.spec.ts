import { accessLogsCsv } from '../../src/utils/accessLogsCsv';
import type { DataAccessLog } from '../../src/api/types';
import { fixtureIds } from '../fixtures';

describe('access journal CSV', () => {
  it('quotes multiline text and prevents spreadsheet formulas', () => {
    const log: DataAccessLog = {
      id: fixtureIds.event,
      accessed_at: '2026-10-06T08:00:00.000Z',
      accessed_user_id: fixtureIds.user,
      accessor_id: fixtureIds.admin,
      accessor_role: 'superadmin',
      action: 'user_detail',
      reason: '  =HYPERLINK("https://example.test", "click")\nVérification',
    };

    const csv = accessLogsCsv([log]);
    expect(csv.startsWith('\uFEFFid,accessed_at,accessed_user_id,accessor_id,accessor_role,action,reason\r\n')).toBe(true);
    expect(csv).toContain('"\'  =HYPERLINK(""https://example.test"", ""click"")\nVérification"');
    expect(csv.endsWith('\r\n')).toBe(true);
  });
});
