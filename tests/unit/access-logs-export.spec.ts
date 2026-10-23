import * as admin from '../../src/api/admin';
import type { DataAccessLog } from '../../src/api/types';
import { accessLogCsvRow, accessLogsCsvHeader } from '../../src/utils/accessLogsCsv';
import { ACCESS_LOG_EXPORT_MAX_BYTES, ACCESS_LOG_EXPORT_MAX_PAGES, ACCESS_LOG_EXPORT_MAX_ROWS, collectAccessLogsForExport } from '../../src/utils/accessLogsExport';
import { fixtureIds } from '../fixtures';

const log: DataAccessLog = {
  id: fixtureIds.event, accessed_user_id: fixtureIds.user, accessor_id: fixtureIds.admin,
  accessor_role: 'admin', action: 'user_detail', reason: 'Contrôle', accessed_at: '2026-10-23T10:00:00Z',
};
const collect = (signal = new AbortController().signal) => collectAccessLogsForExport(fixtureIds.user, signal);

describe('bounded access log export', () => {
  it('allows exactly the row limit, but refuses another page without collecting it', async () => {
    const read = vi.spyOn(admin, 'getAccessLogs').mockResolvedValue({ logs: Array.from({ length: 100 }, () => log), next_cursor: null });
    for (let page = 1; page < ACCESS_LOG_EXPORT_MAX_ROWS / 100; page += 1) {
      read.mockResolvedValueOnce({ logs: Array.from({ length: 100 }, () => log), next_cursor: String(page) });
    }
    expect(await collect()).toHaveLength(ACCESS_LOG_EXPORT_MAX_ROWS);
    read.mockReset().mockResolvedValue({ logs: Array.from({ length: ACCESS_LOG_EXPORT_MAX_ROWS + 1 }, () => log), next_cursor: null });
    await expect(collect()).rejects.toMatchObject({ key: 'auditLogs.exportLimitExceeded' });
  });

  it('bounds actual UTF-8 CSV bytes including BOM, escaping and line endings', async () => {
    const empty = { ...log, reason: '' };
    const encoder = new TextEncoder();
    const overhead = encoder.encode(accessLogsCsvHeader + accessLogCsvRow(empty)).byteLength;
    const remaining = ACCESS_LOG_EXPORT_MAX_BYTES - overhead;
    const reason = 'é'.repeat(Math.floor(remaining / 2)) + 'a'.repeat(remaining % 2);
    const read = vi.spyOn(admin, 'getAccessLogs').mockResolvedValue({ logs: [{ ...log, reason }], next_cursor: null });
    expect(await collect()).toHaveLength(1);
    read.mockResolvedValue({ logs: [{ ...log, reason: reason + 'é' }], next_cursor: null });
    await expect(collect()).rejects.toMatchObject({ key: 'auditLogs.exportLimitExceeded' });
  });

  it('stops unique empty pages rather than paging indefinitely', async () => {
    let count = 0;
    const read = vi.spyOn(admin, 'getAccessLogs').mockImplementation(async () => ({ logs: [], next_cursor: String(++count) }));
    await expect(collect()).rejects.toMatchObject({ key: 'auditLogs.exportLimitExceeded' });
    expect(read).toHaveBeenCalledTimes(ACCESS_LOG_EXPORT_MAX_PAGES);
  });

  it('rejects repeated cursors and produces no partial result', async () => {
    vi.spyOn(admin, 'getAccessLogs').mockResolvedValue({ logs: [log], next_cursor: 'repeated' });
    await expect(collect()).rejects.toMatchObject({ key: 'auditLogs.theLogPaginationIsInconsistentTryAgain' });
  });

  it('does not return data from an in-flight request completed after cancellation', async () => {
    const controller = new AbortController();
    vi.spyOn(admin, 'getAccessLogs').mockImplementation(async () => {
      controller.abort();
      return { logs: [log], next_cursor: null };
    });
    await expect(collect(controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});
