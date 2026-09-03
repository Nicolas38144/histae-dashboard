import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { getModerationCases, getModerationDetail, reviewModerationCase } from '../api/admin';
import { errorMessage } from '../api/client';
import type {
  ModerationCase,
  ModerationContentType,
  ModerationDetail,
  ModerationReasonCode,
  ModerationStatus,
  PhotoReviewChecks,
} from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { UserLink } from '../components/UserLink';
import { useNotification } from '../components/notification-context';
import { formatDate } from '../utils/format';

const contentLabels: Record<ModerationContentType, string> = {
  photo: 'Photo',
  bio: 'Bio',
  profile_answer: 'Réponse de profil',
};

const reasonLabels: Record<ModerationReasonCode, string> = {
  spam: 'Spam',
  insult: 'Insulte',
  personal_contact: 'Coordonnées personnelles',
  sexual_content: 'Contenu sexuel',
  face_not_detected: 'Visage absent',
  multiple_faces: 'Plusieurs visages',
  blurry: 'Photo floue',
  explicit_image: 'Image potentiellement explicite',
  analysis_unavailable: 'Analyse indisponible',
  legacy_unreviewed: 'Contenu antérieur non revu',
};

const initialChecks: PhotoReviewChecks = {
  face_detectable: false,
  sharp_enough: false,
  content_allowed: false,
};

export default function ContentModeration() {
  const [statusFilter, setStatusFilter] = useState<'' | ModerationStatus>('pending');
  const [typeFilter, setTypeFilter] = useState<'' | ModerationContentType>('');
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ModerationCase | null>(null);
  const [accessReason, setAccessReason] = useState('');
  const [detail, setDetail] = useState<ModerationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [checks, setChecks] = useState<PhotoReviewChecks>(initialChecks);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const load = useCallback(async (nextCursor?: string) => {
    if (nextCursor) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const page = await getModerationCases(statusFilter || undefined, typeFilter || undefined, nextCursor);
      setCases((current) => nextCursor ? [...current, ...page.cases] : page.cases);
      setCursor(page.next_cursor);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => { void load(); }, [load]);

  const requestDetail = (item: ModerationCase) => {
    setSelected(item);
    setAccessReason('');
  };

  const openDetail = async () => {
    if (!selected) return;
    setDetailLoading(true);
    try {
      const loaded = await getModerationDetail(selected.case_id, accessReason.trim());
      setDetail(loaded);
      setChecks(loaded.content_type === 'photo' ? {
        face_detectable: loaded.face_detectable ?? false,
        sharp_enough: loaded.sharp_enough ?? false,
        content_allowed: loaded.content_allowed ?? false,
      } : initialChecks);
      setReason('');
      setSelected(null);
    } catch (loadError) {
      showNotification(errorMessage(loadError), 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  const review = async (decision: 'approved' | 'rejected') => {
    if (!detail) return;
    setSaving(true);
    try {
      await reviewModerationCase(detail, decision, reason.trim(), detail.content_type === 'photo' ? checks : undefined);
      showNotification(decision === 'approved' ? 'Contenu approuvé.' : 'Contenu refusé.', 'success');
      setDetail(null);
      await load();
    } catch (reviewError) {
      showNotification(errorMessage(reviewError), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Modération des contenus"
        description="Revue auditée des photos, bios et réponses signalées par les contrôles automatiques."
        actions={<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Filter label="État" value={statusFilter} onChange={(value) => setStatusFilter(value as '' | ModerationStatus)} items={[['', 'Tous'], ['pending', 'En attente'], ['approved', 'Approuvés'], ['rejected', 'Refusés']]} />
          <Filter label="Contenu" value={typeFilter} onChange={(value) => setTypeFilter(value as '' | ModerationContentType)} items={[['', 'Tous'], ['photo', 'Photos'], ['bio', 'Bios'], ['profile_answer', 'Réponses']]} />
        </Stack>}
      />
      <AsyncState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && !error && <TableContainer component={Paper} variant="outlined"><Table size="small">
        <TableHead><TableRow><TableCell>Mise à jour</TableCell><TableCell>Utilisateur</TableCell><TableCell>Type</TableCell><TableCell>Signaux</TableCell><TableCell>État</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
        <TableBody>
          {cases.map((item) => <TableRow key={item.case_id} hover>
            <TableCell>{formatDate(item.updated_at)}</TableCell>
            <TableCell><UserLink id={item.user_id} />{item.firstname && <Typography variant="caption" display="block">{item.firstname}</Typography>}</TableCell>
            <TableCell>{contentLabels[item.content_type]}</TableCell>
            <TableCell><ReasonChips reasons={item.reason_codes} /></TableCell>
            <TableCell><StatusChip value={item.status} /></TableCell>
            <TableCell align="right"><Button size="small" disabled={detailLoading} onClick={() => requestDetail(item)}>Examiner</Button></TableCell>
          </TableRow>)}
          {!cases.length && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>Aucun contenu dans cette file.</TableCell></TableRow>}
        </TableBody>
      </Table>{cursor && <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><Button disabled={loadingMore} onClick={() => void load(cursor)}>{loadingMore ? 'Chargement…' : 'Charger la suite'}</Button></Box>}</TableContainer>}
      <AccessReasonDialog
        item={selected}
        reason={accessReason}
        loading={detailLoading}
        onReasonChange={setAccessReason}
        onClose={() => setSelected(null)}
        onConfirm={() => void openDetail()}
      />
      <ReviewDialog
        detail={detail}
        reason={reason}
        checks={checks}
        saving={saving}
        onReasonChange={setReason}
        onChecksChange={setChecks}
        onClose={() => setDetail(null)}
        onReview={review}
      />
    </>
  );
}

function AccessReasonDialog({ item, reason, loading, onReasonChange, onClose, onConfirm }: {
  item: ModerationCase | null;
  reason: string;
  loading: boolean;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return <Dialog open={Boolean(item)} maxWidth="xs" fullWidth onClose={loading ? undefined : onClose}>
    <DialogTitle>Justifier l’accès au contenu</DialogTitle>
    <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      <Alert severity="info">Cette consultation sera inscrite dans le journal d’accès.</Alert>
      <TextField
        autoFocus
        label="Motif de consultation"
        value={reason}
        onChange={(event) => onReasonChange(event.target.value)}
        multiline
        minRows={2}
        inputProps={{ maxLength: 500 }}
        required
      />
    </Stack></DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>Annuler</Button>
      <Button variant="contained" onClick={onConfirm} disabled={loading || reason.trim().length < 3}>
        {loading ? 'Ouverture…' : 'Ouvrir le contenu'}
      </Button>
    </DialogActions>
  </Dialog>;
}

function ReviewDialog({ detail, reason, checks, saving, onReasonChange, onChecksChange, onClose, onReview }: {
  detail: ModerationDetail | null;
  reason: string;
  checks: PhotoReviewChecks;
  saving: boolean;
  onReasonChange: (value: string) => void;
  onChecksChange: (value: PhotoReviewChecks) => void;
  onClose: () => void;
  onReview: (decision: 'approved' | 'rejected') => void;
}) {
  if (!detail) return null;
  const photo = detail.content_type === 'photo';
  const allChecks = Object.values(checks).every(Boolean);
  return <Dialog open maxWidth="sm" fullWidth onClose={saving ? undefined : onClose}>
    <DialogTitle>Examiner : {contentLabels[detail.content_type]}</DialogTitle>
    <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      <Box><StatusChip value={detail.status} /> <ReasonChips reasons={detail.reason_codes} /></Box>
      {detail.question && <Typography variant="subtitle2">{detail.question}</Typography>}
      {detail.content && <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{detail.content}</Paper>}
      {detail.photo && <Box component="img" src={detail.photo} alt="Contenu à modérer" sx={{ width: '100%', maxHeight: 480, objectFit: 'contain', bgcolor: 'black', borderRadius: 2 }} />}
      {photo && <>
        <Typography variant="body2" color="text.secondary">Signaux : {detail.face_count ?? '—'} visage(s), netteté {detail.sharpness_score?.toFixed(1) ?? '—'}, score explicite {detail.nsfw_score?.toFixed(3) ?? '—'}.</Typography>
        <Stack>
          <Check label="Un seul visage est clairement détectable" checked={checks.face_detectable} onChange={(value) => onChecksChange({ ...checks, face_detectable: value })} />
          <Check label="La photo est suffisamment nette" checked={checks.sharp_enough} onChange={(value) => onChecksChange({ ...checks, sharp_enough: value })} />
          <Check label="Le contenu est autorisé" checked={checks.content_allowed} onChange={(value) => onChecksChange({ ...checks, content_allowed: value })} />
        </Stack>
      </>}
      {detail.status !== 'pending' && <Alert severity="info">Cette décision sera remplacée avec contrôle de version et restera auditée.</Alert>}
      <TextField label="Motif de la décision" value={reason} onChange={(event) => onReasonChange(event.target.value)} multiline minRows={2} inputProps={{ maxLength: 500 }} required />
    </Stack></DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={saving}>Annuler</Button>
      <Button color="error" onClick={() => onReview('rejected')} disabled={saving || reason.trim().length < 3 || (photo && allChecks)}>Refuser</Button>
      <Button variant="contained" onClick={() => onReview('approved')} disabled={saving || reason.trim().length < 3 || (photo && !allChecks)}>Approuver</Button>
    </DialogActions>
  </Dialog>;
}

function ReasonChips({ reasons }: { reasons: ModerationReasonCode[] }) {
  if (!reasons.length) return <Typography variant="caption" color="text.secondary">Aucun signal</Typography>;
  return <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">{reasons.map((reason) => <Chip key={reason} size="small" variant="outlined" label={reasonLabels[reason]} />)}</Stack>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <FormControlLabel control={<Checkbox checked={checked} onChange={(event) => onChange(event.target.checked)} />} label={label} />;
}

function Filter({ label, value, onChange, items }: { label: string; value: string; onChange: (value: string) => void; items: Array<[string, string]> }) {
  return <FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>{label}</InputLabel><Select label={label} value={value} onChange={(event) => onChange(event.target.value)}>{items.map(([itemValue, itemLabel]) => <MenuItem key={itemValue || 'all'} value={itemValue}>{itemLabel}</MenuItem>)}</Select></FormControl>;
}
