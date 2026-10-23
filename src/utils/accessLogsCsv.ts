import { t } from '../i18n/core';
import type { DataAccessLog } from '../api/types';

const columns = ['id', 'accessed_at', 'accessed_user_id', 'accessor_id', 'accessor_role', 'action', 'reason'];
export const accessLogsCsvHeader = `\uFEFF${columns.join(',')}\r\n`;

function csvCell(value: string | null): string {
  const text = value ?? '';
  const safe = /^\s*[=+@-]/u.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function accessLogCsvRow(log: DataAccessLog): string {
  return [
    log.id,
    log.accessed_at,
    log.accessed_user_id,
    log.accessor_id,
    log.accessor_role,
    log.action,
    log.reason,
  ].map(csvCell).join(',') + '\r\n';
}

export function accessLogsCsv(logs: DataAccessLog[]): string {
  return accessLogsCsvHeader + logs.map(accessLogCsvRow).join('');
}

export function downloadAccessLogsCsv(userId: string, logs: DataAccessLog[]): void {
  const file = new Blob([accessLogsCsv(logs)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = t("audit.csvFilename", { id: userId });
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
