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
import { errorMessage } from '../api/client';

export default function Login() {
  const [bootstrapToken, setBootstrapToken] = useState('');
  const [credentialName, setCredentialName] = useState('Clé principale');
  const [loading, setLoading] = useState<'login' | 'bootstrap' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const supported = supportsWebAuthn();

  const login = async () => {
    setLoading('login');
    setError(null);
    try {
      await loginWithPasskey();
      navigate('/overview', { replace: true });
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setLoading(null);
    }
  };

  const bootstrap = async (event: FormEvent) => {
    event.preventDefault();
    setLoading('bootstrap');
    setError(null);
    try {
      await registerWithBootstrap(bootstrapToken.trim(), credentialName.trim());
      setBootstrapToken('');
      navigate('/overview', { replace: true });
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      setLoading(null);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, background: 'radial-gradient(circle at 15% 20%, rgba(92, 91, 231, .18), transparent 32%), radial-gradient(circle at 85% 80%, rgba(14, 165, 164, .16), transparent 30%)' }}>
      <Paper component="main" elevation={0} sx={{ width: '100%', maxWidth: 460, p: { xs: 3, sm: 5 }, border: 1, borderColor: 'divider', borderRadius: 4 }}>
        <Box sx={{ width: 52, height: 52, borderRadius: 3, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center', mb: 3 }}>
          <LockOutlined />
        </Box>
        <Typography variant="h4" fontWeight={850}>Administration Histae</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          Authentification locale avec une passkey ou une clé de sécurité. Aucun code SMS n’est accepté.
        </Typography>
        {!supported && <Alert severity="error" sx={{ mb: 2 }}>Ce navigateur ne prend pas en charge WebAuthn.</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Button
          fullWidth
          variant="contained"
          size="large"
          startIcon={<FingerprintOutlined />}
          disabled={!supported || loading !== null}
          onClick={login}
          sx={{ py: 1.25 }}
        >
          {loading === 'login' ? <CircularProgress size={24} color="inherit" /> : 'Se connecter avec une passkey'}
        </Button>

        <Accordion disableGutters elevation={0} sx={{ mt: 3, border: 1, borderColor: 'divider', borderRadius: '12px !important', '&::before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<KeyOutlined />}>
            <Typography fontWeight={650}>Enregistrer la première passkey</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Générez d’abord un jeton temporaire depuis la console de l’API, puis collez-le ici. Il ne sera pas conservé.
            </Typography>
            <Box component="form" onSubmit={bootstrap}>
              <TextField
                fullWidth
                label="Nom de la passkey"
                value={credentialName}
                onChange={(event) => setCredentialName(event.target.value)}
                inputProps={{ maxLength: 100 }}
                autoComplete="off"
              />
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Jeton d’enrôlement temporaire"
                value={bootstrapToken}
                onChange={(event) => setBootstrapToken(event.target.value)}
                autoComplete="off"
                sx={{ mt: 2 }}
              />
              <Button
                fullWidth
                type="submit"
                variant="outlined"
                disabled={!supported || loading !== null || !credentialName.trim() || !bootstrapToken.trim()}
                sx={{ mt: 2 }}
              >
                {loading === 'bootstrap' ? <CircularProgress size={24} /> : 'Enregistrer cette passkey'}
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Box>
  );
}
