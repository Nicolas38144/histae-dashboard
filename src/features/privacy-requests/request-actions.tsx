import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { AdminSession, DataSubjectRequest } from '../../api/types';
import { ConfirmActionDialog } from '../../components/ConfirmActionDialog';
import { PrivacyRequestMessage } from '../../components/PrivacyRequestMessage';
import { useUserName } from '../../hooks/useUserName';
import { t } from '../../i18n/core';
import { useLocale } from '../../i18n/useLocale';
import { CASE_REPLY_MAX_LENGTH, validateCaseReply } from '../casework/reply';
import { availablePrivacyActions, privacyActionRules, validatePrivacyAction, type PrivacyAction, type PrivacyActionDraft, type PrivacyActionStatus } from './actions';

export function PrivacyRequestActions({ request, accountDeleted, disabled, onSelect }: {
  request: DataSubjectRequest;
  accountDeleted: boolean;
  disabled: boolean;
  onSelect: (request: DataSubjectRequest, status: PrivacyActionStatus) => void;
}) {
  useLocale();
  const actions = availablePrivacyActions(request);
  const profile = useUserName(request.type === 'rectification' && actions.length && !accountDeleted ? request.user_id : undefined);
  if (request.type === 'restriction' || request.type === 'objection') {
    return <Typography variant="caption" color="text.secondary">{t('privacyRequests.historicalReadOnly')}</Typography>;
  }
  if (!actions.length) return null;
  return <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1 }}>
    {profile && profile.status !== 'missing' && <Button component={RouterLink} to={`/users/${request.user_id}`} disabled={disabled} size="small">{t('identityCorrection.edit')}</Button>}
    {actions.map(status => <Button
      key={status}
      disabled={disabled}
      size="small"
      color={status === 'completed' ? 'success' : status === 'rejected' ? 'error' : 'primary'}
      onClick={() => onSelect(request, status)}
    >{actionLabel({ request, status })}</Button>)}
  </Box>;
}

export function PrivacyRequestActionDialog({ draft, accountDeleted, role, saving, onNotesChange, onResponseChange, onCancel, onConfirm }: {
  draft: PrivacyActionDraft;
  accountDeleted: boolean;
  role: AdminSession['role'];
  saving: boolean;
  onNotesChange: (value: string) => void;
  onResponseChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useLocale();
  const profile = useUserName(draft.request.type === 'rectification' && draft.status === 'completed' && !accountDeleted
    ? draft.request.user_id : undefined);
  const rules = privacyActionRules(draft, role);
  const replyTooLong = validateCaseReply(draft.response, rules.requiresReply) === 'too_long';
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
    maxValueLength={draft.status === 'retry' ? rules.maxNotesLength : undefined}
    valueHelperText={draft.status === 'retry' ? undefined : t('casework.replyLimit')}
    loading={saving}
    confirmDisabled={validatePrivacyAction(draft, role) !== null}
    onCancel={onCancel}
    onConfirm={onConfirm}
  >
    <PrivacyRequestMessage details={draft.request.details} />
    {profile && profile.status !== 'missing' && <Button component={RouterLink} to={`/users/${draft.request.user_id}`} disabled={saving} sx={{ mb: 2 }}>{t('identityCorrection.edit')}</Button>}
    {rules.requiresReply && <Alert severity="info" sx={{ mb: 2 }}>{t('privacyRequests.resolveGuidance')}</Alert>}
    {draft.status === 'completed' && (draft.request.type === 'access' || draft.request.type === 'portability') &&
      <Alert severity="info" sx={{ mb: 2 }}>{t('privacyRequests.exportGuidance')}</Alert>}
    {rules.schedulesErasure && <Alert severity="warning" sx={{ mb: 2 }}>{t('privacyRequests.erasureReplyUnavailable')}</Alert>}
    {rules.allowsReply && <TextField
      fullWidth
      required={rules.requiresReply}
      multiline
      minRows={3}
      label={t('privacyRequests.publicReply')}
      helperText={t(replyTooLong ? 'privacyRequests.publicReplyTooLong' : 'privacyRequests.publicReplyHelp', { limit: CASE_REPLY_MAX_LENGTH })}
      error={replyTooLong}
      value={draft.response}
      onChange={(event) => onResponseChange(event.target.value)}
      disabled={saving}
      sx={{ mb: 2 }}
    />}
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
  if (action.status === 'completed' && action.request.type === 'erasure') return t('privacyRequests.erasureWorkflow');
  return t('privacyRequests.theTransitionAndTheResponsibleAdministratorWillBeRecorded');
}
