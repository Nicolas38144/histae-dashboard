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
  lastFetched: number | null;
  fetchVibes: () => Promise<void>;
  addVibe: (data: { vibe: string }) => Promise<void>;
  editVibe: (updatedVibe: IVibe) => Promise<void>;
  removeVibe: (id: string) => Promise<void>;
}

export const useVibeStore = create<VibeState>((set, get) => ({
  vibes: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchVibes: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getVibes();
      set({ vibes: data, loading: false, lastFetched: Date.now() });
    } catch (err) {
      set({ error: 'Error loading posts: '+err, loading: false });
      throw err;
    }
  },

  addVibe: async (data: { vibe: string }) => {
    try {
      const created = await createVibe(data.vibe);
      if (created) {
        set({ vibes: [...get().vibes, created] });
      }
    } catch (err) {
      set({ error: 'Error creating vibe' });
      throw err;
    }
  },

  editVibe: async (updatedVibe: IVibe) => {
    try {
      const updated = await updateVibe(updatedVibe.id, updatedVibe.vibe);
      if (updated) {
        set({
          vibes: get().vibes.map((v) => (v.id === updated.id ? updated : v)),
        });
      }
    } catch (err) {
      set({ error: 'Error while editing vibe' });
      throw err;
    }
  },

  removeVibe: async (id: string) => {
    try {
      await deleteVibe(id);
      set({ vibes: get().vibes.filter((v) => v.id !== id) });
    } catch (err) {
      set({ error: 'Error deleting vibe' });
      throw err;  
    }
  },
}));
