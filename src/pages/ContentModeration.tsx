import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
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
import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getModerationCases, getModerationDetail, reviewModerationCase } from '../api/admin';
import { errorMessage } from '../api/client';
import type {
  AdminSession,
  ModerationCase,
  ModerationContentType,
  ModerationDetail,
  ModerationReasonCode,
  ModerationStatus,
  PhotoReviewChecks,
} from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { CursorPaginationControls } from '../components/CursorPaginationControls';
import { PageHeader } from '../components/PageHeader';
import { StatusChip } from '../components/StatusChip';
import { UserLink } from '../components/UserLink';
import { useNotification } from '../components/notification-context';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { formatDate, formatNumber } from '../utils/format';

const contentLabels = (): Record<ModerationContentType, string> => ({
  photo: t("common.photo"),
  bio: t("common.bio"),
  profile_answer: t("common.profileAnswer"),
});

const reasonLabels = (): Record<ModerationReasonCode, string> => ({
  spam: t("common.spam"),
  insult: t("common.insult"),
  personal_contact: t("contentModeration.personalContactDetails"),
  sexual_content: t("common.sexualContent"),
  face_not_detected: t("common.noFace"),
  multiple_faces: t("common.multipleFaces"),
  blurry: t("common.blurryPhoto"),
  explicit_image: t("contentModeration.potentiallyExplicitImage"),
  analysis_unavailable: t("common.analysisUnavailable"),
  legacy_unreviewed: t("contentModeration.unreviewedLegacyContent"),
});

const initialChecks: PhotoReviewChecks = {
  face_detectable: false,
  sharp_enough: false,
  content_allowed: false,
};
const moderationKey = (item: ModerationCase) => item.case_id;

export default function ContentModeration() {
  useLocale();
  const session = useOutletContext<AdminSession>();
  const [statusFilter, setStatusFilter] = useState<'' | ModerationStatus>('pending');
  const [typeFilter, setTypeFilter] = useState<'' | ModerationContentType>('');
  const [selected, setSelected] = useState<ModerationCase | null>(null);
  const [accessReason, setAccessReason] = useState('');
  const [detail, setDetail] = useState<ModerationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [checks, setChecks] = useState<PhotoReviewChecks>(initialChecks);
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const loadPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getModerationCases(
      statusFilter || undefined,
      typeFilter || undefined,
      cursor,
      signal,
    );
    return { items: page.cases, nextCursor: page.next_cursor };
  }, [statusFilter, typeFilter]);
  const pagination = useCursorPagination(loadPage, moderationKey);

  const requestDetail = (item: ModerationCase) => {
    if (session.role === 'superadmin') {
      void openDetail(item, '');
      return;
    }
    setSelected(item);
    setAccessReason('');
  };

  const openDetail = async (item: ModerationCase, accessReason: string) => {
    setDetailLoading(true);
    try {
      const loaded = await getModerationDetail(item.case_id, accessReason.trim());
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
      showNotification(decision === 'approved' ? t("common.contentApproved") : t("common.contentRejected"), 'success');
      setDetail(null);
      pagination.reload();
    } catch (reviewError) {
      showNotification(errorMessage(reviewError), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("contentModeration.contentModeration")}
        description={t("contentModeration.auditedReviewOfPhotosBiosAndAnswersFlaggedBy")}
        actions={<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Filter label={t("common.status")} value={statusFilter} onChange={(value) => setStatusFilter(value as '' | ModerationStatus)} items={[['', t("common.all")], ['pending', t("common.pending")], ['approved', t("contentModeration.approved")], ['rejected', t("contentModeration.rejected")]]} />
          <Filter label={t("common.content")} value={typeFilter} onChange={(value) => setTypeFilter(value as '' | ModerationContentType)} items={[['', t("common.all")], ['photo', t("common.photos")], ['bio', t("common.bios")], ['profile_answer', t("common.answers")]]} />
        </Stack>}
      />
      <AsyncState loading={pagination.loading} error={pagination.error} onRetry={pagination.reload} />
      {!pagination.loading && !pagination.error && <TableContainer component={Paper} variant="outlined"><Table size="small">
        <TableHead><TableRow><TableCell>{t("common.updated")}</TableCell><TableCell>{t("common.user")}</TableCell><TableCell>{t("common.type")}</TableCell><TableCell>{t("common.signals")}</TableCell><TableCell>{t("common.status")}</TableCell><TableCell align="right">{t("common.action")}</TableCell></TableRow></TableHead>
        <TableBody>
          {pagination.items.map((item) => <TableRow key={item.case_id} hover>
            <TableCell>{formatDate(item.updated_at)}</TableCell>
            <TableCell><UserLink id={item.user_id} label={item.firstname} /></TableCell>
            <TableCell>{contentLabels()[item.content_type]}</TableCell>
            <TableCell><ReasonChips reasons={item.reason_codes} /></TableCell>
            <TableCell><StatusChip value={item.status} /></TableCell>
            <TableCell align="right"><Button size="small" disabled={detailLoading} onClick={() => requestDetail(item)}>{t("common.review")}</Button></TableCell>
          </TableRow>)}
          {!pagination.items.length && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>{t("contentModeration.noContentInThisQueue")}</TableCell></TableRow>}
        </TableBody>
      </Table><CursorPaginationControls nextCursor={pagination.nextCursor} loading={pagination.loadingMore} error={pagination.loadMoreError} onLoadMore={pagination.loadMore} onReload={pagination.reload} /></TableContainer>}
      {session.role !== 'superadmin' && <AccessReasonDialog
        item={selected}
        reason={accessReason}
        loading={detailLoading}
        onReasonChange={setAccessReason}
        onClose={() => setSelected(null)}
        onConfirm={() => { if (selected) void openDetail(selected, accessReason); }}
      />}
      <ReviewDialog
        detail={detail}
        reason={reason}
        checks={checks}
        saving={saving}
        superadmin={session.role === 'superadmin'}
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
  useLocale();
  return <Dialog open={Boolean(item)} maxWidth="xs" fullWidth onClose={loading ? undefined : onClose}>
    <DialogTitle>{t("contentModeration.justifyAccessToTheContent")}</DialogTitle>
    <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      <Alert severity="info">{t("contentModeration.thisViewWillBeRecordedInTheAccessLog")}</Alert>
      <TextField
        autoFocus
        label={t("contentModeration.reasonForViewing")}
        value={reason}
        onChange={(event) => onReasonChange(event.target.value)}
        multiline
        minRows={2}
        inputProps={{ maxLength: 500 }}
        required
      />
    </Stack></DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>{t("common.cancel")}</Button>
      <Button variant="contained" onClick={onConfirm} disabled={loading || reason.trim().length < 3}>
        {loading ? t("common.opening") : t("common.openContent")}
      </Button>
    </DialogActions>
  </Dialog>;
}

function ReviewDialog({ detail, reason, checks, saving, superadmin, onReasonChange, onChecksChange, onClose, onReview }: {
  detail: ModerationDetail | null;
  reason: string;
  checks: PhotoReviewChecks;
  saving: boolean;
  superadmin: boolean;
  onReasonChange: (value: string) => void;
  onChecksChange: (value: PhotoReviewChecks) => void;
  onClose: () => void;
  onReview: (decision: 'approved' | 'rejected') => void;
}) {
  useLocale();
  if (!detail) return null;
  const photo = detail.content_type === 'photo';
  const allChecks = Object.values(checks).every(Boolean);
  return <Dialog open maxWidth="sm" fullWidth onClose={saving ? undefined : onClose}>
    <DialogTitle>{t("moderation.review", { type: contentLabels()[detail.content_type] })}</DialogTitle>
    <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
      <Box><StatusChip value={detail.status} /> <ReasonChips reasons={detail.reason_codes} /></Box>
      {detail.question && <Typography variant="subtitle2">{detail.question}</Typography>}
      {detail.content && <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{detail.content}</Paper>}
      {detail.photo && <Box component="img" src={detail.photo} alt={t("common.contentToReview")} sx={{ width: '100%', maxHeight: 480, objectFit: 'contain', bgcolor: 'black', borderRadius: 2 }} />}
      {photo && <>
        <Typography variant="body2" color="text.secondary">{t("moderation.signals", { faces: detail.face_count ?? t("common.missing"), sharpness: formatNumber(detail.sharpness_score, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), score: formatNumber(detail.nsfw_score, { minimumFractionDigits: 3, maximumFractionDigits: 3 }) })}</Typography>
        <Stack>
          <Check label={t("contentModeration.exactlyOneFaceIsClearlyDetectable")} checked={checks.face_detectable} onChange={(value) => onChecksChange({ ...checks, face_detectable: value })} />
          <Check label={t("contentModeration.thePhotoIsSharpEnough")} checked={checks.sharp_enough} onChange={(value) => onChecksChange({ ...checks, sharp_enough: value })} />
          <Check label={t("contentModeration.theContentIsAllowed")} checked={checks.content_allowed} onChange={(value) => onChecksChange({ ...checks, content_allowed: value })} />
        </Stack>
      </>}
      {detail.status !== 'pending' && <Alert severity="info">{t("contentModeration.thisDecisionWillBeReplacedWithAVersionCheck")}</Alert>}
      {!superadmin && <TextField label={t("common.reasonForTheDecision")} value={reason} onChange={(event) => onReasonChange(event.target.value)} multiline minRows={2} inputProps={{ maxLength: 500 }} required />}
    </Stack></DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={saving}>{t("common.cancel")}</Button>
      <Button color="error" onClick={() => onReview('rejected')} disabled={saving || (!superadmin && reason.trim().length < 3) || (photo && allChecks)}>{t("common.reject")}</Button>
      <Button variant="contained" onClick={() => onReview('approved')} disabled={saving || (!superadmin && reason.trim().length < 3) || (photo && !allChecks)}>{t("common.approve")}</Button>
    </DialogActions>
  </Dialog>;
}

function ReasonChips({ reasons }: { reasons: ModerationReasonCode[] }) {
  useLocale();
  if (!reasons.length) return <Typography variant="caption" color="text.secondary">{t("common.noSignals")}</Typography>;
  return <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">{reasons.map((reason) => <Chip key={reason} size="small" variant="outlined" label={reasonLabels()[reason]} />)}</Stack>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  useLocale();
  return <FormControlLabel control={<Checkbox checked={checked} onChange={(event) => onChange(event.target.checked)} />} label={label} />;
}

function Filter({ label, value, onChange, items }: { label: string; value: string; onChange: (value: string) => void; items: Array<[string, string]> }) {
  useLocale();
  return <FormControl size="small" sx={{ minWidth: 170 }}><InputLabel>{label}</InputLabel><Select label={label} value={value} onChange={(event) => onChange(event.target.value)}>{items.map(([itemValue, itemLabel]) => <MenuItem key={itemValue || 'all'} value={itemValue}>{itemLabel}</MenuItem>)}</Select></FormControl>;
}
