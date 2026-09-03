import { AddOutlined, DevicesOutlined, KeyOutlined, LogoutOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { addCredential, getAdminCredentials, revokeCredential, revokeOtherSessions } from '../api/auth';
import { errorMessage } from '../api/client';
import type { AdminCredential } from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { useNotification } from '../components/notification-context';
import { PageHeader } from '../components/PageHeader';
import { useAsyncData } from '../hooks/useAsyncData';
import { formatDate } from '../utils/format';

export default function Security() {
  const loader = useCallback(() => getAdminCredentials(), []);
  const { data, loading, error, reload } = useAsyncData(loader);
  const [newName, setNewName] = useState('Clé de secours');
  const [adding, setAdding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [revoking, setRevoking] = useState<AdminCredential | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { showNotification } = useNotification();

  const add = async () => {
    setAdding(true);
    try {
      await addCredential(newName.trim());
      setAddOpen(false);
      setNewName('Clé de secours');
      showNotification('La nouvelle passkey a été enregistrée.', 'success');
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
      showNotification('La passkey a été révoquée et les autres sessions ont été fermées.', 'success');
      reload();
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const revokeSessions = async () => {
    setActionLoading(true);
    try {
      const count = await revokeOtherSessions();
      showNotification(`${count} autre${count === 1 ? '' : 's'} session${count === 1 ? '' : 's'} révoquée${count === 1 ? '' : 's'}.`, 'success');
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Sécurité du compte"
        description="Gérez les passkeys de ce compte administrateur et ses sessions actives."
        actions={<Button variant="contained" startIcon={<AddOutlined />} onClick={() => setAddOpen(true)}>Ajouter une passkey</Button>}
      />
      <Alert severity="info" sx={{ mb: 3 }}>
        Conservez au moins deux moyens d’accès. Une clé de sécurité physique distincte constitue la meilleure clé de secours.
      </Alert>
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
                        {credential.current && <Chip size="small" color="primary" label="Session actuelle" />}
                        <Chip size="small" variant="outlined" label={credential.device_type === 'singleDevice' ? 'Liée à un appareil' : 'Synchronisable'} />
                        {credential.backed_up && <Chip size="small" variant="outlined" label="Sauvegardée" />}
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Ajoutée le {formatDate(credential.created_at)} · Dernière utilisation {formatDate(credential.last_used_at)}
                      </Typography>
                      {credential.transports.length > 0 && (
                        <Typography variant="caption" color="text.secondary">Transports : {credential.transports.join(', ')}</Typography>
                      )}
                    </Box>
                  </Stack>
                  <Button
                    color="error"
                    disabled={credential.current || (data?.length ?? 0) <= 1}
                    onClick={() => setRevoking(credential)}
                  >
                    Révoquer
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
          <Divider sx={{ my: 1 }} />
          <Card variant="outlined">
            <CardContent>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} gap={2}>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center"><DevicesOutlined /><Typography fontWeight={750}>Autres sessions</Typography></Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Ferme toutes les sessions administrateur sauf celle utilisée actuellement.</Typography>
                </Box>
                <Button variant="outlined" startIcon={<LogoutOutlined />} disabled={actionLoading} onClick={revokeSessions}>Révoquer les autres sessions</Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}

      <ConfirmActionDialog
        open={addOpen}
        title="Ajouter une passkey"
        description="Votre navigateur vous demandera ensuite de choisir une passkey ou une clé de sécurité. Cette opération nécessite une connexion WebAuthn récente."
        confirmLabel="Continuer"
        value={newName}
        onValueChange={setNewName}
        valueLabel="Nom de la passkey"
        requireValue
        loading={adding}
        onCancel={() => setAddOpen(false)}
        onConfirm={add}
      />
      <ConfirmActionDialog
        open={Boolean(revoking)}
        title="Révoquer cette passkey ?"
        description={`La passkey « ${revoking?.name ?? ''} » ne pourra plus se connecter. Les autres sessions seront également fermées.`}
        confirmLabel="Révoquer"
        danger
        loading={actionLoading}
        onCancel={() => setRevoking(null)}
        onConfirm={revoke}
      />
    </Box>
  );
}
