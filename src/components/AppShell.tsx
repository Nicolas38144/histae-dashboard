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
  SyncProblemOutlined,
  FactCheckOutlined,
  AdminPanelSettingsOutlined,
} from '@mui/icons-material';
import {
  AppBar, Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Tooltip, Typography,
} from '@mui/material';
import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';
import { errorMessage } from '../api/client';
import { useNotification } from './notification-context';

const width = 250;
const entries = [
  { path: '/overview', label: 'Vue d’ensemble', icon: <AssessmentOutlined /> },
  { path: '/users', label: 'Utilisateurs', icon: <GroupsOutlined /> },
  { path: '/reports', label: 'Signalements', icon: <GavelOutlined /> },
  { path: '/content-moderation', label: 'Modération', icon: <FactCheckOutlined /> },
  { path: '/traits', label: 'Traits', icon: <LocalOfferOutlined /> },
  { path: '/profile-questions', label: 'Questions de profil', icon: <QuestionAnswerOutlined /> },
  { path: '/privacy-requests', label: 'Demandes RGPD', icon: <PolicyOutlined /> },
  { path: '/plans', label: 'Plans', icon: <PriceChangeOutlined /> },
  { path: '/photo-reconciliation', label: 'Photos', icon: <SyncProblemOutlined /> },
  { path: '/audit-logs', label: 'Journal d’accès', icon: <SecurityOutlined /> },
  { path: '/security', label: 'Sécurité', icon: <AdminPanelSettingsOutlined /> },
];

export function AppShell({ mode, toggleMode }: { mode: 'light' | 'dark'; toggleMode: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const signOut = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center', fontWeight: 900 }}>H</Box>
        <Box><Typography fontWeight={800}>Histae</Typography><Typography variant="caption" color="text.secondary">Administration</Typography></Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.25, py: 2, flexGrow: 1 }}>
        {entries.map((entry) => {
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
          <ListItemIcon sx={{ minWidth: 42 }}><LogoutOutlined /></ListItemIcon><ListItemText primary="Se déconnecter" />
        </ListItemButton>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', width: { md: `calc(100% - ${width}px)` }, ml: { md: `${width}px` } }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton onClick={() => setMobileOpen(true)} sx={{ display: { md: 'none' } }} aria-label="Ouvrir le menu"><MenuOutlined /></IconButton>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>Console opérationnelle Histae</Typography>
          <Tooltip title={mode === 'dark' ? 'Mode clair' : 'Mode sombre'}><IconButton onClick={toggleMode}>{mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}</IconButton></Tooltip>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: width }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width } }}>{drawer}</Drawer>
        <Drawer variant="permanent" open sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width, boxSizing: 'border-box' } }}>{drawer}</Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, bgcolor: 'background.default' }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3, lg: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
