import api from './http.service';
import { AUTH_KEY, USER_KEY } from '../utils/constants';

export const login = async (phone_number: string, password: string): Promise<boolean> => {
  try {
    const { data } = await api.post('/auth/login', { phone_number, password });    
    localStorage.setItem(AUTH_KEY, data.accessToken);
    localStorage.setItem(USER_KEY, data.user.id);
    return true;
  } catch (err) {
    console.error('Error login API:', err);
    return false;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.error('Error logout API:', err);
  }
};
