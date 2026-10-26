import { useRef, useState } from 'react';
import type { AdminSession, DataSubjectRequest } from '../../api/types';
import { retryErasure, updateDataRequest } from '../../api/admin';
import { errorMessage } from '../../api/client';
import { useNotification } from '../../components/notification-context';
import { LocalizedError, t } from '../../i18n/core';
import { availablePrivacyActions, privacyActionRules, validatePrivacyAction, type PrivacyActionDraft, type PrivacyActionStatus } from './actions';

export function usePrivacyRequestAction(role: AdminSession['role'], onUpdated: () => void) {
  const [draft, setDraft] = useState<PrivacyActionDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  const { showNotification } = useNotification();

  const start = (request: DataSubjectRequest, status: PrivacyActionStatus) => {
    if (pending.current || !availablePrivacyActions(request).includes(status)) return;
    setDraft({ request, status, notes: status === 'retry' ? '' : request.notes || '', response: request.response || '' });
  };
  const close = () => { if (!pending.current) setDraft(null); };
  const setNotes = (notes: string) => setDraft(current => current ? { ...current, notes } : null);
  const setResponse = (response: string) => setDraft(current => current ? { ...current, response } : null);

  const submit = async () => {
    if (!draft || pending.current) return;
    const validation = validatePrivacyAction(draft, role);
    if (validation) {
      if (validation === 'retry_reason') showNotification(t('privacyRequests.theRetryReasonMustContainBetween3And500'), 'error');
      return;
    }
    pending.current = true;
    setSaving(true);
    try {
      if (draft.status === 'retry') {
        const eventId = draft.request.erasure?.event_id;
        if (!eventId) throw new LocalizedError('privacyRequests.thisJobIsNoLongerAvailableRefreshTheList');
        await retryErasure(eventId, draft.notes);
      } else {
        const { requiresReply } = privacyActionRules(draft, role);
        await updateDataRequest(draft.request.id, draft.status, draft.notes, requiresReply ? draft.response : undefined);
      }
      showNotification(draft.status === 'completed' && draft.request.type === 'erasure'
        ? t('privacyRequests.erasureScheduledTheRequestRemainsInProgressUntilProcessing')
        : draft.status === 'retry' ? t('privacyRequests.retryQueued') : t('privacyRequests.gdprRequestUpdated'), 'success');
      setDraft(null);
      onUpdated();
    } catch (reason) {
      showNotification(errorMessage(reason), 'error');
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };

  return { draft, saving, start, close, setNotes, setResponse, submit };
}
