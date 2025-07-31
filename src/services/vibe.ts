import api from './http';
import { AUTH_KEY } from '../utils/constants';
import type { IVibe } from '../types/vibe.interface';

export const getVibes = async (): Promise<IVibe[]> => {
  try {
    const res = await api.get('/vibes');
    const vibes: IVibe[] = res.data;
    return vibes;
  } catch (err) {
    console.error('Erreur logout API:', err);
    return [];
  }
};

export const getVibe = async (phone_number: string): Promise<boolean> => {
  try {
    const { data } = await api.post('/auth/login', { phone_number });
    localStorage.setItem(AUTH_KEY, data.accessToken);
    return true;
  } catch (err) {
    console.error('Erreur login API:', err);
    return false;
  }
};