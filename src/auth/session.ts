export const ADMIN_SESSION_EXPIRED_EVENT = 'histae:session-expired';

export function clearLegacySessions(): void {
  sessionStorage.removeItem('histae_admin_access_token');
  sessionStorage.removeItem('histae_admin_refresh_token');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_id');
}

export function notifyAdminSessionExpired(): void {
  window.dispatchEvent(new Event(ADMIN_SESSION_EXPIRED_EVENT));
}
