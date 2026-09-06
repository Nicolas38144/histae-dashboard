import type {
  AdminCredential,
  AdminMetrics,
  AdminProfileQuestion,
  AdminSession,
  AdminUserDetail,
  BillingReconciliationItem,
  DataSubjectRequest,
  ModerationDetail,
  PhotoReconciliationItem,
  Report,
} from '../src/api/types';

export const fixtureIds = {
  admin: '10000000-0000-4000-8000-000000000001',
  user: '20000000-0000-4000-8000-000000000001',
  secondUser: '20000000-0000-4000-8000-000000000002',
  credential: '30000000-0000-4000-8000-000000000001',
  question: '40000000-0000-4000-8000-000000000001',
  report: '50000000-0000-4000-8000-000000000001',
  moderation: '60000000-0000-4000-8000-000000000001',
  photo: '70000000-0000-4000-8000-000000000001',
  event: '80000000-0000-4000-8000-000000000001',
  request: '90000000-0000-4000-8000-000000000001',
} as const;

const now = '2026-09-06T08:00:00.000Z';

export const adminSession: AdminSession = {
  user_id: fixtureIds.admin,
  role: 'superadmin',
  authenticated_at: now,
  expires_at: '2026-09-06T09:00:00.000Z',
};

export const adminCredential: AdminCredential = {
  id: fixtureIds.credential,
  name: 'Clé de test principale',
  device_type: 'singleDevice',
  backed_up: false,
  transports: ['internal'],
  created_at: now,
  last_used_at: now,
  current: false,
};

export const profileQuestion: AdminProfileQuestion = {
  id: fixtureIds.question,
  code: 'question_fixture',
  prompt: 'Quel moment simple illumine ta journée ?',
  category: 'daily_life',
  display_order: 10,
  answer_count: 12,
  created_at: now,
  updated_at: now,
};

export const adminUser: AdminUserDetail = {
  user_id: fixtureIds.user,
  role: 'user',
  is_banned: false,
  banned_at: null,
  banned_reason: null,
  created_at: now,
  firstname: 'Camille',
  birthdate: '1994-04-12',
  sex: 'other',
  photo: null,
  plan: 'free',
  onboarding_complete: true,
  reports_received: 1,
  matches_count: 0,
  preferences: { min_age: 25, max_age: 40, max_distance_km: 50, looking_for: 'both' },
  traits: [],
  consents: [],
  presence: null,
};

export const report: Report = {
  id: fixtureIds.report,
  reporter_id: fixtureIds.secondUser,
  reported_id: fixtureIds.user,
  reason: 'spam',
  description: 'Description synthétique de test.',
  status: 'pending',
  created_at: now,
};

export const moderationDetail: ModerationDetail = {
  case_id: fixtureIds.moderation,
  user_id: fixtureIds.user,
  firstname: 'Camille',
  content_type: 'bio',
  status: 'pending',
  reason_codes: ['spam'],
  policy_version: 'fixture-v1',
  version: 3,
  face_count: null,
  sharpness_score: null,
  nsfw_score: null,
  face_detectable: null,
  sharp_enough: null,
  content_allowed: null,
  review_reason: null,
  reviewed_at: null,
  reviewed_by: null,
  created_at: now,
  updated_at: now,
  content: 'Contenu fictif réservé au test de revue.',
  question: null,
  photo: null,
};

export const photoReconciliation: PhotoReconciliationItem = {
  photo_id: fixtureIds.photo,
  user_id: fixtureIds.user,
  status: 'deleting',
  size_bytes: 120_000,
  width: 720,
  height: 960,
  created_at: now,
  updated_at: now,
  outbox_status: 'dead_letter',
  outbox_attempts: 10,
  outbox_available_at: now,
  outbox_locked_at: null,
  outbox_last_error_code: 'storage_unavailable',
  issue: 'deletion_dead_letter',
};

export const billingReconciliation: BillingReconciliationItem = {
  event_id: fixtureIds.event,
  user_id: fixtureIds.user,
  kind: 'customer_creation',
  attempts: 10,
  last_error_code: 'billing_customer_search_ambiguous',
  created_at: now,
  dead_lettered_at: now,
};

export const erasureRequest: DataSubjectRequest = {
  id: fixtureIds.request,
  user_id: fixtureIds.user,
  type: 'erasure',
  status: 'in_progress',
  requested_at: now,
  completed_at: null,
  handled_by: fixtureIds.admin,
  notes: null,
  erasure: {
    step: 'photos',
    scylla_partition: 0,
    updated_at: now,
    event_id: fixtureIds.event,
    status: 'dead_letter',
    attempts: 10,
    last_error_code: 'storage_unavailable',
  },
};

export const adminMetrics: AdminMetrics = {
  users: { total: 2, active: 2, banned: 0, onboarded: 2, created_last_30_days: 2 },
  moderation: { pending_reports: 1, pending_content: 1, open_data_requests: 1 },
  matches: { active: 0, awaiting_continuation: 0, confirmed: 0, expired: 0, ended: 0 },
  messages: { total: 0 },
  photos: {
    pending: 0,
    processing: 0,
    ready: 1,
    deleting: 1,
    stale_processing: 0,
    deletion_dead_letters: 1,
    deletion_without_active_event: 0,
  },
  subscriptions: [{ plan: 'free', users: 2 }],
  revenue: {
    period: 'last_30_days',
    period_start: '2026-08-07T08:00:00.000Z',
    period_end: now,
    premium_subscriptions: 0,
    price_per_subscription_cents: 500,
    estimated_revenue_cents: 0,
    currency: 'EUR',
    basis: 'premium_monthly_price',
  },
  operations: {
    runtime: { uptime_seconds: 10, memory_rss_bytes: 1_000, heap_used_bytes: 500, event_loop_delay_p95_ms: 1 },
    postgres_pool: { total: 2, idle: 2, waiting: 0 },
    maintenance: [],
  },
};
