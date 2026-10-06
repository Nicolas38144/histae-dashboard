import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import { notifyAdminSessionExpired } from '../auth/session';
import { api } from './client';
import type { AdminAuthEvent, AdminCredential, AdminSession, AdminSessionSummary, CursorResponse } from './types';

type AuthenticationOptions = {
  challenge_id: string;
  options: PublicKeyCredentialRequestOptionsJSON;
};

type RegistrationOptions = {
  challenge_id: string;
  options: PublicKeyCredentialCreationOptionsJSON;
};

export function supportsWebAuthn(): boolean {
  return browserSupportsWebAuthn();
}

export async function loginWithPasskey(): Promise<AdminSession> {
  return withFriendlyWebAuthnErrors(async () => {
    const { data } = await api.post<AuthenticationOptions>('/admin/auth/login/options');
    const credential = await startAuthentication({ optionsJSON: data.options });
    return (await api.post<AdminSession>('/admin/auth/login/verify', {
      challenge_id: data.challenge_id,
      credential,
    })).data;
  });
}

export async function registerWithBootstrap(token: string, name: string): Promise<AdminSession> {
  return withFriendlyWebAuthnErrors(async () => {
    const { data } = await api.post<RegistrationOptions>('/admin/auth/bootstrap/options', {
      bootstrap_token: token,
    });
    const credential = await startRegistration({ optionsJSON: data.options });
    return (await api.post<AdminSession>('/admin/auth/bootstrap/verify', {
      bootstrap_token: token,
      challenge_id: data.challenge_id,
      credential,
      name,
    })).data;
  });
}

export async function addCredential(name: string): Promise<void> {
  await withFriendlyWebAuthnErrors(async () => {
    const { data } = await api.post<RegistrationOptions>('/admin/auth/credentials/options');
    const credential = await startRegistration({ optionsJSON: data.options });
    await api.post('/admin/auth/credentials/verify', {
      challenge_id: data.challenge_id,
      credential,
      name,
    });
  });
}

export async function getAdminSession(): Promise<AdminSession> {
  return (await api.get<AdminSession>('/admin/auth/session')).data;
}

export async function getAdminCredentials(): Promise<AdminCredential[]> {
  return (await api.get<AdminCredential[]>('/admin/auth/credentials')).data;
}

export async function renameCredential(id: string, name: string): Promise<void> {
  await api.patch(`/admin/auth/credentials/${id}`, { name: name.trim() });
}

export async function revokeCredential(id: string): Promise<void> {
  await api.delete(`/admin/auth/credentials/${id}`);
}

export async function getAdminSessions(): Promise<AdminSessionSummary[]> {
  return (await api.get<AdminSessionSummary[]>('/admin/auth/sessions')).data;
}

export async function revokeAdminSession(id: string): Promise<void> {
  await api.delete(`/admin/auth/sessions/${id}`);
}

export async function getAdminAuthEvents(cursor?: string, signal?: AbortSignal): Promise<CursorResponse<AdminAuthEvent, 'events'>> {
  return (await api.get<CursorResponse<AdminAuthEvent, 'events'>>('/admin/auth/events', {
    params: { limit: 50, cursor }, signal,
  })).data;
}

export async function revokeOtherSessions(): Promise<number> {
  return (await api.post<{ revoked_sessions: number }>('/admin/auth/sessions/revoke-others')).data.revoked_sessions;
}

export async function logout(): Promise<void> {
  await api.post('/admin/auth/logout');
  notifyAdminSessionExpired();
}

async function withFriendlyWebAuthnErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw friendlyWebAuthnError(error);
  }
}

function friendlyWebAuthnError(error: unknown): Error | unknown {
  if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError')) {
    return new Error('La demande a été annulée ou aucune passkey compatible n’est disponible.');
  }
  return error;
}
