import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import Error from '../components/Error';
import { MainTitle } from '../components/Title';
import { t } from 'i18next';
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
      <MainTitle title={t("vibePage.title")} />

      {loading && <Loader />}
      {error && <Error error={error} />}

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
