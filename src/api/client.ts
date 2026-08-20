import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { clearSession, getAccessToken, getRefreshToken, saveSession } from '../auth/session';
import type { ApiErrorBody, TokenPair } from './types';

const baseURL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const request = error.config as RetriableRequest | undefined;
    if (!request || request._retry || error.response?.status !== 401 || request.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      expireSession();
      return Promise.reject(error);
    }
    request._retry = true;
    try {
      refreshPromise ??= axios.post<TokenPair>(`${baseURL}/auth/refresh`, { refresh_token: refreshToken }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15_000,
      }).then(({ data }) => {
        saveSession(data);
        return data.access_token;
      }).finally(() => {
        refreshPromise = null;
      });
      const accessToken = await refreshPromise;
      request.headers.Authorization = `Bearer ${accessToken}`;
      return api(request);
    } catch (refreshError) {
      expireSession();
      return Promise.reject(refreshError);
    }
  },
);

function expireSession(): void {
  clearSession();
  window.dispatchEvent(new Event('histae:session-expired'));
}

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return 'Le serveur est momentanément inaccessible.';
    return error.response.data?.error?.message || `La requête a échoué (${error.response.status}).`;
  }
  return error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
}

