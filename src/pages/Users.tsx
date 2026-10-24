import { useRememberedState } from '../hooks/list-memory';
import { domainLabel } from '../i18n/domain';
import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { SearchOutlined } from '@mui/icons-material';
import { Button, FormControl, InputAdornment, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { useCallback, type FormEvent } from 'react';
import { getUsers } from '../api/admin';
import type { AdminUser, UserRole } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { CursorPaginationControls } from '../components/CursorPaginationControls';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { UserLink } from '../components/UserLink';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { formatDate, formatNumber } from '../utils/format';

type Filters = { status: '' | 'active' | 'banned'; role: '' | UserRole; search: string };
const initialFilters: Filters = { status: '', role: '', search: '' };
const userKey = (user: AdminUser) => user.user_id;

export default function Users() {
  useLocale();
  const [draft, setDraft] = useRememberedState('users:draft',initialFilters);
  const [filters, setFilters] = useRememberedState('users:filters',initialFilters);
  const loadPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getUsers({
      status: filters.status || undefined,
      role: filters.role || undefined,
      search: filters.search || undefined,
      cursor,
    }, signal);
    return { items: page.users, nextCursor: page.next_cursor };
  }, [filters]);
  const pagination = useCursorPagination(loadPage, userKey, undefined, JSON.stringify(['users',filters]));

  const submit = (event: FormEvent) => { event.preventDefault(); setFilters({ ...draft, search: draft.search.trim() }); };

  return (
    <>
      <PageHeader title={t("common.users")} description={t("users.activeAccountDirectoryAndSafetyMeasures")} />
      <Paper component="form" onSubmit={submit} variant="outlined" sx={{ p: 2, mb: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(280px, 1fr) 180px 180px auto' }, gap: 1.5 }}>
        <TextField size="small" label={t("common.firstNameOrExactUuid")} value={draft.search} onChange={(event) => setDraft({ ...draft, search: event.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><SearchOutlined /></InputAdornment> }} />
        <FormControl size="small"><InputLabel>{t("common.status")}</InputLabel><Select label={t("common.status")} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Filters['status'] })}><MenuItem value="">{t("common.all")}</MenuItem><MenuItem value="active">{t("users.active")}</MenuItem><MenuItem value="banned">{t("users.banned")}</MenuItem></Select></FormControl>
        <FormControl size="small"><InputLabel>{t("common.role")}</InputLabel><Select label={t("common.role")} value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value as Filters['role'] })}><MenuItem value="">{t("common.all")}</MenuItem><MenuItem value="user">{t("common.user")}</MenuItem><MenuItem value="admin">{t("common.admin")}</MenuItem><MenuItem value="superadmin">{t("common.superadmin")}</MenuItem></Select></FormControl>
        <Button type="submit" variant="contained">{t("common.filter")}</Button>
      </Paper>
      <AsyncState loading={pagination.loading} error={pagination.error} onRetry={pagination.reload} />
      {!pagination.loading && !pagination.error && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead><TableRow><TableCell>{t("common.user")}</TableCell><TableCell>{t("common.role")}</TableCell><TableCell>{t("common.status")}</TableCell><TableCell>{t("common.plan")}</TableCell><TableCell>{t("common.onboarding")}</TableCell><TableCell align="right">{t("common.reports")}</TableCell><TableCell align="right">{t("common.matches")}</TableCell><TableCell>{t("common.created")}</TableCell></TableRow></TableHead>
            <TableBody>
              {pagination.items.map((user) => <TableRow key={user.user_id} hover><TableCell><UserLink id={user.user_id} label={user.firstname} /></TableCell><TableCell>{domainLabel(user.role)}</TableCell><TableCell><StatusChip value={user.is_banned ? 'banned' : 'active'} /></TableCell><TableCell sx={{ textTransform: 'capitalize' }}>{domainLabel(user.plan)}</TableCell><TableCell><StatusChip value={user.onboarding_complete ? 'completed' : 'pending'} /></TableCell><TableCell align="right">{formatNumber(user.reports_received)}</TableCell><TableCell align="right">{formatNumber(user.matches_count)}</TableCell><TableCell>{formatDate(user.created_at)}</TableCell></TableRow>)}
              {!pagination.items.length && <TableRow><TableCell colSpan={8}><Typography color="text.secondary" textAlign="center" sx={{ py: 5 }}>{t("users.noAccountsMatchTheFilters")}</Typography></TableCell></TableRow>}
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
