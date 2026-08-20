import { SearchOutlined } from '@mui/icons-material';
import { Button, InputAdornment, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useState, type FormEvent } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError(null);
    try { setLogs(await getAccessLogs(userId.trim())); } catch (reason) { setError(errorMessage(reason)); }
    finally { setLoading(false); }
  };
  return <><PageHeader title="Journal d’accès" description="Traçabilité RGPD des consultations et actions administratives par utilisateur." /><Paper component="form" onSubmit={submit} variant="outlined" sx={{ p: 2, display: 'flex', gap: 1.5, mb: 2 }}><TextField fullWidth size="small" label="UUID de l’utilisateur concerné" value={userId} onChange={(event) => setUserId(event.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> }} /><Button type="submit" variant="contained" disabled={!userId.trim() || loading}>Rechercher</Button></Paper><AsyncState loading={loading} error={error} />{logs && <Paper variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>Date</TableCell><TableCell>Action</TableCell><TableCell>Administrateur</TableCell><TableCell>Rôle</TableCell><TableCell>Justification</TableCell></TableRow></TableHead><TableBody>{logs.map((log) => <TableRow key={log.id}><TableCell>{formatDate(log.accessed_at)}</TableCell><TableCell>{log.action}</TableCell><TableCell>{log.accessor_id ? <UserLink id={log.accessor_id} /> : 'Système'}</TableCell><TableCell>{log.accessor_role || '—'}</TableCell><TableCell>{log.reason || '—'}</TableCell></TableRow>)}{!logs.length && <TableRow><TableCell colSpan={5}><Typography textAlign="center" color="text.secondary" sx={{ py: 5 }}>Aucune entrée pour cet utilisateur.</Typography></TableCell></TableRow>}</TableBody></Table></Paper>}</>;
}
