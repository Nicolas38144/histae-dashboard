import api from './http.service';
import type { IDecryptedPostReport, IDecryptedUserPostReport } from '../types/postReport.interface';

export const getPostReports = async (period: number): Promise<IDecryptedPostReport[]> => {
  try {
    const res = await api.get(`/postreports/all/${period}`);
    const postReports: IDecryptedPostReport[] = res.data;
    return postReports;
  } catch (err) {
    console.error('Error getPostReports API:', err);
    return [];
  }
};

export const getPostReportOrigin = async (user_id: string): Promise<IDecryptedUserPostReport[]> => {
  try {
    const res = await api.get(`/postreports/${user_id}`);
    const posts: IDecryptedUserPostReport[] = res.data;    
    return posts;
  } catch (err) {
    console.error('Error getPostReportOrigin API:', err);
    return [];
  }
};

export const deletePostReport = async (id: string): Promise<void> => {
  try {
    await api.delete(`/postreports/${id}`);
  } catch (err) {
    console.error('Error deletePostReport API:', err);
  }
};