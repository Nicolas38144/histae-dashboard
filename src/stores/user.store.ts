import { create } from 'zustand';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../services/user.service';
import type { IDecryptedUser as IUser } from '../types/user.interface';
import type { PeriodTitle } from '../types/dataTableProps.type';

interface UserState {
  users: IUser[];
  loadingUser: boolean;
  errorUser: string | null;
  lastFetchedUser: number | null;
  fetchUsers: (period: number) => Promise<void>;
  addUser: (user: IUser) => Promise<void>;
  editUser: (user: IUser) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
	
  periodTitle: PeriodTitle;
  setPeriodTitle: (period: PeriodTitle) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loadingUser: false,
  errorUser: null,
  lastFetchedUser: null,

  periodTitle: 'last7days',
  setPeriodTitle: (period) => set({ periodTitle: period }),

  fetchUsers: async (period: number) => {
    set({ loadingUser: true, errorUser: null });
    try {
      const data = await getUsers(period);
      set({ users: data, loadingUser: false, lastFetchedUser: Date.now() });
    } catch (err) {
      set({ errorUser: 'Error loadingUser users: '+err, loadingUser: false });
      throw err;
    }
  },

  addUser: async (user: IUser) => {
    try {
      const created = await createUser(
        user.phone_number,
				user.email,
				user.firstname,
				user.birthdate,
				user.sex,
				user.bio
      );
      if (created) {
        set({ users: [...get().users, created] });
      }
    } catch (err) {
      set({ errorUser: 'Error creating user' });
      throw err;
    }
  },

  editUser: async (data: IUser) => {
    try {
      const updated = await updateUser(data.id, data);
      if (updated) {
        set({
          users: get().users.map((u) => (u.id === updated.id ? updated : u)),
        });
      }
    } catch (err) {
      set({ errorUser: 'Error while editing user' });
      throw err;
    }
  },

  removeUser: async (id: string) => {
    try {
      await deleteUser(id);
      set({ users: get().users.filter((v) => v.id !== id) });
    } catch (err) {
      set({ errorUser: 'Error deleting user' });
      throw err;
    }
  },
}));
