import { useVibeStore } from '../stores/vibe.store';
import { CircularProgress, Typography, Box } from '@mui/material';
import DataTable from '../components/DataTable';
import RowDialog from '../components/RowDialog';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useDialog } from '../hooks/useDialog';
import Loader from '../components/Loader';
import Error from '../components/Error';
import Title from '../components/Title';

const Vibe = () => {
  const { vibes, loading, error, lastFetched, fetchVibes, addVibe, editVibe, removeVibe } = useVibeStore();

  useAutoFetchStore({
      lastFetched,
      fetchFn: fetchVibes,
      maxAge: MAX_CACHE_DURATION,
    });

  const {
      dialogType,
      editData,
      selectedId,
      setEditData,
      handleOpenDialog,
      handleCloseDialog,
      handleConfirm,
    } = useDialog({
      addFn: (data) => addVibe(data.vibe),
      editFn: (id, data) => editVibe(id, data.vibe),
      deleteFn: (id) => removeVibe(id),
      getItemFn: (id) => {
        const row = vibes.find((v) => v.id === id);
        if (!row) return undefined;
        return { vibe: row.vibe };
      },
      emptyData: { vibe: '' },
    });

  const columns = [
    { field: 'id', headerName: 'ID' },
    { field: 'vibe', headerName: 'Vibe' },
  ];

  if (loading) { return <Loader /> }

  if (error) { return <Error error={error} /> }

  return (
    <Box
      className="page-vibe"
      sx={{ display: 'flex', flexDirection: 'column'}}
    >
      <Title title='Vibes' />

      <DataTable
        columns={columns}
        rows={vibes}
        searchLabel="Recherche de vibes"
        onRequestAdd={() => handleOpenDialog('add')}
        onRequestEdit={(id) => { handleOpenDialog('edit', id) }}
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

export default Vibe;
