import axios from 'axios';
import { clearSession, getRefreshToken, saveSession } from '../auth/session';
import { api } from './client';
import type { AdminSession, TokenPair } from './types';

export async function sendOtp(phoneNumber: string): Promise<void> {
  await api.post('/auth/otp/send', { phone_number: phoneNumber }, {
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  });
}

export async function verifyOtp(phoneNumber: string, otp: string): Promise<AdminSession> {
  const { data } = await api.post<TokenPair>('/auth/otp/verify', { phone_number: phoneNumber, otp });
  saveSession(data);
  try {
    return await getAdminSession();
  } catch (error) {
    clearSession();
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      throw new Error('Ce compte ne possède pas de rôle administrateur.');
    }
    throw error;
  }
}

export async function getAdminSession(): Promise<AdminSession> {
  return (await api.get<AdminSession>('/admin/me')).data;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) await api.post('/auth/logout', { refresh_token: refreshToken });
  } catch {
    // Local logout must always succeed even when the token is already expired.
  } finally {
    clearSession();
  }
}
