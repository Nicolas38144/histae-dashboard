import { getAccessLogs } from '../api/admin';
import type { DataAccessLog } from '../api/types';
import { LocalizedError } from '../i18n/core';
import { accessLogCsvRow, accessLogsCsvHeader } from './accessLogsCsv';

export const ACCESS_LOG_EXPORT_MAX_ROWS = 5_000;
export const ACCESS_LOG_EXPORT_MAX_BYTES = 5 * 1024 * 1024;
export const ACCESS_LOG_EXPORT_MAX_PAGES = 100;
export const ACCESS_LOG_EXPORT_TIMEOUT_MS = 60_000;

// Reject oversized exports entirely rather than silently downloading a partial journal.
export async function collectAccessLogsForExport(userId: string, signal: AbortSignal): Promise<DataAccessLog[]> {
  const logs: DataAccessLog[] = [];
  const cursors = new Set<string>();
  const encoder = new TextEncoder();
  let bytes = encoder.encode(accessLogsCsvHeader).byteLength;
  let cursor: string | undefined;
  for (let count = 0; count < ACCESS_LOG_EXPORT_MAX_PAGES; count += 1) {
    signal.throwIfAborted();
    const page = await getAccessLogs(userId, cursor, signal);
    signal.throwIfAborted();
    if (logs.length + page.logs.length > ACCESS_LOG_EXPORT_MAX_ROWS) throw exportLimitError();
    for (const log of page.logs) {
      bytes += encoder.encode(accessLogCsvRow(log)).byteLength;
      if (bytes > ACCESS_LOG_EXPORT_MAX_BYTES) throw exportLimitError();
      logs.push(log);
    }
    if (!page.next_cursor) return logs;
    if (cursors.has(page.next_cursor)) throw new LocalizedError('auditLogs.theLogPaginationIsInconsistentTryAgain');
    cursors.add(page.next_cursor);
    cursor = page.next_cursor;
  }
  throw exportLimitError();
}

function exportLimitError(): LocalizedError {
  return new LocalizedError('auditLogs.exportLimitExceeded', { count: ACCESS_LOG_EXPORT_MAX_ROWS, size: 5 });
}
