import { SearchOutlined } from '@mui/icons-material';
import { Box, Button, InputAdornment, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useRef, useState, type FormEvent } from 'react';
import { getAccessLogs } from '../api/admin';
import { errorMessage } from '../api/client';
import type { DataAccessLog } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';
import { UserLink } from '../components/UserLink';
import { formatDate } from '../utils/format';

export default function AuditLogs() {
  const [userId, setUserId] = useState('');
  const [logs, setLogs] = useState<DataAccessLog[] | null>(null);
  const [searchedUserId, setSearchedUserId] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);
  const load = async (targetUserId: string, nextCursor?: string) => {
    const requestId = ++requestSequence.current;
    if (nextCursor) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const page = await getAccessLogs(targetUserId, nextCursor);
      if (requestId !== requestSequence.current) return;
      setLogs((current) => nextCursor && current ? [...current, ...page.logs] : page.logs);
      setCursor(page.next_cursor);
    } catch (reason) {
      if (requestId === requestSequence.current) setError(errorMessage(reason));
    } finally {
      if (requestId === requestSequence.current) {
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
  return <><PageHeader title="Journal d’accès" description="Traçabilité RGPD des consultations et actions administratives par utilisateur." /><Paper component="form" onSubmit={submit} variant="outlined" sx={{ p: 2, display: 'flex', gap: 1.5, mb: 2 }}><TextField fullWidth size="small" label="UUID de l’utilisateur concerné" value={userId} onChange={(event) => setUserId(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> }} /><Button type="submit" variant="contained" disabled={!userId.trim() || loading}>Rechercher</Button></Paper><AsyncState loading={loading} error={error} />{logs && <Paper variant="outlined" sx={{ overflowX: 'auto' }}><Table size="small"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Action</TableCell><TableCell>Administrateur</TableCell><TableCell>Rôle</TableCell><TableCell>Justification</TableCell></TableRow></TableHead><TableBody>{logs.map((log) => <TableRow key={log.id}><TableCell>{formatDate(log.accessed_at)}</TableCell><TableCell>{log.action}</TableCell><TableCell>{log.accessor_id ? <UserLink id={log.accessor_id} /> : 'Système'}</TableCell><TableCell>{log.accessor_role || '—'}</TableCell><TableCell>{log.reason || '—'}</TableCell></TableRow>)}{!logs.length && <TableRow><TableCell colSpan={5}><Typography textAlign="center" color="text.secondary" sx={{ py: 5 }}>Aucune entrée pour cet utilisateur.</Typography></TableCell></TableRow>}</TableBody></Table>{cursor && <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><Button onClick={() => void load(searchedUserId, cursor)} disabled={loadingMore}>{loadingMore ? 'Chargement…' : 'Charger la suite'}</Button></Box>}</Paper>}</>;
}
