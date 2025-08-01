import { create } from 'zustand';
import { getVibes } from '../services/vibe.service';
import type { IVibe } from '../interfaces/vibe.interface';

interface VibeState {
  vibes: IVibe[];
  loading: boolean;
  error: string | null;
  fetchVibes: () => Promise<void>;
}

export const useVibeStore = create<VibeState>((set) => ({
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
}));
