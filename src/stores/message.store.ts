import { create } from 'zustand';
import {
  getMessages,
  createMessage,
  updateMessage,
  deleteMessage,
} from '../services/message.service';
import type { IMessage } from '../types/message.interface';

interface MessageState {
  messages: IMessage[];
  loading: boolean;
  error: string | null;
  fetchMessages: () => Promise<void>;
  addMessage: (message: string) => Promise<void>;
  editMessage: (id: string, message: string) => Promise<void>;
  removeMessage: (id: string) => Promise<void>;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  loading: false,
  error: null,

  fetchMessages: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getMessages();
      set({ messages: data });
    } catch (e) {
      set({ error: 'Erreur lors du chargement des messages' });
    } finally {
      set({ loading: false });
    }
  },

  addMessage: async (message: string) => {
    try {
      const created = await createMessage(message);
      if (created) {
        set({ messages: [...get().messages, created] });
      }
    } catch (e) {
      set({ error: 'Erreur lors de la création de la message' });
    }
  },

  editMessage: async (id: string, message: string) => {
    try {
      const updated = await updateMessage(id, message);
      if (updated) {
        set({
          messages: get().messages.map((v) => (v.id === id ? updated : v)),
        });
      }
    } catch (e) {
      set({ error: 'Erreur lors de la modification de la message' });
    }
  },

  removeMessage: async (id: string) => {
    try {
      await deleteMessage(id);
      set({ messages: get().messages.filter((v) => v.id !== id) });
    } catch (e) {
      set({ error: 'Erreur lors de la suppression de la message' });
    }
  },
}));
