import { create } from 'zustand';
import {
  getSubscriptionUsers,
  getNbSubscriptionUser,
  createSubscriptionUser,
  updateSubscriptionUser,
  deleteSubscriptionUser
} from '../services/subscriptionUser.service';
import type { ISubscriptionUser } from '../types/subscription.interface';

interface SubscriptionUserState {
  subscriptionUsers: ISubscriptionUser[];
  nbSubscriptionUser: number;
  loadingSubscriptionUser: boolean;
  errorSubscriptionUser: string | null;
  lastFetchedSubscriptionUser: number | null;

  fetchSubscriptionUsers: (user_id: string) => Promise<void>;
  fetchNbSubscriptionUser: (plan_name: string) => Promise<void>;
  addSubscriptionUser: (user_id: string, plan_id: string) => Promise<void>;
  editSubscriptionUser: (user_id: string) => Promise<void>;
  removeSubscriptionUser: (id: string) => Promise<void>;
}

export const useSubscriptionUserStore = create<SubscriptionUserState>((set, get) => ({
  subscriptionUsers: [],
  nbSubscriptionUser: 0,
  loadingSubscriptionUser: false,
  errorSubscriptionUser: null,
  lastFetchedSubscriptionUser: null,

  fetchSubscriptionUsers: async (user_id: string) => {
    set({ loadingSubscriptionUser: true, errorSubscriptionUser: null });
    try {
      const data = await getSubscriptionUsers(user_id);      
      set({
        subscriptionUsers: data,
        loadingSubscriptionUser: false,
        lastFetchedSubscriptionUser: Date.now()
      });
    } catch (err) {
      set({ errorSubscriptionUser: 'Error loadingSubscriptionUser subscription users: '+err, loadingSubscriptionUser: false });
      throw err;
    }
  },

  fetchNbSubscriptionUser: async (plan_name: string) => {
    set({ loadingSubscriptionUser: true, errorSubscriptionUser: null });
    try {
      const data = await getNbSubscriptionUser(plan_name);      
      set({
        nbSubscriptionUser: data,
        loadingSubscriptionUser: false,
      });
    } catch (err) {
      set({ errorSubscriptionUser: 'Error loadingSubscriptionUser subscription users: '+err, loadingSubscriptionUser: false });
      throw err;
    }
  },

  addSubscriptionUser: async (user_id: string, plan_id: string) => {
    set({ loadingSubscriptionUser: true, errorSubscriptionUser: null });
    try {
      const created = await createSubscriptionUser(user_id, plan_id);
      if (created) {
        set({
          subscriptionUsers: [...get().subscriptionUsers, created],
          loadingSubscriptionUser: false
        });
      }   
    } catch (err) {
      set({ errorSubscriptionUser: 'Error creating subscription user: '+err, loadingSubscriptionUser: false });
      throw err;
    }
  },

  editSubscriptionUser: async (user_id: string) => {
    set({ loadingSubscriptionUser: true, errorSubscriptionUser: null });
    try {
      const updated = await updateSubscriptionUser(user_id);
      if (updated) {
        set({
          subscriptionUsers: get().subscriptionUsers.map((s) => (s.id === updated.id ? updated : s)),
          loadingSubscriptionUser: false
        });
      }
    } catch (err) {
      set({ errorSubscriptionUser: 'Error editing subscription user: '+err, loadingSubscriptionUser: false });
      throw err;
    }
  },

  removeSubscriptionUser: async (id: string) => {
    try {
      await deleteSubscriptionUser(id);
      set({ subscriptionUsers: get().subscriptionUsers.filter((s) => s.id !== id) });
    } catch (err) {
      set({ errorSubscriptionUser: 'Error deleting subscription user' });
      throw err;
    }
  },
}));
