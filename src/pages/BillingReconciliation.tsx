import { ReplayOutlined } from '@mui/icons-material';
import {
  Box,
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
import { useCallback, useEffect, useRef, useState } from 'react';

import { getBillingReconciliation, retryOutboxEvent } from '../api/admin';
import { errorMessage } from '../api/client';
import type {
  BillingReconciliationItem,
  BillingReconciliationKind,
  BillingReconciliationKindFilter,
} from '../api/types';
import { AsyncState } from '../components/AsyncState';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { PageHeader } from '../components/PageHeader';
import { UserLink } from '../components/UserLink';
import { useNotification } from '../components/notification-context';
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

export default function BillingReconciliation() {
  const [kind, setKind] = useState<BillingReconciliationKindFilter>('all');
  const [events, setEvents] = useState<BillingReconciliationItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<BillingReconciliationItem | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const requestSequence = useRef(0);
  const { showNotification } = useNotification();

  const load = useCallback(async (nextCursor?: string, signal?: AbortSignal) => {
    const requestId = ++requestSequence.current;
    if (nextCursor) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const page = await getBillingReconciliation(kind, nextCursor, signal);
      if (requestId !== requestSequence.current) return;
      setEvents((current) => nextCursor ? [...current, ...page.events] : page.events);
      setCursor(page.next_cursor);
    } catch (loadError) {
      if (signal?.aborted || requestId !== requestSequence.current) return;
      setError(errorMessage(loadError));
    } finally {
      if (requestId === requestSequence.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [kind]);

  useEffect(() => {
    const controller = new AbortController();
    void load(undefined, controller.signal);
    return () => controller.abort();
  }, [load]);

  const retry = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await retryOutboxEvent(selected.event_id, reason);
      showNotification('Une nouvelle vérification Stripe a été mise en file.', 'success');
      setSelected(null);
      setReason('');
      await load();
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
      <AsyncState loading={loading} error={error} onRetry={() => void load()} />
      {!loading && !error && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead><TableRow><TableCell>Événement</TableCell><TableCell>Utilisateur</TableCell><TableCell>Type</TableCell><TableCell>Tentatives</TableCell><TableCell>Diagnostic</TableCell><TableCell>Échec définitif</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
            <TableBody>
              {events.map((event) => (
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
              {!events.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}>Aucune dead letter Stripe.</TableCell></TableRow>}
            </TableBody>
          </Table>
          {cursor && <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><Button onClick={() => void load(cursor)} disabled={loadingMore}>{loadingMore ? 'Chargement…' : 'Charger la suite'}</Button></Box>}
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
