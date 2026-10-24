import {
  AssessmentOutlined, GavelOutlined, GroupsOutlined, LocalOfferOutlined,
  PolicyOutlined, PriceChangeOutlined, QuestionAnswerOutlined, SecurityOutlined,
  SmsOutlined, SyncProblemOutlined, FactCheckOutlined, AdminPanelSettingsOutlined,
  CreditScoreOutlined, MarkunreadMailboxOutlined, MonitorHeartOutlined,
} from '@mui/icons-material';
import { t } from '../i18n/core';
import type { AdminSession } from '../api/types';


export const navigationWidth = 250;

export function navigationGroups(role: AdminSession['role'], search: string) {
  const groups = [
    { id: 'community', label: t('workspace.community'), entries: [
      { path: '/overview', label: t('common.overview'), icon: <AssessmentOutlined /> },
      { path: '/users', label: t('common.users'), icon: <GroupsOutlined /> },
      { path: '/traits', label: t('common.traits'), icon: <LocalOfferOutlined /> },
      { path: '/profile-questions', label: t('common.profileQuestions'), icon: <QuestionAnswerOutlined /> },
    ] },
    { id: 'moderation', label: t('workspace.moderation'), entries: [
      { path: '/reports', label: t('common.reports'), icon: <GavelOutlined /> },
      { path: '/content-moderation', label: t('common.moderation'), icon: <FactCheckOutlined /> },
      { path: '/privacy-requests', label: t('common.gdprRequests'), icon: <PolicyOutlined /> },
      { path: '/photo-reconciliation', label: t('common.photos'), icon: <SyncProblemOutlined /> },
    ] },
    { id: 'payments', label: t('workspace.payments'), entries: [
      { path: '/plans', label: t('common.plans'), icon: <PriceChangeOutlined /> },
      { path: '/store-billing', label: t('storeBilling.title'), icon: <PriceChangeOutlined /> },
      { path: '/billing-reconciliation', label: t('common.stripe'), icon: <CreditScoreOutlined /> },
    ] },
    { id: 'operations', label: t('workspace.operations'), entries: [
      { path: '/outbox-dead-letters', label: t('common.outbox'), icon: <MarkunreadMailboxOutlined /> },
      { path: '/sms-safety', label: t('common.smsSafety'), icon: <SmsOutlined /> },
      { path: '/audit-logs', label: t('common.accessLog'), icon: <SecurityOutlined /> },
      { path: '/security', label: t('common.security'), icon: <AdminPanelSettingsOutlined /> },
      ...(role === 'superadmin'
        ? [{ path: '/monitoring', label: t('common.monitoring'), icon: <MonitorHeartOutlined /> }]
        : []),
    ] },
  ];
  const query = normalize(search.trim());
  return groups.map(group => ({
    ...group,
    entries: group.entries.filter(entry => normalize(entry.label).includes(query)),
  })).filter(group => group.entries.length > 0);
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
}
