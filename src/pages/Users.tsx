import { SearchOutlined } from '@mui/icons-material';
import { Button, FormControl, InputAdornment, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useCallback, useState, type FormEvent } from 'react';
import { getUsers } from '../api/admin';
import type { AdminUser, UserRole } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { CursorPaginationControls } from '../components/CursorPaginationControls';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { UserLink } from '../components/UserLink';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { formatDate } from '../utils/format';

type Filters = { status: '' | 'active' | 'banned'; role: '' | UserRole; search: string };
const initialFilters: Filters = { status: '', role: '', search: '' };
const userKey = (user: AdminUser) => user.user_id;

export default function Users() {
  const [draft, setDraft] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const loadPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getUsers({
      status: filters.status || undefined,
      role: filters.role || undefined,
      search: filters.search || undefined,
      cursor,
    }, signal);
    return { items: page.users, nextCursor: page.next_cursor };
  }, [filters]);
  const pagination = useCursorPagination(loadPage, userKey);

  const submit = (event: FormEvent) => { event.preventDefault(); setFilters({ ...draft, search: draft.search.trim() }); };

  return (
    <>
      <PageHeader title="Utilisateurs" description="Annuaire des comptes actifs et gestion des mesures de sûreté." />
      <Paper component="form" onSubmit={submit} variant="outlined" sx={{ p: 2, mb: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(280px, 1fr) 180px 180px auto' }, gap: 1.5 }}>
        <TextField size="small" label="Prénom ou UUID exact" value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> }} />
        <FormControl size="small"><InputLabel>État</InputLabel><Select label="État" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Filters['status'] })}><MenuItem value="">Tous</MenuItem><MenuItem value="active">Actifs</MenuItem><MenuItem value="banned">Bannis</MenuItem></Select></FormControl>
        <FormControl size="small"><InputLabel>Rôle</InputLabel><Select label="Rôle" value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value as Filters['role'] })}><MenuItem value="">Tous</MenuItem><MenuItem value="user">Utilisateur</MenuItem><MenuItem value="admin">Admin</MenuItem><MenuItem value="superadmin">Superadmin</MenuItem></Select></FormControl>
        <Button type="submit" variant="contained">Filtrer</Button>
      </Paper>
      <AsyncState loading={pagination.loading} error={pagination.error} onRetry={pagination.reload} />
      {!pagination.loading && !pagination.error && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead><TableRow><TableCell>Utilisateur</TableCell><TableCell>Rôle</TableCell><TableCell>État</TableCell><TableCell>Plan</TableCell><TableCell>Onboarding</TableCell><TableCell align="right">Signalements</TableCell><TableCell align="right">Matchs</TableCell><TableCell>Création</TableCell></TableRow></TableHead>
            <TableBody>
              {pagination.items.map((user) => <TableRow key={user.user_id} hover><TableCell><UserLink id={user.user_id} label={user.firstname} /></TableCell><TableCell>{user.role}</TableCell><TableCell><StatusChip value={user.is_banned ? 'banned' : 'active'} /></TableCell><TableCell sx={{ textTransform: 'capitalize' }}>{user.plan}</TableCell><TableCell><StatusChip value={user.onboarding_complete ? 'completed' : 'pending'} /></TableCell><TableCell align="right">{user.reports_received}</TableCell><TableCell align="right">{user.matches_count}</TableCell><TableCell>{formatDate(user.created_at)}</TableCell></TableRow>)}
              {!pagination.items.length && <TableRow><TableCell colSpan={8}><Typography color="text.secondary" textAlign="center" sx={{ py: 5 }}>Aucun compte ne correspond aux filtres.</Typography></TableCell></TableRow>}
            </TableBody>
          </Table>
          <CursorPaginationControls
            nextCursor={pagination.nextCursor}
            loading={pagination.loadingMore}
            error={pagination.loadMoreError}
            onLoadMore={pagination.loadMore}
            onReload={pagination.reload}
          />
        </TableContainer>
      )}
    </>
  );
}
