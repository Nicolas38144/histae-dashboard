export type ApiErrorBody = { error: { code: string; message: string } };

export type TokenPair = { access_token: string; refresh_token: string };
export type AdminSession = { user_id: string; role: 'admin' | 'superadmin' };

export type AdminMetrics = {
  users: { total: number; active: number; banned: number; onboarded: number; created_last_30_days: number };
  moderation: { pending_reports: number; open_data_requests: number };
  matches: Record<'active' | 'awaiting_continuation' | 'confirmed' | 'expired' | 'ended', number>;
  messages: { total: number };
  subscriptions: Array<{ plan: string; users: number }>;
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

