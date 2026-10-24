import { useRememberedState } from '../hooks/list-memory';
import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { ReplayOutlined } from '@mui/icons-material';
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import { getBillingReconciliation, retryOutboxEvent } from '../api/admin';
import { errorMessage } from '../api/client';
import type {
  AdminSession,
  BillingReconciliationItem,
  BillingReconciliationKind,
  BillingReconciliationKindFilter,
} from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { CursorPaginationControls } from '../components/CursorPaginationControls';
import { PageHeader } from '../components/PageHeader';
import { UserLink } from '../components/UserLink';
import { useNotification } from '../components/notification-context';
import { useCursorPagination } from '../hooks/useCursorPagination';
import { compactId, formatDate, formatNumber } from '../utils/format';

const kindLabels = (): Record<BillingReconciliationKind, string> => ({
  subscription: t("common.subscription"),
  customer_creation: t("billingReconciliation.uncertainCustomerCreation"),
});

const errorLabels = (): Record<string, string> => ({
  billing_provider_unavailable: t("common.stripeUnavailable"),
  billing_projection_invalid: t("billingReconciliation.invalidStripeProjection"),
  billing_subscription_set_too_large: t("billingReconciliation.tooManySubscriptionsToAnalyse"),
  billing_multiple_current_subscriptions: t("billingReconciliation.multipleCurrentPremiumSubscriptions"),
  billing_subscription_mapping_conflict: t("billingReconciliation.subscriptionOwnerMismatch"),
  billing_customer_search_ambiguous: t("billingReconciliation.uncertainOrAmbiguousCustomer"),
  billing_customer_mapping_conflict: t("billingReconciliation.customerAlreadyLinkedElsewhere"),
  billing_customer_not_due: t("billingReconciliation.safeReplayWindowStillOpen"),
  billing_reconciliation_disabled: t("billingReconciliation.reconciliationDisabled"),
  billing_reconciliation_unavailable: t("billingReconciliation.reconciliationWorkerUnavailable"),
});
const eventKey = (event: BillingReconciliationItem) => event.event_id;

export default function BillingReconciliation() {
  useLocale();
  const session = useOutletContext<AdminSession>();
  const [kind, setKind] = useRememberedState<BillingReconciliationKindFilter>('billing:filter','all');
  const [selected, setSelected] = useState<BillingReconciliationItem | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const loadPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getBillingReconciliation(kind, cursor, signal);
    return { items: page.events, nextCursor: page.next_cursor };
  }, [kind]);
  const pagination = useCursorPagination(loadPage, eventKey, undefined, 'billing:'+kind);

  const retry = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await retryOutboxEvent(selected.event_id, reason);
      showNotification(t("billingReconciliation.aNewStripeCheckHasBeenQueued"), 'success');
      setSelected(null);
      setReason('');
      pagination.reload();
    } catch (retryError) {
      showNotification(errorMessage(retryError), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("billingReconciliation.stripeReconciliation")}
        description={t("billingReconciliation.projectionDeadLettersAndUncertainCustomerCreationsRetryingReads")}
        actions={<KindFilter kind={kind} onKind={setKind} />}
      />
      <AsyncState loading={pagination.loading} error={pagination.error} onRetry={pagination.reload} />
      {!pagination.loading && !pagination.error && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead><TableRow><TableCell>{t("common.event")}</TableCell><TableCell>{t("common.user")}</TableCell><TableCell>{t("common.type")}</TableCell><TableCell>{t("common.attempts")}</TableCell><TableCell>{t("common.diagnostic")}</TableCell><TableCell>{t("common.permanentFailure")}</TableCell><TableCell align="right">{t("common.action")}</TableCell></TableRow></TableHead>
            <TableBody>
              {pagination.items.map((event) => (
                <TableRow key={event.event_id} hover>
                  <TableCell>{compactId(event.event_id)}</TableCell>
                  <TableCell><UserLink id={event.user_id} /></TableCell>
                  <TableCell>{kindLabels()[event.kind]}</TableCell>
                  <TableCell>{formatNumber(event.attempts)}</TableCell>
                  <TableCell>{event.last_error_code ? errorLabels()[event.last_error_code] ?? event.last_error_code : t("common.missing")}</TableCell>
                  <TableCell>{formatDate(event.dead_lettered_at)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<ReplayOutlined />} onClick={() => setSelected(event)}>{t("common.recheck")}</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!pagination.items.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>{t("billingReconciliation.noStripeDeadLetters")}</TableCell></TableRow>}
            </TableBody>
          </Table>
          <CursorPaginationControls nextCursor={pagination.nextCursor} loading={pagination.loadingMore} error={pagination.loadMoreError} onLoadMore={pagination.loadMore} onReload={pagination.reload} />
        </TableContainer>
      )}
      <ConfirmActionDialog
        open={Boolean(selected)}
        title={t("billingReconciliation.recheckThisStripeAnomaly")}
        description={t("billingReconciliation.theApiWillReadStripeStateAndOnlyApply")}
        confirmLabel={t("common.requeue")}
        value={reason}
        onValueChange={setReason}
        valueLabel={session.role === 'superadmin' ? undefined : t("common.operationalReason")}
        requireValue={session.role !== 'superadmin'}
        minValueLength={3}
        maxValueLength={500}
        loading={saving}
        onCancel={() => { setSelected(null); setReason(''); }}
        onConfirm={() => void retry()}
      />
    </>
  );
}

function KindFilter({
  kind,
  onKind,
}: {
  kind: BillingReconciliationKindFilter;
  onKind: (value: BillingReconciliationKindFilter) => void;
}) {
  useLocale();
  return (
    <FormControl size="small" sx={{ minWidth: 220 }}>
      <InputLabel>{t("common.type")}</InputLabel>
      <Select label={t("common.type")} value={kind} onChange={(event) => onKind(event.target.value as BillingReconciliationKindFilter)}>
        <MenuItem value="all">{t("common.all")}</MenuItem>
        <MenuItem value="subscription">{t("common.subscriptions")}</MenuItem>
        <MenuItem value="customer_creation">{t("common.customerCreations")}</MenuItem>
      </Select>
    </FormControl>
  );
}
