export const ADMIN_SESSION_EXPIRED_EVENT = 'histae:session-expired';

let locallyLocked = false;
let logoutStatus: 'idle' | 'pending' | 'failed' = 'idle';
const logoutListeners = new Set<() => void>();

export const getAdminLogoutStatus = () => logoutStatus;
export function subscribeAdminLogout(listener: () => void): () => void {
  logoutListeners.add(listener);
  return () => { logoutListeners.delete(listener); };
}
export function setAdminLogoutStatus(status: typeof logoutStatus): void {
  logoutStatus = status;
  logoutListeners.forEach((listener) => listener());
}

export const isAdminSessionLocked = (): boolean => locallyLocked;

// Only a successful WebAuthn ceremony unlocks a locally expired session.
export function unlockAdminSession(): void {
  locallyLocked = false;
  setAdminLogoutStatus('idle');
}

export function clearLegacySessions(): void {
  for (const [storage, keys] of [
    ['sessionStorage', ['histae_admin_access_token', 'histae_admin_refresh_token']],
    ['localStorage', ['auth_token', 'user_id']],
  ] as const) {
    for (const key of keys) {
      try { window[storage].removeItem(key); } catch { /* Storage may be disabled by the browser. */ }
    }
  }
}

export function notifyAdminSessionExpired(): void {
  locallyLocked = true;
  window.dispatchEvent(new Event(ADMIN_SESSION_EXPIRED_EVENT));
}
