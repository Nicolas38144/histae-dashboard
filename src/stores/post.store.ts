import { create } from 'zustand';
import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
} from '../services/post.service';
import type { IPost } from '../types/post.interface';
import type { PeriodTitle } from '../types/dataTableProps.type';

interface PostState {
  posts: IPost[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;

  periodTitle: PeriodTitle;
  setPeriodTitle: (period: PeriodTitle) => void;

  fetchPosts: (period: number) => Promise<void>;
  addPost: (data: { user_id: string, content: string }) => Promise<void>;
  editPost: (updatedPost: IPost) => Promise<void>;
  removePost: (id: string) => Promise<void>;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  loading: false,
  error: null,
  lastFetched: null,

  periodTitle: 'last7days',
  setPeriodTitle: (period) => set({ periodTitle: period }),

  fetchPosts: async (period: number) => {
    set({ loading: true, error: null });
    try {
      const data = await getPosts(period);
      set({ posts: data, loading: false, lastFetched: Date.now() });
    } catch (err) {
      set({ error: 'Error loading posts: '+err, loading: false });
      throw err;
    }
  },

  addPost: async (data: { user_id: string, content: string }) => {
    try {
      const created = await createPost(data.user_id, data.content);
      if (created) {
        set({ posts: [...get().posts, created] });
      }
    } catch (err) {
      set({ error: 'Error creating post' });
      throw err;
    }
  },

  editPost: async (updatedPost: IPost) => {
    try {
      const updated = await updatePost(updatedPost.id, updatedPost.content);
      if (updated) {
        set({
          posts: get().posts.map((p) => (p.id === updatedPost.id ? updated : p)),
        });
      }
    } catch (err) {
      set({ error: 'Error while editing post' });
      throw err;
    }
  },

  removePost: async (id: string) => {
    try {
      await deletePost(id);
      set({ posts: get().posts.filter((v) => v.id !== id) });
    } catch (err) {
      set({ error: 'Error deleting post' });
      throw err;
    }
  },
}));
