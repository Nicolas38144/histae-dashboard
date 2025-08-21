import api from './http.service';
import type { IMessage } from '../types/message.interface';

export const getMessages = async (match_id: string): Promise<IMessage[]> => {
  try {
    const res = await api.get(`/messages/${match_id}`);
    const messages: IMessage[] = res.data;
    return messages;
  } catch (err) {
    console.error('Error getMessages API:', err);
    return [];
  }
};

export const createMessage = async (message: string): Promise<IMessage | null> => {
  try {
    const res = await api.post('/messages', { message });
    const createdMessage: IMessage = res.data;
    return createdMessage;
  } catch (err) {
    console.error('Error createMessage API:', err);
    return null;
  }
};

export const updateMessage = async (message_id: string, message: string): Promise<IMessage | null> => {
  try {
    const res = await api.patch(`/messages/${message_id}`, { message });
    const updatedMessage: IMessage = res.data;
    return updatedMessage;
  } catch (err) {
    console.error('Error updateMessage API:', err);
    return null;
  }
};

export const deleteMessage = async (message_id: string): Promise<void> => {
  try {
    await api.delete(`/messages/${message_id}`);
  } catch (err) {
    console.error('Error deleteMessage API:', err);
  }
};
