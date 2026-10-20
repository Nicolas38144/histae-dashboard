import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { FingerprintOutlined, KeyOutlined, LockOutlined } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithPasskey, registerWithBootstrap, supportsWebAuthn } from '../api/auth';
import { LanguageSelector } from '../components/LanguageSelector';
import { errorMessage } from '../api/client';

export default function Login() {
  useLocale();
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [credentialName, setCredentialName] = useState<string | null>(null);
  const passkeyName = credentialName ?? t("common.primaryKey");
  const [loading, setLoading] = useState<'login' | 'bootstrap' | null>(null);
  const [error, setError] = useState<unknown>(null);
  const navigate = useNavigate();
  const supported = supportsWebAuthn();

  const login = async () => {
    setLoading('login');
    setError(null);
    try {
      await loginWithPasskey();
      navigate('/overview', { replace: true });
    } catch (reason) {
      setError(reason);
    } finally {
      setLoading(null);
    }
  };

  const bootstrap = async (event: FormEvent) => {
    event.preventDefault();
    setLoading('bootstrap');
    setError(null);
    try {
      await registerWithBootstrap(bootstrapToken.trim(), passkeyName.trim());
      setBootstrapToken('');
      navigate('/overview', { replace: true });
    } catch (reason) {
      setError(reason);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, background: 'radial-gradient(circle at 15% 20%, rgba(92, 91, 231, .18), transparent 32%), radial-gradient(circle at 85% 80%, rgba(14, 165, 164, .16), transparent 30%)' }}>
      <Paper component="main" elevation={0} sx={{ width: '100%', maxWidth: 460, p: { xs: 3, sm: 5 }, border: 1, borderColor: 'divider', borderRadius: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}><LanguageSelector /></Box>
        <Box sx={{ width: 52, height: 52, borderRadius: 3, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center', mb: 3 }}>
          <LockOutlined />
        </Box>
        <Typography variant="h4" fontWeight={850}>{t("login.histaeAdministration")}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          {t("login.localAuthenticationWithAPasskeyOrSecurityKeySms")}</Typography>
        {!supported && <Alert severity="error" sx={{ mb: 2 }}>{t("login.thisBrowserDoesNotSupportWebauthn")}</Alert>}
        {error !== null && <Alert severity="error" sx={{ mb: 2 }}>{errorMessage(error)}</Alert>}
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<FingerprintOutlined />}
          disabled={!supported || loading !== null}
          onClick={login}
          sx={{ py: 1.25 }}
        >
          {loading === 'login' ? <CircularProgress aria-label={t("common.loading")} size={24} color="inherit" /> : t("login.signInWithAPasskey")}
        </Button>

        <Accordion disableGutters elevation={0} sx={{ mt: 3, border: 1, borderColor: 'divider', borderRadius: '12px !important', '&::before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<KeyOutlined />}>
            <Typography fontWeight={650}>{t("login.registerTheFirstPasskey")}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("login.firstGenerateATemporaryTokenFromTheApiConsole")}</Typography>
            <Box component="form" onSubmit={bootstrap}>
              <TextField
                fullWidth
                label={t("common.passkeyName")}
                value={passkeyName}
                onChange={(event) => setCredentialName(event.target.value)}
                inputProps={{ maxLength: 100 }}
                autoComplete="off"
              />
              <TextField
                fullWidth
                multiline
                minRows={2}
                label={t("login.temporaryEnrollmentToken")}
                value={bootstrapToken}
                onChange={(event) => setBootstrapToken(event.target.value)}
                autoComplete="off"
                sx={{ mt: 2 }}
              />
              <Button
                fullWidth
                type="submit"
                variant="outlined"
                disabled={!supported || loading !== null || !passkeyName.trim() || !bootstrapToken.trim()}
                sx={{ mt: 2 }}
              >
                {loading === 'bootstrap' ? <CircularProgress aria-label={t("common.loading")} size={24} /> : t("login.registerThisPasskey")}
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Box>
  );
}
