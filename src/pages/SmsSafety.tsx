import { useOutletContext } from 'react-router-dom';
import type { AdminSession } from '../api/types';
import { PageHeader } from '../components/PageHeader';
import { SmsSafetyPanel } from '../components/SmsSafetyPanel';
import { t } from '../i18n/core';
import { useLocale } from '../i18n/useLocale';

export default function SmsSafety() {
  useLocale();
  const session = useOutletContext<AdminSession>();

  return (
    <>
      <PageHeader title={t('smsSafety.title')} description={t('smsSafety.description')} />
      <SmsSafetyPanel canManage={session.role === 'superadmin'} />
    </>
  );
}
