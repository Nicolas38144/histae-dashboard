import { useVibeStore } from '../stores/vibe.store';
import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import { MAX_CACHE_DURATION } from '../utils/constants';
import Loader from '../components/Loader';
import Error from '../components/Error';
import Title from '../components/Title';
import { useNotification } from '../components/Notifier';

const Vibe = () => {
  const { vibes, loading, error, lastFetched, fetchVibes, addVibe, editVibe, removeVibe } = useVibeStore();
  const { showNotification } = useNotification();

  const handleAdd = async (data: any) => {
    if (!data.vibe?.trim()) {
      showNotification('Le champ Vibe est requis', 'error');
      return;
    }
    try {
      await addVibe(data);
      showNotification('Vibe ajoutée avec succès', 'success');
    } catch (err) {
      showNotification("Erreur lors de l'ajout", 'error');
    }
  };

  const handleEdit = async (data: any) => {
    if (!data.vibe?.trim()) {
      showNotification('Le champ Vibe est requis', 'error');
      return;
    }
    try {
      await editVibe(data);
      showNotification('Vibe modifiée', 'success');
    } catch (err) {
      showNotification("Erreur lors de la modification", 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeVibe(id);
      showNotification('Vibe supprimée', 'success');
    } catch (err) {
      showNotification("Erreur lors de la suppression", 'error');
    }
  };

  useAutoFetchStore({
    lastFetched,
    fetchFn: fetchVibes,
    maxAge: MAX_CACHE_DURATION,
  });

  const columns = [
    { field: 'id', headerName: 'ID' },
    { field: 'vibe', headerName: 'Vibe' },
  ];

  const editableFields = ['vibe'];

  const addFields = [
    { field: 'vibe', headerName: 'Vibe' },
  ];

  if (loading) return <Loader />;
  if (error) return <Error error={error} />;

  return (
    <Box className="page-vibe" sx={{ display: 'flex', flexDirection: 'column' }}>
      <Title title="Vibes" />

      <DataTable
        columns={columns}
        rows={vibes}
        editableFields={editableFields}
        addFields={addFields}
        onRequestAdd={handleAdd}
        onRequestEdit={handleEdit}
        onRequestDelete={handleDelete}
        showAddButton={true}
      />
    </Box>
  );
};

export default Vibe;
