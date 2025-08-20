import { Box, Paper } from '@mui/material';
import Loader from '../components/Loader';
import Error from '../components/Error';
import PeriodToggle from '../components/PeriodToggle';
import DataTable from '../components/DataTable';
import ChatMessages from '../components/ChatMessage';
import { useMatchViewModel } from '../hooks/useMatchViewModel';

const Match = () => {
  const {
    addFields,
    columns,
    error,
    errorMessage,
    formattedMatches,
    formattedMessages,
    loading,
    loadingMessage,
    periodTitle,
    selectedMatchId,
    showConversation,
    setPeriodTitle,
    handleAdd,
    handleDelete,
    handleToggleView,
  } = useMatchViewModel();

  return (
    <Box className="page-match" sx={{ display: 'flex', flexDirection: 'column' }}>
      <PeriodToggle value={periodTitle} onChange={setPeriodTitle} />

      {loading && <Loader />}
      {error && <Error error={error} />}

      <DataTable
        searchLabel="Research match reports"
        columns={columns}
        rows={formattedMatches}
        addFields={addFields}
        onRequestAdd={handleAdd}
        onRequestView={handleToggleView}
        onRequestDelete={handleDelete}
        showAddButton={true}
        currentViewedId={selectedMatchId}
        isViewing={showConversation}
      />

      {showConversation && selectedMatchId && (
        <>
          {loadingMessage && <Loader />}
          {errorMessage && <Error error={errorMessage} />}
          {!loadingMessage && !errorMessage && (
            <Paper elevation={3} sx={{ my: 3, mx: 'auto', height: 550, overflowY: 'auto' }}>
              <ChatMessages messages={formattedMessages} />
            </Paper>
          )}
        </>
      )}
    </Box>
  );
};

export default Match;
