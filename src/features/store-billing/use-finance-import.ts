import { useEffect, useRef, useState } from 'react';
import { importStoreFinance } from '../../api/store-billing';
import { LocalizedError } from '../../i18n/core';
import { parseStoreFinanceCsv } from './finance-csv';
import type { StoreFinanceRow, StoreProvider } from './types';

type ImportSnapshot = { provider: StoreProvider; reportId: string; rows: StoreFinanceRow[] };
export function useFinanceImport(onImported: () => void) {
  const [provider, setProvider] = useState<StoreProvider>('app_store');
  const [reportId, setReportId] = useState('');
  const [rows, setRows] = useState<StoreFinanceRow[]>([]);
  const [confirm, setConfirm] = useState<ImportSnapshot | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);
  const [imported, setImported] = useState(false);
  const fileRevision = useRef(0), mounted = useRef(true), running = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const revision = fileRevision;
    return () => { mounted.current = false; revision.current++; };
  }, []);
  const readFile = async (file?: File) => {
    const revision = ++fileRevision.current;
    setRows([]); setActionError(null); setImported(false);
    if (!file) return;
    try {
      if (file.size > 524288) throw new LocalizedError('storeBilling.invalid');
      const parsed = parseStoreFinanceCsv(await file.text());
      if (mounted.current && revision === fileRevision.current) setRows(parsed);
    } catch {
      if (mounted.current && revision === fileRevision.current) setActionError(new LocalizedError('storeBilling.invalid'));
    }
  };
  const submit = async () => {
    if (running.current || !confirm) return;
    running.current = true;
    setSaving(true); setActionError(null); setImported(false);
    try {
      await importStoreFinance(confirm.provider, confirm.reportId, confirm.rows);
      if (mounted.current) { setRows([]); setImported(true); }
    } catch (error: unknown) { if (mounted.current) setActionError(error); }
    finally {
      running.current = false;
      if (mounted.current) { setConfirm(null); setSaving(false); onImported(); }
    }
  };
  return { provider, setProvider, reportId, setReportId, rows, confirm, setConfirm, saving, actionError, imported, setImported, readFile, submit };
}
