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

export type RevenuePeriod = 'last_7_days' | 'last_30_days' | 'month_to_date' | 'previous_month' | 'year_to_date' | 'all_time';

export type AdminRevenue = {
  period: RevenuePeriod;
  period_start: string | null;
  period_end: string;
  premium_subscriptions: number;
  price_per_subscription_cents: number;
  estimated_revenue_cents: number;
  currency: string;
  basis: 'premium_monthly_price';
};

export type AdminMetrics = {
  users: { total: number; active: number; banned: number; onboarded: number; created_last_30_days: number };
  moderation: { pending_reports: number; pending_content: number; open_data_requests: number };
  matches: Record<'active' | 'awaiting_continuation' | 'confirmed' | 'expired' | 'ended', number>;
  messages: { total: number };
  photos: PhotoMetrics;
  subscriptions: Array<{ plan: string; users: number }>;
  revenue: AdminRevenue;
};

export type PhotoMetrics = {
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

export type AdminUserDetail = AdminUser & {
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

export type Trait = { id: string; name: string };

export type ProfileQuestionCategory = 'daily_life' | 'personality' | 'interests' | 'relationships' | 'conversation';
export type AdminProfileQuestion = {
  id: string;
  code: string;
  prompt: string;
  category: ProfileQuestionCategory;
  display_order: number;
  answer_count: number;
  created_at: string;
  updated_at: string;
};

export type DataRequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';
export type DataSubjectRequest = {
  id: string;
  user_id: string;
  type: string;
  status: DataRequestStatus;
  requested_at: string;
  completed_at: string | null;
  handled_by: string | null;
  notes?: string | null;
  erasure?: {
    step: 'stripe' | 'photos' | 'scylla' | 'postgres' | 'completed';
    scylla_partition: number;
    updated_at: string;
    event_id: string | null;
    status: 'pending' | 'processing' | 'completed' | 'dead_letter' | 'discarded' | null;
    attempts: number;
    last_error_code: string | null;
  } | null;
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
  trial_days: number;
  weekly_continuation_limit?: number;
  features: Array<{ code: string; display_name: string | null; description: string | null; feature_value: unknown }>;
};

export type Match = {
  id: string;
  user1_id: string;
  user2_id: string;
  status: string;
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
  | 'face_not_detected' | 'multiple_faces' | 'blurry' | 'explicit_image'
  | 'analysis_unavailable' | 'legacy_unreviewed';

export type ModerationCase = {
  case_id: string;
  user_id: string;
  firstname: string | null;
  content_type: ModerationContentType;
  status: ModerationStatus;
  reason_codes: ModerationReasonCode[];
  policy_version: string;
  version: number;
  face_count: number | null;
  sharpness_score: number | null;
  nsfw_score: number | null;
  face_detectable: boolean | null;
  sharp_enough: boolean | null;
  content_allowed: boolean | null;
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

export type PhotoReviewChecks = {
  face_detectable: boolean;
  sharp_enough: boolean;
  content_allowed: boolean;
};
