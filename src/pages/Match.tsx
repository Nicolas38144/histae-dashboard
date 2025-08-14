import { useCallback, useMemo, useState } from 'react';
import { useMatchStore } from '../stores/match.store';
import { useMessageStore } from '../stores/message.store';
import { Box, Paper } from '@mui/material';
import DataTable from '../components/DataTable';
import { formatDateFromDate } from '../utils/general';
import PeriodToggle, { periods } from '../components/PeriodToggle';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import Loader from '../components/Loader';
import Error from '../components/Error';
import Title from '../components/Title';
import { useNotification } from '../components/Notifier';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import ChatMessages from '../components/ChatMessage';

const Match = () => {
  const { matches, loading, error, lastFetched, fetchMatches, addMatch, removeMatch, periodTitle, setPeriodTitle } = useMatchStore();
  const { messages, loading: loadingMessages, error: errorMessages, lastFetched: lastFetchedMessages, fetchMessages } = useMessageStore();

  const { showNotification } = useNotification();
  const [showConversation, setShowConversation] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const handleAdd = async (data: any) => {
    setShowConversation(false);
    if (!data.user1_id?.trim() && !data.user2_id?.trim()) {
      showNotification(t("notifications.requiredFields"), 'error');
      return;
    }
    try {
      await addMatch(data);
      showNotification(t("notifications.matchAdded"), 'success');
    } catch {
      showNotification(t("notifications.errorAdding"), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setShowConversation(false);
      await removeMatch(id);
      showNotification(t("notifications.matchDeleted"), 'success');
    } catch {
      showNotification(t("notifications.errorDeleting"), 'error');
    }
  };

  const handleToggleView = (id: string) => {
    if (selectedMatchId === id && showConversation) {
      setShowConversation(false);
    } else {
      setSelectedMatchId(id);
      setShowConversation(true);
    }
  };

  const fetchFnMatches = useCallback(async () => {
    await fetchMatches(periods[periodTitle].days);
  }, [fetchMatches, periodTitle]);

  useAutoFetchStore({
    lastFetched,
    fetchFn: fetchFnMatches,
    maxAge: MAX_CACHE_DURATION,
    deps: [periodTitle],
    persistKey: 'matches:metrics:period',
  });

  const formattedMatches = useMemo(() => {
    return matches.map((match) => ({
      ...match,
      created_at: formatDateFromDate(match.created_at),
    }));
  }, [matches]);

  const columns = [
    { field: 'created_at', headerName: t("matchPage.date") },
    { field: 'user1_info', headerName: t("matchPage.user1"), renderCell: (params: any) => (
      <Link to={`/users/${params.row.user1_id}`} style={{ color: '#000', textDecoration: 'underline' }}>
        {params.value}
      </Link>
    )},
    { field: 'user2_info', headerName: t("matchPage.user2"), renderCell: (params: any) => (
      <Link to={`/users/${params.row.user2_id}`} style={{ color: '#000', textDecoration: 'underline' }}>
        {params.value}
      </Link>
    )},
    { field: 'user1_has_consented_to_reveal_photo', headerName: t("matchPage.user1Consents") },
    { field: 'user2_has_consented_to_reveal_photo', headerName: t("matchPage.user2Consents") },
    { field: 'user1_wishes_to_continue', headerName: t("matchPage.user1Continues") },
    { field: 'user2_wishes_to_continue', headerName: t("matchPage.user2Continues") },
  ];

  const addFields = [
    { field: 'user1_id', headerName: t("matchPage.user1ID") },
    { field: 'user2_id', headerName: t("matchPage.user2ID") },
  ];

  const fetchFnMessages = useCallback(async () => {
    if (selectedMatchId) {
      await fetchMessages(selectedMatchId);
    }
  }, [fetchMessages, selectedMatchId]);

  useAutoFetchStore({
    lastFetched: lastFetchedMessages,
    fetchFn: fetchFnMessages,
    maxAge: MAX_CACHE_DURATION,
    deps: [selectedMatchId],
  });

  const formattedMessages = useMemo(() => {
    if (messages.length === 0) return [];
    const firstSenderId = messages[0].sender_id;
    return messages.map((m) => ({
      ...m,
      //created_at: formatDateFromDate(m.created_at),
      isRight: m.sender_id === firstSenderId,
    }));
  }, [messages]);

  return (
    <Box className="page-match" sx={{ display: 'flex', flexDirection: 'column' }}>
      <Title title={t("matchPage.title")} />
      <PeriodToggle value={periodTitle} onChange={setPeriodTitle} />

      {loading && <Loader />}
      {error && <Error error={error} />}

      <DataTable
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
          {loadingMessages && <Loader />}
          {errorMessages && <Error error={errorMessages} />}
          {!loadingMessages && !errorMessages && (
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
