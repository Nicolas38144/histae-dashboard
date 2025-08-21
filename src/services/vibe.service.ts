import api from './http.service';
import type { IVibe } from '../types/vibe.interface';

export const getVibes = async (): Promise<IVibe[]> => {
  try {
    const res = await api.get('/vibes');
    const vibes: IVibe[] = res.data;
    return vibes;
  } catch (err) {
    console.error('Error getVibes API:', err);
    return [];
  }
};

export const getVibe = async (vibe_id: string): Promise<IVibe | null> => {
  try {
    const res = await api.get(`/vibes/${vibe_id}`);
    const vibe: IVibe = res.data;
    return vibe;
  } catch (err) {
    console.error('Error getVibe API:', err);
    return null;
  }
};

export const createVibe = async (vibe: string): Promise<IVibe | null> => {
  try {
    const res = await api.post('/vibes', { vibe });
    const createdVibe: IVibe = res.data;
    return createdVibe;
  } catch (err) {
    console.error('Error createVibe API:', err);
    return null;
  }
};

export const updateVibe = async (vibe_id: string, vibe: string): Promise<IVibe | null> => {
  try {
    const res = await api.patch(`/vibes/${vibe_id}`, { vibe });
    const updatedVibe: IVibe = res.data;
    return updatedVibe;
  } catch (err) {
    console.error('Error updateVibe API:', err);
    return null;
  }
};

export const deleteVibe = async (vibe_id: string): Promise<void> => {
  try {
    await api.delete(`/vibes/${vibe_id}`);
  } catch (err) {
    console.error('Error deleteVibe API:', err);
  }
};
