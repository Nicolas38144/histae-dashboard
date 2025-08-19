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
  loadingMessage: boolean;
  errorMessage: string | null;
  lastFetchedMessage: number | null;
  fetchMessages: (match_id: string) => Promise<void>;
  addMessage: (message: string) => Promise<void>;
  editMessage: (id: string, message: string) => Promise<void>;
  removeMessage: (id: string) => Promise<void>;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: [],
  loadingMessage: false,
  errorMessage: null,
  lastFetchedMessage: null,

  fetchMessages: async (match_id: string) => {
    set({ loadingMessage: true, errorMessage: null });
    try {
      const data = await getMessages(match_id);
      set({ messages: data, loadingMessage: false, lastFetchedMessage: Date.now() });
    } catch (err) {
      set({ errorMessage: 'Error loadingMessage messages: '+err, loadingMessage: false });
      throw err;
    }
  },

  addMessage: async (message: string) => {
    try {
      const created = await createMessage(message);
      if (created) {
        set({ messages: [...get().messages, created] });
      }
    } catch (err) {
      set({ errorMessage: 'Error creating message' });
      throw err;
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
    } catch (err) {
      set({ errorMessage: 'Error while editing message' });
      throw err;
    }
  },

  removeMessage: async (id: string) => {
    try {
      await deleteMessage(id);
      set({ messages: get().messages.filter((v) => v.id !== id) });
    } catch (err) {
      set({ errorMessage: 'Error deleting message' });
      throw err;
    }
  },
}));
