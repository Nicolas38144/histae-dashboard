import api from './http.service';
import type { IPublication } from '../types/publication.interface';

export const getPublications = async (): Promise<IPublication[]> => {
  try {
    const res = await api.get('/publications');
    const publications: IPublication[] = res.data;
    return publications;
  } catch (err) {
    console.error('Error getPublications API:', err);
    return [];
  }
};

export const getPublication = async (idPublication: string): Promise<IPublication | null> => {
  try {
    const res = await api.get('/publications/'+idPublication);
    const publication: IPublication = res.data;
    return publication;
  } catch (err) {
    console.error('Error getPublication API:', err);
    return null;
  }
};

export const createPublication = async (user_id: string, content: string): Promise<IPublication | null> => {
  try {
    const res = await api.post('/publications', { user_id, content });
    const createdPublication: IPublication = res.data;
    return createdPublication;
  } catch (err) {
    console.error('Error createPublication API:', err);
    return null;
  }
};

export const updatePublication = async (idPublication: string, publication: string): Promise<IPublication | null> => {
  try {
    const res = await api.patch('/publications/'+idPublication, { publication });
    const updatedPublication: IPublication = res.data;
    return updatedPublication;
  } catch (err) {
    console.error('Error updatePublication API:', err);
    return null;
  }
};

export const deletePublication = async (idPublication: string): Promise<void> => {
  try {
    await api.delete('/publications/'+idPublication);
  } catch (err) {
    console.error('Error deletePublication API:', err);
  }
};