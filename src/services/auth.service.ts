import api from './http.service';
import { AUTH_KEY } from '../utils/constants';

export const login = async (phone_number: string): Promise<boolean> => {
  try {
    const { data } = await api.post('/auth/login', { phone_number });
    localStorage.setItem(AUTH_KEY, data.accessToken);
    return true;
  } catch (err) {
    console.error('Erreur login API:', err);
    return false;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
    localStorage.removeItem(AUTH_KEY);
  } catch (err) {
    console.error('Erreur logout API:', err);
  }
};
