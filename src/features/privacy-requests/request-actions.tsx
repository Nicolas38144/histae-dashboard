import { Alert, Box, Button, TextField } from '@mui/material';
import type { AdminSession, DataSubjectRequest } from '../../api/types';
import { ConfirmActionDialog } from '../../components/ConfirmActionDialog';
import { PrivacyRequestMessage } from '../../components/PrivacyRequestMessage';
import { t } from '../../i18n/core';
import { useLocale } from '../../i18n/useLocale';
import { availablePrivacyActions, privacyActionRules, PRIVACY_REPLY_MAX_LENGTH, validatePrivacyAction, type PrivacyAction, type PrivacyActionDraft, type PrivacyActionStatus } from './actions';

export function PrivacyRequestActions({ request, disabled, onSelect }: {
  request: DataSubjectRequest;
  disabled: boolean;
  onSelect: (request: DataSubjectRequest, status: PrivacyActionStatus) => void;
}) {
  useLocale();
  const actions = availablePrivacyActions(request);
  if (!actions.length) return null;
  return <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
    {actions.map(status => <Button
      key={status}
      disabled={disabled}
      size="small"
      color={status === 'completed' ? 'success' : status === 'rejected' ? 'error' : 'primary'}
      onClick={() => onSelect(request, status)}
    >{actionLabel({ request, status })}</Button>)}
  </Box>;
}

export function PrivacyRequestActionDialog({ draft, role, saving, onNotesChange, onResponseChange, onCancel, onConfirm }: {
  draft: PrivacyActionDraft;
  role: AdminSession['role'];
  saving: boolean;
  onNotesChange: (value: string) => void;
  onResponseChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useLocale();
  const rules = privacyActionRules(draft, role);
  return <ConfirmActionDialog
    open
    title={dialogTitle(draft)}
    description={dialogDescription(draft)}
    confirmLabel={t('common.confirm')}
    danger={rules.danger}
    value={draft.notes}
    onValueChange={onNotesChange}
    valueLabel={role === 'superadmin' ? undefined : draft.status === 'retry' ? t('privacyRequests.retryReason3To500Characters') : t('privacyRequests.internalNotes')}
    requireValue={rules.requiresNotes}
    minValueLength={rules.minNotesLength}
    maxValueLength={rules.maxNotesLength}
    loading={saving}
    confirmDisabled={validatePrivacyAction(draft, role) !== null}
    onCancel={onCancel}
    onConfirm={onConfirm}
  >
    <PrivacyRequestMessage details={draft.request.details} />
    {rules.requiresReply && <>
      <Alert severity="info" sx={{ mb: 2 }}>{t('privacyRequests.resolveGuidance')}</Alert>
      <TextField fullWidth required multiline minRows={3} label={t('privacyRequests.publicReply')} helperText={t('privacyRequests.publicReplyHelp')} value={draft.response} onChange={(event) => onResponseChange(event.target.value)} inputProps={{ maxLength: PRIVACY_REPLY_MAX_LENGTH }} disabled={saving} sx={{ mb: 2 }} />
    </>}
  </ConfirmActionDialog>;
}

function actionLabel(action: PrivacyAction): string {
  if (action.status === 'in_progress') return t('common.takeOwnership');
  if (action.status === 'rejected') return t('common.reject');
  if (action.status === 'retry') return t('common.retry');
  return action.request.type === 'erasure' ? t('common.startErasure') : t('privacyRequests.resolve');
}

function dialogTitle(action: PrivacyAction): string {
  if (action.status === 'retry') return t('privacyRequests.retryThisErasure');
  if (action.status === 'in_progress') return t('privacyRequests.takeOwnershipOfThisRequest');
  if (action.status === 'rejected') return t('privacyRequests.rejectThisRequest');
  return action.request.type === 'erasure' ? t('privacyRequests.startPermanentErasure') : t('privacyRequests.completeThisRequest');
}

function dialogDescription(action: PrivacyAction): string {
  if (action.status === 'retry') return t('privacyRequests.checkThatTheCauseOfTheFailureIsResolved');
  if (action.status === 'completed' && action.request.type === 'erasure') return t('privacyRequests.theErasureWorkflowWillBeScheduledStripePhotosDiscovery');
  return t('privacyRequests.theTransitionAndTheResponsibleAdministratorWillBeRecorded');
}
