import { userDetailsUserStore } from '../stores/detailsUser.store';
import { userMetricStore } from '../stores/metric.store';
import { usePostStore } from '../stores/post.store';
import { Box, Button, Paper, Typography, Switch, FormControlLabel, } from '@mui/material';
import ConfirmDialog from '../components/ConfirmDialog';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAutoFetchStore } from '../hooks/useAutoFetchStore';
import { MAX_CACHE_DURATION } from '../utils/constants';
import Loader from '../components/Loader';
import Error from '../components/Error';
import { MainTitle, SubTitle } from '../components/Title';
import { useCallback, useMemo, useState } from 'react';
import { formatDateFromDate, formatShortDateFromDate, getAge } from '../utils/general';
import { useNotification } from '../components/Notifier';
import { t } from 'i18next';
import { useNavigate, useParams } from 'react-router-dom';
import RenderField from '../components/RenderField';
import type { IFormattedUser } from '../types/user.interface';
import DataTable from '../components/DataTable';

const DetailsUser = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, userReport, loading, error, lastFetched, fetchUser, fetchUserReport, removeUser, editUser } = userDetailsUserStore();
  const { userMetric, loadingUserMetric, errorMetric, fetchUserMetric } = userMetricStore();
  const { userPosts, loadingPost, errorPost, fetchUserPosts, removePost } = usePostStore();
  const { showNotification } = useNotification();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const formattedPosts = useMemo(() => {
    return userPosts.map((post) => ({
      ...post,
      created_at: formatDateFromDate(post.created_at),
    }));
  }, [userPosts]);

  const columns = [
    { field: 'created_at', headerName: t("postPage.date") },
    { field: 'content', headerName: t("postPage.post") },
    { field: 'nb_like', headerName: t("postPage.nbLike") },
    { field: 'nb_report', headerName: t("postPage.nbReport") },
  ];

  const fetchFn = useCallback(async () => {
    if (id) {
      await fetchUser(id);
      await fetchUserReport(id);
      await fetchUserMetric(id);
      await fetchUserPosts(id);
    }
  }, [id, fetchUser, fetchUserReport, fetchUserMetric, fetchUserPosts]);

  useAutoFetchStore({
    lastFetched,
    fetchFn,
    maxAge: MAX_CACHE_DURATION,
    deps: [id],
    persistKey: 'detailsuser:metrics:period',
  });

  const handleDelete = async () => {
    if (!id) return;
    try {
      await removeUser(id);
      showNotification(t('notifications.userDeleted'), 'success');
      navigate(-1);
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
      <Button
        variant="outlined"
        onClick={() => navigate(-1)}
        startIcon={<ArrowBackIcon />}
        sx={{ width: 'fit-content', color: 'black' }}
      >
        {t("detailsUserPage.back")}
      </Button>

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
                <RenderField 
                  label={t('userPage.nbReport')}
                  value={`post: ${userReport?.nb_post_report} - match: ${userReport?.nb_match_report}`} /> 
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
              onConfirm={handleDelete}
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

      {formattedUser ? (
        <Box className="subpage-userposts" sx={{ mt: 6, mb:2 }}>
          <SubTitle title="Posts" />
          {loadingPost && <Loader />}
          {errorPost && <Error error={errorPost} />}
          <DataTable
            columns={columns}
            rows={formattedPosts}
            onRequestDelete={removePost}
          />
        </Box>
      ) : (
        <Error error={t("detailsUserPage.noData")} />
      )}
    </Box>
  );

};

export default DetailsUser;
