import { Box, Button, Paper, Typography, Switch, FormControlLabel, } from '@mui/material';
import ConfirmDialog from '../components/ConfirmDialog';
import ChatMessages from '../components/ChatMessage';
import Loader from '../components/Loader';
import Error from '../components/Error';
import { MainTitle, SubTitle } from '../components/Title';
import { formatShortDateFromDate } from '../utils/general';
import { t } from 'i18next';
import RenderField from '../components/RenderField';
import DataTable from '../components/DataTable';
import { useDetailsUserViewModel } from '../hooks/useDetailsUserViewModel';

const DetailsUser = () => {

  const du = useDetailsUserViewModel();

  return (
    <Box
      className="page-detailsuser"
      sx={{ display: 'flex', flexDirection: 'column' }}
    >
      {du.loading && <Loader />}
      {du.error && <Error error={du.error} />}

      {du.formattedUser && <MainTitle title={`${du.formattedUser.firstname}, ${du.formattedUser.age}`} /> }
      
      <Box
        sx={{
          display: 'flex',
          gap: 4,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        {du.formattedUser ? (
          <>
            <Paper
                elevation={3}
                sx={{ padding: 3, maxWidth: 600, flex: '1 1 400px' }}
              >
                <RenderField label={t('userPage.role')} value={du.formattedUser.role} />
                <RenderField label={t('userPage.phone_number')} value={du.formattedUser.phone_number}/>
                <RenderField label={t('userPage.email')} value={du.formattedUser.email} />
                <RenderField label={t('userPage.created')} value={du.formattedUser.created_at} />
                <RenderField label={t('userPage.isBanned')} value={du.formattedUser.is_banned} />
                <RenderField label={t('userPage.lastActiveAt')} value={du.formattedUser.last_active_at} />
                <RenderField label={t('userPage.lastCoordsLat')} value={du.formattedUser.last_coords_lat} />
                <RenderField label={t('userPage.lastCoordsLon')} value={du.formattedUser.last_coords_lon} />
                <RenderField label={t('userPage.firstname')} value={du.formattedUser.firstname} />
                <RenderField label={t('userPage.birthdate')} value={formatShortDateFromDate(du.formattedUser.birthdate)} />
                <RenderField label={t('userPage.sex')} value={du.formattedUser.sex} />
                <RenderField label={t('userPage.bio')} value={du.formattedUser.bio} />

                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    gutterBottom
                  >
                    {t('userPage.photo')}
                  </Typography>
                  {du.formattedUser.photo ? (
                    <Box
                      component="img"
                      src={du.formattedUser.photo}
                      alt={`${du.formattedUser.firstname} photo`}
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
                    onClick={() => du.setConfirmDeleteOpen(true)}
                  >
                    {t("detailsUserPage.delete")}
                  </Button>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={du.user?.is_banned}
                        onChange={(e) => du.handleToggleBanned(e.target.checked)}
                        color="primary"
                        disabled={du.saving}
                      />
                    }
                    label={t('userPage.isBanned')}
                  />
                </Box>
              </Paper>
            <ConfirmDialog
              open={du.confirmDeleteOpen}
              title={undefined}
              message={undefined}
              onConfirm={du.handleDeleteUser}
              onCancel={() => du.setConfirmDeleteOpen(false)}
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
          {du.loadingUserMetric && <Loader />}
          {du.errorMetric && <Error error={du.errorMetric} />}
          {du.userMetrics.map((metric) => (
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

      {du.userCreatedPosts.length > 0 && (
        <Box className="subpage-usercreatedposts" sx={{ mt: 6, mb:2 }}>
          <SubTitle title="Posts created" />
          {du.loadingCreatedPost && <Loader />}
          {du.errorPost && <Error error={du.errorPost} />}
          <DataTable
            columns={du.createdPostsColumns}
            rows={du.formattedCreatedPosts}
            onRequestDelete={du.removePost}
          />
        </Box>
      )}

      {du.userLikedPosts.length > 0 && (
        <Box className="subpage-userlikedposts" sx={{ mt: 6, mb:2 }}>
          <SubTitle title="Posts liked" />
          {du.loadingLikedPost && <Loader />}
          {du.errorPost && <Error error={du.errorPost} />}
          <DataTable
            columns={du.likedPostsColumns}
            rows={du.formattedLikedPosts}
            onRequestDelete={du.removePost}
          />
        </Box>
      )}

      {du.postReportOrigin.length > 0 && (
        <Box className="subpage-postReportOrigin" sx={{ mt: 6, mb:2 }}>
          <SubTitle title="Post reports (origin)" />
          {du.loadingPostReportOrigin && <Loader />}
          {du.errorPost && <Error error={du.errorPost} />}
          <DataTable
            columns={du.reportedPostsColumns}
            rows={du.formattedPostReportOrigin}
            onRequestDelete={du.removePost}
          />
        </Box>
      )}

      {du.userMatchReports.length > 0 && (
        <Box className="subpage-userMatchReport" sx={{ display: 'flex', flexDirection: 'column', mt: 6, mb:2 }}>
          <SubTitle title="Match reports" />
          {du.loadingUserMatchReports && <Loader />}
          {du.errorUserMatchReports && <Error error={du.errorUserMatchReports} />}
          <DataTable
            columns={du.matchReportsColumns}
            rows={du.formattedMatchReports}
            onRequestView={du.handleToggleView}
            currentViewedId={du.selectedMatchId}
            isViewing={du.showConversation}
            onRequestDelete={du.handleDeleteMatchReport}
          />

          {du.showConversation && du.selectedMatchId && (
            <>
              {du.loadingMessage && <Loader />}
              {du.errorMessage && <Error error={du.errorMessage} />}
              {!du.loadingMessage && !du.errorMessage && (
                <Paper elevation={3} sx={{ my: 3, mx: 'auto', height: 550, overflowY: 'auto' }}>
                  <ChatMessages
                    messages={du.formattedMessages}
                    currentUserId={du.id}
                    onUserLinkClick={du.handleCloseConversation}
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
