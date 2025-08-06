import { create } from 'zustand';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../services/user.service';
import type { IDecryptedUser as IUser } from '../types/user.interface';

interface UserState {
  users: IUser[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchUsers: () => Promise<void>;
  addUser: (user: IUser) => Promise<void>;
  editUser: (user: IUser) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getUsers();
      set({ users: data, loading: false, lastFetched: Date.now() });
    } catch (err) {
      set({ error: 'Erreur lors du chargement des users: '+err, loading: false });
      throw err;
    }
  },

  addUser: async (user: IUser) => {
    try {
      const created = await createUser(
        user.phone_number,
				user.email_backup,
				user.firstname,
				user.birthdate,
				user.sex,
				user.bio
      );
      if (created) {
        set({ users: [...get().users, created] });
      }
    } catch (err) {
      set({ error: 'Erreur lors de la création du user' });
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
      set({ error: 'Erreur lors de la modification du user' });
      throw err;
    }
  },

  removeUser: async (id: string) => {
    try {
      await deleteUser(id);
      set({ users: get().users.filter((v) => v.id !== id) });
    } catch (err) {
      set({ error: 'Erreur lors de la suppression du user' });
      throw err;
    }
  },
}));
