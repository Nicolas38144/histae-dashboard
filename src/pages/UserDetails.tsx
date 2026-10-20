import { domainLabel } from '../i18n/domain';
import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { ContinuationCredits } from '../components/ContinuationCredits';
import { ArrowBack, BlockOutlined, CheckCircleOutline } from '@mui/icons-material';
import { Avatar, Box, Button, Chip, Divider, Paper, TextField, Tooltip, Typography } from '@mui/material';
import { useCallback, useState, type FormEvent } from 'react';
import { Link as RouterLink, useOutletContext, useParams } from 'react-router-dom';
import { getUser, setUserBanned, setUserRole } from '../api/admin';
import { errorMessage } from '../api/client';
import type { AdminSession, AdminUserDetail } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { UserMatches } from '../components/UserMatches';
import { useNotification } from '../components/notification-context';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatDate, formatDateOnly, formatNumber } from '../utils/format';

export default function UserDetails() {
  useLocale();
  const { id = '' } = useParams();
  return <UserDetailsAccess key={id} id={id} />;
}

function UserDetailsAccess({ id }: { id: string }) {
  useLocale();
  const session = useOutletContext<AdminSession>();
  const [reason, setReason] = useState('');
  const [accessReason, setAccessReason] = useState<string | null>(null);
  const authorize = (event: FormEvent) => {
    event.preventDefault();
    const value = reason.trim();
    if (value.length >= 3 && value.length <= 500) setAccessReason(value);
  };

  if (session.role === 'superadmin' || accessReason) return <UserDetailsForId id={id} accessReason={accessReason || ''} />;
  return <>
    <Button component={RouterLink} to="/users" startIcon={<ArrowBack />} sx={{ mb: 2 }}>{t("userDetails.backToUsers")}</Button>
    <PageHeader title={t("userDetails.justifyThisView")} description={t("userDetails.accessToThisFileAndItsMatchesWillBe")} />
    <Paper component="form" onSubmit={authorize} variant="outlined" sx={{ p: 3, maxWidth: 640 }}>
      <TextField fullWidth multiline minRows={2} label={t("userDetails.accessReason3To500Characters")} value={reason} onChange={(event) => setReason(event.target.value)} inputProps={{ maxLength: 500 }} />
      <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={reason.trim().length < 3}>{t("common.viewFile")}</Button>
    </Paper>
  </>;
}

function UserDetailsForId({ id, accessReason }: { id: string; accessReason: string }) {
  useLocale();
  const loadUser = useCallback(() => getUser(id, accessReason), [id, accessReason]);
  const userState = useAsyncData(loadUser);
  const session = useOutletContext<AdminSession>();
  const [action, setAction] = useState<'ban' | 'role' | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const closeAction = () => {
    setAction(null);
    setReason('');
  };

  const updateBan = async () => {
    const user = userState.data;
    if (!user) return;
    setSaving(true);
    try {
      await setUserBanned(id, !user.is_banned, user.is_banned ? undefined : reason);
      showNotification(user.is_banned ? t("common.accountUnbanned") : t("userDetails.accountBannedAndSessionsRevoked"), 'success');
      closeAction();
      userState.reload();
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateRole = async () => {
    const user = userState.data;
    if (!user) return;
    const role = user.role === 'admin' ? 'user' : 'admin';
    setSaving(true);
    try {
      await setUserRole(id, role, reason);
      showNotification(role === 'admin'
        ? t("userDetails.accountPromotedToAdministratorGenerateAnEnrollmentTokenFor")
        : t("userDetails.administratorPermissionsRemovedAndAdminAccessRevoked"), 'success');
      closeAction();
      userState.reload();
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    } finally {
      setSaving(false);
    }
  };

  const user = !userState.loading && !userState.error ? userState.data : null;
  const canChangeRole = user && session?.role === 'superadmin'
    && user.user_id !== session.user_id
    && (user.role === 'admin' || (user.role === 'user' && !user.is_banned));
  const canBan = user && session && user.user_id !== session.user_id
    && (session.role === 'superadmin' ? user.role !== 'superadmin' : user.role === 'user');
  return (
    <>
      <Button component={RouterLink} to="/users" startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        {t("userDetails.backToUsers")}</Button>
      <PageHeader
        title={<Tooltip title={id}><span>{user?.firstname || t("common.userProfile")}</span></Tooltip>}
        description={t("userDetails.accountDetailsAndActivity")}
        actions={user && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {canChangeRole && <Button variant="outlined" onClick={() => setAction('role')}>
              {user.role === 'admin' ? t("userDetails.removeAdminPermissions") : t("common.promoteToAdmin")}
            </Button>}
            {canBan && <Button
              variant={user.is_banned ? 'outlined' : 'contained'}
              color={user.is_banned ? 'success' : 'error'}
              startIcon={user.is_banned ? <CheckCircleOutline /> : <BlockOutlined />}
              onClick={() => setAction('ban')}
            >
              {user.is_banned ? t("common.unban") : t("common.ban")}
            </Button>}
          </Box>
        )}
      />
      <AsyncState loading={userState.loading} error={userState.error} onRetry={userState.reload} />
      {user && (
        <>
          <UserProfile user={user} />
          <UserMatches userId={id} profileReason={accessReason} />
        </>
      )}
      <ConfirmActionDialog
        open={action === 'role'}
        title={user?.role === 'admin' ? t("userDetails.removeAdministratorPermissions") : t("userDetails.promoteToAdministrator")}
        description={user?.role === 'admin'
          ? t("userDetails.theUserAccountRemainsActiveAdministratorSessionsPasskeysAnd")
          : t("userDetails.thisAccountWillBeAbleToAccessTheDashboard")}
        confirmLabel={user?.role === 'admin' ? t("common.removePermissions") : t("common.promote")}
        danger={user?.role === 'admin'}
        value={reason}
        onValueChange={setReason}
        valueLabel={session.role === 'superadmin' ? undefined : t("userMatches.requiredReason3To500Characters")}
        requireValue={session.role !== 'superadmin'}
        minValueLength={3}
        maxValueLength={500}
        loading={saving}
        onCancel={closeAction}
        onConfirm={() => void updateRole()}
      />
      <ConfirmActionDialog
        open={action === 'ban'}
        title={user?.is_banned ? t("common.unbanThisAccount") : t("common.banThisAccount")}
        description={user?.is_banned ? t("userDetails.theAccountWillBeAbleToSignInAgain") : t("userDetails.allActiveSessionsWillBeRevokedImmediately")}
        confirmLabel={user?.is_banned ? t("common.unban") : t("common.ban")}
        danger={!user?.is_banned}
        value={reason}
        onValueChange={setReason}
        valueLabel={session.role === 'superadmin' || user?.is_banned ? undefined : t("common.requiredReason")}
        requireValue={session.role !== 'superadmin' && !user?.is_banned}
        minValueLength={3}
        maxValueLength={500}
        loading={saving}
        onCancel={closeAction}
        onConfirm={() => void updateBan()}
      />
    </>
  );
}

function UserProfile({ user }: { user: AdminUserDetail }) {
  useLocale();
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(320px, .8fr) 1.2fr' }, gap: 2 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar src={user.photo || undefined} sx={{ width: 64, height: 64 }}>{user.firstname?.[0]}</Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800}>{user.firstname || t("common.incompleteProfile")}</Typography>
            <StatusChip value={user.is_banned ? 'banned' : 'active'} />
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Field label={t("common.role")} value={domainLabel(user.role)} />
        <Field label={t("common.effectivePlan")} value={domainLabel(user.continuation_quota?.plan ?? user.plan)} />
        {user.continuation_quota && user.continuation_quota.plan !== user.plan && <Field label={t("common.recordedPlan")} value={domainLabel(user.plan)} />}
        <Field label={t("common.dateOfBirth")} value={formatDateOnly(user.birthdate)} />
        <Field label={t("common.sex")} value={domainLabel(user.sex || t("common.missing"))} />
        <Field label={t("common.created")} value={formatDate(user.created_at)} />
        <Field label={t("common.onboarding")} value={user.onboarding_complete ? t("common.completed") : t("common.incomplete")} />
        <Field label={t("common.reportsReceived")} value={formatNumber(user.reports_received)} />
        <Field label={t("common.matches")} value={formatNumber(user.matches_count)} />
        {user.banned_reason && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.main', color: 'error.contrastText', borderRadius: 2 }}>
            <Typography variant="caption">{t("userDetails.banReason")}</Typography>
            <Typography>{user.banned_reason}</Typography>
          </Box>
        )}
      </Paper>
      <Box sx={{ display: 'grid', gap: 2 }}>
        {user.continuation_quota && <ContinuationCredits quota={user.continuation_quota} />}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={750}>{t("common.preferences")}</Typography>
          {user.preferences ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1, mt: 2 }}>
              <Field label={t("common.minimumAge")} value={formatNumber(user.preferences.min_age)} />
              <Field label={t("common.maximumAge")} value={formatNumber(user.preferences.max_age)} />
              <Field label={t("common.maximumDistance")} value={t("common.valueKm", { value0: user.preferences.max_distance_km })} />
              <Field label={t("common.lookingFor")} value={domainLabel(user.preferences.looking_for)} />
            </Box>
          ) : <Typography color="text.secondary" sx={{ mt: 1 }}>{t("common.notProvided")}</Typography>}
        </Paper>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={750}>{t("common.traits")}</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {user.traits.length
              ? user.traits.map((trait) => <Chip key={trait.id} label={trait.name} />)
              : <Typography color="text.secondary">{t("common.noTraits")}</Typography>}
          </Box>
        </Paper>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={750}>{t("userDetails.consentsAndLocationFreshness")}</Typography>
          <Box sx={{ mt: 2 }}>
            {user.consents.map((consent) => (
              <Box key={consent.consent_type} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2">{domainLabel(consent.consent_type)}</Typography>
                <StatusChip value={consent.granted ? 'completed' : 'rejected'} />
              </Box>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {user.presence ? t(user.presence.is_location_fresh ? "presence.fresh" : "presence.outdated", { date: formatDate(user.presence.updated_at) }) : t("presence.missing")}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  useLocale();
  return <Box sx={{ mb: 1.5 }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={600}>{value}</Typography></Box>;
}
