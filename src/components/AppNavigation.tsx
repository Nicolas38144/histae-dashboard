import { useEffect, useRef, useState } from 'react';
import { LogoutOutlined } from '@mui/icons-material';
import {
  Box, Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, TextField, useMediaQuery,
} from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import type { AdminSession } from '../api/types';
import { useSignOut } from '../auth/useSignOut';
import { t } from '../i18n/core';
import { useLocale } from '../i18n/useLocale';
import { navigationGroups, navigationWidth as width } from '../navigation/navigation';


type Props = {
  role: AdminSession['role'];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export function AppNavigation({ role, open, onOpen, onClose }: Props) {
  useLocale();
  const location = useLocation();
  const signOut = useSignOut();
  const desktop = useMediaQuery('(min-width:900px)');
  const [search, setSearch] = useState('');
  const searchInput = useRef<HTMLInputElement>(null);
  const groups = navigationGroups(role, search);

  useEffect(() => {
    let frame: number | undefined;
    const shortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      onOpen();
      frame = requestAnimationFrame(() => searchInput.current?.focus());
    };
    window.addEventListener('keydown', shortcut);
    return () => {
      window.removeEventListener('keydown', shortcut);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [onOpen]);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'grid', placeItems: 'center', fontWeight: 900 }}>{t("common.h")}</Box>
        <Box><Typography fontWeight={800}>{t("common.histae")}</Typography><Typography variant="caption" color="text.secondary">{t("common.administration")}</Typography></Box>
      </Toolbar>
      <Divider />
      <Box sx={{ px: 2, pt: 2 }}>
        <TextField
          inputRef={searchInput}
          fullWidth
          size="small"
          label={t('workspace.search')}
          value={search}
          onChange={event => setSearch(event.target.value)}
          onKeyDown={event => { if (event.key === 'Escape') setSearch(''); }}
        />
      </Box>
      <List sx={{ px: 1.25, py: 2, flexGrow: 1 }}>
        {!groups.length && <Typography component="li" sx={{ p: 1 }}>{t('workspace.empty')}</Typography>}
        {groups.map(group => (
          <Box component="li" key={group.id} sx={{ listStyle: 'none' }}>
            <Typography sx={{ px: 2, pt: 2, pb: 1 }} variant="overline">{group.label}</Typography>
            {group.entries.map(entry => {
              const selected = location.pathname === entry.path ||
                (entry.path === '/users' && location.pathname.startsWith('/users/'));
              return (
                <ListItemButton
                  component={Link}
                  to={entry.path}
                  key={entry.path}
                  selected={selected}
                  aria-current={selected ? 'page' : undefined}
                  onClick={onClose}
                  sx={{ borderRadius: 2, mb: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 42 }}>{entry.icon}</ListItemIcon>
                  <ListItemText primary={entry.label} />
                </ListItemButton>
              );
            })}
          </Box>
        ))}
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
    <Box component="nav" sx={{ width: { md: width }, flexShrink: { md: 0 } }}>
      {desktop ? (
        <Drawer variant="permanent" open sx={{ '& .MuiDrawer-paper': { width, boxSizing: 'border-box' } }}>
          {drawer}
        </Drawer>
      ) : (
        <Drawer variant="temporary" open={open} onClose={onClose} ModalProps={{ keepMounted: true }} sx={{ '& .MuiDrawer-paper': { width } }}>
          {drawer}
        </Drawer>
      )}
    </Box>
  );
}
