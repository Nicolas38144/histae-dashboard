import api from './http.service';
import type { IMessage } from '../types/message.interface';

export const getMessages = async (): Promise<IMessage[]> => {
  try {
    const res = await api.get('/messages');
    const messages: IMessage[] = res.data;
    return messages;
  } catch (err) {
    console.error('Erreur getMessages API:', err);
    return [];
  }
};

export const getMessage = async (idMessage: string): Promise<IMessage | null> => {
  try {
    const res = await api.get('/messages/'+idMessage);
    const message: IMessage = res.data;
    return message;
  } catch (err) {
    console.error('Erreur getMessage API:', err);
    return null;
  }
};

export const createMessage = async (message: string): Promise<IMessage | null> => {
  try {
    const res = await api.post('/messages', { message });
    const createdMessage: IMessage = res.data;
    return createdMessage;
  } catch (err) {
    console.error('Erreur createMessage API:', err);
    return null;
  }
};

export const updateMessage = async (idMessage: string, message: string): Promise<IMessage | null> => {
  try {
    const res = await api.patch('/messages/'+idMessage, { message });
    const updatedMessage: IMessage = res.data;
    return updatedMessage;
  } catch (err) {
    console.error('Erreur updateMessage API:', err);
    return null;
  }
};

export const deleteMessage = async (idMessage: string): Promise<void> => {
  try {
    await api.delete('/messages/'+idMessage);
  } catch (err) {
    console.error('Erreur deleteMessage API:', err);
  }
};