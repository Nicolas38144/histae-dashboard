import { getLocale, LocalizedError, t } from '../i18n/core';
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

api.interceptors.request.use((config) => {
  config.headers.set('Accept-Language', getLocale());
  return config;
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

const apiErrorMessages = (): Readonly<Record<string, string>> => ({
  admin_reauthentication_required: t("errors.signInAgainWithYourPasskeyToPerformThis"),
  admin_session_invalid: t("errors.yourAdministratorSessionHasExpiredSignInAgain"),
  invalid_admin_request_origin: t("errors.theDashboardOriginDoesNotMatchTheOneConfigured"),
  moderation_case_stale: t("errors.thisContentHasChangedReloadItBeforeMakingA"),
  invalid_data_request_transition: t("errors.thisGdprRequestTransitionIsNoLongerAllowedRefresh"),
  outbox_event_not_dead_letter: t("errors.thisEventIsNoLongerInAPermanentFailure"),
  outbox_discard_not_allowed: t("errors.discardingThisEventIsNotAllowed"),
});

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return t("errors.theServerIsTemporarilyUnreachable");
    const code = error.response.data?.error?.code;
    if (code) return Object.hasOwn(apiErrorMessages(), code)
      ? apiErrorMessages()[code]
      : t("errors.theRequestFailedValue", { value0: code });
    return t("errors.theRequestFailedValue", { value0: error.response.status });
  }
  if (error instanceof LocalizedError) return t(error.key, error.params);
  return t("errors.anUnexpectedErrorOccurred");
}
