import api from './http.service';
import type { ISubscriptionPlan } from '../types/subscription.interface';

export const getPlans = async (): Promise<ISubscriptionPlan[]> => {
  try {
    const res = await api.get('/subscription/plans');
    const plans: ISubscriptionPlan[] = res.data;
    return plans;
  } catch (err) {
    console.error('Erreur getPlans API:', err);
    return [];
  }
};

export const getPlan = async (idPlan: string): Promise<ISubscriptionPlan | null> => {
  try {
    const res = await api.get('/subscription/plans/'+idPlan);
    const plan: ISubscriptionPlan = res.data;
    return plan;
  } catch (err) {
    console.error('Erreur getPlan API:', err);
    return null;
  }
};

export const createPlan = async (plan: string): Promise<ISubscriptionPlan | null> => {
  try {
    const res = await api.post('/subscription/plans', { plan });
    const createdPlan: ISubscriptionPlan = res.data;
    return createdPlan;
  } catch (err) {
    console.error('Erreur createPlan API:', err);
    return null;
  }
};

export const deletePlan = async (idPlan: string): Promise<void> => {
  try {
    await api.delete('/subscription/plans/'+idPlan);
  } catch (err) {
    console.error('Erreur deletePlan API:', err);
  }
};