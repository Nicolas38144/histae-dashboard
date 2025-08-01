import api from './http.service';
import type { IDecryptedUser as IUser } from '../interfaces/user.interface';

export const getUsers = async (): Promise<IUser[] | null> => {
  try {
    const users: IUser[] = await api.post('/users');
    return users;
  } catch (err) {
    console.error('Erreur logout API:', err);
    return null;
  }
};
