export type ApiErrorBody = { error: { code: string; message: string } };

export type AdminSession = {
  user_id: string;
  role: 'admin' | 'superadmin';
  authenticated_at: string;
  expires_at: string;
};

export type AdminCredential = {
  id: string;
  name: string;
  device_type: 'singleDevice' | 'multiDevice';
  backed_up: boolean;
  transports: string[];
  created_at: string;
  last_used_at: string | null;
  current: boolean;
};

export type AdminSessionSummary = {
  id: string;
  credential_id: string;
  credential_name: string;
  authenticated_at: string;
  last_seen_at: string;
  expires_at: string;
  current: boolean;
};

export type AdminAuthEvent = {
  id: string;
  event_type: string;
  credential_id: string | null;
  session_id: string | null;
  created_at: string;
};

export type RevenuePeriod = 'last_7_days' | 'last_30_days' | 'month_to_date' | 'previous_month' | 'year_to_date' | 'all_time';

export type AdminRevenue = {
  period: RevenuePeriod;
  period_start: string | null;
  period_end: string;
  premium_subscriptions: number;
  paid_invoices: number;
  estimated_revenue_cents: number;
  currency: string;
  excluded_currency_invoices: number;
  basis: 'stripe_paid_invoices';
};

export type MaintenanceJob = {
  job_name: 'matches' | 'photos' | 'privacy' | 'outbox' | 'billing';
  status: 'running' | 'succeeded' | 'failed' | 'skipped' | null;
  started_at: string | null;
  finished_at: string | null;
  last_succeeded_at: string | null;
  duration_ms: number | null;
  processed_count: number;
  batch_count: number;
  work_remaining: boolean;
  last_error_code: string | null;
  missing: boolean;
  overdue: boolean;
};

type AdminOperations = {
  runtime: {
    runtime: 'rust';
    uptime_seconds: number;
    memory_rss_bytes: number;
  };
  postgres_pool: { total: number; idle: number; waiting: number };
  maintenance: MaintenanceJob[];
};

export type AdminMetrics = {
  users: { total: number; active: number; banned: number; onboarded: number; created_last_30_days: number };
  moderation: { pending_reports: number; pending_content: number; open_data_requests: number };
  matches: Record<'active' | 'awaiting_continuation' | 'confirmed' | 'expired' | 'ended', number>;
  messages: { total: number };
  photos: PhotoMetrics;
  subscriptions: Array<{ plan: string; users: number }>;
  subscription_offers: Array<{ offer: 'free' | 'premium_monthly' | 'premium_annual' | 'premium_unspecified'; users: number }>;
  revenue: AdminRevenue;
  operations: AdminOperations;
};

type PhotoMetrics = {
  pending: number;
  processing: number;
  ready: number;
  deleting: number;
  stale_processing: number;
  deletion_dead_letters: number;
  deletion_without_active_event: number;
};

export type PhotoReconciliationFilter = 'all' | 'stale_processing' | 'deleting' | 'dead_letter';
export type PhotoReconciliationIssue =
  | 'stale_processing'
  | 'deletion_queued'
  | 'deletion_processing'
  | 'deletion_retry_scheduled'
  | 'deletion_dead_letter'
  | 'deletion_event_missing'
  | 'deletion_event_completed';

export type PhotoReconciliationItem = {
  photo_id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'deleting';
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
  updated_at: string;
  outbox_status: 'pending' | 'processing' | 'completed' | 'dead_letter' | null;
  outbox_attempts: number | null;
  outbox_available_at: string | null;
  outbox_locked_at: string | null;
  outbox_last_error_code: string | null;
  issue: PhotoReconciliationIssue;
};

export type UserRole = 'user' | 'admin' | 'superadmin';
export type AdminUser = {
  user_id: string;
  role: UserRole;
  is_banned: boolean;
  banned_at: string | null;
  created_at: string;
  firstname: string | null;
  birthdate: string | null;
  sex: 'male' | 'female' | 'other' | null;
  photo: string | null;
  plan: string;
  onboarding_complete: boolean;
  reports_received: number;
  matches_count: number;
};

export type ContinuationQuota = {
  plan: string;
  used: number;
  weekly_limit?: number;
  remaining?: number;
  weekly_credits: number;
  free_remaining: number;
  advertising_balance: number;
  advertising_remaining: number;
  reserved: number;
  advertising_stock_limit: number;
};

export type AdminUserDetail = AdminUser & {
  continuation_quota: ContinuationQuota | null;
  banned_reason: string | null;
  preferences: { min_age: number; max_age: number; max_distance_km: number; looking_for: string } | null;
  traits: Array<{ id: string; name: string }>;
  consents: Array<{ consent_type: string; granted: boolean; document_version: string; updated_at: string }>;
  presence: { is_location_fresh: boolean; updated_at: string } | null;
};

export type CursorResponse<T, K extends string> = Record<K, T[]> & { next_cursor: string | null };

export type BillingReconciliationKind = 'subscription' | 'customer_creation';
export type BillingReconciliationKindFilter = BillingReconciliationKind | 'all';

export type BillingReconciliationItem = {
  event_id: string;
  user_id: string;
  kind: BillingReconciliationKind;
  attempts: number;
  last_error_code: string | null;
  created_at: string;
  dead_lettered_at: string;
};

export type ReportStatus = 'pending' | 'reviewed' | 'dismissed';
export type Report = {
  id: string;
  reporter_id: string;
  reported_id: string;
  match_id?: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  created_at: string;
};

type Language = 'fr' | 'en' | 'es' | 'it';
export type Translations = Partial<Record<Language, string>>;
export type TranslationPatch = Partial<Record<Language, string | null>>;
export type Trait = { id: string; name: string; translations?: Translations };

export type ProfileQuestionCategory = 'daily_life' | 'personality' | 'interests' | 'relationships' | 'conversation';
export type AdminProfileQuestion = {
  id: string;
  code: string;
  prompt: string;
  translations?: Translations;
  category: ProfileQuestionCategory;
  display_order: number;
  answer_count: number;
  created_at: string;
  updated_at: string;
};

export type DataRequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';
type DataRequestType = 'access' | 'erasure' | 'portability' | 'rectification' | 'restriction' | 'objection';
export type DataSubjectRequest = {
  id: string;
  user_id: string;
  type: DataRequestType;
  status: DataRequestStatus;
  requested_at: string;
  completed_at: string | null;
  handled_by: string | null;
  notes: string | null;
  erasure: {
    step: 'stripe' | 'photos' | 'swipes' | 'postgres' | 'completed';
    updated_at: string;
    event_id: string | null;
    status: 'pending' | 'processing' | 'completed' | 'dead_letter' | 'discarded' | null;
    attempts: number;
    last_error_code: string | null;
  } | null;
};

export type OutboxDeadLetter = {
  event_id: string;
  event_type: string;
  attempts: number;
  last_error_code: string | null;
  created_at: string;
  dead_lettered_at: string;
};

export type DataAccessLog = {
  id: string;
  accessed_user_id: string;
  accessor_id: string | null;
  accessor_role: string | null;
  action: string;
  reason: string | null;
  accessed_at: string;
};

export type Plan = {
  code: string;
  display_name: string;
  monthly_price_cents: number;
  annual_price_cents: number;
  currency: string;
  weekly_continuation_limit?: number;
  weekly_included_credits?: number;
  advertising_credit_stock_limit: number;
  ads_removed: boolean;
  rewarded_advertising_enabled: boolean;
  features: Array<{ code: string; display_name: string | null; description: string | null; feature_value: unknown }>;
};

export type PlanOffer = {
  code: string;
  plan_code: 'free' | 'premium';
  display_name: string;
  billing_period: 'monthly' | 'annual' | null;
  price_cents: number;
  currency: string;
};

export type PlanCatalog = { plans: Plan[]; offers: PlanOffer[] };

export type Match = {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'active' | 'awaiting_continuation' | 'confirmed' | 'expired' | 'ended';
  expires_at: string;
  purge_after?: string;
  created_at: string;
  last_message_at?: string;
};

export type ChatMessage = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string;
};

export type ModerationContentType = 'photo' | 'bio' | 'profile_answer';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type ModerationReasonCode =
  | 'spam' | 'insult' | 'personal_contact' | 'sexual_content'
  | 'legacy_unreviewed';

export type ModerationCase = {
  case_id: string;
  user_id: string;
  firstname: string | null;
  content_type: ModerationContentType;
  status: ModerationStatus;
  reason_codes: ModerationReasonCode[];
  policy_version: string;
  version: number;
  review_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ModerationDetail = ModerationCase & {
  content: string | null;
  question: string | null;
  photo: string | null;
};

export type SmsSafety = {
  provider_enabled: boolean;
  suspended: boolean;
  manual_suspended: boolean;
  environment_suspended: boolean;
  version: number;
  hourly_limit_per_phone: number;
  daily_limit_per_phone: number;
  sends_last_5_minutes: number;
  sends_last_hour: number;
  sends_last_24_hours: number;
  spike_threshold_5_minutes: number;
  traffic_spike: boolean;
  updated_at: string | null;
};
