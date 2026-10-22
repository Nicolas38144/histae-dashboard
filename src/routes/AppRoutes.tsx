import { t } from '../i18n/core';
import { useLocale } from '../i18n/useLocale';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ADMIN_SESSION_EXPIRED_EVENT, clearLegacySessions } from '../auth/session';
import { getAdminSession } from '../api/auth';
import type { AdminSession } from '../api/types';
import { AppShell } from '../components/AppShell';
import { clearUserNames } from '../utils/userNames';

const AuditLogs = lazy(() => import('../pages/AuditLogs'));
const Login = lazy(() => import('../pages/Login'));
const Overview = lazy(() => import('../pages/Overview'));
const Plans = lazy(() => import('../pages/Plans'));
const PhotoReconciliation = lazy(() => import('../pages/PhotoReconciliation'));
const BillingReconciliation = lazy(() => import('../pages/BillingReconciliation'));
const OutboxDeadLetters = lazy(() => import('../pages/OutboxDeadLetters'));
const ContentModeration = lazy(() => import('../pages/ContentModeration'));
const ProfileQuestions = lazy(() => import('../pages/ProfileQuestions'));
const PrivacyRequests = lazy(() => import('../pages/PrivacyRequests'));
const Reports = lazy(() => import('../pages/Reports'));
const Security = lazy(() => import('../pages/Security'));
const StoreBilling = lazy(() => import('../pages/StoreBilling'));
const SmsSafety = lazy(() => import('../pages/SmsSafety'));
const Traits = lazy(() => import('../pages/Traits'));
const UserDetails = lazy(() => import('../pages/UserDetails'));
const Monitoring = lazy(() => import('../pages/Monitoring'));
const Users = lazy(() => import('../pages/Users'));

function RequireSession() {
  useLocale();
  const [session, setSession] = useState<AdminSession | null | undefined>();
  useEffect(() => {
    let active = true;
    let invalidated = false;
    clearLegacySessions();
    clearUserNames();
    getAdminSession().then((value) => { if (active && !invalidated) setSession(value); }).catch(() => {
      if (active) setSession(null);
    });
    const expire = () => {
      invalidated = true;
      clearUserNames();
      setSession(null);
    };
    window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, expire);
    return () => {
      active = false;
      window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, expire);
    };
  }, []);
  if (session === undefined) return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><CircularProgress aria-label={t("common.loading")} /></Box>;
  return session ? <Outlet context={session} /> : <Navigate to="/login" replace />;
}

export default function AppRoutes({ mode, toggleMode }: { mode: 'light' | 'dark'; toggleMode: () => void }) {
  useLocale();
  const loading = (
    <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
      <CircularProgress aria-label={t("common.loading")} />
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
              <Route path="/billing-reconciliation" element={<BillingReconciliation />} />
              <Route path="/outbox-dead-letters" element={<OutboxDeadLetters />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/security" element={<Security />} />
              <Route path="/store-billing" element={<StoreBilling />} />
              <Route path="/sms-safety" element={<SmsSafety />} />
              <Route path="/monitoring" element={<Monitoring />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
