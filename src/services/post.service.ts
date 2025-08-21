import api from './http.service';
import type { IDecryptedPost } from '../types/post.interface';

export const getPosts = async (period: number): Promise<IDecryptedPost[]> => {
  try {
    const res = await api.get(`/posts/all/${period}`);
    const posts: IDecryptedPost[] = res.data;
    return posts;
  } catch (err) {
    console.error('Error getPosts API:', err);
    return [];
  }
};

export const getPost = async (post_id: string): Promise<IDecryptedPost | null> => {
  try {
    const res = await api.get(`/posts/${post_id}`);
    const post: IDecryptedPost = res.data;
    return post;
  } catch (err) {
    console.error('Error getPost API:', err);
    return null;
  }
};

export const getUserCreatedPosts = async (user_id: string): Promise<IDecryptedPost[]> => {
  try {
    const res = await api.get(`/posts/created/${user_id}`);
    const post: IDecryptedPost[] = res.data;
    return post;
  } catch (err) {
    console.error('Error getUserCreatedPosts API:', err);
    return [];
  }
};

export const getUserLikedPosts = async (user_id: string): Promise<IDecryptedPost[]> => {
  try {
    const res = await api.get(`/posts/liked/${user_id}`);
    const posts: IDecryptedPost[] = res.data;
    return posts;
  } catch (err) {
    console.error('Error getUserLikedPosts API:', err);
    return [];
  }
};

export const createPost = async (user_id: string, content: string): Promise<IDecryptedPost | null> => {
  try {
    const res = await api.post('/posts', { user_id, content });
    const createdPost: IDecryptedPost = res.data;
    return createdPost;
  } catch (err) {
    console.error('Error createPost API:', err);
    return null;
  }
};

export const updatePost = async (post_id: string, post: string): Promise<IDecryptedPost | null> => {
  try {
    const res = await api.patch(`/posts/${post_id}`, { post });
    const updatedPost: IDecryptedPost = res.data;
    return updatedPost;
  } catch (err) {
    console.error('Error updatePost API:', err);
    return null;
  }
};

export const deletePost = async (post_id: string): Promise<void> => {
  try {
    await api.delete(`/posts/${post_id}`);
  } catch (err) {
    console.error('Error deletePost API:', err);
  }
};
