import { useMemo } from 'react';
import { useMatchStore } from '../stores/match.store';
import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import { formatDateFromDate } from '../utils/general';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import Loader from '../components/Loader';
import Error from '../components/Error';
import Title from '../components/Title';
import { useNotification } from '../components/Notifier';

const Match = () => {
  const { matches, loading, error, lastFetched, fetchMatches, addMatch, removeMatch } = useMatchStore();
  const { showNotification } = useNotification();

  const handleAdd = async (data: any) => {
    if (!data.user1_id?.trim() && !data.user2_id?.trim()) {
      showNotification('Le champ Match est requis', 'error');
      return;
    }
    try {
      await addMatch(data);
      showNotification('Match ajoutée avec succès', 'success');
    } catch (err) {
      showNotification("Erreur lors de l'ajout", 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeMatch(id);
      showNotification('Match supprimée', 'success');
    } catch (err) {
      showNotification("Erreur lors de la suppression", 'error');
    }
  };

  useAutoFetchStore({
      lastFetched,
      fetchFn: fetchMatches,
      maxAge: MAX_CACHE_DURATION,
    });

  const formattedMatches = useMemo(() => {
    return matches.map((match) => ({
      ...match,
      created_at: formatDateFromDate(match.created_at),
    }));
  }, [matches]);

  const columns = [
    { field: 'created_at', headerName: 'Date' },
    { field: 'user1_info', headerName: 'Utilisateur 1' },
    { field: 'user2_info', headerName: 'Utilisateur 2' },
    { field: 'user1_has_consented_to_reveal_photo', headerName: 'Utilisateur 1 consent' },
    { field: 'user2_has_consented_to_reveal_photo', headerName: 'Utilisateur 2 consent' },
    { field: 'user1_wishes_to_continue', headerName: 'Utilisateur 1 continue' },
    { field: 'user2_wishes_to_continue', headerName: 'Utilisateur 2 continue' },
  ];

  const addFields = [
    { field: 'user1_id', headerName: 'ID Utilisateur 1' },
    { field: 'user2_id', headerName: 'ID Utilisateur 2' },
  ]
  
  if (loading) { return <Loader /> }

  if (error) { return <Error error={error} /> }

  return (
    <Box
      className="page-match"
      sx={{ display: 'flex', flexDirection: 'column'}}
    >
      <Title title='Matches' />

      <DataTable
        columns={columns}
        rows={formattedMatches}
        addFields={addFields}
        onRequestAdd={handleAdd}
        onRequestDelete={handleDelete}
        showAddButton={true}
      />
    </Box>
  );
};

export default Match;
