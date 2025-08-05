import { usePublicationStore } from '../stores/publication.store';
import { CircularProgress, Typography, Box } from '@mui/material';
import DataTable from '../components/DataTable';
import RowDialog from '../components/RowDialog';
import { formatDateFromDate } from '../utils/formatDate';
import { getID } from '../utils/auth';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useDialog } from '../hooks/useDialog';
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

  const {
    dialogType,
    editData,
    selectedId,
    setEditData,
    handleOpenDialog,
    handleCloseDialog,
    handleConfirm,
  } = useDialog({
    addFn: (data) => addPublication(getID(), data.content),
    editFn: (id, data) => editPublication(id, data.content),
    deleteFn: (id) => removePublication(id),
    getItemFn: (id) => {
      const row = publications.find((p) => p.id === id);
      if (!row) return undefined;
      return { content: row.content };
    },
    emptyData: { content: '' },
  });
  
  const columns = [
    { field: 'created_at', headerName: 'Date' },
    { field: 'author', headerName: 'Auteur' },
    { field: 'content', headerName: 'Publication' },
    { field: 'nb_like', headerName: 'Nb de like' },
    { field: 'nb_report', headerName: 'Nb de signalement' },
  ];

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
        searchLabel="Recherche de publications"
        onRequestAdd={() => handleOpenDialog('add')}
        onRequestDelete={(id) => { handleOpenDialog('delete', id) }}
      />
      
      <RowDialog
        open={!!dialogType}
        type={dialogType!}
        data={editData}
        rowId={selectedId}
        setEditData={setEditData}
        onClose={handleCloseDialog}
        onConfirm={handleConfirm}
      />
    </Box>
  );
};

export default Publication;
