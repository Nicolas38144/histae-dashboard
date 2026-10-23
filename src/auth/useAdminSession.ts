import { useEffect, useState } from 'react';
import { getAdminSession } from '../api/auth';
import type { AdminSession } from '../api/types';
import { clearUserNames } from '../utils/userNames';
import { ADMIN_SESSION_EXPIRED_EVENT, clearLegacySessions, isAdminSessionLocked, notifyAdminSessionExpired } from './session';

export const ADMIN_IDLE_TIMEOUT_MS = 15 * 60_000;
export const ADMIN_SESSION_CHECK_INTERVAL_MS = 60_000;

export function useAdminSession(): AdminSession | null | undefined {
  const [session, setSession] = useState<AdminSession | null | undefined>();

  useEffect(() => {
    let active = true;
    let invalidated = isAdminSessionLocked();
    let lastActivity = Date.now();
    let pending: AbortController | undefined;
    let idleTimer: number;

    clearLegacySessions();
    clearUserNames();

    const expire = () => {
      invalidated = true;
      pending?.abort();
      pending = undefined;
      clearUserNames();
      setSession(null);
    };
    const checkIdle = () => {
      if (invalidated || !active) return true;
      if (Date.now() - lastActivity >= ADMIN_IDLE_TIMEOUT_MS) {
        notifyAdminSessionExpired();
        return true;
      }
      return false;
    };
    const conceal = () => {
      pending?.abort();
      pending = undefined;
      clearUserNames();
      if (!invalidated) setSession(undefined);
    };
    const verify = async (concealFirst = false) => {
      if (checkIdle() || document.visibilityState === 'hidden') return;
      if (concealFirst) conceal();
      if (pending) return;
      const controller = new AbortController();
      pending = controller;
      try {
        const value = await getAdminSession(controller.signal);
        if (active && !invalidated && !controller.signal.aborted && !checkIdle()) setSession(value);
      } catch {
        // Fail closed if the server cannot confirm the session, including network failures.
        if (active && !controller.signal.aborted) notifyAdminSessionExpired();
      } finally {
        if (pending === controller) pending = undefined;
      }
    };
    const activity = () => {
      // A delayed timer must not let the first interaction unlock an idle console.
      if (!checkIdle() && document.visibilityState !== 'hidden') lastActivity = Date.now();
    };
    const scheduleIdleCheck = () => {
      idleTimer = window.setTimeout(() => {
        if (!checkIdle()) scheduleIdleCheck();
      }, Math.max(1, ADMIN_IDLE_TIMEOUT_MS - (Date.now() - lastActivity)));
    };
    const visibility = () => {
      if (document.visibilityState === 'hidden') conceal();
      else void verify(true);
    };
    const resume = () => { void verify(true); };
    const activityEvents = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart'] as const;

    window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, expire);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('focus', resume);
    window.addEventListener('pagehide', conceal);
    window.addEventListener('pageshow', resume);
    activityEvents.forEach((event) => window.addEventListener(event, activity, { passive: true }));
    if (invalidated) expire();
    else {
      void verify();
      scheduleIdleCheck();
    }
    const interval = window.setInterval(() => { void verify(); }, ADMIN_SESSION_CHECK_INTERVAL_MS);

    return () => {
      active = false;
      pending?.abort();
      window.clearTimeout(idleTimer);
      window.clearInterval(interval);
      clearUserNames();
      window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, expire);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('focus', resume);
      window.removeEventListener('pagehide', conceal);
      window.removeEventListener('pageshow', resume);
      activityEvents.forEach((event) => window.removeEventListener(event, activity));
    };
  }, []);

  return session;
}
