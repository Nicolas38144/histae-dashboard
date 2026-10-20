import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { AddOutlined, KeyOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { addCredential, getAdminCredentials, renameCredential, revokeCredential } from '../api/auth';
import { errorMessage } from '../api/client';
import type { AdminCredential } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { useNotification } from '../components/notification-context';
import { PageHeader } from '../components/PageHeader';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatDate } from '../utils/format';
import { AdminSecurityHistory } from '../components/AdminSecurityHistory';

export default function Security() {
  useLocale();
  const loader = useCallback(() => getAdminCredentials(), []);
  const { data, loading, error, reload } = useAsyncData(loader);
  const [newName, setNewName] = useState<string | null>(null);
  const passkeyName = newName ?? t("common.backupKey");
  const [adding, setAdding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [revoking, setRevoking] = useState<AdminCredential | null>(null);
  const [renaming, setRenaming] = useState<AdminCredential | null>(null);
  const [renamedName, setRenamedName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const { showNotification } = useNotification();

  const add = async () => {
    setAdding(true);
    try {
      await addCredential(passkeyName.trim());
      setAddOpen(false);
      setNewName(null);
      showNotification(t("security.theNewPasskeyHasBeenRegistered"), 'success');
      reload();
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    } finally {
      setAdding(false);
    }
  };

  const revoke = async () => {
    if (!revoking) return;
    setActionLoading(true);
    try {
      await revokeCredential(revoking.id);
      setRevoking(null);
      showNotification(t("security.thePasskeyHasBeenRevokedAndOtherSessionsHave"), 'success');
      reload();
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const rename = async () => {
    if (!renaming || !renamedName.trim()) return;
    setActionLoading(true);
    try {
      await renameCredential(renaming.id, renamedName);
      setRenaming(null);
      showNotification(t("security.thePasskeyHasBeenRenamed"), 'success');
      reload();
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title={t("common.accountSecurity")}
        description={t("security.manageThisAdministratorAccountSPasskeysAndActiveSessions")}
        actions={<Button variant="contained" startIcon={<AddOutlined />} onClick={() => setAddOpen(true)}>{t("common.addAPasskey")}</Button>}
      />
      <Alert severity="info" sx={{ mb: 3 }}>
        {t("security.keepAtLeastTwoWaysToSignInA")}</Alert>
      <AsyncState loading={loading} error={error} onRetry={reload} />
      {!loading && !error && (
        <Stack spacing={2}>
          {(data ?? []).map((credential) => (
            <Card key={credential.id} variant="outlined">
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <KeyOutlined color="primary" />
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Typography fontWeight={750}>{credential.name}</Typography>
                        {credential.current && <Chip size="small" color="primary" label={t("common.currentSession")} />}
                        <Chip size="small" variant="outlined" label={credential.device_type === 'singleDevice' ? t("common.deviceBound") : t("common.syncable")} />
                        {credential.backed_up && <Chip size="small" variant="outlined" label={t("common.backedUp")} />}
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {t("security.passkeyDates", { created: formatDate(credential.created_at), used: formatDate(credential.last_used_at) })}
                      </Typography>
                      {credential.transports.length > 0 && (
                        <Typography variant="caption" color="text.secondary">{t("security.transports", { transports: credential.transports.join(', ') })}</Typography>
                      )}
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button onClick={() => { setRenaming(credential); setRenamedName(credential.name); }}>{t("common.rename")}</Button>
                    <Button color="error" disabled={credential.current || (data?.length ?? 0) <= 1} onClick={() => setRevoking(credential)}>{t("common.revoke")}</Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <AdminSecurityHistory />

      <ConfirmActionDialog
        open={addOpen}
        title={t("common.addAPasskey")}
        description={t("security.yourBrowserWillAskYouToChooseAPasskey")}
        confirmLabel={t("common.continue")}
        value={passkeyName}
        onValueChange={setNewName}
        valueLabel={t("common.passkeyName")}
        requireValue
        maxValueLength={100}
        loading={adding}
        onCancel={() => setAddOpen(false)}
        onConfirm={add}
      />
      <ConfirmActionDialog
        open={Boolean(renaming)}
        title={t("security.renameThisPasskey")}
        description={t("security.theNameChangeWillBeAuditedAndRequiresRecent")}
        confirmLabel={t("common.rename")}
        value={renamedName}
        onValueChange={setRenamedName}
        valueLabel={t("common.passkeyName")}
        requireValue
        maxValueLength={100}
        loading={actionLoading}
        onCancel={() => setRenaming(null)}
        onConfirm={() => void rename()}
      />
      <ConfirmActionDialog
        open={Boolean(revoking)}
        title={t("security.revokeThisPasskey")}
        description={t("security.thePasskeyValueWillNoLongerBeAbleTo", { value0: revoking?.name ?? '' })}
        confirmLabel={t("common.revoke")}
        danger
        loading={actionLoading}
        onCancel={() => setRevoking(null)}
        onConfirm={revoke}
      />
    </Box>
  );
}
