import { useVibeStore } from '../stores/vibe.store';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useNotification } from '../components/Notifier';
import { t } from 'i18next';

export const useVibeViewModel = () => {
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
    } catch {
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
    } catch {
      showNotification(t("notifications.errorEditing"), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeVibe(id);
      showNotification(t("notifications.vibeDeleted"), 'success');
    } catch {
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
  const addFields = [{ field: 'vibe', headerName: t("vibePage.vibe") }];

  return {
    vibes,
    loading,
    error,
    columns,
    editableFields,
    addFields,
    handleAdd,
    handleEdit,
    handleDelete,
  };
};
