import { Box, Typography } from '@mui/material';
import { t } from '../i18n/core';
import { useLocale } from '../i18n/useLocale';

/** User content is always rendered as text, separately from internal notes. */
export function PrivacyRequestMessage({ details, label, collapsible = false }: { details?: string | null; label?: string; collapsible?: boolean }) {
  useLocale();
  const message = <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mt: 1 }}>{details || t('privacyRequests.noUserMessage')}</Typography>;
  if (collapsible) return <Box component="details" sx={{ mt: 1, minWidth: 220, maxWidth: 360 }}>
    <Box component="summary" sx={{ cursor: 'pointer', color: 'primary.main', fontWeight: 600 }}>{label || t('privacyRequests.userMessage')}</Box>
    {message}
  </Box>;
  return <Box sx={{ my: 2 }}>
    <Typography variant="subtitle2">{label || t('privacyRequests.userMessage')}</Typography>
    {message}
  </Box>;
}
