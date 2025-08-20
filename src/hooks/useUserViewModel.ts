import { useUserStore } from '../stores/user.store';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { periods } from '../components/PeriodToggle';
import { useCallback, useMemo } from 'react';
import { formatDateFromDate, getAge } from '../utils/general';
import { useNotification } from '../components/Notifier';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import React from 'react';

export const useUserViewModel = () => {
  const { users, loading, error, lastFetched, fetchUsers, removeUser, periodTitle, setPeriodTitle } = useUserStore();
  const { showNotification } = useNotification();

  const handleDelete = async (id: string) => {
    try {
      await removeUser(id);
      showNotification(t("notifications.userDeleted"), 'success');
    } catch {
      showNotification(t("notifications.errorDeleting"), 'error');
    }
  };

  const fetchFn = useCallback(async () => {
    await fetchUsers(periods[periodTitle].days);
  }, [periodTitle]);

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
    {
      field: 'phone_number',
      headerName: t("userPage.phone_number"),
      renderCell: (params: any) =>
        React.createElement(Link, {
          to: `/users/${params.row.id}`,
          style: { color: '#000000ff', textDecoration: 'underline', cursor: 'pointer' }
        }, params.value),
    },
    { field: 'email', headerName: t("userPage.email") },
    { field: 'firstname', headerName: t("userPage.firstname") },
    { field: 'birthdate', headerName: t("userPage.age") },
    { field: 'sex', headerName: t("userPage.sex") },
  ];

  return {
    users: formattedUsers,
    loading,
    error,
    periodTitle,
    setPeriodTitle,
    columns,
    handleDelete,
  };
};
