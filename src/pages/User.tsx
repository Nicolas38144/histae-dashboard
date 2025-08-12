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
import { formatDateFromDate } from '../utils/general';
import { useNotification } from '../components/Notifier';
import { t } from 'i18next';
import { Link } from 'react-router-dom';

const User = () => {
  const { users, loading, error, lastFetched, fetchUsers, editUser, removeUser, periodTitle, setPeriodTitle, } = useUserStore();
  const { showNotification } = useNotification();

  // const handleEdit = async (data: any) => {    
  //   if (
  //     !data.role?.trim() && 
  //     !data.is_banned?.trim() && 
  //     !data.nb_reports?.trim() && 
  //     !data.firstname?.trim() && 
  //     !data.birthdate?.trim() && 
  //     !data.sex?.trim() && 
  //     !data.bio?.trim() && 
  //     !data.photo?.trim()
  //   ) {
  //     showNotification(t("notifications.requiredFields"), 'error');
  //     return;
  //   }
  //   try {
  //     await editUser(data);
  //     showNotification(t("notifications.userAdded"), 'success');
  //   } catch (err) {
  //     showNotification(t("notifications.errorAdding"), 'error');
  //   }
  // };

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
        last_active_at: user.last_active_at ? user.last_active_at : "-",
        last_coords_lat: user.last_coords_lat ? user.last_coords_lat : "-",
        last_coords_lon: user.last_coords_lon ? user.last_coords_lon : "-",
        photo: user.photo ? user.photo : "-",
      }));
    }, [users]);

  const columns = [
    { field: 'role', headerName: t("userPage.role") },
    { field: 'phone_number', headerName: t("userPage.phone"), renderCell: (params: any) => (
      <Link
        to={`/users/${params.row.id}`}
        style={{ color: '#000000ff', textDecoration: 'underline', cursor: 'pointer' }}
      >
        {params.value}
      </Link>
    ), },
    { field: 'email', headerName: t("userPage.email") },
    { field: 'created_at', headerName: t("userPage.created") },
    { field: 'is_banned', headerName: t("userPage.isBanned") },
    { field: 'nb_reports', headerName: t("userPage.nbReport") },
    { field: 'last_active_at', headerName: t("userPage.lastActiveAt") },
    { field: 'last_coords_lat', headerName: t("userPage.lastCoordsLat") },
    { field: 'last_coords_lon', headerName: t("userPage.lastCoordsLon") },
    { field: 'firstname', headerName: t("userPage.firstname") },
    { field: 'birthdate', headerName: t("userPage.birthdate") },
    { field: 'sex', headerName: t("userPage.sex") },
    { field: 'bio', headerName: t("userPage.bio") },
    { field: 'photo', headerName: t("userPage.photo") },
  ];

  // const editableFields = ['role','is_banned','nb_reports','firstname','birthdate','sex','bio','photo']

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
        // editableFields={editableFields}
        // onRequestEdit={handleEdit}
        onRequestDelete={handleDelete}
      />
    </Box>
  );
};

export default User;
