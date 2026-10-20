import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { Alert, Box, Button } from '@mui/material';

export function CursorPaginationControls({
  nextCursor,
  loading,
  error,
  onLoadMore,
  onReload,
  loadLabel = t("common.loadMore"),
}: {
  nextCursor: string | null;
  loading: boolean;
  error: string | null;
  onLoadMore: () => void;
  onReload: () => void;
  loadLabel?: string;
}) {
  useLocale();
  if (error) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={onReload}>{t("cursorPaginationControls.reloadFromTheBeginning")}</Button>}
        sx={{ m: 2 }}
      >
        {t("cursorPaginationControls.theNextPageCouldNotBeLoaded")}{error}
      </Alert>
    );
  }
  if (!nextCursor) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
      <Button onClick={onLoadMore} disabled={loading}>{loading ? t("common.loading") : loadLabel}</Button>
    </Box>
  );
}
