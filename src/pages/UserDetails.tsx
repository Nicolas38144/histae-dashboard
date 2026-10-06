import { ArrowBack, BlockOutlined, CheckCircleOutline } from '@mui/icons-material';
import { Avatar, Box, Button, Chip, Divider, Paper, TextField, Typography } from '@mui/material';
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
import { formatDate, formatDateOnly } from '../utils/format';

export default function UserDetails() {
  const { id = '' } = useParams();
  return <UserDetailsAccess key={id} id={id} />;
}

function UserDetailsAccess({ id }: { id: string }) {
  const [reason, setReason] = useState('');
  const [accessReason, setAccessReason] = useState<string | null>(null);
  const authorize = (event: FormEvent) => {
    event.preventDefault();
    const value = reason.trim();
    if (value.length >= 3 && value.length <= 500) setAccessReason(value);
  };

  if (accessReason) return <UserDetailsForId id={id} accessReason={accessReason} />;
  return <>
    <Button component={RouterLink} to="/users" startIcon={<ArrowBack />} sx={{ mb: 2 }}>Retour aux utilisateurs</Button>
    <PageHeader title="Justifier la consultation" description="L’accès à ce dossier et à ses matchs sera audité avec votre motif." />
    <Paper component="form" onSubmit={authorize} variant="outlined" sx={{ p: 3, maxWidth: 640 }}>
      <TextField fullWidth multiline minRows={2} label="Motif d’accès (3 à 500 caractères)" value={reason} onChange={(event) => setReason(event.target.value)} inputProps={{ maxLength: 500 }} />
      <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={reason.trim().length < 3}>Consulter le dossier</Button>
    </Paper>
  </>;
}

function UserDetailsForId({ id, accessReason }: { id: string; accessReason: string }) {
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
      showNotification(user.is_banned ? 'Compte débanni.' : 'Compte banni et sessions révoquées.', 'success');
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
        ? 'Compte promu administrateur. Générez ensuite son jeton d’enrôlement pour la première passkey.'
        : 'Droits administrateur retirés et accès admin révoqués.', 'success');
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
        Retour aux utilisateurs
      </Button>
      <PageHeader
        title={user?.firstname || 'Profil utilisateur'}
        description={id}
        actions={user && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {canChangeRole && <Button variant="outlined" onClick={() => setAction('role')}>
              {user.role === 'admin' ? 'Retirer les droits admin' : 'Promouvoir admin'}
            </Button>}
            {canBan && <Button
              variant={user.is_banned ? 'outlined' : 'contained'}
              color={user.is_banned ? 'success' : 'error'}
              startIcon={user.is_banned ? <CheckCircleOutline /> : <BlockOutlined />}
              onClick={() => setAction('ban')}
            >
              {user.is_banned ? 'Débannir' : 'Bannir'}
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
        title={user?.role === 'admin' ? 'Retirer les droits administrateur ?' : 'Promouvoir administrateur ?'}
        description={user?.role === 'admin'
          ? 'Le compte utilisateur reste actif. Les sessions, passkeys et jetons d’enrôlement administrateur seront révoqués.'
          : 'Ce compte pourra accéder au dashboard après l’enrôlement de sa première passkey.'}
        confirmLabel={user?.role === 'admin' ? 'Retirer les droits' : 'Promouvoir'}
        danger={user?.role === 'admin'}
        value={reason}
        onValueChange={setReason}
        valueLabel="Motif obligatoire (3 à 500 caractères)"
        requireValue
        minValueLength={3}
        maxValueLength={500}
        loading={saving}
        onCancel={closeAction}
        onConfirm={() => void updateRole()}
      />
      <ConfirmActionDialog
        open={action === 'ban'}
        title={user?.is_banned ? 'Débannir ce compte ?' : 'Bannir ce compte ?'}
        description={user?.is_banned ? 'Le compte pourra de nouveau se connecter.' : 'Toutes les sessions actives seront immédiatement révoquées.'}
        confirmLabel={user?.is_banned ? 'Débannir' : 'Bannir'}
        danger={!user?.is_banned}
        value={reason}
        onValueChange={setReason}
        valueLabel={user?.is_banned ? undefined : 'Motif obligatoire'}
        requireValue={!user?.is_banned}
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
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(320px, .8fr) 1.2fr' }, gap: 2 }}>
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar src={user.photo || undefined} sx={{ width: 64, height: 64 }}>{user.firstname?.[0]}</Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800}>{user.firstname || 'Profil incomplet'}</Typography>
            <StatusChip value={user.is_banned ? 'banned' : 'active'} />
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Field label="Rôle" value={user.role} />
        <Field label="Plan" value={user.plan} />
        <Field label="Naissance" value={formatDateOnly(user.birthdate)} />
        <Field label="Sexe" value={user.sex || '—'} />
        <Field label="Création" value={formatDate(user.created_at)} />
        <Field label="Onboarding" value={user.onboarding_complete ? 'Terminé' : 'Incomplet'} />
        <Field label="Signalements reçus" value={String(user.reports_received)} />
        <Field label="Matchs" value={String(user.matches_count)} />
        {user.banned_reason && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'error.main', color: 'error.contrastText', borderRadius: 2 }}>
            <Typography variant="caption">Motif du bannissement</Typography>
            <Typography>{user.banned_reason}</Typography>
          </Box>
        )}
      </Paper>
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={750}>Préférences</Typography>
          {user.preferences ? (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1, mt: 2 }}>
              <Field label="Âge minimum" value={String(user.preferences.min_age)} />
              <Field label="Âge maximum" value={String(user.preferences.max_age)} />
              <Field label="Distance maximum" value={`${user.preferences.max_distance_km} km`} />
              <Field label="Recherche" value={user.preferences.looking_for} />
            </Box>
          ) : <Typography color="text.secondary" sx={{ mt: 1 }}>Non renseignées.</Typography>}
        </Paper>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={750}>Traits</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {user.traits.length
              ? user.traits.map((trait) => <Chip key={trait.id} label={trait.name} />)
              : <Typography color="text.secondary">Aucun trait.</Typography>}
          </Box>
        </Paper>
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={750}>Consentements et présence</Typography>
          <Box sx={{ mt: 2 }}>
            {user.consents.map((consent) => (
              <Box key={consent.consent_type} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body2">{consent.consent_type}</Typography>
                <StatusChip value={consent.granted ? 'completed' : 'rejected'} />
              </Box>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Présence : {user.presence ? `${user.presence.is_location_fresh ? 'fraîche' : 'obsolète'} · ${formatDate(user.presence.updated_at)}` : 'aucune donnée conservée'}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <Box sx={{ mb: 1.5 }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={600}>{value}</Typography></Box>;
}
