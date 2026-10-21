import type { MessageKey } from './catalogs';
import { t } from './core';

// Protocol values stay unchanged; only their presentation is localized.
const labels: Readonly<Record<string, MessageKey>> = {
  "user": "common.user",
  "admin": "common.admin",
  "superadmin": "common.superadmin",
  "free": "common.free",
  "male": "domain.male",
  "female": "domain.female",
  "both": "domain.both",
  "other": "domain.other",
  "premium": "domain.premium",
  "terms_of_service_acceptance": "domain.terms_of_service_acceptance",
  "privacy_notice_acknowledgement": "domain.privacy_notice_acknowledgement",
  "sensitive_data_consent": "domain.sensitive_data_consent",
  "location_consent": "domain.location_consent",
  "access": "domain.access",
  "erasure": "domain.erasure",
  "portability": "domain.portability",
  "rectification": "domain.rectification",
  "restriction": "domain.restriction",
  "objection": "domain.objection",
  "bootstrap_issued": "domain.bootstrap_issued",
  "bootstrap_registered": "domain.bootstrap_registered",
  "login_succeeded": "domain.login_succeeded",
  "credential_added": "domain.credential_added",
  "credential_renamed": "domain.credential_renamed",
  "credential_revoked": "domain.credential_revoked",
  "session_revoked": "domain.session_revoked",
  "other_sessions_revoked": "domain.other_sessions_revoked",
  "logout": "domain.logout",
  "view_profile": "domain.view_profile",
  "view_messages": "domain.view_messages",
  "view_matches": "domain.view_matches",
  "export_data": "domain.export_data",
  "admin_ban": "domain.admin_ban",
  "admin_unban": "domain.admin_unban",
  "admin_promote": "domain.admin_promote",
  "admin_demote": "domain.admin_demote",
  "admin_suspend_sms": "domain.admin_suspend_sms",
  "admin_resume_sms": "domain.admin_resume_sms",
  "admin_review_report": "domain.admin_review_report",
  "admin_review_dsr": "domain.admin_review_dsr",
  "admin_reconcile_photo": "domain.admin_reconcile_photo",
  "view_moderation_content": "domain.view_moderation_content",
  "admin_review_content": "domain.admin_review_content",
  "system_anonymize": "domain.system_anonymize",
  "system_export_portability": "domain.system_export_portability"
};

export function domainLabel(value: string | null | undefined): string {
  if (!value) return t('common.missing');
  return Object.hasOwn(labels, value) ? t(labels[value]) : value;
}
