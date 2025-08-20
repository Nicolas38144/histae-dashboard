import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import Loader from '../components/Loader';
import Error from '../components/Error';
import { MainTitle } from '../components/Title';
import PeriodToggle from '../components/PeriodToggle';
import { t } from 'i18next';
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
      <MainTitle title={t("userPage.title")} />

      <PeriodToggle value={periodTitle} onChange={setPeriodTitle} />

      {loading && <Loader />}
      {error && <Error error={error} />}

      <DataTable
        columns={columns}
        rows={users}
        onRequestDelete={handleDelete}
      />
    </Box>
  );
};

export default User;
