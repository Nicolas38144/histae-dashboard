import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import type { PhoneChange, PhoneDecision, PhoneEntry, PhoneTarget } from '../api/phone-blocklist';
import { t } from '../i18n/core';
import { useLocale } from '../i18n/useLocale';

export function PhonePolicyDialog({ entry, target, isSuperadmin, saving, onSave, onClose }: {
  entry: PhoneEntry; target: PhoneTarget; isSuperadmin: boolean; saving: boolean;
  onSave: (change: PhoneChange) => void; onClose: () => void;
}) {
  useLocale();
  const [decision, setDecision] = useState<PhoneDecision>(!isSuperadmin || entry.blocked ? 'allow' : 'block');
  const [days, setDays] = useState('30');
  const [reason, setReason] = useState('');
  const validDays = decision === 'automatic' || (Number.isInteger(Number(days)) && Number(days) >= 1 && Number(days) <= 90);
  const validReason = isSuperadmin || (reason.trim().length >= 3 && reason.trim().length <= 500 && !/\p{Cc}/u.test(reason));
  const submit = () => {
    if (saving || !validDays || !validReason) return;
    onSave({ ...target, decision, version: entry.version,
      ...(decision === 'automatic' ? {} : { valid_days: Number(days) }),
      ...(!isSuperadmin ? { reason: reason.trim() } : {}),
    });
  };
  return <Dialog open onClose={() => { if (!saving) onClose(); }} fullWidth maxWidth="sm">
    <DialogTitle>{t('phoneBlocklist.reviewTitle', { phone: entry.phone_hint })}</DialogTitle>
    <DialogContent><Stack spacing={2} sx={{ mt: 1 }}>
      <Alert severity="info">{t('phoneBlocklist.exceptionHelp')}</Alert>
      <TextField select label={t('phoneBlocklist.decision')} value={decision} disabled={saving || !isSuperadmin}
        onChange={(event) => setDecision(event.target.value as PhoneDecision)}>
        <MenuItem value="allow">{t('phoneBlocklist.allow')}</MenuItem>
        {isSuperadmin && <MenuItem value="block">{t('phoneBlocklist.block')}</MenuItem>}
        {isSuperadmin && <MenuItem value="automatic">{t('phoneBlocklist.automatic')}</MenuItem>}
      </TextField>
      {decision !== 'automatic' && <TextField label={t('phoneBlocklist.days')} type="number" value={days}
        slotProps={{ htmlInput: { min: 1, max: 90, step: 1 } }} disabled={saving}
        onChange={(event) => setDays(event.target.value)} error={!validDays} />}
      {!isSuperadmin && <TextField label={t('phoneBlocklist.reason')} required multiline maxRows={4}
        value={reason} disabled={saving} slotProps={{ htmlInput: { maxLength: 500 } }}
        onChange={(event) => setReason(event.target.value)} helperText={t('phoneBlocklist.reasonHelp')} />}
    </Stack></DialogContent>
    <DialogActions>
      <Button disabled={saving} onClick={onClose}>{t('common.cancel')}</Button>
      <Button disabled={saving || !validDays || !validReason} onClick={submit}>{t('common.confirm')}</Button>
    </DialogActions>
  </Dialog>;
}
