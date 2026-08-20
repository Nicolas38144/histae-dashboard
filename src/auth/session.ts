import type { TokenPair } from '../api/types';

const ACCESS_TOKEN_KEY = 'histae_admin_access_token';
const REFRESH_TOKEN_KEY = 'histae_admin_refresh_token';

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function saveSession(tokens: TokenPair): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function clearSession(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_id');
}

export function hasSession(): boolean {
  return Boolean(getAccessToken() && getRefreshToken());
}

