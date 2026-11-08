import { useRef, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { correctProfileIdentity } from '../../api/admin';
import { errorMessage } from '../../api/client';
import type { AdminSession, AdminUserDetail, ProfileIdentityCorrection } from '../../api/types';
import { useNotification } from '../../components/notification-context';
import { t } from '../../i18n/core';
import { domainLabel } from '../../i18n/domain';
import { useLocale } from '../../i18n/useLocale';
import { clearUserNames } from '../../utils/userNames';
import { latestAdultBirthdate, validIdentityCorrection } from './identity-correction';

export function IdentityCorrectionButton({ user, role, onUpdated }: {
  user: AdminUserDetail;
  role: AdminSession['role'];
  onUpdated: () => void;
}) {
  useLocale();
  const [draft, setDraft] = useState<ProfileIdentityCorrection | null>(null);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const pending = useRef(false);
  const { showNotification } = useNotification();
  const canCorrect = role === 'superadmin' || user.role === 'user';

  const open = () => {
    setFailure(null);
    setDraft({ firstname: user.firstname ?? '', birthdate: user.birthdate?.slice(0, 10) ?? '', sex: user.sex, reason: '' });
  };
  const close = () => { if (!pending.current) setDraft(null); };
  const submit = async () => {
    if (!canCorrect || !draft || pending.current || !validIdentityCorrection(draft)) return;
    pending.current = true;
    setSaving(true);
    setFailure(null);
    try {
      await correctProfileIdentity(user.user_id, draft);
      clearUserNames();
      setDraft(null);
      showNotification(t('identityCorrection.saved'), 'success');
      onUpdated();
    } catch (error) {
      setFailure(error);
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };

  if (!canCorrect) return null;
  return <>
    <Button variant="outlined" onClick={open}>{t('identityCorrection.edit')}</Button>
    {draft && <Dialog open onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>{t('identityCorrection.title')}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ mt: 1 }}>
        <Alert severity="info">{t('identityCorrection.guidance')}</Alert>
        {failure !== null && <Alert severity="error">{errorMessage(failure)}</Alert>}
        <TextField required fullWidth label={t('identityCorrection.firstname')} value={draft.firstname} disabled={saving}
          onChange={(event) => setDraft({ ...draft, firstname: event.target.value })} />
        <TextField required fullWidth type="date" label={t('common.dateOfBirth')} value={draft.birthdate} disabled={saving}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: latestAdultBirthdate() } }}
          helperText={t('identityCorrection.adultRequired')} onChange={(event) => setDraft({ ...draft, birthdate: event.target.value })} />
        <TextField select fullWidth label={t('common.sex')} value={draft.sex ?? ''} disabled={saving}
          helperText={t('identityCorrection.consentHelp')}
          onChange={(event) => setDraft({ ...draft, sex: (event.target.value || null) as ProfileIdentityCorrection['sex'] })}>
          <MenuItem value="">{t('identityCorrection.unspecified')}</MenuItem>
          {(['male', 'female', 'other'] as const).map((sex) => <MenuItem key={sex} value={sex}>{domainLabel(sex)}</MenuItem>)}
        </TextField>
        <TextField required fullWidth multiline minRows={2} label={t('identityCorrection.reason')} value={draft.reason} disabled={saving}
          slotProps={{ htmlInput: { maxLength: 500 } }} helperText={t('identityCorrection.reasonHelp')}
          onChange={(event) => setDraft({ ...draft, reason: event.target.value })} />
      </Stack></DialogContent>
      <DialogActions>
        <Button disabled={saving} onClick={close}>{t('common.cancel')}</Button>
        <Button variant="contained" disabled={saving || !validIdentityCorrection(draft)} onClick={() => void submit()}>{t('identityCorrection.save')}</Button>
      </DialogActions>
    </Dialog>}
  </>;
}
