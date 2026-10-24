import { useCallback, useState } from 'react';
import { DarkModeOutlined, LightModeOutlined, MenuOutlined } from '@mui/icons-material';
import { AppBar, Box, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import { Outlet, useOutletContext } from 'react-router-dom';
import type { AdminSession } from '../api/types';
import { t } from '../i18n/core';
import { useLocale } from '../i18n/useLocale';
import { LanguageSelector } from './LanguageSelector';
import { ListMemoryProvider } from './ListMemoryProvider';
import { AppNavigation } from './AppNavigation';
import { navigationWidth as width } from '../navigation/navigation';

export function AppShell({ mode, toggleMode }: { mode: 'light' | 'dark'; toggleMode: () => void }) {
  useLocale();
  const session = useOutletContext<AdminSession>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const openMenu = useCallback(() => setMobileOpen(true), []);
  const closeMenu = useCallback(() => setMobileOpen(false), []);
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', width: { md: `calc(100% - ${width}px)` }, ml: { md: `${width}px` } }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton onClick={openMenu} sx={{ display: { md: 'none' } }} aria-label={t("common.openMenu")}><MenuOutlined /></IconButton>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>{t("appShell.histaeOperationsConsole")}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}><LanguageSelector /><Tooltip title={mode === 'dark' ? t("common.lightMode") : t("common.darkMode")}><IconButton onClick={toggleMode} aria-label={mode === 'dark' ? t("common.lightMode") : t("common.darkMode")}>{mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}</IconButton></Tooltip></Box>
        </Toolbar>
      </AppBar>
      <AppNavigation role={session.role} open={mobileOpen} onOpen={openMenu} onClose={closeMenu} />
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, bgcolor: 'background.default' }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3, lg: 4 } }}>
          <ListMemoryProvider key={JSON.stringify([session.user_id, session.authenticated_at, session.role])}><Outlet context={session} /></ListMemoryProvider>
        </Box>
      </Box>
    </Box>
  );
}
