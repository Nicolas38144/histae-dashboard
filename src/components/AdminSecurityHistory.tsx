import { Button, Chip, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { getAdminAuthEvents, getAdminSessions, revokeAdminSession, revokeOtherSessions } from '../api/auth';
import { errorMessage } from '../api/client';
import type { AdminAuthEvent, AdminSessionSummary } from '../api/types';
import { useAsyncData } from '../hooks/useAsyncData';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { compactId, formatDate } from '../utils/format';
import { useNotification } from './notification-context';
import { AsyncState } from './AsyncState';
import { ConfirmActionDialog } from './ConfirmActionDialog';
import { CursorPaginationControls } from './CursorPaginationControls';

type Revocation = { kind: 'session'; session: AdminSessionSummary } | { kind: 'others' };
const eventKey = (event: AdminAuthEvent) => event.id;

export function AdminSecurityHistory() {
  const sessions = useAsyncData(getAdminSessions);
  const loadEvents = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getAdminAuthEvents(cursor, signal);
    return { items: page.events, nextCursor: page.next_cursor };
  }, []);
  const events = useCursorPagination(loadEvents, eventKey);
  const [revocation, setRevocation] = useState<Revocation | null>(null);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const confirmRevocation = async () => {
    if (!revocation) return;
    setSaving(true);
    try {
      if (revocation.kind === 'session') {
        await revokeAdminSession(revocation.session.id);
        showNotification('La session a été révoquée.', 'success');
      } else {
        const count = await revokeOtherSessions();
        showNotification(`${count} autre${count === 1 ? '' : 's'} session${count === 1 ? '' : 's'} révoquée${count === 1 ? '' : 's'}.`, 'success');
      }
      setRevocation(null);
      sessions.reload();
      events.reload();
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    } finally {
      setSaving(false);
    }
  };

  return <>
    <Paper variant="outlined" sx={{ mt: 3, p: 2.5, overflowX: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={2} sx={{ mb: 2 }}>
        <Typography variant="h6">Sessions administrateur</Typography>
        <Button variant="outlined" disabled={saving || !sessions.data?.some((session) => !session.current)} onClick={() => setRevocation({ kind: 'others' })}>Révoquer les autres sessions</Button>
      </Stack>
      <AsyncState loading={sessions.loading} error={sessions.error} onRetry={sessions.reload} />
      {!sessions.loading && !sessions.error && <Table size="small">
        <TableHead><TableRow><TableCell>Passkey</TableCell><TableCell>Authentification</TableCell><TableCell>Dernière activité</TableCell><TableCell>Expiration</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
        <TableBody>{(sessions.data ?? []).map((session) => <TableRow key={session.id}>
          <TableCell>{session.credential_name}{session.current && <Chip size="small" label="Actuelle" color="primary" sx={{ ml: 1 }} />}</TableCell>
          <TableCell>{formatDate(session.authenticated_at)}</TableCell>
          <TableCell>{formatDate(session.last_seen_at)}</TableCell>
          <TableCell>{formatDate(session.expires_at)}</TableCell>
          <TableCell align="right"><Button color="error" disabled={session.current || saving} onClick={() => setRevocation({ kind: 'session', session })}>Révoquer</Button></TableCell>
        </TableRow>)}
          {!sessions.data?.length && <TableRow><TableCell colSpan={5}>Aucune session active.</TableCell></TableRow>}
        </TableBody>
      </Table>}
    </Paper>

    <Paper variant="outlined" sx={{ mt: 3, p: 2.5, overflowX: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Événements de sécurité</Typography>
      <AsyncState loading={events.loading} error={events.error} onRetry={events.reload} />
      {!events.loading && !events.error && <>
        <Table size="small">
          <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Événement</TableCell><TableCell>Passkey</TableCell><TableCell>Session</TableCell></TableRow></TableHead>
          <TableBody>{events.items.map((event) => <TableRow key={event.id}>
            <TableCell>{formatDate(event.created_at)}</TableCell>
            <TableCell>{event.event_type}</TableCell>
            <TableCell>{event.credential_id ? compactId(event.credential_id) : '—'}</TableCell>
            <TableCell>{event.session_id ? compactId(event.session_id) : '—'}</TableCell>
          </TableRow>)}
            {!events.items.length && <TableRow><TableCell colSpan={4}>Aucun événement conservé.</TableCell></TableRow>}
          </TableBody>
        </Table>
        <CursorPaginationControls nextCursor={events.nextCursor} loading={events.loadingMore} error={events.loadMoreError} onLoadMore={events.loadMore} onReload={events.reload} />
      </>}
    </Paper>

    <ConfirmActionDialog
      open={Boolean(revocation)}
      title={revocation?.kind === 'session' ? 'Révoquer cette session ?' : 'Révoquer les autres sessions ?'}
      description="Une authentification WebAuthn récente est requise. La session actuelle restera active."
      confirmLabel="Révoquer"
      danger
      loading={saving}
      onCancel={() => setRevocation(null)}
      onConfirm={() => void confirmRevocation()}
    />
  </>;
}
