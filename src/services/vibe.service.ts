import api from './http.service';
import type { IVibe } from '../types/vibe.interface';

export const getVibes = async (): Promise<IVibe[]> => {
  try {
    const res = await api.get('/vibes');
    const vibes: IVibe[] = res.data;
    return vibes;
  } catch (err) {
    console.error('Erreur getVibes API:', err);
    return [];
  }
};

export const getVibe = async (idVibe: string): Promise<IVibe | null> => {
  try {
    const res = await api.get('/vibes/'+idVibe);
    const vibe: IVibe = res.data;
    return vibe;
  } catch (err) {
    console.error('Erreur getVibe API:', err);
    return null;
  }
};

export const createVibe = async (vibe: string): Promise<IVibe | null> => {
  try {
    const res = await api.post('/vibes', { vibe });
    const createdVibe: IVibe = res.data;
    return createdVibe;
  } catch (err) {
    console.error('Erreur createVibe API:', err);
    return null;
  }
};

export const updateVibe = async (idVibe: string, vibe: string): Promise<IVibe | null> => {
  try {
    const res = await api.patch('/vibes/'+idVibe, { vibe });
    const updatedVibe: IVibe = res.data;
    return updatedVibe;
  } catch (err) {
    console.error('Erreur updateVibe API:', err);
    return null;
  }
};

export const deleteVibe = async (idVibe: string): Promise<void> => {
  try {
    await api.delete('/vibes/'+idVibe);
  } catch (err) {
    console.error('Erreur deleteVibe API:', err);
  }
};
