import { alpha, createTheme } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: { main: mode === 'light' ? '#514fc4' : '#9694ff' },
    secondary: { main: '#0e9695' },
    background: { default: mode === 'light' ? '#f7f7fb' : '#11121a', paper: mode === 'light' ? '#ffffff' : '#191a24' },
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', button: { textTransform: 'none', fontWeight: 700 } },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 10 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiTableHead: { styleOverrides: { root: ({ theme }) => ({ backgroundColor: alpha(theme.palette.primary.main, 0.06) }) } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 750, whiteSpace: 'nowrap' } } },
  },
});
