import { create } from 'zustand';
import {
  getPosts,
  getUserCreatedPosts,
  getUserLikedPosts,
  createPost,
  updatePost,
  deletePost,
} from '../services/post.service';
import type { IDecryptedPost } from '../types/post.interface';
import type { PeriodTitle } from '../types/dataTableProps.type';

interface PostState {
  posts: IDecryptedPost[];
  userCreatedPosts: IDecryptedPost[];
  userLikedPosts: IDecryptedPost[];
  loadingPost: boolean;
  loadingCreatedPost: boolean;
  loadingLikedPost: boolean;
  errorPost: string | null;
  lastFetchedPost: number | null;

  periodTitle: PeriodTitle;
  setPeriodTitle: (period: PeriodTitle) => void;

  fetchPosts: (period: number) => Promise<void>;
  fetchUserCreatedPosts: (user_id: string) => Promise<void>;
  fetchUserLikedPosts: (user_id: string) => Promise<void>;
  addPost: (data: { user_id: string, content: string }) => Promise<void>;
  editPost: (updatedPost: IDecryptedPost) => Promise<void>;
  removePost: (id: string) => Promise<void>;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  userCreatedPosts: [],
  userLikedPosts: [],
  loadingPost: false,
  loadingCreatedPost: false,
  loadingLikedPost: false,
  errorPost: null,
  lastFetchedPost: null,

  periodTitle: 'last7days',
  setPeriodTitle: (period) => set({ periodTitle: period }),

  fetchPosts: async (period: number) => {
    set({ loadingPost: true, errorPost: null });
    try {
      const data = await getPosts(period);
      set({ posts: data, loadingPost: false, lastFetchedPost: Date.now() });
    } catch (err) {
      set({ errorPost: 'Error loading posts: '+err, loadingPost: false });
      throw err;
    }
  },

  fetchUserCreatedPosts: async (user_id: string) => {
    set({ loadingCreatedPost: true, errorPost: null });
    try {
      const data = await getUserCreatedPosts(user_id);
      set({ userCreatedPosts: data, loadingCreatedPost: false, lastFetchedPost: Date.now() });
    } catch (err) {
      set({ errorPost: 'Error loading posts: '+err, loadingCreatedPost: false });
      throw err;
    }
  },

  fetchUserLikedPosts: async (user_id: string) => {
    set({ loadingLikedPost: true, errorPost: null });
    try {
      const data = await getUserLikedPosts(user_id);
      set({ userLikedPosts: data, loadingLikedPost: false, lastFetchedPost: Date.now() });
    } catch (err) {
      set({ errorPost: 'Error loading posts: '+err, loadingLikedPost: false });
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
      set({ errorPost: 'Error creating post' });
      throw err;
    }
  },

  editPost: async (updatedPost: IDecryptedPost) => {
    try {
      const updated = await updatePost(updatedPost.id, updatedPost.content);
      if (updated) {
        set({
          posts: get().posts.map((p) => (p.id === updatedPost.id ? updated : p)),
        });
      }
    } catch (err) {
      set({ errorPost: 'Error while editing post' });
      throw err;
    }
  },

  removePost: async (id: string) => {
    try {
      await deletePost(id);
      set({ posts: get().posts.filter((v) => v.id !== id) });
    } catch (err) {
      set({ errorPost: 'Error deleting post' });
      throw err;
    }
  },
}));
