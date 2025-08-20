import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import Error from '../components/Error';
import { useVibeViewModel } from '../hooks/useVibeViewModel';

const Vibe = () => {
  const {
    vibes,
    loading,
    error,
    columns,
    editableFields,
    addFields,
    handleAdd,
    handleEdit,
    handleDelete,
  } = useVibeViewModel();

  return (
    <Box className="page-vibe" sx={{ display: 'flex', flexDirection: 'column' }}>
      {loading && <Loader />}
      {error && <Error error={error} />}

      <DataTable
        searchLabel="Research vibes"
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
