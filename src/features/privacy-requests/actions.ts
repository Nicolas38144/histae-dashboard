import type { AdminSession, DataRequestStatus, DataSubjectRequest } from '../../api/types';

export type PrivacyActionStatus = Exclude<DataRequestStatus, 'pending'> | 'retry';
export type PrivacyAction = { request: DataSubjectRequest; status: PrivacyActionStatus };
export type PrivacyActionDraft = PrivacyAction & { notes: string; response: string };

export const PRIVACY_REPLY_MAX_LENGTH = 2_000;

export function availablePrivacyActions(request: DataSubjectRequest): PrivacyActionStatus[] {
  if (request.type === 'restriction' || request.type === 'objection') return [];
  const actions: PrivacyActionStatus[] = [];
  if (request.status === 'pending') actions.push('in_progress');
  if (request.status === 'in_progress' && !request.erasure) actions.push('completed');
  if (!request.erasure && (request.status === 'pending' || request.status === 'in_progress')) actions.push('rejected');
  if (request.erasure?.status === 'dead_letter' && request.erasure.event_id) actions.push('retry');
  return actions;
}

export function privacyActionRules(action: PrivacyAction, role: AdminSession['role']) {
  const retry = action.status === 'retry';
  return {
    requiresReply: action.request.type === 'rectification' && (action.status === 'completed' || action.status === 'rejected'),
    requiresNotes: role !== 'superadmin' && (action.status === 'rejected' || retry),
    minNotesLength: retry ? 3 : 1,
    maxNotesLength: retry ? 500 : 2_000,
    danger: action.status === 'rejected' || (action.status === 'completed' && action.request.type === 'erasure'),
  };
}

export function validatePrivacyAction(draft: PrivacyActionDraft, role: AdminSession['role']): 'retry_reason' | 'invalid_form' | null {
  const rules = privacyActionRules(draft, role);
  const notesLength = draft.notes.trim().length;
  if (rules.requiresNotes && (notesLength < rules.minNotesLength || notesLength > rules.maxNotesLength)) {
    return draft.status === 'retry' ? 'retry_reason' : 'invalid_form';
  }
  if (notesLength > rules.maxNotesLength) return 'invalid_form';
  if (rules.requiresReply) {
    const replyLength = [...draft.response.trim()].length;
    if (replyLength === 0 || replyLength > PRIVACY_REPLY_MAX_LENGTH) return 'invalid_form';
  }
  return null;
}
