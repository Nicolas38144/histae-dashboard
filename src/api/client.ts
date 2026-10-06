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
    if (error.response?.status === 401
      && error.response.data?.error?.code === 'admin_session_invalid'
      && !isPublicAdminAuthentication(path)) {
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
    const code = error.response.data?.error?.code;
    if (code === 'admin_reauthentication_required') return 'Reconnectez-vous avec votre passkey pour effectuer cette action.';
    if (code === 'admin_session_invalid') return 'La session administrateur a expiré. Reconnectez-vous.';
    if (code === 'invalid_admin_request_origin') return 'L’origine du dashboard ne correspond pas à celle configurée dans l’API.';
    if (code === 'moderation_case_stale') return 'Ce contenu a changé. Rechargez-le avant de décider.';
    if (code === 'invalid_data_request_transition') return 'Cette transition de demande RGPD n’est plus autorisée. Actualisez la liste.';
    if (code === 'outbox_event_not_dead_letter') return 'Cet événement n’est plus en échec définitif. Actualisez la liste.';
    if (code === 'outbox_discard_not_allowed') return 'L’abandon de cet événement est interdit.';
    return code ? `La requête a échoué (${code}).` : `La requête a échoué (${error.response.status}).`;
  }
  return error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
}
