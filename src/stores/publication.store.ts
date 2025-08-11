import { create } from 'zustand';
import {
  getPublications,
  createPublication,
  updatePublication,
  deletePublication,
} from '../services/publication.service';
import type { IPublication } from '../types/publication.interface';

interface PublicationState {
  publications: IPublication[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchPublications: () => Promise<void>;
  addPublication: (data: { user_id: string, content: string }) => Promise<void>;
  editPublication: (updatedPublication: IPublication) => Promise<void>;
  removePublication: (id: string) => Promise<void>;
}

export const usePublicationStore = create<PublicationState>((set, get) => ({
  publications: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchPublications: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getPublications();
      set({ publications: data, loading: false, lastFetched: Date.now() });
    } catch (err) {
      set({ error: 'Error loading publications: '+err, loading: false });
      throw err;
    }
  },

  addPublication: async (data: { user_id: string, content: string }) => {
    try {
      const created = await createPublication(data.user_id, data.content);
      if (created) {
        set({ publications: [...get().publications, created] });
      }
    } catch (err) {
      set({ error: 'Error creating publication' });
      throw err;
    }
  },

  editPublication: async (updatedPublication: IPublication) => {
    try {
      const updated = await updatePublication(updatedPublication.id, updatedPublication.content);
      if (updated) {
        set({
          publications: get().publications.map((p) => (p.id === updatedPublication.id ? updated : p)),
        });
      }
    } catch (err) {
      set({ error: 'Error while editing publication' });
      throw err;
    }
  },

  removePublication: async (id: string) => {
    try {
      await deletePublication(id);
      set({ publications: get().publications.filter((v) => v.id !== id) });
    } catch (err) {
      set({ error: 'Error deleting publication' });
      throw err;
    }
  },
}));
