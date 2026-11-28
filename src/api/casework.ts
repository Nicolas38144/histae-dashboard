import { api } from './client';
import type { CursorResponse, DataRequestStatus } from './types';

export type RightsMessage = { id: string; author: 'user' | 'team'; body: string; created_at: string };
type ExportGrant = { id: string; expires_at: string };
export type SupportStatus = 'pending' | 'in_progress' | 'closed';
export type SupportCategory = 'login' | 'billing' | 'appeal' | 'privacy' | 'other';
export type SupportCase = {
  id: string;
  user_id: string | null;
  category: SupportCategory;
  body: string;
  status: SupportStatus;
  response: string | null;
  created_at: string;
};

export async function getRightsMessages(id: string, { before, reason, signal }: {
  before?: string;
  reason?: string;
  signal?: AbortSignal;
}) {
  return (await api.get<CursorResponse<RightsMessage, 'messages'> & { status: DataRequestStatus }>(`/admin/data-subject-requests/${id}/messages`, {
    params: { before, reason }, signal,
  })).data;
}

export async function sendRightsMessage(id: string, message: string) {
  await api.post(`/admin/data-subject-requests/${id}/messages`, { message: message.trim() });
}

export async function getExportGrant(id: string, reason?: string) {
  return (await api.get<ExportGrant | null>(`/admin/data-subject-requests/${id}/assisted-export`, { params: { reason } })).data;
}

export async function grantExport(id: string) {
  return (await api.post<ExportGrant>(`/admin/data-subject-requests/${id}/assisted-export`, {})).data;
}

export async function decideReport(id: string, status: 'reviewed' | 'dismissed', response: string) {
  await api.patch(`/admin/reports/${id}/decision`, { status, response: response.trim() });
}

export async function getSupportCases(before?: string, signal?: AbortSignal) {
  return (await api.get<CursorResponse<SupportCase, 'cases'>>('/admin/support-cases', {
    params: { before }, signal,
  })).data;
}

export async function replyToSupport(id: string, status: Exclude<SupportStatus, 'pending'>, response: string) {
  await api.patch(`/admin/support-cases/${id}`, { status, response: response.trim() });
}
