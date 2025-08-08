import { useUserStore } from '../stores/user.store';
import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import { MAX_CACHE_DURATION } from '../utils/constants';
import Loader from '../components/Loader';
import Error from '../components/Error';
import Title from '../components/Title';
import { useMemo } from 'react';
import { formatDateFromDate } from '../utils/general';
import { useNotification } from '../components/Notifier';

const User = () => {
  const { users, loading, error, lastFetched, fetchUsers, editUser, removeUser } = useUserStore();
  const { showNotification } = useNotification();

  const handleEdit = async (data: any) => {    
    if (
      !data.role?.trim() && 
      !data.is_banned?.trim() && 
      !data.nb_reports?.trim() && 
      !data.firstname?.trim() && 
      !data.birthdate?.trim() && 
      !data.sex?.trim() && 
      !data.bio?.trim() && 
      !data.photo?.trim()
    ) {
      showNotification('Les champs sont requis', 'error');
      return;
    }
    try {
      await editUser(data);
      showNotification('Utilisateur ajoutée avec succès', 'success');
    } catch (err) {
      showNotification("Erreur lors de l'ajout", 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeUser(id);
      showNotification('Utilisateur supprimée', 'success');
    } catch (err) {
      showNotification("Erreur lors de la suppression", 'error');
    }
  };

  useAutoFetchStore({
    lastFetched,
    fetchFn: fetchUsers,
    maxAge: MAX_CACHE_DURATION,
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
    { field: 'role', headerName: 'Rôle' },
    { field: 'phone_number', headerName: 'Tél.' },
    { field: 'email', headerName: 'email' },
    { field: 'created_at', headerName: 'Date création' },
    { field: 'is_banned', headerName: 'Banni ?' },
    { field: 'nb_reports', headerName: 'Nb de signalement' },
    { field: 'last_active_at', headerName: 'Dernière connexion' },
    { field: 'last_coords_lat', headerName: 'Dernière lat' },
    { field: 'last_coords_lon', headerName: 'Dernière lon' },
    { field: 'firstname', headerName: 'Prénom' },
    { field: 'birthdate', headerName: 'Date naissance' },
    { field: 'sex', headerName: 'Sexe' },
    { field: 'bio', headerName: 'Bio' },
    { field: 'photo', headerName: 'Photo' },
  ];

  const editableFields = ['role','is_banned','nb_reports','firstname','birthdate','sex','bio','photo']

  if (loading) { return <Loader /> }

  if (error) { return <Error error={error} /> }

  return (
    <Box
      className="page-user"
      sx={{ display: 'flex', flexDirection: 'column'}}
    >
      <Title title='Users' />

      <DataTable
        columns={columns}
        rows={formattedUsers}
        editableFields={editableFields}
        onRequestEdit={handleEdit}
        onRequestDelete={handleDelete}
      />
    </Box>
  );
};

export default User;
