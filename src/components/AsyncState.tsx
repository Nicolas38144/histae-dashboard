import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { Alert, Box, Button, CircularProgress } from '@mui/material';

type AsyncStateProps = {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
};

export function AsyncState({ loading, error, onRetry }: AsyncStateProps) {
  useLocale();
  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}>
        <CircularProgress aria-label={t("common.loading")} />
      </Box>
    );
  }
  if (error) {
    return (
      <Alert severity="error" action={onRetry ? <Button color="inherit" onClick={onRetry}>{t("common.tryAgain")}</Button> : undefined}>
        {error}
      </Alert>
    );
  }
  return null;
}
