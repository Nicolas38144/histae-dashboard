import { Box, Button, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { useCallback, useState } from 'react';
import { getDataRequests, updateDataRequest } from '../api/admin';
import { errorMessage } from '../api/client';
import type { DataRequestStatus, DataSubjectRequest } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { UserLink } from '../components/UserLink';
import { useNotification } from '../components/notification-context';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatDate } from '../utils/format';

type NextStatus = Exclude<DataRequestStatus, 'pending'>;

export default function PrivacyRequests() {
  const [filter, setFilter] = useState<'' | DataRequestStatus>('');
  const [action, setAction] = useState<{ request: DataSubjectRequest; status: NextStatus } | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();
  const load = useCallback(() => getDataRequests(filter || undefined), [filter]);
  const { data, loading, error, reload } = useAsyncData(load);

  const update = async () => {
    if (!action) return; setSaving(true);
    try { await updateDataRequest(action.request.id, action.status, notes); showNotification('Demande RGPD mise à jour.', 'success'); setAction(null); setNotes(''); reload(); }
    catch (reason) { showNotification(errorMessage(reason), 'error'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <PageHeader title="Demandes RGPD" description="Suivi des droits d’accès, d’effacement, de portabilité et de rectification." actions={<FormControl size="small" sx={{ minWidth: 190 }}><InputLabel>État</InputLabel><Select label="État" value={filter} onChange={(event) => setFilter(event.target.value as '' | DataRequestStatus)}><MenuItem value="">Tous</MenuItem><MenuItem value="pending">En attente</MenuItem><MenuItem value="in_progress">En cours</MenuItem><MenuItem value="completed">Terminées</MenuItem><MenuItem value="rejected">Refusées</MenuItem></Select></FormControl>} />
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {data && <Paper variant="outlined"><Table size="small"><TableHead><TableRow><TableCell>Demande</TableCell><TableCell>Utilisateur</TableCell><TableCell>Type</TableCell><TableCell>Date</TableCell><TableCell>État</TableCell><TableCell>Notes</TableCell><TableCell align="right">Transition</TableCell></TableRow></TableHead><TableBody>{data.map((request) => <TableRow key={request.id}><TableCell>{request.id}</TableCell><TableCell><UserLink id={request.user_id} /></TableCell><TableCell>{request.type}</TableCell><TableCell>{formatDate(request.requested_at)}</TableCell><TableCell><StatusChip value={request.status} /></TableCell><TableCell>{request.notes || '—'}</TableCell><TableCell align="right"><Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>{request.status === 'pending' && <Button size="small" onClick={() => setAction({ request, status: 'in_progress' })}>Prendre en charge</Button>}{request.status === 'in_progress' && <Button size="small" color="success" onClick={() => setAction({ request, status: 'completed' })}>Terminer</Button>}{(request.status === 'pending' || request.status === 'in_progress') && <Button size="small" color="error" onClick={() => setAction({ request, status: 'rejected' })}>Refuser</Button>}</Box></TableCell></TableRow>)}{!data.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>Aucune demande dans cette file.</TableCell></TableRow>}</TableBody></Table></Paper>}
      <ConfirmActionDialog open={Boolean(action)} title={dialogTitle(action)} description={dialogDescription(action)} confirmLabel="Confirmer" danger={action?.status === 'rejected' || (action?.status === 'completed' && action.request.type === 'erasure')} value={notes} onValueChange={setNotes} valueLabel="Notes de traitement" requireValue={action?.status === 'rejected'} loading={saving} onCancel={() => { setAction(null); setNotes(''); }} onConfirm={() => void update()} />
    </>
  );
}

function dialogTitle(action: { request: DataSubjectRequest; status: NextStatus } | null): string {
  if (!action) return '';
  if (action.status === 'in_progress') return 'Prendre en charge cette demande ?';
  if (action.status === 'rejected') return 'Refuser cette demande ?';
  return action.request.type === 'erasure' ? 'Exécuter l’effacement définitif ?' : 'Terminer cette demande ?';
}

function dialogDescription(action: { request: DataSubjectRequest; status: NextStatus } | null): string {
  if (action?.status === 'completed' && action.request.type === 'erasure') return 'Cette confirmation déclenche immédiatement l’anonymisation complète du compte et ne peut pas être annulée.';
  return 'La transition et l’administrateur responsable seront inscrits au journal de conformité.';
}
