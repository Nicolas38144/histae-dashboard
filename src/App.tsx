import { CssBaseline, ThemeProvider } from '@mui/material';
import { useMemo, useState } from 'react';
import AppRoutes from './routes/AppRoutes';
import { getTheme } from './theme';

export default function App() {
  const [mode, setMode] = useState<'light' | 'dark'>(() => localStorage.getItem('histae_theme') === 'dark' ? 'dark' : 'light');
  const theme = useMemo(() => getTheme(mode), [mode]);
  const toggleMode = () => setMode((current) => {
    const next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem('histae_theme', next);
    return next;
  });
  return <ThemeProvider theme={theme}><CssBaseline /><AppRoutes mode={mode} toggleMode={toggleMode} /></ThemeProvider>;
}
