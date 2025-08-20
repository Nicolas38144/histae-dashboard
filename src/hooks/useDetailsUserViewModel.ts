import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userDetailsUserStore } from '../stores/detailsUser.store';
import { userMetricStore } from '../stores/metric.store';
import { useMatchReportStore } from '../stores/matchReport.store';
import { usePostStore } from '../stores/post.store';
import { usePostReportStore } from '../stores/postReport.store';
import { useMessageStore } from '../stores/message.store';
import { useNotification } from '../components/Notifier';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import { MAX_CACHE_DURATION } from '../utils/constants';
import { formatDateFromDate, getAge } from '../utils/general';
import type { IFormattedUser } from '../types/user.interface';
import { t } from 'i18next';
import { Link } from 'react-router-dom';
import React from 'react';

export const useDetailsUserViewModel = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showNotification } = useNotification();

  // Stores
  const { user, loading, error, lastFetched, fetchUser, removeUser, editUser } = userDetailsUserStore();
  const { userMetric, loadingUserMetric, errorMetric, fetchUserMetric } = userMetricStore();
  const { userCreatedPosts, userLikedPosts, loadingCreatedPost, loadingLikedPost, errorPost, fetchUserCreatedPosts, fetchUserLikedPosts, removePost } = usePostStore();
  const { postReportOrigin, loadingPostReportOrigin, fetchPostReportOrigin } = usePostReportStore();
  const { userMatchReports, loadingUserMatchReports, errorUserMatchReports, fetchUserMatchReports, removeUserMatchReport } = useMatchReportStore();
  const { messages, loadingMessage, errorMessage, lastFetchedMessage, fetchMessages } = useMessageStore();

  // Local state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  // Columns
  const createdPostsColumns  = [
    { field: 'created_at', headerName: t("postPage.date") },
    { field: 'content', headerName: t("postPage.post") },
    { field: 'nb_like', headerName: t("postPage.nbLike") },
    { field: 'nb_report', headerName: t("postPage.nbReport") },
  ];

  const likedPostsColumns  = [
    { field: 'created_at', headerName: t("postPage.date") },
    {
      field: 'author',
      headerName:t("postPage.author"),
      renderCell: (params: any) =>
        React.createElement(Link, {
          to: `/users/${params.row.user_id}`,
          style: { color: '#000000ff', textDecoration: 'underline', cursor: 'pointer' }
        }, params.value),
    },
    { field: 'content', headerName: t("postPage.post") },
    { field: 'nb_like', headerName: t("postPage.nbLike") },
    { field: 'nb_report', headerName: t("postPage.nbReport") },
  ];

  const reportedPostsColumns = [
    ...likedPostsColumns,
    { field: 'reason', headerName: t("postPage.reason")}
  ];

  const matchReportsColumns = [
    { field: 'report_date', headerName: t("detailsUserPage.reportDate") },
    { field: 'match_date', headerName: t("detailsUserPage.matchDate") },
    {
      field: 'origin_user_info',
      headerName: t("detailsUserPage.origin"),
      renderCell: (params: any) => {
        const isSelf = params.row.origin_user_id === id;
        return isSelf ? (
          React.createElement('span', null, params.value)
        ) : (
          React.createElement(Link, {
            to: `/users/${params.row.origin_user_id}`,
            style: { color: '#000000ff', textDecoration: 'underline', cursor: 'pointer' },
            onClick: () => handleCloseConversation()
          }, params.value)
        )
      },
    },
    {
      field: 'target_user_info',
      headerName: t("detailsUserPage.target"),
      renderCell: (params: any) => {
        const isSelf = params.row.target_user_id === id;
        return isSelf ? (
          React.createElement('span', null, params.value)
        ) : (
          React.createElement(Link, {
            to: `/users/${params.row.target_user_id}`,
            style: { color: '#000000ff', textDecoration: 'underline', cursor: 'pointer' },
            onClick: () => handleCloseConversation()
          }, params.value)
        )
      },
    },
    { field: 'reason', headerName: t("detailsUserPage.reason") },
  ];

  // Formattage
  const formattedUser = useMemo<IFormattedUser | null>(() => {
    if (!user) return null;
    return {
      ...user,
      created_at: formatDateFromDate(user.created_at),
      last_active_at: user.last_active_at ? formatDateFromDate(user.last_active_at) : '-',
      last_coords_lat: user.last_coords_lat || '-',
      last_coords_lon: user.last_coords_lon || '-',
      age: getAge(user.birthdate),
      is_banned: user.is_banned ? 'Yes' : 'No',
    };
  }, [user]);

  const formattedCreatedPosts = useMemo(() => userCreatedPosts.map(post => ({
    ...post,
    created_at: formatDateFromDate(post.created_at),
  })), [userCreatedPosts]);

  const formattedLikedPosts = useMemo(() => userLikedPosts.map(post => ({
    ...post,
    created_at: formatDateFromDate(post.created_at),
  })), [userLikedPosts]);

  const formattedPostReportOrigin = useMemo(() => postReportOrigin.map(post => ({
    ...post,
    created_at: formatDateFromDate(post.created_at),
  })), [postReportOrigin]);

  const formattedMatchReports = useMemo(() => userMatchReports.map(match => ({
    ...match,
    report_date: formatDateFromDate(match.report_date),
    match_date: formatDateFromDate(match.match_date),
  })), [userMatchReports]);

  const formattedMessages = useMemo(() => {
    if (messages.length === 0) return [];
    const firstSenderId = messages[0].sender_id;
    return messages.map(m => ({ ...m, isRight: m.sender_id === firstSenderId }));
  }, [messages]);

  // Fetchers
  const fetchAllData = useCallback(async () => {
    if (!id) return;
    await Promise.all([
      fetchUser(id),
      fetchUserMetric(id),
      fetchUserCreatedPosts(id),
      fetchUserLikedPosts(id),
      fetchPostReportOrigin(id),
      fetchUserMatchReports(id)
    ]);
  }, [id, fetchUser, fetchUserMetric, fetchUserCreatedPosts, fetchUserLikedPosts, fetchPostReportOrigin, fetchUserMatchReports]);

  useAutoFetchStore({
    lastFetched,
    fetchFn: fetchAllData,
    maxAge: MAX_CACHE_DURATION,
    deps: [id],
    persistKey: 'detailsuser:metrics:period',
  });

  const fetchMessagesForMatch = useCallback(async () => {
    if (!selectedMatchId) return;
    await fetchMessages(selectedMatchId);
  }, [selectedMatchId, fetchMessages]);

  useAutoFetchStore({
    lastFetched: lastFetchedMessage,
    fetchFn: fetchMessagesForMatch,
    maxAge: MAX_CACHE_DURATION,
    deps: [selectedMatchId],
  });

  // Handlers
  const handleDeleteUser = async () => {
    if (!id) return;
    try {
      await removeUser(id);
      showNotification('User deleted', 'success');
      setShowConversation(false);
      navigate(-1);
    } catch {
      showNotification('Error deleting user', 'error');
    } finally {
      setConfirmDeleteOpen(false);
    }
  };

  const handleDeleteMatchReport = async (match_id: string) => {
    const matchReport = userMatchReports.find(r => r.id === match_id);
    if (!matchReport) return;
    try {
      await removeUserMatchReport(matchReport.report_id);
      showNotification('Match report deleted', 'success');
      setShowConversation(false);
    } catch {
      showNotification('Error deleting match report', 'error');
    }
  };

  const handleToggleBanned = async (checked: boolean) => {
    if (!user || !id) return;
    setSaving(true);
    try {
      await editUser({ ...user, is_banned: checked });
      showNotification('User updated', 'success');
      fetchUser(id);
    } catch {
      showNotification('Error updating user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleView = (matchId: string) => {
    if (selectedMatchId === matchId && showConversation) {
      setShowConversation(false);
      setSelectedMatchId(null);
    } else {
      setSelectedMatchId(matchId);
      setShowConversation(true);
    }
  };

  const handleCloseConversation = () => {
    setSelectedMatchId(null);
    setShowConversation(false);
  };

  const userMetrics = userMetric ? [
    { label: "Matches", value: userMetric.nb_match },
    { label: "Matches Not Continued", value: userMetric.nb_match_not_continued },
    { label: "Matches Continued", value: userMetric.nb_match_continued },
    { label: "Origin Match Report", value: userMetric.nb_origin_match_report },
    { label: "Target Match Report", value: userMetric.nb_target_match_report },
    { label: "Posts", value: userMetric.nb_post },
    { label: "Posts Liked", value: userMetric.nb_post_liked },
    { label: "Origin Post Report", value: userMetric.nb_origin_post_report },
    { label: "Target Post Report", value: userMetric.nb_target_post_report },
  ] : [];

  return {
    id,
    selectedMatchId,
    postReportOrigin,
    
    formattedUser,
    formattedCreatedPosts,
    formattedLikedPosts,
    formattedPostReportOrigin,
    formattedMatchReports,
    formattedMessages,

    user,
    userCreatedPosts,
    userMatchReports,
    userMetrics,
    userLikedPosts,

    createdPostsColumns,
    likedPostsColumns,
    reportedPostsColumns,
    matchReportsColumns,

    loading,
    loadingCreatedPost,
    loadingUserMetric,
    loadingLikedPost,
    loadingPostReportOrigin,
    loadingUserMatchReports,
    loadingMessage,

    error,
    errorMetric,
    errorMessage,
    errorUserMatchReports,
    errorPost,
    
    saving,
    confirmDeleteOpen,
    showConversation,

    handleDeleteUser,
    handleDeleteMatchReport,
    handleToggleBanned,
    handleToggleView,
    handleCloseConversation,
    removePost,
    setConfirmDeleteOpen,
  };
};
