import { create } from 'zustand';
import {
  getUser,
  updateUser,
  deleteUser,
} from '../services/user.service';
import type { IDecryptedUser as IUser } from '../types/user.interface';

interface DetailsUserState {
  user: IUser | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchUser: (id: string) => Promise<void>;
  editUser: (user: IUser) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
}

export const userDetailsUserStore = create<DetailsUserState>((set, get) => ({
  user: null,
  userReport: null,
  loading: false,
  error: null,
  lastFetched: null,

  fetchUser: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const data = await getUser(id);
      set({ user: data, loading: false, lastFetched: Date.now() });
    } catch (err) {
      set({ error: 'Error loading user: '+err, loading: false });
      throw err;
    }
  },

  editUser: async (data: IUser) => {
    try {
      const updated = await updateUser(data.id, data);
      if (updated) {
        set({
          user: updated,
        });
      }
    } catch (err) {
      set({ error: 'Error while editing user' });
      throw err;
    }
  },

  removeUser: async (id: string) => {
    try {
      await deleteUser(id);
      set({ user: null });
    } catch (err) {
      set({ error: 'Error deleting user' });
      throw err;
    }
  },
}));
