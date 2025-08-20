import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { logout } from '../services/auth.service';
import { t } from 'i18next';

const drawerWidth = 200;

const menuItems = [
  { label: "Home", path: '/home' },
  { label:"Users", path: '/users' },
  { label: "Vibes", path: '/vibes' },
  { label: "Posts", path: '/posts' },
  { label: "Post reports", path: '/post-reports' },
  { label: "Match reports", path: '/matches' },
  { label: "Subscription plans", path: '/subscription-plans' },
];

const DashboardLayout = ({ toggleTheme, mode }: { toggleTheme: () => void; mode: 'light' | 'dark' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box  sx={{ display: 'flex', justifyContent: 'center' }}>
      <CssBaseline />

      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {t("dashboard.title")}
          </Typography>
          <IconButton color="inherit" onClick={toggleTheme}>
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        anchor="left"
        open={true}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          },
        }}
      >
        <Box>
          <Toolbar />
          <Divider />
          <List>
            {menuItems.map((item) => {
              console.log(location.pathname);
              
              const isActive = location.pathname === item.path;
              return (
                <ListItemButton
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    backgroundColor: isActive ? 'rgba(0,0,0,0.1)' : 'inherit',
                    '&:hover': {
                      backgroundColor: isActive ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              );
            })}
          </List>
          <Divider />
        </Box> 
        <Box sx={{ p: 2 }}>
            <ListItemButton onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              <ListItemText primary={t("dashboard.logout")} />
            </ListItemButton>
        </Box>
      </Drawer>
      <Box component="main">
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardLayout;
