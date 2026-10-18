import type { Plan, PlanCatalog, PlanOffer } from './types';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const isAmount = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

function isPlan(value: unknown): value is Plan {
  return isObject(value) && isText(value.code) && isText(value.display_name) && isText(value.currency)
    && isAmount(value.monthly_price_cents) && isAmount(value.annual_price_cents)
    && isAmount(value.advertising_credit_stock_limit) && typeof value.ads_removed === 'boolean'
    && typeof value.rewarded_advertising_enabled === 'boolean'
    && (value.weekly_continuation_limit === undefined || isAmount(value.weekly_continuation_limit))
    && (value.weekly_included_credits === undefined || isAmount(value.weekly_included_credits))
    && Array.isArray(value.features) && value.features.every((feature) => isObject(feature)
      && isText(feature.code) && (feature.display_name === null || isText(feature.display_name))
      && (feature.description === null || typeof feature.description === 'string')
      && Object.hasOwn(feature, 'feature_value'));
}

function isOffer(value: unknown): value is PlanOffer {
  if (!isObject(value) || !isText(value.display_name) || !isText(value.currency)
    || !isAmount(value.price_cents)) return false;
  return value.plan_code === 'free'
    ? value.code === 'free' && value.billing_period === null
    : value.plan_code === 'premium' && ['monthly', 'annual'].includes(value.billing_period as string)
      && value.code === `premium_${value.billing_period}`;
}

export function parsePlanCatalog(value: unknown): PlanCatalog {
  const invalid = () => new Error('Le catalogue des offres est incomplet.');
  if (!isObject(value) || !Array.isArray(value.plans) || !value.plans.every(isPlan)) throw invalid();
  const plans = value.plans;
  const codes = new Set(plans.map((plan) => plan.code));
  const offers = value.offers;
  if (codes.size !== plans.length || !Array.isArray(offers) || !offers.every(isOffer)
    || new Set(offers.map((offer) => offer.code)).size !== offers.length
    || offers.some((offer) => !codes.has(offer.plan_code))) throw invalid();
  return { plans, offers };
}
