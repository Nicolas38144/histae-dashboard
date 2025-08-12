import api from './http.service';
import type { IMatch } from '../types/match.interface';

export const getMatches = async (period: number): Promise<IMatch[]> => {
  try {
    const res = await api.get(`/matches/all/${period}`);
    const matches: IMatch[] = res.data;
    return matches;
  } catch (err) {
    console.error('Error getMatches API:', err);
    return [];
  }
};

export const getMatch = async (id: string): Promise<IMatch | null> => {
  try {
    const res = await api.get('/matches/'+id);
    const match: IMatch = res.data;
    return match;
  } catch (err) {
    console.error('Error getMatch API:', err);
    return null;
  }
};

export const createMatch = async (idUser1: string, idUser2: string): Promise<IMatch | null> => {
  try {
    const res = await api.post('/matches', { idUser1, idUser2 });
    const createdMatch: IMatch = res.data;
    return createdMatch;
  } catch (err) {
    console.error('Error createMatch API:', err);
    return null;
  }
};

export const updateMatch = async (id: string, user1_has_consented_to_reveal_photo: boolean, user2_has_consented_to_reveal_photo: boolean, user1_wishes_to_continue: boolean, user2_wishes_to_continue: boolean): Promise<IMatch | null> => {
  try {
    const res = await api.patch('/matches/'+id, { user1_has_consented_to_reveal_photo, user2_has_consented_to_reveal_photo, user1_wishes_to_continue, user2_wishes_to_continue });
    const updatedMatch: IMatch = res.data;
    return updatedMatch;
  } catch (err) {
    console.error('Error updateMatch API:', err);
    return null;
  }
};

export const deleteMatch = async (id: string): Promise<void> => {
  try {
    await api.delete('/matches/'+id);
  } catch (err) {
    console.error('Error deleteMatch API:', err);
  }
};

