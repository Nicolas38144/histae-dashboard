import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import { login } from '../services/auth.service';
import { useNotification } from '../components/Notifier';
import { t } from 'i18next';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setpassword] = useState('');
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber || !password) {
      showNotification(t("notifications.requiredFields"), 'error');
      return;
    }

    const success = await login(phoneNumber, password);

    if (success) {
      navigate('/home');
    } else {
      showNotification(t("notifications.loginFailed"), 'error');
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t("loginPage.title")}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            fullWidth
            label={t("loginPage.phoneLabel")}
            type="tel"
            variant="outlined"
            margin="normal"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
          <TextField
            fullWidth
            label={t("loginPage.passwordLabel")}
            type="password"
            variant="outlined"
            margin="normal"
            value={password}
            onChange={(e) => setpassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            {t("loginPage.button")}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
