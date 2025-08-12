import { useCallback, useMemo } from 'react';
import { useMatchStore } from '../stores/match.store';
import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import { formatDateFromDate } from '../utils/general';
import PeriodToggle, { periods } from '../components/PeriodToggle';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import Loader from '../components/Loader';
import Error from '../components/Error';
import Title from '../components/Title';
import { useNotification } from '../components/Notifier';
import { t } from 'i18next';

const Match = () => {
  const { matches, loading, error, lastFetched, fetchMatches, addMatch, removeMatch, periodTitle, setPeriodTitle, } = useMatchStore();
  const { showNotification } = useNotification();

  const handleAdd = async (data: any) => {
    if (!data.user1_id?.trim() && !data.user2_id?.trim()) {
      showNotification(t("notifications.requiredFields"), 'error');
      return;
    }
    try {
      await addMatch(data);
      showNotification(t("notifications.matchAdded"), 'success');
    } catch (err) {
      showNotification(t("notifications.errorAdding"), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeMatch(id);
      showNotification(t("notifications.matchDeleted"), 'success');
    } catch (err) {
      showNotification(t("notifications.errorDeleting"), 'error');
    }
  };

  const fetchFn = useCallback(async () => {
    await fetchMatches(periods[periodTitle].days);
  }, [fetchMatches, periodTitle]);

  useAutoFetchStore({
    lastFetched,
    fetchFn,
    maxAge: MAX_CACHE_DURATION,
    deps: [periodTitle],
    persistKey: 'matches:metrics:period',
  });

  const formattedMatches = useMemo(() => {
    return matches.map((match) => ({
      ...match,
      created_at: formatDateFromDate(match.created_at),
    }));
  }, [matches]);

  const columns = [
    { field: 'created_at', headerName: t("matchPage.date") },
    { field: 'user1_info', headerName: t("matchPage.user1") },
    { field: 'user2_info', headerName: t("matchPage.user2") },
    { field: 'user1_has_consented_to_reveal_photo', headerName: t("matchPage.user1Consents") },
    { field: 'user2_has_consented_to_reveal_photo', headerName: t("matchPage.user2Consents") },
    { field: 'user1_wishes_to_continue', headerName: t("matchPage.user1Continues") },
    { field: 'user2_wishes_to_continue', headerName: t("matchPage.user2Continues") },
  ];

  const addFields = [
    { field: 'user1_id', headerName: t("matchPage.user1ID") },
    { field: 'user2_id', headerName: t("matchPage.user2ID") },
  ]

  return (
    <Box
      className="page-match"
      sx={{ display: 'flex', flexDirection: 'column'}}
    >
      <Title title={t("matchPage.title")} />
      
      <PeriodToggle value={periodTitle} onChange={setPeriodTitle} />

      {loading && <Loader />}
      {error && <Error error={error} />}

      <DataTable
        columns={columns}
        rows={formattedMatches}
        addFields={addFields}
        onRequestAdd={handleAdd}
        onRequestDelete={handleDelete}
        showAddButton={true}
      />
    </Box>
  );
};

export default Match;
