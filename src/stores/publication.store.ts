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
  addPublication: (user_id: string, content: string) => Promise<void>;
  editPublication: (id: string, content: string) => Promise<void>;
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
      set({ error: 'Erreur lors du chargement des publications: '+err, loading: false });
    }
  },

  addPublication: async (user_id: string, content: string) => {
    try {
      const created = await createPublication(user_id, content);
      if (created) {
        set({ publications: [...get().publications, created] });
      }
    } catch (err) {
      set({ error: 'Erreur lors de la création de la publication' });
    }
  },

  editPublication: async (id: string, content: string) => {
    try {
      const updated = await updatePublication(id, content);
      if (updated) {
        set({
          publications: get().publications.map((v) => (v.id === id ? updated : v)),
        });
      }
    } catch (err) {
      set({ error: 'Erreur lors de la modification de la publication' });
    }
  },

  removePublication: async (id: string) => {
    try {
      await deletePublication(id);
      set({ publications: get().publications.filter((v) => v.id !== id) });
    } catch (err) {
      set({ error: 'Erreur lors de la suppression de la publication' });
    }
  },
}));
