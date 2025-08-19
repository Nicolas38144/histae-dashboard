import { userDetailsUserStore } from '../stores/detailsUser.store';
import { userMetricStore } from '../stores/metric.store';
import { useMatchReportStore } from '../stores/matchReport.store';
import { usePostStore } from '../stores/post.store';
import { Box, Button, Paper, Typography, Switch, FormControlLabel, } from '@mui/material';
import ConfirmDialog from '../components/ConfirmDialog';
import ChatMessages from '../components/ChatMessage';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import { MAX_CACHE_DURATION } from '../utils/constants';
import Loader from '../components/Loader';
import Error from '../components/Error';
import { MainTitle, SubTitle } from '../components/Title';
import { useCallback, useMemo, useState } from 'react';
import { formatDateFromDate, formatShortDateFromDate, getAge } from '../utils/general';
import { useNotification } from '../components/Notifier';
import { t } from 'i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import RenderField from '../components/RenderField';
import type { IFormattedUser } from '../types/user.interface';
import DataTable from '../components/DataTable';
import { useMessageStore } from '../stores/message.store';

const DetailsUser = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, loading, error, lastFetched, fetchUser, removeUser, editUser } = userDetailsUserStore();
  const { userMetric, loadingUserMetric, errorMetric, fetchUserMetric } = userMetricStore();
  const { userCreatedPosts, userLikedPosts, postReportOrigin, loadingCreatedPost, loadingLikedPost, loadingPostReportOrigin, errorPost, fetchUserCreatedPosts, fetchUserLikedPosts, fetchPostReportOrigin, removePost } = usePostStore();
  const { userMatchReports, loadingUserMatchReports, errorUserMatchReports, fetchUserMatchReports, removeUserMatchReport } = useMatchReportStore();
  const { messages, loadingMessage, errorMessage, lastFetchedMessage, fetchMessages } = useMessageStore();
  const { showNotification } = useNotification();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  const formattedUser = useMemo(() => {
    if (!user) return null;
    const formatted: IFormattedUser = {
      ...user,
      created_at: formatDateFromDate(user.created_at),
      last_active_at: user.last_active_at
        ? formatDateFromDate(user.last_active_at)
        : '-',
      last_coords_lat: user.last_coords_lat || '-',
      last_coords_lon: user.last_coords_lon || '-',
      age: getAge(user.birthdate),
      is_banned: user.is_banned ? 'Yes' : 'No',
    };
    return formatted;
  }, [user]);

  const formattedCreatedPosts = useMemo(() => {
    return userCreatedPosts.map((post) => ({
      ...post,
      created_at: formatDateFromDate(post.created_at),
    }));
  }, [userCreatedPosts]);

  const formattedLikedPosts = useMemo(() => {
    return userLikedPosts.map((post) => ({
      ...post,
      created_at: formatDateFromDate(post.created_at),
    }));
  }, [userLikedPosts]);

  const formattedPostReportOrigin = useMemo(() => {
    return postReportOrigin.map((post) => ({
      ...post,
      created_at: formatDateFromDate(post.created_at),
    }));
  }, [postReportOrigin]);

  const formattedMatchReports = useMemo(() => {
    return userMatchReports.map((matchReport) => ({
      ...matchReport,
      report_date: formatDateFromDate(matchReport.report_date),
      match_date: formatDateFromDate(matchReport.match_date),
    }));
  }, [userMatchReports]);

  const formattedMessages = useMemo(() => {
    if (messages.length === 0) return [];
    const firstSenderId = messages[0].sender_id;
    return messages.map((m) => ({
      ...m,
      isRight: m.sender_id === firstSenderId,
    }));
  }, [messages]);

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
      headerName: t("postPage.author"),
      renderCell: (params: any) => {
        return (
          <Link
            to={`/users/${params.row.user_id}`}
            style={{ color: '#000000ff', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => handleCloseConversation()}
          >
            {params.value}
          </Link>
        )
      }
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
          <span>{params.value}</span>
        ) : (
          <Link
            to={`/users/${params.row.origin_user_id}`}
            style={{ color: '#000000ff', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => handleCloseConversation()}
          >
            {params.value}
          </Link>
        );
      },
    },
    {
      field: 'target_user_info',
      headerName: t("detailsUserPage.target"),
      renderCell: (params: any) => {
        const isSelf = params.row.target_user_id === id;
        return isSelf ? (
          <span>{params.value}</span>
        ) : (
          <Link
            to={`/users/${params.row.target_user_id}`}
            style={{ color: '#000000ff', textDecoration: 'underline', cursor: 'pointer' }}
            onClick={() => handleCloseConversation()}
          >
            {params.value}
          </Link>
        );
      },
    },
    { field: 'reason', headerName: t("detailsUserPage.reason") },
  ];


  const fetchFn = useCallback(async () => {
    if (id) {
      await fetchUser(id);
      await fetchUserMetric(id);
      await fetchUserCreatedPosts(id);
      await fetchUserLikedPosts(id);
      await fetchPostReportOrigin(id);
      await fetchUserMatchReports(id);
    }
  }, [id, fetchUser, fetchUserMetric, fetchUserCreatedPosts, fetchUserLikedPosts, fetchPostReportOrigin, fetchUserMatchReports]);

  useAutoFetchStore({
    lastFetched,
    fetchFn,
    maxAge: MAX_CACHE_DURATION,
    deps: [id],
    persistKey: 'detailsuser:metrics:period',
  });

  const fetchFnMessages = useCallback(async () => {
    if (selectedMatchId) {
      await fetchMessages(selectedMatchId);
    }
  }, [fetchMessages, selectedMatchId]);

  useAutoFetchStore({
    lastFetched: lastFetchedMessage,
    fetchFn: fetchFnMessages,
    maxAge: MAX_CACHE_DURATION,
    deps: [selectedMatchId],
  });

  const handleDeleteUser = async () => {
    if (!id) return;
    try {
      await removeUser(id);
      showNotification(t('notifications.userDeleted'), 'success');
      handleCloseConversation();
      navigate(-1);
    } catch {
      showNotification(t('notifications.errorDeleting'), 'error');
    }
    setConfirmDeleteOpen(false);
  };

  const handleDeleteMatchReport = async (match_id: string) => {
    const matchReport = userMatchReports.find(r => r.id === match_id);
    if (!matchReport) return;
    try {
      await removeUserMatchReport(matchReport.report_id);
      showNotification(t('notifications.userDeleted'), 'success');
      handleCloseConversation();
    } catch {
      showNotification(t('notifications.errorDeleting'), 'error');
    }
    setConfirmDeleteOpen(false);   
  };

  const handleToggleBanned = async (checked: boolean) => {
    if (!user || !id) return;
    setSaving(true);
    try {
      const updatedUser = { ...user, is_banned: checked };
      await editUser(updatedUser);
      showNotification(t('notifications.userUpdated'), 'success');
      fetchUser(id);
    } catch {
      showNotification(t('notifications.errorUpdating'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleView = (id: string) => {
    if (selectedMatchId === id && showConversation) {
      setShowConversation(false);
      setSelectedMatchId(null);
    } else {
      setSelectedMatchId(id);
      setShowConversation(true);
    }
  };

  const handleCloseConversation = () => {
    setSelectedMatchId(null);
    setShowConversation(false);
  };

  const userMetrics = userMetric
    ? [
        { label: t("detailsUserPage.matches"), value: userMetric.nb_match },
        { label: t("detailsUserPage.matchesNotContinued"), value: userMetric.nb_match_not_continued },
        { label: t("detailsUserPage.matchesContinued"), value: userMetric.nb_match_continued },
        { label: t("detailsUserPage.originMatchReport"), value: userMetric.nb_origin_match_report },
        { label: t("detailsUserPage.targetMatchReport"), value: userMetric.nb_target_match_report },
        { label: t("detailsUserPage.posts"), value: userMetric.nb_post },
        { label: t("detailsUserPage.postsLiked"), value: userMetric.nb_post_liked },
        { label: t("detailsUserPage.originPostReport"), value: userMetric.nb_origin_post_report },
        { label: t("detailsUserPage.targetPostReport"), value: userMetric.nb_target_post_report },
      ]
    : [];

  return (
    <Box
      className="page-user"
      sx={{ display: 'flex', flexDirection: 'column' }}
    >
      {loading && <Loader />}
      {error && <Error error={error} />}

      {formattedUser && <MainTitle title={`${formattedUser.firstname}, ${formattedUser.age}`} /> }
      
      <Box
        sx={{
          display: 'flex',
          gap: 4,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {formattedUser ? (
          <>
            <Paper
                elevation={3}
                sx={{ padding: 3, maxWidth: 600, flex: '1 1 400px' }}
              >
                <RenderField label={t('userPage.role')} value={formattedUser.role} />
                <RenderField label={t('userPage.phone_number')} value={formattedUser.phone_number}/>
                <RenderField label={t('userPage.email')} value={formattedUser.email} />
                <RenderField label={t('userPage.created')} value={formattedUser.created_at} />
                <RenderField label={t('userPage.isBanned')} value={formattedUser.is_banned} />
                <RenderField label={t('userPage.lastActiveAt')} value={formattedUser.last_active_at} />
                <RenderField label={t('userPage.lastCoordsLat')} value={formattedUser.last_coords_lat} />
                <RenderField label={t('userPage.lastCoordsLon')} value={formattedUser.last_coords_lon} />
                <RenderField label={t('userPage.firstname')} value={formattedUser.firstname} />
                <RenderField label={t('userPage.birthdate')} value={formatShortDateFromDate(formattedUser.birthdate)} />
                <RenderField label={t('userPage.sex')} value={formattedUser.sex} />
                <RenderField label={t('userPage.bio')} value={formattedUser.bio} />

                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    gutterBottom
                  >
                    {t('userPage.photo')}
                  </Typography>
                  {formattedUser.photo ? (
                    <Box
                      component="img"
                      src={formattedUser.photo}
                      alt={`${formattedUser.firstname} photo`}
                      sx={{ maxWidth: '100%', maxHeight: 300, borderRadius: 1 }}
                    />
                  ) : (
                    <Typography variant="body2">{t("detailsUserPage.noPhoto")}</Typography>
                  )}
                </Box>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-around' }}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => setConfirmDeleteOpen(true)}
                  >
                    {t("detailsUserPage.delete")}
                  </Button>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={user?.is_banned}
                        onChange={(e) => handleToggleBanned(e.target.checked)}
                        color="primary"
                        disabled={saving}
                      />
                    }
                    label={t('userPage.isBanned')}
                  />
                </Box>
              </Paper>
            <ConfirmDialog
              open={confirmDeleteOpen}
              title={undefined}
              message={undefined}
              onConfirm={handleDeleteUser}
              onCancel={() => setConfirmDeleteOpen(false)}
            />
          </>
        ) : (
          <Error error={t("detailsUserPage.noData")} />
        )}

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 2,
            flex: '1 1 300px',
          }}
        >
          {loadingUserMetric && <Loader />}
          {errorMetric && <Error error={errorMetric} />}
          {userMetrics.map((metric) => (
            <Paper
              elevation={3}
              key={metric.label}
              sx={{ flex: '1 1 300px', p: 2, textAlign: 'center' }}
            >
              <Typography variant="h6">{metric.label}</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mt: 1 }}>
                {metric.value}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      {userCreatedPosts.length > 0 && (
        <Box className="subpage-usercreatedposts" sx={{ mt: 6, mb:2 }}>
          <SubTitle title="Posts created" />
          {loadingCreatedPost && <Loader />}
          {errorPost && <Error error={errorPost} />}
          <DataTable
            columns={createdPostsColumns}
            rows={formattedCreatedPosts}
            onRequestDelete={removePost}
          />
        </Box>
      )}

      {userLikedPosts.length > 0 && (
        <Box className="subpage-userlikedposts" sx={{ mt: 6, mb:2 }}>
          <SubTitle title="Posts liked" />
          {loadingLikedPost && <Loader />}
          {errorPost && <Error error={errorPost} />}
          <DataTable
            columns={likedPostsColumns}
            rows={formattedLikedPosts}
            onRequestDelete={removePost}
          />
        </Box>
      )}

      {postReportOrigin.length > 0 && (
        <Box className="subpage-postReportOrigin" sx={{ mt: 6, mb:2 }}>
          <SubTitle title="Post reports (origin)" />
          {loadingPostReportOrigin && <Loader />}
          {errorPost && <Error error={errorPost} />}
          <DataTable
            columns={reportedPostsColumns}
            rows={formattedPostReportOrigin}
            onRequestDelete={removePost}
          />
        </Box>
      )}

      {userMatchReports.length > 0 && (
        <Box className="subpage-userMatchReport" sx={{ display: 'flex', flexDirection: 'column', mt: 6, mb:2 }}>
          <SubTitle title="Match reports" />
          {loadingUserMatchReports && <Loader />}
          {errorUserMatchReports && <Error error={errorUserMatchReports} />}
          <DataTable
            columns={matchReportsColumns}
            rows={formattedMatchReports}
            onRequestView={handleToggleView}
            currentViewedId={selectedMatchId}
            isViewing={showConversation}
            onRequestDelete={handleDeleteMatchReport}
          />

          {showConversation && selectedMatchId && (
            <>
              {loadingMessage && <Loader />}
              {errorMessage && <Error error={errorMessage} />}
              {!loadingMessage && !errorMessage && (
                <Paper elevation={3} sx={{ my: 3, mx: 'auto', height: 550, overflowY: 'auto' }}>
                  <ChatMessages
                    messages={formattedMessages}
                    currentUserId={id}
                    onUserLinkClick={handleCloseConversation}
                  />
                </Paper>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DetailsUser;
