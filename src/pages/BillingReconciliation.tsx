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

import { getBillingReconciliation, retryOutboxEvent } from '../api/admin';
import { errorMessage } from '../api/client';
import type {
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
import { compactId, formatDate } from '../utils/format';

const kindLabels: Record<BillingReconciliationKind, string> = {
  subscription: 'Abonnement',
  customer_creation: 'Création Customer incertaine',
};

const errorLabels: Record<string, string> = {
  billing_provider_unavailable: 'Stripe indisponible',
  billing_projection_invalid: 'Projection Stripe invalide',
  billing_subscription_set_too_large: 'Trop d’abonnements à analyser',
  billing_multiple_current_subscriptions: 'Plusieurs abonnements Premium courants',
  billing_subscription_mapping_conflict: 'Propriétaire de l’abonnement incohérent',
  billing_customer_search_ambiguous: 'Customer incertain ou ambigu',
  billing_customer_mapping_conflict: 'Customer déjà rattaché ailleurs',
  billing_customer_not_due: 'Fenêtre de rejeu sûre encore ouverte',
  billing_reconciliation_disabled: 'Réconciliation désactivée',
  billing_reconciliation_unavailable: 'Worker de réconciliation indisponible',
};
const eventKey = (event: BillingReconciliationItem) => event.event_id;

export default function BillingReconciliation() {
  const [kind, setKind] = useState<BillingReconciliationKindFilter>('all');
  const [selected, setSelected] = useState<BillingReconciliationItem | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const { showNotification } = useNotification();

  const loadPage = useCallback(async (cursor: string | undefined, signal: AbortSignal) => {
    const page = await getBillingReconciliation(kind, cursor, signal);
    return { items: page.events, nextCursor: page.next_cursor };
  }, [kind]);
  const pagination = useCursorPagination(loadPage, eventKey);

  const retry = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await retryOutboxEvent(selected.event_id, reason);
      showNotification('Une nouvelle vérification Stripe a été mise en file.', 'success');
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
        title="Réconciliation Stripe"
        description="Dead letters de projection et créations Customer incertaines. Une relance vérifie Stripe en lecture et n’effectue jamais un paiement."
        actions={<KindFilter kind={kind} onKind={setKind} />}
      />
      <AsyncState loading={pagination.loading} error={pagination.error} onRetry={pagination.reload} />
      {!pagination.loading && !pagination.error && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead><TableRow><TableCell>Événement</TableCell><TableCell>Utilisateur</TableCell><TableCell>Type</TableCell><TableCell>Tentatives</TableCell><TableCell>Diagnostic</TableCell><TableCell>Échec définitif</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
            <TableBody>
              {pagination.items.map((event) => (
                <TableRow key={event.event_id} hover>
                  <TableCell>{compactId(event.event_id)}</TableCell>
                  <TableCell><UserLink id={event.user_id} /></TableCell>
                  <TableCell>{kindLabels[event.kind]}</TableCell>
                  <TableCell>{event.attempts}</TableCell>
                  <TableCell>{event.last_error_code ? errorLabels[event.last_error_code] ?? event.last_error_code : '—'}</TableCell>
                  <TableCell>{formatDate(event.dead_lettered_at)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<ReplayOutlined />} onClick={() => setSelected(event)}>Revérifier</Button>
                  </TableCell>
                </TableRow>
              ))}
              {!pagination.items.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>Aucune dead letter Stripe.</TableCell></TableRow>}
            </TableBody>
          </Table>
          <CursorPaginationControls nextCursor={pagination.nextCursor} loading={pagination.loadingMore} error={pagination.loadMoreError} onLoadMore={pagination.loadMore} onReload={pagination.reload} />
        </TableContainer>
      )}
      <ConfirmActionDialog
        open={Boolean(selected)}
        title="Revérifier cette anomalie Stripe ?"
        description="L’API relira l’état chez Stripe puis appliquera uniquement une projection plus récente. Une authentification WebAuthn récente, ce motif et l’identité de l’opérateur seront contrôlés et audités."
        confirmLabel="Remettre en file"
        value={reason}
        onValueChange={setReason}
        valueLabel="Motif opérationnel"
        requireValue
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
  return (
    <FormControl size="small" sx={{ minWidth: 220 }}>
      <InputLabel>Type</InputLabel>
      <Select label="Type" value={kind} onChange={(event) => onKind(event.target.value as BillingReconciliationKindFilter)}>
        <MenuItem value="all">Tous</MenuItem>
        <MenuItem value="subscription">Abonnements</MenuItem>
        <MenuItem value="customer_creation">Créations Customer</MenuItem>
      </Select>
    </FormControl>
  );
}
