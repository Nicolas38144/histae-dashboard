import { usePublicationStore } from '../stores/publication.store';
import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import { formatDateFromDate } from '../utils/general';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import PeriodToggle, { periods } from '../components/PeriodToggle';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useCallback, useMemo } from 'react';
import Loader from '../components/Loader';
import Error from '../components/Error';
import Title from '../components/Title';
import { t } from 'i18next';

const Publication = () => {
  const { publications, loading, error, lastFetched, fetchPublications, addPublication, removePublication, periodTitle, setPeriodTitle, } = usePublicationStore();

  const fetchFn = useCallback(async () => {
    await fetchPublications(periods[periodTitle].days);
  }, [fetchPublications, periodTitle]);

  useAutoFetchStore({
    lastFetched,
    fetchFn,
    maxAge: MAX_CACHE_DURATION,
    deps: [periodTitle],
    persistKey: 'publications:metrics:period',
  });

  const formattedPublications = useMemo(() => {
    return publications.map((pub) => ({
      ...pub,
      created_at: formatDateFromDate(pub.created_at),
    }));
  }, [publications]);
  
  const columns = [
    { field: 'created_at', headerName: t("publicationPage.date") },
    { field: 'author', headerName: t("publicationPage.author") },
    { field: 'content', headerName: t("publicationPage.publication") },
    { field: 'nb_like', headerName: t("publicationPage.nbLike") },
    { field: 'nb_report', headerName: t("publicationPage.nbReport") },
  ];

  const addFields = [
    { field: 'user_id', headerName: t("publicationPage.userID") },
    { field: 'content', headerName: t("publicationPage.publication") },
  ]

  return (
    <Box
      className="page-publication"
      sx={{ display: 'flex', flexDirection: 'column'}}
    >
      <Title title={t("publicationPage.title")} />

      <PeriodToggle value={periodTitle} onChange={setPeriodTitle} />

      {loading && <Loader />}
      {error && <Error error={error} />}

      <DataTable
        columns={columns}
        rows={formattedPublications}
        addFields={addFields}
        onRequestAdd={addPublication}
        onRequestDelete={removePublication}
        showAddButton={true}
      />
    </Box>
  );
};

export default Publication;
