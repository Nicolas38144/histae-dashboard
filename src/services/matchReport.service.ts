import api from './http.service';
import type { IUserMatchReportDecrypted } from '../types/matchReport.interface';

export const getUserMatchReports = async (user_id: string): Promise<IUserMatchReportDecrypted[]> => {
  try {
    const res = await api.get(`/matchreports/${user_id}`);
    const userMatchReports: IUserMatchReportDecrypted[] = res.data;
    return userMatchReports;
  } catch (err) {
    console.error('Error getUserMatchReports API:', err);
    return [];
  }
};

export const deleteUserMatchReport = async (report_id: string): Promise<void> => {
  try {
    await api.delete(`/matchreports/${report_id}`);
  } catch (err) {
    console.error('Error deleteMatch API:', err);
  }
};
