import axios, { AxiosError } from 'axios';
import { notifyAdminSessionExpired } from '../auth/session';
import type { ApiErrorBody } from './types';

const baseURL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const path = error.config?.url ?? '';
    if (error.response?.status === 401 && !isPublicAdminAuthentication(path)) {
      notifyAdminSessionExpired();
    }
    return Promise.reject(error);
  },
);

function isPublicAdminAuthentication(path: string): boolean {
  return path.includes('/admin/auth/login/') || path.includes('/admin/auth/bootstrap/');
}

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return 'Le serveur est momentanément inaccessible.';
    return error.response.data?.error?.message || `La requête a échoué (${error.response.status}).`;
  }
  return error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
}
