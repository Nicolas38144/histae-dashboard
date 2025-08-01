import { useEffect } from 'react';
import { useVibeStore } from '../stores/vibe.store';
import { CircularProgress, Typography, Box } from '@mui/material';
import DataTable from '../components/DataTable';

const Vibe = () => {
  const { vibes, loading, error, fetchVibes } = useVibeStore();

  useEffect(() => {
    if (vibes.length === 0) {
      fetchVibes();
    }
  }, [vibes.length, fetchVibes]);

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

  const columns = [
    { field: 'id', headerName: 'ID' },
    { field: 'vibe', headerName: 'Vibe' },
  ];

  return (
    <Box
      className="page-vibe"
      sx={{ display: 'flex', flexDirection: 'column'}}
    >
      <h1>Vibes</h1>

      <DataTable
        columns={columns}
        rows={vibes}
        searchableField="vibe"
        searchLabel="Recherche de vibes"
        onDelete={(id) => {
          console.log('Supprimer :', id);
        }}
        onEdit={(id, updatedRow) => {
          console.log('Éditer :', id, updatedRow);
        }}
      />
    </Box>
  );
};

export default Vibe;
