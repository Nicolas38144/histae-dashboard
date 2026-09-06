import { SearchOutlined } from '@mui/icons-material';
import { Button, InputAdornment, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getAccessLogs } from '../api/admin';
import { errorMessage } from '../api/client';
import type { DataAccessLog } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { CursorPaginationControls } from '../components/CursorPaginationControls';
import { PageHeader } from '../components/PageHeader';
import { UserLink } from '../components/UserLink';
import { formatDate } from '../utils/format';
import { appendUniqueBy, uniqueBy } from '../utils/pagination';

const logKey = (log: DataAccessLog) => log.id;

export default function AuditLogs() {
  const [userId, setUserId] = useState('');
  const [logs, setLogs] = useState<DataAccessLog[] | null>(null);
  const [searchedUserId, setSearchedUserId] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const requestSequence = useRef(0);
  const activeController = useRef<AbortController | null>(null);

  useEffect(() => () => {
    activeController.current?.abort();
    requestSequence.current += 1;
  }, []);

  const load = async (targetUserId: string, nextCursor?: string) => {
    const requestId = ++requestSequence.current;
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    if (nextCursor) setLoadingMore(true); else setLoading(true);
    if (nextCursor) setLoadMoreError(null);
    else {
      setLogs(null);
      setCursor(null);
      setError(null);
      setLoadMoreError(null);
    }
    try {
      const page = await getAccessLogs(targetUserId, nextCursor, controller.signal);
      if (controller.signal.aborted || requestId !== requestSequence.current) return;
      setLogs((current) => nextCursor && current
        ? appendUniqueBy(current, page.logs, logKey)
        : uniqueBy(page.logs, logKey));
      setCursor(page.next_cursor);
    } catch (reason) {
      if (!controller.signal.aborted && requestId === requestSequence.current) {
        if (nextCursor) setLoadMoreError(errorMessage(reason));
        else setError(errorMessage(reason));
      }
    } finally {
      if (!controller.signal.aborted && requestId === requestSequence.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const targetUserId = userId.trim();
    setSearchedUserId(targetUserId);
    void load(targetUserId);
  };
  return <><PageHeader title="Journal d’accès" description="Traçabilité RGPD des consultations et actions administratives par utilisateur." /><Paper component="form" onSubmit={submit} variant="outlined" sx={{ p: 2, display: 'flex', gap: 1.5, mb: 2 }}><TextField fullWidth size="small" label="UUID de l’utilisateur concerné" value={userId} onChange={(event) => setUserId(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> }} /><Button type="submit" variant="contained" disabled={!userId.trim() || loading}>Rechercher</Button></Paper><AsyncState loading={loading} error={error} />{logs && <Paper variant="outlined" sx={{ overflowX: 'auto' }}><Table size="small"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Action</TableCell><TableCell>Administrateur</TableCell><TableCell>Rôle</TableCell><TableCell>Justification</TableCell></TableRow></TableHead><TableBody>{logs.map((log) => <TableRow key={log.id}><TableCell>{formatDate(log.accessed_at)}</TableCell><TableCell>{log.action}</TableCell><TableCell>{log.accessor_id ? <UserLink id={log.accessor_id} /> : 'Système'}</TableCell><TableCell>{log.accessor_role || '—'}</TableCell><TableCell>{log.reason || '—'}</TableCell></TableRow>)}{!logs.length && <TableRow><TableCell colSpan={5}><Typography textAlign="center" color="text.secondary" sx={{ py: 5 }}>Aucune entrée pour cet utilisateur.</Typography></TableCell></TableRow>}</TableBody></Table><CursorPaginationControls nextCursor={cursor} loading={loadingMore} error={loadMoreError} onLoadMore={() => void load(searchedUserId, cursor!)} onReload={() => void load(searchedUserId)} /></Paper>}</>;
}
