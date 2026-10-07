import { Alert, Box, Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { discardOutboxEvent, getOutboxDeadLetters, retryOutboxEvent } from '../api/admin';
import { errorMessage } from '../api/client';
import type { AdminSession, OutboxDeadLetter } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { CursorPaginationControls } from '../components/CursorPaginationControls';
import { PageHeader } from '../components/PageHeader';
import { useNotification } from '../components/notification-context';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { compactId, formatDate } from '../utils/format';

type Action = { event: OutboxDeadLetter; kind: 'retry' | 'discard' };
const eventKey = (event: OutboxDeadLetter) => event.event_id;

export default function OutboxDeadLetters() {
  const session = useOutletContext<AdminSession>();
  const loadPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getOutboxDeadLetters(cursor, signal);
    return { items: page.events, nextCursor: page.next_cursor };
  }, []);
  const pagination = useCursorPagination(loadPage, eventKey);
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const close = () => { setAction(null); setReason(''); };
  const resolve = async () => {
    if (!action) return;
    const trimmed = reason.trim();
    if (session.role !== 'superadmin' && (trimmed.length < 3 || trimmed.length > 500)) {
      showNotification('Le motif doit contenir entre 3 et 500 caractères.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (action.kind === 'retry') {
        await retryOutboxEvent(action.event.event_id, trimmed);
        showNotification('La reprise a été mise en file.', 'success');
      } else {
        await discardOutboxEvent(action.event.event_id, trimmed);
        showNotification('L’événement a été abandonné.', 'success');
      }
      close();
      pagination.reload();
    } catch (error) {
      showNotification(errorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  return <>
    <PageHeader title="Outbox — échecs définitifs" description="Événements nécessitant une décision opérationnelle auditée." />
    <Alert severity="info" sx={{ mb: 2 }}>La reprise exige une authentification WebAuthn récente et ne garantit pas la réussite du prochain essai. L’abandon de certains types d’événements est interdit par l’API.</Alert>
    <AsyncState loading={pagination.loading} error={pagination.error} onRetry={pagination.reload} />
    {!pagination.loading && !pagination.error && <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead><TableRow><TableCell>Événement</TableCell><TableCell>Type</TableCell><TableCell>Tentatives</TableCell><TableCell>Diagnostic</TableCell><TableCell>Échec définitif</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
        <TableBody>{pagination.items.map((event) => <TableRow key={event.event_id}>
          <TableCell>{compactId(event.event_id)}</TableCell>
          <TableCell>{event.event_type}</TableCell>
          <TableCell>{event.attempts}</TableCell>
          <TableCell>{event.last_error_code || '—'}</TableCell>
          <TableCell>{formatDate(event.dead_lettered_at)}</TableCell>
          <TableCell align="right"><Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button size="small" disabled={saving} onClick={() => setAction({ event, kind: 'retry' })}>Reprendre</Button>
            {(event.event_type === 'notification.push' || event.event_type === 'photo.delete') && <Button size="small" color="error" disabled={saving} onClick={() => setAction({ event, kind: 'discard' })}>Abandonner</Button>}
          </Box></TableCell>
        </TableRow>)}
          {!pagination.items.length && <TableRow><TableCell colSpan={6}><Typography textAlign="center" sx={{ py: 4 }}>Aucun événement en échec définitif.</Typography></TableCell></TableRow>}
        </TableBody>
      </Table>
      <CursorPaginationControls nextCursor={pagination.nextCursor} loading={pagination.loadingMore} error={pagination.loadMoreError} onLoadMore={pagination.loadMore} onReload={pagination.reload} />
    </Paper>}
    <ConfirmActionDialog
      open={Boolean(action)}
      title={action?.kind === 'discard' ? 'Abandonner cet événement ?' : 'Reprendre cet événement ?'}
      description={action?.kind === 'discard' ? action.event.event_type === 'photo.delete' ? 'La suppression de photo ne peut être abandonnée que si la photo n’existe plus. L’API vérifiera cette condition.' : 'L’abandon supprime les essais futurs de cette notification.' : 'L’événement sera remis en file pour un nouvel essai.'}
      confirmLabel={action?.kind === 'discard' ? 'Abandonner' : 'Reprendre'}
      danger={action?.kind === 'discard'}
      value={reason}
      onValueChange={setReason}
      valueLabel={session.role === 'superadmin' ? undefined : 'Motif opérationnel (3 à 500 caractères)'}
      requireValue={session.role !== 'superadmin'}
      minValueLength={3}
      maxValueLength={500}
      loading={saving}
      onCancel={close}
      onConfirm={() => void resolve()}
    />
  </>;
}
