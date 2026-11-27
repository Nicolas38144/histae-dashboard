import { useLocale } from '../i18n/useLocale';
import { t } from '../i18n/core';
import { Link, Tooltip, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useUserName } from '../hooks/useUserName';

export function UserLink({ id, label, accountDeleted = false }: { id: string; label?: string | null; accountDeleted?: boolean }) {
  useLocale();
  const result = useUserName(accountDeleted || label ? undefined : id);
  if (accountDeleted || result?.status === 'missing') {
    return <Typography component="span" variant="body2" color="text.secondary">
      {t(accountDeleted ? 'common.accountDeleted' : 'common.accountUnavailable')}
    </Typography>;
  }
  if (!label && !result) return <Typography component="span" variant="body2" color="text.secondary">{t('common.loading')}</Typography>;
  const name = label || (result?.status === 'found'
    ? result.firstname || t('common.firstNameNotProvided')
    : t('common.userProfile'));
  return <Tooltip title={id} describeChild><Link component={RouterLink} to={`/users/${id}`}>{name}</Link></Tooltip>;
}
