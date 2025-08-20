import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import Error from '../components/Error';
import PeriodToggle from '../components/PeriodToggle';
import { useUserViewModel } from '../hooks/useUserViewModel';

const User = () => {
  const {
    users,
    columns,
    loading,
    error,
    periodTitle,
    setPeriodTitle,
    handleDelete
   } = useUserViewModel();

  return (
    <Box className="page-user" sx={{ display: 'flex', flexDirection: 'column'}}>
      <PeriodToggle value={periodTitle} onChange={setPeriodTitle} />

      {loading && <Loader />}
      {error && <Error error={error} />}

      <DataTable
        searchLabel="Research users"
        columns={columns}
        rows={users}
        onRequestDelete={handleDelete}
      />
    </Box>
  );
};

export default User;
