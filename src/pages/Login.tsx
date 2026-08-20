import { ArrowBack, LockOutlined, SmsOutlined } from '@mui/icons-material';
import { Alert, Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';
import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { sendOtp, verifyOtp } from '../api/auth';
import { errorMessage } from '../api/client';
import { hasSession } from '../auth/session';

export default function Login() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('+33');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  if (hasSession()) return <Navigate to="/overview" replace />;

  const submitPhone = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError(null);
    try { await sendOtp(phone.trim()); setStep('otp'); } catch (reason) { setError(errorMessage(reason)); } finally { setLoading(false); }
  };
  const submitOtp = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError(null);
    try { await verifyOtp(phone.trim(), otp.trim()); navigate('/overview', { replace: true }); } catch (reason) { setError(errorMessage(reason)); } finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, background: 'radial-gradient(circle at 15% 20%, rgba(92, 91, 231, .18), transparent 32%), radial-gradient(circle at 85% 80%, rgba(14, 165, 164, .16), transparent 30%)' }}>
      <Paper component="main" elevation={0} sx={{ width: '100%', maxWidth: 440, p: { xs: 3, sm: 5 }, border: 1, borderColor: 'divider', borderRadius: 4 }}>
        <Box sx={{ width: 52, height: 52, borderRadius: 3, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center', mb: 3 }}>{step === 'phone' ? <LockOutlined /> : <SmsOutlined />}</Box>
        <Typography variant="h4" fontWeight={850}>Administration Histae</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>{step === 'phone' ? 'Connectez-vous avec le numéro associé à votre compte administrateur.' : `Saisissez le code envoyé au ${phone}.`}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={step === 'phone' ? submitPhone : submitOtp}>
          {step === 'phone' ? <TextField fullWidth autoFocus label="Téléphone au format +33" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" inputProps={{ inputMode: 'tel' }} /> : <TextField fullWidth autoFocus label="Code à 6 chiffres" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} autoComplete="one-time-code" inputProps={{ inputMode: 'numeric', pattern: '[0-9]{6}' }} />}
          <Button fullWidth type="submit" variant="contained" size="large" disabled={loading || (step === 'phone' ? phone.trim().length < 12 : otp.length !== 6)} sx={{ mt: 2.5, py: 1.25 }}>
            {loading ? <CircularProgress size={24} color="inherit" /> : step === 'phone' ? 'Recevoir le code' : 'Se connecter'}
          </Button>
          {step === 'otp' && <Button fullWidth startIcon={<ArrowBack />} onClick={() => { setStep('phone'); setOtp(''); setError(null); }} disabled={loading} sx={{ mt: 1 }}>Changer de numéro</Button>}
        </Box>
      </Paper>
    </Box>
  );
}
