import type { DataAccessLog } from '../api/types';

const columns = ['id', 'accessed_at', 'accessed_user_id', 'accessor_id', 'accessor_role', 'action', 'reason'];

function csvCell(value: string | null): string {
  const text = value ?? '';
  const safe = /^\s*[=+@-]/u.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function accessLogsCsv(logs: DataAccessLog[]): string {
  const rows = logs.map((log) => [
    log.id,
    log.accessed_at,
    log.accessed_user_id,
    log.accessor_id,
    log.accessor_role,
    log.action,
    log.reason,
  ].map(csvCell).join(','));
  return `\uFEFF${columns.join(',')}\r\n${rows.join('\r\n')}${rows.length ? '\r\n' : ''}`;
}

export function downloadAccessLogsCsv(userId: string, logs: DataAccessLog[]): void {
  const file = new Blob([accessLogsCsv(logs)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `histae-journal-acces-${userId}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
