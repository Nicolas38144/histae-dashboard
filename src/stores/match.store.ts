import { create } from 'zustand';
import {
  getMatches,
  createMatch,
  updateMatch,
  deleteMatch,
} from '../services/match.service';
import type { IMatch } from '../types/match.interface';

interface MatchState {
  matches: IMatch[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchMatches: () => Promise<void>;
  addMatch: (data: { user1_id: string, user2_id: string }) => Promise<void>;
  editMatch: (updatedMatch: IMatch) => Promise<void>;
  removeMatch: (id: string) => Promise<void>;
}

export const useMatchStore = create<MatchState>((set, get) => ({
  matches: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchMatches: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getMatches();
      set({ matches: data, loading: false, lastFetched: Date.now() });
    } catch (err) {
      set({ error: 'Error loading matches: '+err, loading: false });
      throw err;
    }
  },

  addMatch: async (data: { user1_id: string, user2_id: string }) => {
    try {
      const created = await createMatch(data.user1_id, data.user2_id);
      if (created) {
        set({ matches: [...get().matches, created] });
      }
    } catch (err) {
      set({ error: 'Error creating match' });
      throw err;
    }
  },

  editMatch: async (updatedMatch: IMatch) => {
    try {
      const updated = await updateMatch(
        updatedMatch.id,
        updatedMatch.user1_has_consented_to_reveal_photo,
        updatedMatch.user2_has_consented_to_reveal_photo,
        updatedMatch.user1_wishes_to_continue,
        updatedMatch.user2_wishes_to_continue
      );
      if (updated) {
        set({
          matches: get().matches.map((m) => (m.id === updatedMatch.id ? updated : m)),
        });
      }
    } catch (err) {
      set({ error: 'Error while editing match' });
      throw err;
    }
  },

  removeMatch: async (id: string) => {
    try {
      await deleteMatch(id);
      set({ matches: get().matches.filter((v) => v.id !== id) });
    } catch (err) {
      set({ error: 'Error deleting match' });
      throw err;
    }
  },
}));
