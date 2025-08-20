import { create } from 'zustand';
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan
} from '../services/subscription.service';
import type { ISubscriptionPlan } from '../types/subscription.interface';
import type { PeriodTitle } from '../types/dataTableProps.type';

interface SubscriptionPlanState {
  subscriptionPlans: ISubscriptionPlan[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;

  fetchSubscriptionPlans: () => Promise<void>;
  addSubscriptionPlan: (name: string, price_cents: number, duration_days: number, features: string[]) => Promise<void>;
  editSubscriptionPlan: (plan: ISubscriptionPlan) => Promise<void>;
  removeSubscriptionPlan: (id: string) => Promise<void>;
}

export const useSubscriptionPlanStore = create<SubscriptionPlanState>((set, get) => ({
  subscriptionPlans: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchSubscriptionPlans: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getSubscriptionPlans();      
      set({
        subscriptionPlans: data,
        loading: false,
        lastFetched: Date.now()
      });
    } catch (err) {
      set({ error: 'Error loading subscription plans: '+err, loading: false });
      throw err;
    }
  },

  addSubscriptionPlan: async (name: string, price_cents: number, duration_days: number, features: string[]) => {
    set({ loading: true, error: null });
    try {
      const created = await createSubscriptionPlan(name, price_cents, duration_days, features);
      if (created) {
        set({
          subscriptionPlans: [...get().subscriptionPlans, created],
          loading: false
        });
      }   
    } catch (err) {
      set({ error: 'Error creating subscription plan: '+err, loading: false });
      throw err;
    }
  },

  editSubscriptionPlan: async (plan: ISubscriptionPlan) => {
    set({ loading: true, error: null });
    try {
      const updated = await updateSubscriptionPlan(plan);
      if (updated) {
        set({
          subscriptionPlans: get().subscriptionPlans.map((s) => (s.id === updated.id ? updated : s)),
          loading: false
        });
      }
    } catch (err) {
      set({ error: 'Error editing subscription plan: '+err, loading: false });
      throw err;
    }
  },

  removeSubscriptionPlan: async (id: string) => {
    try {
      await deleteSubscriptionPlan(id);
      set({ subscriptionPlans: get().subscriptionPlans.filter((s) => s.id !== id) });
    } catch (err) {
      set({ error: 'Error deleting subscription plan' });
      throw err;
    }
  },
}));
