import { Alert, Box, Button } from '@mui/material';

export function CursorPaginationControls({
  nextCursor,
  loading,
  error,
  onLoadMore,
  onReload,
  loadLabel = 'Charger la suite',
}: {
  nextCursor: string | null;
  loading: boolean;
  error: string | null;
  onLoadMore: () => void;
  onReload: () => void;
  loadLabel?: string;
}) {
  if (error) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={onReload}>Recharger depuis le début</Button>}
        sx={{ m: 2 }}
      >
        La page suivante n’a pas pu être chargée : {error}
      </Alert>
    );
  }
  if (!nextCursor) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
      <Button onClick={onLoadMore} disabled={loading}>{loading ? 'Chargement…' : loadLabel}</Button>
    </Box>
  );
}
