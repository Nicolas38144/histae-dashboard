import { LocalizedError } from '../../i18n/core';
import type { StoreFinanceRow } from './types';

export function parseStoreFinanceCsv(text: string): StoreFinanceRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.shift()?.replace(/^\uFEFF/, '') !== 'row_id,paid_at,currency,gross_cents,net_cents' || !lines.length || lines.length > 1000) throw new LocalizedError('storeBilling.invalid');
  const ids = new Set<string>();
  return lines.map((line) => {
    const columns = line.split(',');
    if (columns.length !== 5) throw new LocalizedError('storeBilling.invalid');
    const [row_id, paid_at, currency, gross, net] = columns;
    const gross_cents = Number(gross), net_cents = net === '' ? null : Number(net);
    if (!/^[A-Za-z0-9_.:-]{1,128}$/.test(row_id) || ids.has(row_id) || !/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(paid_at) || Number.isNaN(Date.parse(paid_at))
      || !/^[A-Z]{3}$/.test(currency) || !/^-?\d+$/.test(gross) || (net !== '' && !/^-?\d+$/.test(net))
      || !Number.isSafeInteger(gross_cents) || Math.abs(gross_cents) > 1_000_000_000_000 || (net_cents !== null && (!Number.isSafeInteger(net_cents) || Math.abs(net_cents) > 1_000_000_000_000))) throw new LocalizedError('storeBilling.invalid');
    ids.add(row_id);
    return { row_id, paid_at, currency, gross_cents, net_cents };
  });
}

export function financeTotals(rows: readonly StoreFinanceRow[]) {
  const totals = new Map<string, { currency: string; gross: number; net: number | null }>();
  for (const row of rows) {
    const current = totals.get(row.currency) ?? { currency: row.currency, gross: 0, net: 0 };
    current.gross += row.gross_cents;
    current.net = current.net === null || row.net_cents === null ? null : current.net + row.net_cents;
    totals.set(row.currency, current);
  }
  return [...totals.values()];
}
