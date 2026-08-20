import { ArrowBack, BlockOutlined, ChatOutlined, CheckCircleOutline } from '@mui/icons-material';
import { Avatar, Box, Button, Chip, Divider, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { getMatchMessages, getUser, getUserMatches, setUserBanned } from '../api/admin';
import { errorMessage } from '../api/client';
import type { ChatMessage, Match } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { UserLink } from '../components/UserLink';
import { useNotification } from '../components/notification-context';
import { useAsyncData } from '../hooks/useAsyncData';
import { compactId, formatDate, formatDateOnly } from '../utils/format';

export default function UserDetails() {
  const { id = '' } = useParams();
  const load = useCallback(async () => ({ user: await getUser(id), matches: await getUserMatches(id) }), [id]);
  const { data, loading, error, reload } = useAsyncData(load);
  const [banOpen, setBanOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messageReason, setMessageReason] = useState('');
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const { showNotification } = useNotification();

  const updateBan = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await setUserBanned(id, !data.user.is_banned, data.user.is_banned ? undefined : banReason);
      showNotification(data.user.is_banned ? 'Compte débanni.' : 'Compte banni et sessions révoquées.', 'success');
      setBanOpen(false); setBanReason(''); reload();
    } catch (reason) { showNotification(errorMessage(reason), 'error'); }
    finally { setSaving(false); }
  };

  const loadMessages = async () => {
    if (!selectedMatch) return;
    setSaving(true);
    try { setMessages(await getMatchMessages(selectedMatch.id, messageReason.trim())); }
    catch (reason) { showNotification(errorMessage(reason), 'error'); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Button component={RouterLink} to="/users" startIcon={<ArrowBack />} sx={{ mb: 2 }}>Retour aux utilisateurs</Button>
      <PageHeader title={data?.user.firstname || 'Profil utilisateur'} description={id} actions={data && <Button variant={data.user.is_banned ? 'outlined' : 'contained'} color={data.user.is_banned ? 'success' : 'error'} startIcon={data.user.is_banned ? <CheckCircleOutline /> : <BlockOutlined />} onClick={() => setBanOpen(true)}>{data.user.is_banned ? 'Débannir' : 'Bannir'}</Button>} />
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {data && (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(320px, .8fr) 1.2fr' }, gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}><Avatar src={data.user.photo || undefined} sx={{ width: 64, height: 64 }}>{data.user.firstname?.[0]}</Avatar><Box><Typography variant="h6" fontWeight={800}>{data.user.firstname || 'Profil incomplet'}</Typography><StatusChip value={data.user.is_banned ? 'banned' : 'active'} /></Box></Box>
              <Divider sx={{ my: 2 }} />
              <Field label="Rôle" value={data.user.role} /><Field label="Plan" value={data.user.plan} /><Field label="Naissance" value={formatDateOnly(data.user.birthdate)} /><Field label="Sexe" value={data.user.sex || '—'} /><Field label="Création" value={formatDate(data.user.created_at)} /><Field label="Onboarding" value={data.user.onboarding_complete ? 'Terminé' : 'Incomplet'} /><Field label="Signalements reçus" value={String(data.user.reports_received)} /><Field label="Matchs" value={String(data.user.matches_count)} />
              {data.user.banned_reason && <Box sx={{ mt: 2, p: 2, bgcolor: 'error.main', color: 'error.contrastText', borderRadius: 2 }}><Typography variant="caption">Motif du bannissement</Typography><Typography>{data.user.banned_reason}</Typography></Box>}
            </Paper>
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Paper variant="outlined" sx={{ p: 3 }}><Typography variant="h6" fontWeight={750}>Préférences</Typography>{data.user.preferences ? <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1, mt: 2 }}><Field label="Âge minimum" value={String(data.user.preferences.min_age)} /><Field label="Âge maximum" value={String(data.user.preferences.max_age)} /><Field label="Distance maximum" value={`${data.user.preferences.max_distance_km} km`} /><Field label="Recherche" value={data.user.preferences.looking_for} /></Box> : <Typography color="text.secondary" sx={{ mt: 1 }}>Non renseignées.</Typography>}</Paper>
              <Paper variant="outlined" sx={{ p: 3 }}><Typography variant="h6" fontWeight={750}>Traits</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>{data.user.traits.length ? data.user.traits.map((trait) => <Chip key={trait.id} label={trait.name} />) : <Typography color="text.secondary">Aucun trait.</Typography>}</Box></Paper>
              <Paper variant="outlined" sx={{ p: 3 }}><Typography variant="h6" fontWeight={750}>Consentements et présence</Typography><Box sx={{ mt: 2 }}>{data.user.consents.map((consent) => <Box key={consent.consent_type} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}><Typography variant="body2">{consent.consent_type}</Typography><StatusChip value={consent.granted ? 'completed' : 'rejected'} /></Box>)}</Box><Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Présence : {data.user.presence ? `${data.user.presence.is_location_fresh ? 'fraîche' : 'obsolète'} · ${formatDate(data.user.presence.updated_at)}` : 'aucune donnée conservée'}</Typography></Paper>
            </Box>
          </Box>
          <Paper variant="outlined" sx={{ mt: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 2.5 }}><Typography variant="h6" fontWeight={750}>Matchs</Typography><Typography variant="body2" color="text.secondary">La consultation est inscrite au journal d’accès.</Typography></Box>
            <Table size="small"><TableHead><TableRow><TableCell>Match</TableCell><TableCell>Autre participant</TableCell><TableCell>État</TableCell><TableCell>Dernière activité</TableCell><TableCell align="right">Conversation</TableCell></TableRow></TableHead><TableBody>
              {data.matches.map((match) => { const other = match.user1_id === id ? match.user2_id : match.user1_id; return <TableRow key={match.id}><TableCell>{compactId(match.id)}</TableCell><TableCell><UserLink id={other} /></TableCell><TableCell><StatusChip value={match.status} /></TableCell><TableCell>{formatDate(match.last_message_at || match.created_at)}</TableCell><TableCell align="right"><Button size="small" startIcon={<ChatOutlined />} onClick={() => { setSelectedMatch(match); setMessages(null); setMessageReason(''); }}>Consulter</Button></TableCell></TableRow>; })}
              {!data.matches.length && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>Aucun match conservé.</TableCell></TableRow>}
            </TableBody></Table>
          </Paper>
          {selectedMatch && messages && <Conversation match={selectedMatch} messages={messages} onClose={() => { setSelectedMatch(null); setMessages(null); }} />}
        </>
      )}
      <ConfirmActionDialog open={banOpen} title={data?.user.is_banned ? 'Débannir ce compte ?' : 'Bannir ce compte ?'} description={data?.user.is_banned ? 'Le compte pourra de nouveau se connecter.' : 'Toutes les sessions actives seront immédiatement révoquées.'} confirmLabel={data?.user.is_banned ? 'Débannir' : 'Bannir'} danger={!data?.user.is_banned} value={banReason} onValueChange={setBanReason} valueLabel={data?.user.is_banned ? undefined : 'Motif obligatoire'} requireValue={!data?.user.is_banned} loading={saving} onCancel={() => setBanOpen(false)} onConfirm={() => void updateBan()} />
      <ConfirmActionDialog open={Boolean(selectedMatch && !messages)} title="Justifier l’accès à la conversation" description="Les deux participants verront cet accès représenté dans le journal de traçabilité." confirmLabel="Ouvrir la conversation" value={messageReason} onValueChange={setMessageReason} valueLabel="Motif obligatoire" requireValue loading={saving} onCancel={() => setSelectedMatch(null)} onConfirm={() => void loadMessages()} />
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <Box sx={{ mb: 1.5 }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={600}>{value}</Typography></Box>;
}

function Conversation({ match, messages, onClose }: { match: Match; messages: ChatMessage[]; onClose: () => void }) {
  return <Paper variant="outlined" sx={{ mt: 2, p: 2.5 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Box><Typography variant="h6">Conversation {compactId(match.id)}</Typography><Typography variant="caption" color="text.secondary">Accès justifié et journalisé</Typography></Box><Button onClick={onClose}>Fermer</Button></Box><Box sx={{ maxHeight: 520, overflowY: 'auto', bgcolor: 'action.hover', borderRadius: 2, p: 2 }}>{messages.map((message) => <Box key={message.id} sx={{ display: 'flex', justifyContent: message.sender_id === match.user1_id ? 'flex-start' : 'flex-end', mb: 1 }}><Paper sx={{ p: 1.5, maxWidth: '75%' }}><Typography variant="caption" color="text.secondary">{compactId(message.sender_id)} · {formatDate(message.created_at)}</Typography><Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.content}</Typography></Paper></Box>)}{!messages.length && <Typography textAlign="center" color="text.secondary">Aucun message conservé.</Typography>}</Box></Paper>;
}
