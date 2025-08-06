import api from './http.service';
import type { IDecryptedUser as IUser } from '../types/user.interface';

export const getUsers = async (): Promise<IUser[]> => {
  try {
    const res = await api.get('/users');
    const users: IUser[] = res.data;
    return users;
  } catch (err) {
    console.error('Erreur logout API:', err);
    return [];
  }
};

export const getUser = async (id: string): Promise<IUser | null> => {
  try {
    const res = await api.get('/users/'+id);
    const user: IUser = res.data;
    return user;
  } catch (err) {
    console.error('Erreur getUser API:', err);
    return null;
  }
};

export const createUser = async (phone_number: string, email_backup: string, firstname: string, birthdate: Date, sex: string, bio: string): Promise<IUser | null> => {
  try {
    const res = await api.post('/auth/register', { phone_number, email_backup, firstname, birthdate, sex, bio });
    const createdUser: IUser = res.data;
    return createdUser;
  } catch (err) {
    console.error('Erreur createUser API:', err);
    return null;
  }
};

export const updateUser = async (id: string, user: IUser): Promise<IUser | null> => {
  try {
    const res = await api.patch('/users/'+id, { user });
    const updatedUser: IUser = res.data;
    return updatedUser;
  } catch (err) {
    console.error('Erreur updateUser API:', err);
    return null;
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  try {
    await api.delete('/users/'+id);
  } catch (err) {
    console.error('Erreur deleteUser API:', err);
  }
};
