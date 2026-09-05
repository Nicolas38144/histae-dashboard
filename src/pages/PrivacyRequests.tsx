import { Alert, Box, Button, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getDataRequests, retryErasure, updateDataRequest } from '../api/admin';
import { errorMessage } from '../api/client';
import type { DataRequestStatus, DataSubjectRequest } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { UserLink } from '../components/UserLink';
import { useNotification } from '../components/notification-context';
import { formatDate } from '../utils/format';

type NextStatus = Exclude<DataRequestStatus, 'pending'> | 'retry';
type Action = { request: DataSubjectRequest; status: NextStatus };
const steps = { stripe: 'Stripe', photos: 'Photos privées', scylla: 'Découverte Scylla', postgres: 'Anonymisation PostgreSQL', completed: 'Effacement terminé' };

export default function PrivacyRequests() {
  const [filter, setFilter] = useState<'' | DataRequestStatus>('');
  const [action, setAction] = useState<Action | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestSequence = useRef(0);
  const { showNotification } = useNotification();
  const load = useCallback(async (nextCursor?: string, signal?: AbortSignal) => {
    const requestId = ++requestSequence.current;
    if (nextCursor) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const page = await getDataRequests(filter || undefined, nextCursor, signal);
      if (requestId !== requestSequence.current) return;
      setRequests((current) => nextCursor ? [...current, ...page.requests] : page.requests);
      setCursor(page.next_cursor);
    } catch (loadError) {
      if (signal?.aborted || requestId !== requestSequence.current) return;
      setError(errorMessage(loadError));
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [filter]);

  useEffect(() => {
    const controller = new AbortController();
    void load(undefined, controller.signal);
    return () => controller.abort();
  }, [load]);

  const reload = () => void load();
  const close = () => { setAction(null); setNotes(''); };

  const update = async () => {
    if (!action) return;
    if (action.status === 'retry' && (notes.trim().length < 3 || notes.trim().length > 500)) {
      showNotification('Le motif de reprise doit contenir entre 3 et 500 caractères.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (action.status === 'retry') {
        const eventId = action.request.erasure?.event_id;
        if (!eventId) throw new Error('Cette tâche n’est plus disponible. Actualisez la liste.');
        await retryErasure(eventId, notes);
      } else {
        await updateDataRequest(action.request.id, action.status, notes);
      }
      showNotification(action.status === 'completed' && action.request.type === 'erasure'
        ? 'Effacement enregistré. Le compte est désactivé ; le traitement se poursuit en arrière-plan.'
        : action.status === 'retry' ? 'Reprise mise en file.' : 'Demande RGPD mise à jour.', 'success');
      close(); await load();
    } catch (reason) { showNotification(errorMessage(reason), 'error'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <PageHeader title="Demandes RGPD" description="Suivi des droits d’accès, d’effacement, de portabilité et de rectification." actions={
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button disabled={loading || saving} onClick={() => void load()}>Actualiser</Button>
          <FormControl size="small" sx={{ minWidth: 190 }}><InputLabel>État</InputLabel><Select label="État" value={filter} onChange={(event) => setFilter(event.target.value as '' | DataRequestStatus)}>
            <MenuItem value="">Tous</MenuItem><MenuItem value="pending">En attente</MenuItem><MenuItem value="in_progress">En cours</MenuItem><MenuItem value="completed">Terminées</MenuItem><MenuItem value="rejected">Refusées</MenuItem>
          </Select></FormControl>
        </Box>
      } />
      <Alert severity="info" sx={{ mb: 2 }}>Une authentification administrateur récente est requise pour les transitions et reprises. Reconnectez-vous si elle a expiré. Un effacement commencé ne peut pas être annulé.</Alert>
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {!loading && !error && <Paper variant="outlined" sx={{ overflowX: 'auto' }}><Table size="small">
        <TableHead><TableRow><TableCell>Demande</TableCell><TableCell>Utilisateur</TableCell><TableCell>Type</TableCell><TableCell>Date</TableCell><TableCell>État / progression</TableCell><TableCell>Notes</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
        <TableBody>{requests.map((request) => <TableRow key={request.id}>
          <TableCell>{request.id}</TableCell><TableCell><UserLink id={request.user_id} /></TableCell><TableCell>{request.type}</TableCell><TableCell>{formatDate(request.requested_at)}</TableCell>
          <TableCell><StatusChip value={request.status} /><ErasureProgress request={request} /></TableCell><TableCell>{request.notes || '—'}</TableCell>
          <TableCell align="right"><Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            {request.status === 'pending' && <Button disabled={saving} size="small" onClick={() => setAction({ request, status: 'in_progress' })}>Prendre en charge</Button>}
            {request.status === 'in_progress' && !request.erasure && <Button disabled={saving} size="small" color="success" onClick={() => setAction({ request, status: 'completed' })}>{request.type === 'erasure' ? 'Lancer l’effacement' : 'Terminer'}</Button>}
            {!request.erasure && (request.status === 'pending' || request.status === 'in_progress') && <Button disabled={saving} size="small" color="error" onClick={() => setAction({ request, status: 'rejected' })}>Refuser</Button>}
            {request.erasure?.status === 'dead_letter' && request.erasure.event_id && <Button disabled={saving} size="small" onClick={() => setAction({ request, status: 'retry' })}>Reprendre</Button>}
          </Box></TableCell>
        </TableRow>)}{!requests.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>Aucune demande dans cette file.</TableCell></TableRow>}</TableBody>
      </Table>{cursor && <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><Button onClick={() => void load(cursor)} disabled={loadingMore}>{loadingMore ? 'Chargement…' : 'Charger la suite'}</Button></Box>}</Paper>}
      <ConfirmActionDialog open={Boolean(action)} title={dialogTitle(action)} description={dialogDescription(action)} confirmLabel="Confirmer" danger={action?.status === 'rejected' || (action?.status === 'completed' && action.request.type === 'erasure')} value={notes} onValueChange={setNotes} valueLabel={action?.status === 'retry' ? 'Motif de reprise (3 à 500 caractères)' : 'Notes de traitement'} requireValue={action?.status === 'rejected' || action?.status === 'retry'} loading={saving} onCancel={close} onConfirm={() => void update()} />
    </>
  );
}

function ErasureProgress({ request }: { request: DataSubjectRequest }) {
  const erasure = request.erasure;
  if (!erasure) return null;
  return <Box sx={{ mt: 1 }}>
    <Typography variant="body2">{steps[erasure.step]}{erasure.step === 'scylla' ? ' (' + erasure.scylla_partition + '/64 partitions)' : ''}</Typography>
    <Typography variant="caption">{erasure.status === 'dead_letter' ? 'Intervention nécessaire' : erasure.status === 'processing' ? 'Traitement en cours' : erasure.step === 'completed' ? 'Terminé' : 'En attente de reprise'} · {erasure.attempts} tentative(s)</Typography>
    <Typography variant="caption" display="block">Dernière progression : {formatDate(erasure.updated_at)}</Typography>
    {erasure.last_error_code && <Typography variant="caption" color="error" display="block">{erasure.last_error_code}</Typography>}
  </Box>;
}

function dialogTitle(action: Action | null): string {
  if (!action) return '';
  if (action.status === 'retry') return 'Reprendre cet effacement ?';
  if (action.status === 'in_progress') return 'Prendre en charge cette demande ?';
  if (action.status === 'rejected') return 'Refuser cette demande ?';
  return action.request.type === 'erasure' ? 'Lancer l’effacement définitif ?' : 'Terminer cette demande ?';
}

function dialogDescription(action: Action | null): string {
  if (action?.status === 'retry') return 'Vérifiez que la cause de l’échec est résolue. La reprise conserve la progression, exige un motif et sera auditée ; elle ne réactive pas le compte.';
  if (action?.status === 'completed' && action.request.type === 'erasure') return 'Le compte sera immédiatement désactivé. Stripe, les photos, Scylla puis PostgreSQL seront traités en arrière-plan. La demande ne sera terminée qu’après leur réussite. Cette action est irréversible.';
  return 'La transition et l’administrateur responsable seront inscrits au journal de conformité.';
}
