import { create } from 'zustand';
import {
  getVibes,
  createVibe,
  updateVibe,
  deleteVibe,
} from '../services/vibe.service';
import type { IVibe } from '../types/vibe.interface';

interface VibeState {
  vibes: IVibe[];
  loading: boolean;
  error: string | null;
  fetchVibes: () => Promise<void>;
  addVibe: (vibe: string) => Promise<void>;
  editVibe: (id: string, vibe: string) => Promise<void>;
  removeVibe: (id: string) => Promise<void>;
}

export const useVibeStore = create<VibeState>((set, get) => ({
  vibes: [],
  loading: false,
  error: null,

  fetchVibes: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getVibes();
      set({ vibes: data });
    } catch (e) {
      set({ error: 'Erreur lors du chargement des vibes' });
    } finally {
      set({ loading: false });
    }
  },

  addVibe: async (vibe: string) => {
    try {
      const created = await createVibe(vibe);
      if (created) {
        set({ vibes: [...get().vibes, created] });
      }
    } catch (e) {
      set({ error: 'Erreur lors de la création de la vibe' });
    }
  },

  editVibe: async (id: string, vibe: string) => {
    try {
      const updated = await updateVibe(id, vibe);
      if (updated) {
        set({
          vibes: get().vibes.map((v) => (v.id === id ? updated : v)),
        });
      }
    } catch (e) {
      set({ error: 'Erreur lors de la modification de la vibe' });
    }
  },

  removeVibe: async (id: string) => {
    try {
      await deleteVibe(id);
      set({ vibes: get().vibes.filter((v) => v.id !== id) });
    } catch (e) {
      set({ error: 'Erreur lors de la suppression de la vibe' });
    }
  },
}));
