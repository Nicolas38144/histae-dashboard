export interface ISubscriptionPlan {
  id: string;
	created_at: Date;
	name: string;
  price_cents: number;
  duration_days: number;
	features: string[];
}

export interface IUserSubscription {
  id: string;
	user_id: string;
	plan_id: string;
	started_at: Date;
	expires_at: Date;
	ended_at: Date;
	is_active: boolean;
}
