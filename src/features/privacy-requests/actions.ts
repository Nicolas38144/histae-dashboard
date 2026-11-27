import type { AdminSession, DataRequestStatus, DataSubjectRequest } from '../../api/types';
import { validateCaseReply } from '../casework/reply';

export type PrivacyActionStatus = Exclude<DataRequestStatus, 'pending'> | 'retry';
export type PrivacyAction = { request: DataSubjectRequest; status: PrivacyActionStatus };
export type PrivacyActionDraft = PrivacyAction & { notes: string; response: string };

export function canReplyToPrivacyRequest(request: DataSubjectRequest, accountDeleted: boolean): boolean {
  return !accountDeleted && !request.erasure && request.type !== 'restriction' && request.type !== 'objection'
    && (request.status === 'pending' || request.status === 'in_progress');
}

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
  const schedulesErasure = action.status === 'completed' && action.request.type === 'erasure';
  return {
    allowsReply: !retry && !schedulesErasure,
    requiresReply: action.request.type === 'rectification' && (action.status === 'completed' || action.status === 'rejected'),
    schedulesErasure,
    requiresNotes: role !== 'superadmin' && (action.status === 'rejected' || retry),
    minNotesLength: retry ? 3 : 1,
    maxNotesLength: retry ? 500 : 1_000,
    danger: action.status === 'rejected' || schedulesErasure,
  };
}

export function validatePrivacyAction(draft: PrivacyActionDraft, role: AdminSession['role']): 'retry_reason' | 'invalid_form' | null {
  const rules = privacyActionRules(draft, role);
  const notes = draft.notes.trim();
  const notesLength = draft.status === 'retry' ? notes.length : [...notes].length;
  if (rules.requiresNotes && (notesLength < rules.minNotesLength || notesLength > rules.maxNotesLength)) {
    return draft.status === 'retry' ? 'retry_reason' : 'invalid_form';
  }
  if (notesLength > rules.maxNotesLength) return 'invalid_form';
  if (rules.allowsReply && validateCaseReply(draft.response, rules.requiresReply)) return 'invalid_form';
  return null;
}
