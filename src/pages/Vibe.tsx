import { useEffect, useState } from 'react';
import { useVibeStore } from '../stores/vibe.store';
import { CircularProgress, Typography, Box } from '@mui/material';
import DataTable from '../components/DataTable';
import type { GridRowId } from '@mui/x-data-grid';
import RowDialog from '../components/RowDialog';

const Vibe = () => {
  const { vibes, loading, error, fetchVibes, addVibe, editVibe, removeVibe } = useVibeStore();
  const [dialogType, setDialogType] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [selectedId, setSelectedId] = useState<GridRowId | null>(null);

  useEffect(() => {
    fetchVibes();
  }, [fetchVibes]);

  const handleOpenDialog = (type: 'add' | 'edit' | 'delete', id?: GridRowId) => {
    setDialogType(type);
    setSelectedId(id ?? null);

    if (type === 'edit' && id) {
      const row = vibes.find((v) => v.id === id);
      if (row) {
        const { id, ...rest } = row;
        setEditData(rest);
      }
    } else if (type === 'add') {
      setEditData({ vibe: '' });
    }
  };

  const handleCloseDialog = () => {
    setDialogType(null);
    setSelectedId(null);
    setEditData({});
  };

  const handleConfirm = async (id: GridRowId | null, updatedData?: any) => {
    if (dialogType === 'add' && updatedData) {
      await addVibe(updatedData.vibe);
    } else if (dialogType === 'edit' && id && updatedData) {
      await editVibe(id.toString(), updatedData.vibe);
    } else if (dialogType === 'delete' && id) {
      await removeVibe(id.toString());
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID' },
    { field: 'vibe', headerName: 'Vibe' },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" align="center" mt={4}>
        {error}
      </Typography>
    );
  }

  return (
    <Box
      className="page-vibe"
      sx={{ display: 'flex', flexDirection: 'column'}}
    >
      <Typography variant="h4" align="left" gutterBottom>
        Vibes
      </Typography>

      <DataTable
        columns={columns}
        rows={vibes}
        searchableField="vibe"
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
