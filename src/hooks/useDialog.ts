import { useState } from 'react';
import type { GridRowId } from '@mui/x-data-grid';

type DialogType = 'add' | 'edit' | 'delete' | null;

interface UseDialogOptions<T> {
  addFn: (data: T) => Promise<any>;
  editFn: (id: string, data: T) => Promise<any>;
  deleteFn: (id: string) => Promise<any>;
  getItemFn: (id: GridRowId) => T | undefined;
  emptyData: T;
}

export const useDialog = <T extends object>({
  addFn,
  editFn,
  deleteFn,
  getItemFn,
  emptyData,
}: UseDialogOptions<T>) => {
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [editData, setEditData] = useState<T>(emptyData);
  const [selectedId, setSelectedId] = useState<GridRowId | null>(null);

  const handleOpenDialog = (type: Exclude<DialogType, null>, id?: GridRowId) => {
    setDialogType(type);
    setSelectedId(id ?? null);

    if (type === 'edit' && id) {
      const row = getItemFn(id);
      if (row) {
        setEditData(row);
      }
    } else if (type === 'add') {
      setEditData(emptyData);
    }
  };

  const handleCloseDialog = () => {
    setDialogType(null);
    setSelectedId(null);
    setEditData(emptyData);
  };

  const handleConfirm = async (id: GridRowId | null, updatedData?: T) => {
    if (dialogType === 'add' && updatedData) {
      await addFn(updatedData);
    } else if (dialogType === 'edit' && id && updatedData) {
      await editFn(id.toString(), updatedData);
    } else if (dialogType === 'delete' && id) {
      await deleteFn(id.toString());
    }
  };

  return {
    dialogType,
    editData,
    selectedId,
    setEditData,
    handleOpenDialog,
    handleCloseDialog,
    handleConfirm,
  };
};
