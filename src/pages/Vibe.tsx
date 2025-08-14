import { useVibeStore } from '../stores/vibe.store';
import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import { MAX_CACHE_DURATION } from '../utils/constants';
import Loader from '../components/Loader';
import Error from '../components/Error';
import { MainTitle } from '../components/Title';
import { useNotification } from '../components/Notifier';
import { t } from 'i18next';

const Vibe = () => {
  const { vibes, loading, error, lastFetched, fetchVibes, addVibe, editVibe, removeVibe } = useVibeStore();
  const { showNotification } = useNotification();

  const handleAdd = async (data: any) => {
    if (!data.vibe?.trim()) {
      showNotification(t("notifications.requiredFields"), 'error');
      return;
    }
    try {
      await addVibe(data);
      showNotification(t("notifications.vibeAdded"), 'success');
    } catch (err) {
      showNotification(t("notifications.errorAdding"), 'error');
    }
  };

  const handleEdit = async (data: any) => {
    if (!data.vibe?.trim()) {
      showNotification(t("notifications.requiredFields"), 'error');
      return;
    }
    try {
      await editVibe(data);
      showNotification(t("notifications.vibeEdited"), 'success');
    } catch (err) {
      showNotification(t("notifications.errorEditing"), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeVibe(id);
      showNotification(t("notifications.vibeDeleted"), 'success');
    } catch (err) {
      showNotification(t("notifications.errorDeleting"), 'error');
    }
  };

  useAutoFetchStore({
    lastFetched,
    fetchFn: fetchVibes,
    maxAge: MAX_CACHE_DURATION,
  });

  const columns = [
    { field: 'id', headerName: t("vibePage.id") },
    { field: 'vibe', headerName: t("vibePage.vibe") },
  ];

  const editableFields = ['vibe'];

  const addFields = [
    { field: 'vibe', headerName: t("vibePage.vibe") },
  ];

  if (loading) return <Loader />;
  if (error) return <Error error={error} />;

  return (
    <Box className="page-vibe" sx={{ display: 'flex', flexDirection: 'column' }}>
      <MainTitle title={t("vibePage.title")} />

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
