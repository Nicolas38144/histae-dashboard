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
  addMatch: (data: IMatch) => Promise<void>;
  editMatch: (id: string, data: IMatch) => Promise<void>;
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
      set({ error: 'Erreur lors du chargement des matches: '+err, loading: false });
    }
  },

  addMatch: async (data: IMatch) => {
    try {
      const created = await createMatch(data.user1_id, data.user2_id);
      if (created) {
        set({ matches: [...get().matches, created] });
      }
    } catch (err) {
      set({ error: 'Erreur lors de la création du match' });
    }
  },

  editMatch: async (id: string, data: IMatch) => {
    try {
      const updated = await updateMatch(
        id,
        data.user1_has_consented_to_reveal_photo,
        data.user2_has_consented_to_reveal_photo,
        data.user1_wishes_to_continue,
        data.user2_wishes_to_continue,
      );
      if (updated) {
        set({
          matches: get().matches.map((v) => (v.id === id ? updated : v)),
        });
      }
    } catch (err) {
      set({ error: 'Erreur lors de la modification du match' });
    }
  },

  removeMatch: async (id: string) => {
    try {
      await deleteMatch(id);
      set({ matches: get().matches.filter((v) => v.id !== id) });
    } catch (err) {
      set({ error: 'Erreur lors de la suppression du match' });
    }
  },
}));
