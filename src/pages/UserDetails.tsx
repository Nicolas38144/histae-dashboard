import { ArrowBack, BlockOutlined, CheckCircleOutline } from '@mui/icons-material';
import { Avatar, Box, Button, Chip, Divider, Paper, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { getUser, setUserBanned } from '../api/admin';
import { errorMessage } from '../api/client';
import type { AdminUserDetail } from '../api/types';
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
  return <UserDetailsForId key={id} id={id} />;
}

function UserDetailsForId({ id }: { id: string }) {
  const loadUser = useCallback(() => getUser(id), [id]);
  const userState = useAsyncData(loadUser);
  const [banOpen, setBanOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banSaving, setBanSaving] = useState(false);
  const { showNotification } = useNotification();

  const updateBan = async () => {
    const user = userState.data;
    if (!user) return;
    setBanSaving(true);
    try {
      await setUserBanned(id, !user.is_banned, user.is_banned ? undefined : banReason);
      showNotification(user.is_banned ? 'Compte débanni.' : 'Compte banni et sessions révoquées.', 'success');
      setBanOpen(false);
      setBanReason('');
      userState.reload();
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    } finally {
      setBanSaving(false);
    }
  };

  const user = !userState.loading && !userState.error ? userState.data : null;
  return (
    <>
      <Button component={RouterLink} to="/users" startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        Retour aux utilisateurs
      </Button>
      <PageHeader
        title={user?.firstname || 'Profil utilisateur'}
        description={id}
        actions={user && (
          <Button
            variant={user.is_banned ? 'outlined' : 'contained'}
            color={user.is_banned ? 'success' : 'error'}
            startIcon={user.is_banned ? <CheckCircleOutline /> : <BlockOutlined />}
            onClick={() => setBanOpen(true)}
          >
            {user.is_banned ? 'Débannir' : 'Bannir'}
          </Button>
        )}
      />
      <AsyncState loading={userState.loading} error={userState.error} onRetry={userState.reload} />
      {user && (
        <>
          <UserProfile user={user} />
          <UserMatches userId={id} />
        </>
      )}
      <ConfirmActionDialog
        open={banOpen}
        title={user?.is_banned ? 'Débannir ce compte ?' : 'Bannir ce compte ?'}
        description={user?.is_banned ? 'Le compte pourra de nouveau se connecter.' : 'Toutes les sessions actives seront immédiatement révoquées.'}
        confirmLabel={user?.is_banned ? 'Débannir' : 'Bannir'}
        danger={!user?.is_banned}
        value={banReason}
        onValueChange={setBanReason}
        valueLabel={user?.is_banned ? undefined : 'Motif obligatoire'}
        requireValue={!user?.is_banned}
        loading={banSaving}
        onCancel={() => setBanOpen(false)}
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
