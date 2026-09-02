import { Chip } from '@mui/material';

const labels: Record<string, string> = {
  active: 'Actif', banned: 'Banni', pending: 'En attente', reviewed: 'Traité', dismissed: 'Rejeté',
  in_progress: 'En cours', completed: 'Terminé', rejected: 'Refusé', confirmed: 'Confirmé',
  awaiting_continuation: 'Décision attendue', expired: 'Expiré', ended: 'Terminé', processing: 'Traitement',
  deleting: 'Suppression', ready: 'Prête', dead_letter: 'Échec définitif',
};

export function StatusChip({ value }: { value: string }) {
  const color = value === 'active' || value === 'confirmed' || value === 'completed' || value === 'reviewed'
    ? 'success' : value === 'pending' || value === 'processing' || value === 'in_progress' || value === 'awaiting_continuation'
      ? 'warning' : value === 'banned' || value === 'rejected' || value === 'deleting' || value === 'dead_letter' ? 'error' : 'default';
  return <Chip size="small" label={labels[value] ?? value} color={color} variant={color === 'default' ? 'outlined' : 'filled'} />;
}
