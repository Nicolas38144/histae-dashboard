import { CardGiftcardOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Chip, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import { setUserComplimentaryPremium } from '../../api/admin';
import { errorMessage } from '../../api/client';
import type { AdminUserDetail } from '../../api/types';
import { ConfirmActionDialog } from '../../components/ConfirmActionDialog';
import { useNotification } from '../../components/notification-context';
import { t } from '../../i18n/core';
import { useLocale } from '../../i18n/useLocale';

export function ComplimentaryPremiumPanel({ user, canManage, onUpdated }: {
  user: AdminUserDetail;
  canManage: boolean;
  onUpdated: () => void;
}) {
  useLocale();
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const enabled = user.complimentary_premium;
  const review = user.is_review_account;
  const status = review ? 'premiumGift.review' : enabled ? user.is_banned ? 'premiumGift.suspended' : 'premiumGift.active' : 'premiumGift.none';

  const update = async () => {
    if (saving || !canManage || review || (!enabled && user.is_banned)) return;
    setSaving(true);
    setFailure(null);
    try {
      await setUserComplimentaryPremium(user.user_id, !enabled);
      showNotification(t(enabled ? 'premiumGift.revoked' : 'premiumGift.granted'), 'success');
      setConfirming(false);
      onUpdated();
    } catch (error) {
      setFailure(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return <Paper variant="outlined" sx={{ p: 3 }}>
    <Typography variant="h6" fontWeight={750}>{t('premiumGift.title')}</Typography>
    <Box sx={{ mt: 1, mb: 2 }}>
      <Chip color={(enabled || review) && !user.is_banned ? 'success' : 'default'} label={t(status)} />
    </Box>
    <Typography variant="body2" color="text.secondary">{t('premiumGift.description')}</Typography>
    {user.is_banned && !review && <Typography variant="body2" sx={{ mt: 1 }}>{t('premiumGift.banned')}</Typography>}
    {canManage && !review && <Button
      variant="outlined"
      color={enabled ? 'error' : 'primary'}
      startIcon={<CardGiftcardOutlined />}
      sx={{ mt: 2 }}
      disabled={saving || (!enabled && user.is_banned)}
      onClick={() => { setFailure(null); setConfirming(true); }}
    >{t(enabled ? 'premiumGift.revoke' : 'premiumGift.grant')}</Button>}
    <ConfirmActionDialog
      open={confirming}
      title={t(enabled ? 'premiumGift.revokeTitle' : 'premiumGift.grantTitle')}
      description={t(enabled ? 'premiumGift.revokeDescription' : 'premiumGift.grantDescription')}
      confirmLabel={t(enabled ? 'premiumGift.revoke' : 'premiumGift.grant')}
      danger={enabled}
      loading={saving}
      onCancel={() => setConfirming(false)}
      onConfirm={() => void update()}
    >
      {failure && <Alert severity="error" sx={{ mt: 2 }}>{failure}</Alert>}
    </ConfirmActionDialog>
  </Paper>;
}
