import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Paper, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { getSmsSafety, setSmsSuspension } from '../api/admin';
import { errorMessage } from '../api/client';
import { useAsyncData } from '../hooks/useAsyncData';
import { t } from '../i18n/core';
import { useLocale } from '../i18n/useLocale';
import { formatNumber } from '../utils/format';
import { AsyncState } from './AsyncState';

export function SmsSafetyPanel({ canManage }: { canManage: boolean }) {
  useLocale();
  const load = useCallback(() => getSmsSafety(), []);
  const { data, loading, error, reload } = useAsyncData(load);
  const [confirm, setConfirm] = useState<{ suspended: boolean; version: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);
  useEffect(() => {
    const interval = window.setInterval(reload, 30_000);
    return () => window.clearInterval(interval);
  }, [reload]);
  const targetSuspended = data ? !data.manual_suspended : true;
  const act = async () => {
    if (!data || !confirm || saving || confirm.version !== data.version) return;
    setSaving(true);
    setActionError(null);
    try {
      await setSmsSuspension(confirm.suspended, confirm.version);
      setConfirm(null);
    } catch (reason: unknown) {
      setActionError(reason);
      setConfirm(null);
    } finally {
      setSaving(false);
      // A lost mutation response is resolved by a read, never an automatic retry.
      reload();
    }
  };
  return (
    <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" fontWeight={700}>{t('smsSafety.title')}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{t('smsSafety.description')}</Typography>
      <AsyncState loading={loading && !data} error={error} onRetry={reload} />
      {actionError !== null && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage(actionError)}</Alert>}
      {data && <>
        {!data.provider_enabled && <Alert severity="info" sx={{ mb: 2 }}>{t('smsSafety.providerDisabled')}</Alert>}
        <Alert severity={data.suspended ? 'warning' : 'success'} sx={{ mb: 2 }}>
          {data.suspended ? t('smsSafety.suspended') : t('smsSafety.active')}
        </Alert>
        {data.environment_suspended && <Alert severity="info" sx={{ mb: 2 }}>{t('smsSafety.environmentStop')}</Alert>}
        {data.traffic_spike && data.provider_enabled && <Alert severity="warning" sx={{ mb: 2 }}>{t('smsSafety.spike')}</Alert>}
        <Typography>{t('smsSafety.limits', { hour: data.hourly_limit_per_phone, day: data.daily_limit_per_phone })}</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, my: 2 }}>
          {([
            ['smsSafety.last5Minutes', data.sends_last_5_minutes],
            ['smsSafety.lastHour', data.sends_last_hour],
            ['smsSafety.last24Hours', data.sends_last_24_hours],
          ] as const).map(([key, value]) => <Box key={key}>
            <Typography variant="body2" color="text.secondary">{t(key)}</Typography>
            <Typography variant="h5">{formatNumber(value)}</Typography>
          </Box>)}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{t('smsSafety.accounting')}</Typography>
        {canManage && <Button variant="contained" color={targetSuspended ? 'warning' : 'primary'}
          disabled={saving || loading || Boolean(error) || data.environment_suspended}
          onClick={() => setConfirm({ suspended: targetSuspended, version: data.version })}>
          {targetSuspended ? t('smsSafety.pause') : t('smsSafety.resume')}
        </Button>}
      </>}
      <Dialog open={confirm !== null} onClose={() => { if (!saving) setConfirm(null); }}>
        <DialogTitle>{confirm?.suspended ? t('smsSafety.pause') : t('smsSafety.resume')}</DialogTitle>
        <DialogContent><DialogContentText>{confirm?.suspended ? t('smsSafety.confirmPause') : t('smsSafety.confirmResume')}</DialogContentText>{confirm && data && confirm.version !== data.version && <Alert severity="warning">{t("errors.thisContentHasChangedReloadItBeforeMakingA")}</Alert>}</DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setConfirm(null)}>{t('common.cancel')}</Button>
          <Button disabled={saving || loading || Boolean(error) || confirm?.version !== data?.version} onClick={() => { void act(); }}>{t('common.confirm')}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
