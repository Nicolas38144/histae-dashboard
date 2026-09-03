import { lazy, Suspense, useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ADMIN_SESSION_EXPIRED_EVENT, clearLegacySessions } from '../auth/session';
import { getAdminSession } from '../api/auth';
import { AppShell } from '../components/AppShell';

const AuditLogs = lazy(() => import('../pages/AuditLogs'));
const Login = lazy(() => import('../pages/Login'));
const Overview = lazy(() => import('../pages/Overview'));
const Plans = lazy(() => import('../pages/Plans'));
const PhotoReconciliation = lazy(() => import('../pages/PhotoReconciliation'));
const ContentModeration = lazy(() => import('../pages/ContentModeration'));
const ProfileQuestions = lazy(() => import('../pages/ProfileQuestions'));
const PrivacyRequests = lazy(() => import('../pages/PrivacyRequests'));
const Reports = lazy(() => import('../pages/Reports'));
const Security = lazy(() => import('../pages/Security'));
const Traits = lazy(() => import('../pages/Traits'));
const UserDetails = lazy(() => import('../pages/UserDetails'));
const Users = lazy(() => import('../pages/Users'));

function RequireSession() {
  const [state, setState] = useState<'checking' | 'authenticated' | 'anonymous'>('checking');
  useEffect(() => {
    let active = true;
    clearLegacySessions();
    getAdminSession().then(() => { if (active) setState('authenticated'); }).catch(() => {
      if (active) setState('anonymous');
    });
    const expire = () => setState('anonymous');
    window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, expire);
    return () => {
      active = false;
      window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, expire);
    };
  }, []);
  if (state === 'checking') return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  return state === 'authenticated' ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function AppRoutes({ mode, toggleMode }: { mode: 'light' | 'dark'; toggleMode: () => void }) {
  const loading = (
    <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <BrowserRouter>
      <Suspense fallback={loading}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireSession />}>
            <Route element={<AppShell mode={mode} toggleMode={toggleMode} />}>
              <Route index element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/:id" element={<UserDetails />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/content-moderation" element={<ContentModeration />} />
              <Route path="/traits" element={<Traits />} />
              <Route path="/profile-questions" element={<ProfileQuestions />} />
              <Route path="/privacy-requests" element={<PrivacyRequests />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/photo-reconciliation" element={<PhotoReconciliation />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/security" element={<Security />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
