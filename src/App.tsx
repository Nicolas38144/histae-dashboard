import { useLocale } from './i18n/useLocale';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useMemo, useState } from 'react';
import AppRoutes from './routes/AppRoutes';
import { getTheme } from './theme';

export default function App() {
  const locale = useLocale();
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    try { return localStorage.getItem('histae_theme') === 'dark' ? 'dark' : 'light'; }
    catch { return 'light'; }
  });
  const theme = useMemo(() => getTheme(mode, locale), [mode, locale]);
  const toggleMode = () => setMode((current) => {
    const next = current === 'light' ? 'dark' : 'light';
    try { localStorage.setItem('histae_theme', next); } catch { /* Preferences are optional. */ }
    return next;
  });
  return <ThemeProvider theme={theme}><CssBaseline /><AppRoutes mode={mode} toggleMode={toggleMode} /></ThemeProvider>;
}
