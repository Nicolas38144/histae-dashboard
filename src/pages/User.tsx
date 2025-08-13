import { useUserStore } from '../stores/user.store';
import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import { MAX_CACHE_DURATION } from '../utils/constants';
import PeriodToggle, { periods } from '../components/PeriodToggle';
import Loader from '../components/Loader';
import Error from '../components/Error';
import Title from '../components/Title';
import { useCallback, useMemo } from 'react';
import { formatDateFromDate, getAge } from '../utils/general';
import { useNotification } from '../components/Notifier';
import { t } from 'i18next';
import { Link } from 'react-router-dom';

const User = () => {
  const { users, loading, error, lastFetched, fetchUsers, removeUser, periodTitle, setPeriodTitle, } = useUserStore();
  const { showNotification } = useNotification();

  const handleDelete = async (id: string) => {
    try {
      await removeUser(id);
      showNotification(t("notifications.userDeleted"), 'success');
    } catch (err) {
      showNotification(t("notifications.errorDeleting"), 'error');
    }
  };

   const fetchFn = useCallback(async () => {
      await fetchUsers(periods[periodTitle].days);
    }, [users, periodTitle]);

  useAutoFetchStore({
    lastFetched,
    fetchFn,
    maxAge: MAX_CACHE_DURATION,
    deps: [periodTitle],
    persistKey: 'users:metrics:period',
  });

  const formattedUsers = useMemo(() => {
      return users.map((user) => ({
        ...user,
        created_at: formatDateFromDate(user.created_at),
        birthdate: getAge(user.birthdate),
        last_active_at: user.last_active_at ? formatDateFromDate(user.last_active_at) : "-",
        last_coords_lat: user.last_coords_lat ? user.last_coords_lat : "-",
        last_coords_lon: user.last_coords_lon ? user.last_coords_lon : "-",
        photo: user.photo ? user.photo : "-",
      }));
    }, [users]);

  const columns = [
    { field: 'role', headerName: t("userPage.role") },
    { field: 'created_at', headerName: t("userPage.created") },
    { field: 'last_active_at', headerName: t("userPage.lastActiveAt") },
    { field: 'phone_number', headerName: t("userPage.phone_number"), renderCell: (params: any) => (
      <Link
        to={`/users/${params.row.id}`}
        style={{ color: '#000000ff', textDecoration: 'underline', cursor: 'pointer' }}
      >
        {params.value}
      </Link>
    ), },
    { field: 'email', headerName: t("userPage.email") },
    // { field: 'is_banned', headerName: t("userPage.isBanned") },
    { field: 'firstname', headerName: t("userPage.firstname") },
    { field: 'birthdate', headerName: t("userPage.age") },
    { field: 'sex', headerName: t("userPage.sex") }
  ];

  return (
    <Box
      className="page-user"
      sx={{ display: 'flex', flexDirection: 'column'}}
    >
      <Title title={t("userPage.title")} />

      <PeriodToggle value={periodTitle} onChange={setPeriodTitle} />

      {loading && <Loader />}
      {error && <Error error={error} />}

      <DataTable
        columns={columns}
        rows={formattedUsers}
        onRequestDelete={handleDelete}
      />
    </Box>
  );
};

export default User;
