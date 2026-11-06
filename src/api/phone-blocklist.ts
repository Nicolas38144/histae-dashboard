import { api } from './client';

export type PhoneDecision = 'automatic' | 'block' | 'allow';
export interface PhoneObservation { source: string; last_seen_at: string; expires_at: string }
export interface PhoneEntry {
  id: string | null;
  phone_hint: string;
  decision: PhoneDecision;
  decision_until: string | null;
  version: number;
  blocked: boolean;
  observations: PhoneObservation[];
}
export interface PhoneBlocklist {
  entries: PhoneEntry[];
  total: number;
  ready: boolean;
  sources: { source: string; last_attempt_at: string | null; last_success_at: string | null; last_error: string | null; imported_count: number }[];
}
export type PhoneTarget = { entry_id: string; phone_number?: never } | { phone_number: string; entry_id?: never };
export type PhoneChange = PhoneTarget & { decision: PhoneDecision; valid_days?: number; version: number; reason?: string };
const path = '/admin/sms-safety/phone-blocklist';
export async function getPhoneBlocklist(offset: number): Promise<PhoneBlocklist> {
  return (await api.get<PhoneBlocklist>(path, { params: { limit: 25, offset } })).data;
}
export async function lookupPhone(phone_number: string, signal?: AbortSignal): Promise<PhoneEntry> {
  return (await api.post<PhoneEntry>(`${path}/lookup`, { phone_number }, { signal })).data;
}
export async function changePhonePolicy(change: PhoneChange): Promise<void> {
  await api.patch(path, change);
}
