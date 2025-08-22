import api from './http.service';
import type { ISubscriptionPlan } from '../types/subscription.interface';

export const getSubscriptionPlans = async (): Promise<ISubscriptionPlan[]> => {
  try {
    const res = await api.get('/subscription-plans');
    const plans: ISubscriptionPlan[] = res.data;
    return plans;
  } catch (err) {
    console.error('Error getSubscriptionPlans API:', err);
    return [];
  }
};

export const createSubscriptionPlan = async (name: string, price_cents: number, duration_days: number, features: string[]): Promise<ISubscriptionPlan | null> => {
  try {
    const res = await api.post('/subscription-plans', { name, price_cents, duration_days, features });
    const createdSubscriptionPlan: ISubscriptionPlan = res.data;
    return createdSubscriptionPlan;
  } catch (err) {
    console.error('Error createSubscriptionPlan API:', err);
    return null;
  }
};

export const updateSubscriptionPlan = async (plan: ISubscriptionPlan): Promise<ISubscriptionPlan | null> => {
  try {
    const res = await api.patch(`/subscription-plans/${plan.id}`, { plan });
    const updatedSubscriptionPlan: ISubscriptionPlan = res.data;
    return updatedSubscriptionPlan;
  } catch (err) {
    console.error('Error updateSubscriptionPlan API:', err);
    return null;
  }
};

export const deleteSubscriptionPlan = async (id: string): Promise<void> => {
  try {
    await api.delete(`/subscription-plans/${id}`);
  } catch (err) {
    console.error('Error deleteSubscriptionPlan API:', err);
  }
};
