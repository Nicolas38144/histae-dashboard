import { SearchOutlined } from '@mui/icons-material';
import {
  Button,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useState, type FormEvent } from 'react';
import { getAccessLogs } from '../api/admin';
import type { DataAccessLog } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { CursorPaginationControls } from '../components/CursorPaginationControls';
import { PageHeader } from '../components/PageHeader';
import { UserLink } from '../components/UserLink';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { formatDate } from '../utils/format';

type AuditSearch = {
  key: number;
  userId: string;
};

const logKey = (log: DataAccessLog) => log.id;

export default function AuditLogs() {
  const [userId, setUserId] = useState('');
  const [search, setSearch] = useState<AuditSearch | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const targetUserId = userId.trim();
    if (!targetUserId) return;
    setSearch((current) => ({ key: (current?.key ?? 0) + 1, userId: targetUserId }));
  };

  return (
    <>
      <PageHeader
        title="Journal d’accès"
        description="Traçabilité RGPD des consultations et actions administratives par utilisateur."
      />
      <Paper
        component="form"
        onSubmit={submit}
        variant="outlined"
        sx={{ p: 2, display: 'flex', gap: 1.5, mb: 2 }}
      >
        <TextField
          fullWidth
          size="small"
          label="UUID de l’utilisateur concerné"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment>,
            },
          }}
        />
        <Button type="submit" variant="contained" disabled={!userId.trim()}>
          Rechercher
        </Button>
      </Paper>
      {search && <AuditLogResults key={search.key} userId={search.userId} />}
    </>
  );
}

function AuditLogResults({ userId }: { userId: string }) {
  const loadPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getAccessLogs(userId, cursor, signal);
    return { items: page.logs, nextCursor: page.next_cursor };
  }, [userId]);
  const pagination = useCursorPagination(loadPage, logKey);

  return (
    <>
      <AsyncState loading={pagination.loading} error={pagination.error} onRetry={pagination.reload} />
      {!pagination.loading && !pagination.error && (
        <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Administrateur</TableCell>
                <TableCell>Rôle</TableCell>
                <TableCell>Justification</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagination.items.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{formatDate(log.accessed_at)}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.accessor_id ? <UserLink id={log.accessor_id} /> : 'Système'}</TableCell>
                  <TableCell>{log.accessor_role || '—'}</TableCell>
                  <TableCell>{log.reason || '—'}</TableCell>
                </TableRow>
              ))}
              {!pagination.items.length && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography textAlign="center" color="text.secondary" sx={{ py: 5 }}>
                      Aucune entrée pour cet utilisateur.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <CursorPaginationControls
            nextCursor={pagination.nextCursor}
            loading={pagination.loadingMore}
            error={pagination.loadMoreError}
            onLoadMore={pagination.loadMore}
            onReload={pagination.reload}
          />
        </Paper>
      )}
    </>
  );
}
