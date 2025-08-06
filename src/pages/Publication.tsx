import { usePublicationStore } from '../stores/publication.store';
import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import { formatDateFromDate } from '../utils/general';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useMemo } from 'react';
import Loader from '../components/Loader';
import Error from '../components/Error';
import Title from '../components/Title';

const Publication = () => {
  const { publications, loading, error, lastFetched, fetchPublications, addPublication, editPublication, removePublication } = usePublicationStore();

  useAutoFetchStore({
    lastFetched,
    fetchFn: fetchPublications,
    maxAge: MAX_CACHE_DURATION,
  });

  const formattedPublications = useMemo(() => {
    return publications.map((pub) => ({
      ...pub,
      created_at: formatDateFromDate(pub.created_at),
    }));
  }, [publications]);
  
  const columns = [
    { field: 'created_at', headerName: 'Date' },
    { field: 'author', headerName: 'Auteur' },
    { field: 'content', headerName: 'Publication' },
    { field: 'nb_like', headerName: 'Nb de like' },
    { field: 'nb_report', headerName: 'Nb de signalement' },
  ];

  const addFields = [
    { field: 'user_id', headerName: 'ID Utilisateur' },
    { field: 'content', headerName: 'Publication' },
  ]

  if (loading) { return <Loader /> }

  if (error) { return <Error error={error} /> }

  return (
    <Box
      className="page-publication"
      sx={{ display: 'flex', flexDirection: 'column'}}
    >
      <Title title='Publications' />

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
