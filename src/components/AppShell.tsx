import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import {
  AssessmentOutlined,
  DarkModeOutlined,
  GavelOutlined,
  GroupsOutlined,
  LightModeOutlined,
  LocalOfferOutlined,
  LogoutOutlined,
  MenuOutlined,
  PolicyOutlined,
  PriceChangeOutlined,
  QuestionAnswerOutlined,
  SecurityOutlined,
  SmsOutlined,
  SyncProblemOutlined,
  FactCheckOutlined,
  AdminPanelSettingsOutlined,
  CreditScoreOutlined,
  MarkunreadMailboxOutlined,
  MonitorHeartOutlined,
} from '@mui/icons-material';
import {
  AppBar, Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Tooltip, Typography,
} from '@mui/material';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { logout } from '../api/auth';
import { errorMessage } from '../api/client';
import type { AdminSession } from '../api/types';
import { useNotification } from './notification-context';
import { clearUserNames } from '../utils/userNames';

import { LanguageSelector } from './LanguageSelector';

const width = 250;
const entries = () => ([
  { path: '/overview', label: t("common.overview"), icon: <AssessmentOutlined /> },
  { path: '/users', label: t("common.users"), icon: <GroupsOutlined /> },
  { path: '/reports', label: t("common.reports"), icon: <GavelOutlined /> },
  { path: '/content-moderation', label: t("common.moderation"), icon: <FactCheckOutlined /> },
  { path: '/traits', label: t("common.traits"), icon: <LocalOfferOutlined /> },
  { path: '/profile-questions', label: t("common.profileQuestions"), icon: <QuestionAnswerOutlined /> },
  { path: '/privacy-requests', label: t("common.gdprRequests"), icon: <PolicyOutlined /> },
  { path: '/plans', label: t("common.plans"), icon: <PriceChangeOutlined /> },
  { path: '/photo-reconciliation', label: t("common.photos"), icon: <SyncProblemOutlined /> },
  { path: '/store-billing', label: t('storeBilling.title'), icon: <PriceChangeOutlined /> },
  { path: '/billing-reconciliation', label: t("common.stripe"), icon: <CreditScoreOutlined /> },
  { path: '/outbox-dead-letters', label: t("common.outbox"), icon: <MarkunreadMailboxOutlined /> },
  { path: '/sms-safety', label: t("common.smsSafety"), icon: <SmsOutlined /> },
  { path: '/audit-logs', label: t("common.accessLog"), icon: <SecurityOutlined /> },
  { path: '/security', label: t("common.security"), icon: <AdminPanelSettingsOutlined /> },
]);

export function AppShell({ mode, toggleMode }: { mode: 'light' | 'dark'; toggleMode: () => void }) {
  useLocale();
  const session = useOutletContext<AdminSession>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const navigationEntries = session.role === 'superadmin'
    ? [...entries(), { path: '/monitoring', label: t("common.monitoring"), icon: <MonitorHeartOutlined /> }]
    : entries();

  const signOut = async () => {
    try {
      await logout();
      clearUserNames();
      navigate('/login', { replace: true });
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center', fontWeight: 900 }}>{t("common.h")}</Box>
        <Box><Typography fontWeight={800}>{t("common.histae")}</Typography><Typography variant="caption" color="text.secondary">{t("common.administration")}</Typography></Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.25, py: 2, flexGrow: 1 }}>
        {navigationEntries.map((entry) => {
          const selected = location.pathname === entry.path || (entry.path === '/users' && location.pathname.startsWith('/users/'));
          return (
            <ListItemButton key={entry.path} selected={selected} onClick={() => { navigate(entry.path); setMobileOpen(false); }} sx={{ borderRadius: 2, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 42 }}>{entry.icon}</ListItemIcon><ListItemText primary={entry.label} />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <List sx={{ p: 1.25 }}>
        <ListItemButton onClick={signOut} sx={{ borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 42 }}><LogoutOutlined /></ListItemIcon><ListItemText primary={t("common.signOut")} />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', width: { md: `calc(100% - ${width}px)` }, ml: { md: `${width}px` } }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' } }} aria-label={t("common.openMenu")}><MenuOutlined /></IconButton>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>{t("appShell.histaeOperationsConsole")}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}><LanguageSelector /><Tooltip title={mode === 'dark' ? t("common.lightMode") : t("common.darkMode")}><IconButton onClick={toggleMode} aria-label={mode === 'dark' ? t("common.lightMode") : t("common.darkMode")}>{mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}</IconButton></Tooltip></Box>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: width }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width } }}>{drawer}</Drawer>
        <Drawer variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width, boxSizing: 'border-box' } }}>{drawer}</Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, bgcolor: 'background.default' }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3, lg: 4 } }}>
          <Outlet context={session} />
        </Box>
      </Box>
    </Box>
  );
}
