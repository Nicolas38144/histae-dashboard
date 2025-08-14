import api from './http.service';
import type { IPost } from '../types/post.interface';

export const getPosts = async (period: number): Promise<IPost[]> => {
  try {
    const res = await api.get(`/posts/all/${period}`);
    const posts: IPost[] = res.data;
    return posts;
  } catch (err) {
    console.error('Error getPosts API:', err);
    return [];
  }
};

export const getPost = async (idPost: string): Promise<IPost | null> => {
  try {
    const res = await api.get('/posts/'+idPost);
    const post: IPost = res.data;
    return post;
  } catch (err) {
    console.error('Error getPost API:', err);
    return null;
  }
};

export const createPost = async (user_id: string, content: string): Promise<IPost | null> => {
  try {
    const res = await api.post('/posts', { user_id, content });
    const createdPost: IPost = res.data;
    return createdPost;
  } catch (err) {
    console.error('Error createPost API:', err);
    return null;
  }
};

export const updatePost = async (idPost: string, post: string): Promise<IPost | null> => {
  try {
    const res = await api.patch('/posts/'+idPost, { post });
    const updatedPost: IPost = res.data;
    return updatedPost;
  } catch (err) {
    console.error('Error updatePost API:', err);
    return null;
  }
};

export const deletePost = async (idPost: string): Promise<void> => {
  try {
    await api.delete('/posts/'+idPost);
  } catch (err) {
    console.error('Error deletePost API:', err);
  }
};