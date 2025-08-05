import { useMemo } from 'react';
import { useMatchStore } from '../stores/match.store';
import { Box } from '@mui/material';
import DataTable from '../components/DataTable';
import { formatDateFromDate } from '../utils/formatDate';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import Loader from '../components/Loader';
import Error from '../components/Error';
import Title from '../components/Title';
import RowDialog from '../components/RowDialog';
import { useDialog } from '../hooks/useDialog';
import type { IMatch } from '../types/match.interface';

const Match = () => {
  const { matches, loading, error, lastFetched, fetchMatches, addMatch, editMatch, removeMatch } = useMatchStore();

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

  const {
    dialogType,
    editData,
    selectedId,
    setEditData,
    handleOpenDialog,
    handleCloseDialog,
    handleConfirm,
  } = useDialog<IMatch>({
    addFn: (data) => addMatch(data),
    editFn: (id, data) => editMatch(id, data),
    deleteFn: (id) => removeMatch(id),
    getItemFn: (id) => {
      const match = matches.find((m) => m.id === id);
      if (!match) return undefined;
      return match
    },
    emptyData: {
      id: '',
      user1_id: '',
      user2_id: '',
      user1_info: '',
      user2_info: '',
      user1_has_consented_to_reveal_photo: false,
      user2_has_consented_to_reveal_photo: false,
      user1_wishes_to_continue: false,
      user2_wishes_to_continue: false,
      created_at: new Date(0),
    },
  });


  const columns = [
    { field: 'created_at', headerName: 'Date' },
    { field: 'user1_info', headerName: 'Utilisateur 1' },
    { field: 'user2_info', headerName: 'Utilisateur 2' },
    { field: 'user1_has_consented_to_reveal_photo', headerName: 'Utilisateur 1 consent' },
    { field: 'user2_has_consented_to_reveal_photo', headerName: 'Utilisateur 2 consent' },
    { field: 'user1_wishes_to_continue', headerName: 'Utilisateur 1 continue' },
    { field: 'user2_wishes_to_continue', headerName: 'Utilisateur 2 continue' },
  ];

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
        searchLabel="Recherche de matches"
        onRequestDelete={(id) => { handleOpenDialog('delete', id) }}
      />

      <RowDialog
        open={!!dialogType}
        type={dialogType!}
        data={editData}
        rowId={selectedId}
        setEditData={setEditData}
        onClose={handleCloseDialog}
        onConfirm={handleConfirm}
      />
    </Box>
  );
};

export default Match;
