import { Alert, Box, Button, CircularProgress } from '@mui/material';

type AsyncStateProps = {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
};

export function AsyncState({ loading, error, onRetry }: AsyncStateProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Alert severity="error" action={onRetry ? <Button color="inherit" onClick={onRetry}>Réessayer</Button> : undefined}>
        {error}
      </Alert>
    );
  }
  return null;
}
