import { api } from './client';
import type {
  AdminMetrics,
  AdminProfileQuestion,
  AdminRevenue,
  AdminUser,
  AdminUserDetail,
  ChatMessage,
  CursorResponse,
  DataAccessLog,
  DataRequestStatus,
  DataSubjectRequest,
  Match,
  PhotoReconciliationFilter,
  PhotoReconciliationItem,
  Plan,
  Report,
  ReportStatus,
  RevenuePeriod,
  Trait,
  ProfileQuestionCategory,
  UserRole,
  ModerationCase,
  ModerationContentType,
  ModerationDetail,
  ModerationStatus,
  PhotoReviewChecks,
  BillingReconciliationItem,
  BillingReconciliationKindFilter,
} from './types';

export const getMetrics = async (): Promise<AdminMetrics> => (
  await api.get<AdminMetrics>('/admin/metrics')
).data;

export const getRevenue = async (revenuePeriod: RevenuePeriod, signal?: AbortSignal): Promise<AdminRevenue> => (
  await api.get<AdminRevenue>('/admin/revenue', { params: { revenue_period: revenuePeriod }, signal })
).data;

export async function getPhotoReconciliation(
  status: PhotoReconciliationFilter,
  cursor?: string,
  signal?: AbortSignal,
): Promise<CursorResponse<PhotoReconciliationItem, 'photos'>> {
  return (await api.get<CursorResponse<PhotoReconciliationItem, 'photos'>>('/admin/photo-reconciliation', {
    params: { status, cursor, limit: 50 },
    signal,
  })).data;
}

export async function getModerationCases(
  status?: ModerationStatus,
  contentType?: ModerationContentType,
  cursor?: string,
  signal?: AbortSignal,
): Promise<CursorResponse<ModerationCase, 'cases'>> {
  return (await api.get<CursorResponse<ModerationCase, 'cases'>>('/admin/content-moderation', {
    params: { status, content_type: contentType, cursor, limit: 50 },
    signal,
  })).data;
}

export async function getModerationDetail(caseId: string, reason: string): Promise<ModerationDetail> {
  return (await api.get<ModerationDetail>(`/admin/content-moderation/${caseId}`, {
    params: { reason },
  })).data;
}

export async function reviewModerationCase(
  moderation: ModerationDetail,
  decision: 'approved' | 'rejected',
  reason: string,
  photoChecks?: PhotoReviewChecks,
): Promise<void> {
  await api.patch(`/admin/content-moderation/${moderation.case_id}`, {
    version: moderation.version,
    decision,
    reason,
    ...(photoChecks ? { photo_checks: photoChecks } : {}),
  });
}

export async function retryPhotoReconciliation(photoId: string, reason: string): Promise<void> {
  await api.post(`/admin/photo-reconciliation/${photoId}/retry`, { reason });
}

export async function getUsers(filters: {
  status?: 'active' | 'banned';
  role?: UserRole;
  search?: string;
  cursor?: string;
}, signal?: AbortSignal): Promise<CursorResponse<AdminUser, 'users'>> {
  return (await api.get<CursorResponse<AdminUser, 'users'>>('/admin/users', {
    params: { ...filters, limit: 50 },
    signal,
  })).data;
}

export async function getUser(userId: string): Promise<AdminUserDetail> {
  return (await api.get<AdminUserDetail>(`/admin/users/${userId}`, {
    params: { reason: 'Consultation administrative du profil depuis le dashboard' },
  })).data;
}

export async function setUserBanned(userId: string, isBanned: boolean, reason?: string): Promise<void> {
  await api.patch(`/admin/users/${userId}/status`, { is_banned: isBanned, reason: reason || null });
}

export async function getUserMatches(
  userId: string,
  cursor?: string,
  signal?: AbortSignal,
): Promise<CursorResponse<Match, 'matches'>> {
  return (await api.get<CursorResponse<Match, 'matches'>>(`/matches/${userId}`, {
    params: { limit: 100, cursor, reason: 'Consultation administrative des matchs depuis le dashboard' },
    signal,
  })).data;
}

export async function getMatchMessages(
  matchId: string,
  reason: string,
  cursor?: string,
  signal?: AbortSignal,
): Promise<CursorResponse<ChatMessage, 'messages'>> {
  return (await api.get<CursorResponse<ChatMessage, 'messages'>>(`/admin/matches/${matchId}/messages`, {
    params: { limit: 100, cursor, reason },
    signal,
  })).data;
}

export async function getReports(
  status?: ReportStatus,
  cursor?: string,
  signal?: AbortSignal,
): Promise<CursorResponse<Report, 'reports'>> {
  return (await api.get<CursorResponse<Report, 'reports'>>('/admin/reports', {
    params: { status, cursor, limit: 100 },
    signal,
  })).data;
}

export async function updateReport(id: string, status: ReportStatus): Promise<void> {
  await api.patch(`/admin/reports/${id}`, { status });
}

export async function getTraits(): Promise<Trait[]> {
  return (await api.get<{ traits: Trait[] }>('/traits')).data.traits;
}

export async function createTrait(name: string): Promise<Trait> {
  return (await api.post<Trait>('/admin/traits', { name })).data;
}

export async function updateTrait(id: string, name: string): Promise<void> {
  await api.patch(`/admin/traits/${id}`, { name });
}

export async function deleteTrait(id: string): Promise<void> {
  await api.delete(`/admin/traits/${id}`);
}

export async function getProfileQuestions(): Promise<AdminProfileQuestion[]> {
  return (await api.get<{ questions: AdminProfileQuestion[] }>('/admin/profile-questions')).data.questions;
}

export async function createProfileQuestion(input: {
  prompt: string;
  category: ProfileQuestionCategory;
  display_order: number;
}): Promise<AdminProfileQuestion> {
  return (await api.post<AdminProfileQuestion>('/admin/profile-questions', input)).data;
}

export async function updateProfileQuestion(
  id: string,
  input: { prompt: string; category: ProfileQuestionCategory; display_order: number },
): Promise<AdminProfileQuestion> {
  return (await api.patch<AdminProfileQuestion>(`/admin/profile-questions/${id}`, input)).data;
}

export async function deleteProfileQuestion(id: string): Promise<void> {
  await api.delete(`/admin/profile-questions/${id}`);
}

export async function getDataRequests(
  status?: DataRequestStatus,
  cursor?: string,
  signal?: AbortSignal,
): Promise<CursorResponse<DataSubjectRequest, 'requests'>> {
  return (await api.get<CursorResponse<DataSubjectRequest, 'requests'>>('/admin/data-subject-requests', {
    params: { status, cursor, limit: 50 }, signal,
  })).data;
}

export async function retryErasure(eventId: string, reason: string): Promise<void> {
  await retryOutboxEvent(eventId, reason);
}

export async function getBillingReconciliation(
  kind: BillingReconciliationKindFilter,
  cursor?: string,
  signal?: AbortSignal,
): Promise<CursorResponse<BillingReconciliationItem, 'events'>> {
  return (await api.get<CursorResponse<BillingReconciliationItem, 'events'>>('/admin/billing-reconciliation', {
    params: { kind, cursor, limit: 50 }, signal,
  })).data;
}

export async function retryOutboxEvent(eventId: string, reason: string): Promise<void> {
  await api.post(`/admin/outbox/${eventId}/retry`, { reason: reason.trim() });
}

export async function updateDataRequest(id: string, status: Exclude<DataRequestStatus, 'pending'>, notes?: string): Promise<void> {
  await api.patch(`/admin/data-subject-requests/${id}`, { status, notes: notes || null });
}

export async function getAccessLogs(
  userId: string,
  cursor?: string,
  signal?: AbortSignal,
): Promise<CursorResponse<DataAccessLog, 'logs'>> {
  return (await api.get<CursorResponse<DataAccessLog, 'logs'>>('/admin/data-access-logs', {
    params: { user_id: userId, cursor, limit: 100 }, signal,
  })).data;
}

export async function getPlans(): Promise<Plan[]> {
  return (await api.get<{ plans: Plan[] }>('/plans')).data.plans;
}
