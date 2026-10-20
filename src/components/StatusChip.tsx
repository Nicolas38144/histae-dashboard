import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { Chip } from '@mui/material';

const labels = (): Record<string, string> => ({
  active: t("common.active"), banned: t("common.banned"), pending: t("common.pending"), reviewed: t("common.reviewed"), dismissed: t("common.dismissed"),
  in_progress: t("common.inProgress"), completed: t("common.completed"), rejected: t("common.rejected"), confirmed: t("common.confirmed"),
  awaiting_continuation: t("common.conversationPaused"), expired: t("common.expired"), ended: t("common.completed"), processing: t("common.processing"),
  deleting: t("common.deleting"), ready: t("common.ready"), dead_letter: t("common.permanentFailure"), approved: t("common.approved"),
  running: t("common.inProgress"), succeeded: t("common.succeeded"), failed: t("common.failed"), skipped: t("common.notRun"),
});

export function StatusChip({ value }: { value: string }) {
  useLocale();
  const color = value === 'active' || value === 'confirmed' || value === 'completed' || value === 'reviewed'
    || value === 'approved' || value === 'succeeded'
    ? 'success' : value === 'pending' || value === 'processing' || value === 'in_progress'
      || value === 'awaiting_continuation' || value === 'running'
      ? 'warning' : value === 'banned' || value === 'rejected' || value === 'deleting'
        || value === 'dead_letter' || value === 'failed' ? 'error' : 'default';
  return <Chip size="small" label={labels()[value] ?? value} color={color} variant={color === 'default' ? 'outlined' : 'filled'} />;
}
