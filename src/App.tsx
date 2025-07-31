import { useState, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { getTheme } from './theme';
import { CssBaseline } from '@mui/material';
import AppRoutes from './routes/AppRoutes';

const App = () => {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRoutes toggleTheme={toggleTheme} mode={mode} />
    </ThemeProvider>
  );
};

export default App;