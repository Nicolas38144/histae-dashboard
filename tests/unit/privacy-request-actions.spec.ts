import type { DataSubjectRequest } from '../../src/api/types';
import { availablePrivacyActions, privacyActionRules, PRIVACY_REPLY_MAX_LENGTH, validatePrivacyAction, type PrivacyActionDraft } from '../../src/features/privacy-requests/actions';
import { erasureRequest } from '../fixtures';

const correction: DataSubjectRequest = { ...erasureRequest, type: 'rectification', status: 'in_progress', erasure: null };
const draft: PrivacyActionDraft = { request: correction, status: 'completed', notes: '', response: 'Correction vérifiée.' };

describe('privacy request action policy', () => {
  it.each(['restriction', 'objection'] as const)('keeps historical %s requests read-only in every state', (type) => {
    for (const status of ['pending', 'in_progress', 'completed', 'rejected'] as const) {
      expect(availablePrivacyActions({ ...erasureRequest, type, status })).toEqual([]);
    }
  });

  it('offers ownership, resolution and rejection according to the request state', () => {
    expect(availablePrivacyActions({ ...correction, status: 'pending' })).toEqual(['in_progress', 'rejected']);
    expect(availablePrivacyActions(correction)).toEqual(['completed', 'rejected']);
    expect(availablePrivacyActions({ ...correction, status: 'completed' })).toEqual([]);
    expect(availablePrivacyActions({ ...correction, status: 'rejected' })).toEqual([]);
  });

  it('keeps an existing erasure workflow out of ordinary status transitions', () => {
    expect(availablePrivacyActions(erasureRequest)).toEqual(['retry']);
    expect(availablePrivacyActions({ ...erasureRequest, erasure: { ...erasureRequest.erasure!, event_id: null } })).toEqual([]);
    expect(availablePrivacyActions({ ...erasureRequest, erasure: { ...erasureRequest.erasure!, status: 'processing' } })).toEqual([]);
  });

  it.each(['admin', 'superadmin'] as const)('requires a reply for correction resolution and rejection by %s', (role) => {
    for (const status of ['completed', 'rejected'] as const) {
      const action = { ...draft, status, notes: 'Motif interne.' };
      expect(privacyActionRules(action, role).requiresReply).toBe(true);
      expect(validatePrivacyAction({ ...action, response: ' \n ' }, role)).toBe('invalid_form');
      expect(validatePrivacyAction(action, role)).toBeNull();
    }
    expect(privacyActionRules({ ...draft, status: 'in_progress' }, role).requiresReply).toBe(false);
    expect(privacyActionRules({ ...draft, request: { ...correction, type: 'access' } }, role).requiresReply).toBe(false);
  });

  it('counts public reply code points at the 2000-character boundary', () => {
    expect(validatePrivacyAction({ ...draft, response: '😀'.repeat(PRIVACY_REPLY_MAX_LENGTH) }, 'superadmin')).toBeNull();
    expect(validatePrivacyAction({ ...draft, response: 'a'.repeat(PRIVACY_REPLY_MAX_LENGTH + 1) }, 'superadmin')).toBe('invalid_form');
  });

  it('keeps notes and public replies distinct when an ordinary administrator rejects a correction', () => {
    const rejected = { ...draft, status: 'rejected' as const };
    expect(validatePrivacyAction(rejected, 'admin')).toBe('invalid_form');
    expect(validatePrivacyAction({ ...rejected, notes: 'Motif interne.' }, 'admin')).toBeNull();
    expect(validatePrivacyAction(rejected, 'superadmin')).toBeNull();
  });

  it('preserves bounded retry reasons and the optional superadmin reason', () => {
    const retry = { ...draft, request: erasureRequest, status: 'retry' as const };
    expect(validatePrivacyAction(retry, 'admin')).toBe('retry_reason');
    expect(validatePrivacyAction({ ...retry, notes: 'ab' }, 'admin')).toBe('retry_reason');
    expect(validatePrivacyAction({ ...retry, notes: 'abc' }, 'admin')).toBeNull();
    expect(validatePrivacyAction({ ...retry, notes: 'a'.repeat(500) }, 'admin')).toBeNull();
    expect(validatePrivacyAction({ ...retry, notes: 'a'.repeat(501) }, 'admin')).toBe('retry_reason');
    expect(validatePrivacyAction(retry, 'superadmin')).toBeNull();
  });
});
