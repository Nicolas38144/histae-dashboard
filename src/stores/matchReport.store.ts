import { create } from 'zustand';
import {
  getUserMatchReports,
  deleteUserMatchReport
} from '../services/matchReport.service';
import type { IUserMatchReportDecrypted } from '../types/matchReport.interface';

interface MatchReportState {
  userMatchReports: IUserMatchReportDecrypted[];
  loadingUserMatchReports: boolean;
  errorUserMatchReports: string | null;
  lastFetched: number | null;

  fetchUserMatchReports: (user_id: string) => Promise<void>;
  removeUserMatchReport: (report_id: string) => Promise<void>;
}

export const useMatchReportStore = create<MatchReportState>((set, get) => ({
  userMatchReports: [],
  loadingUserMatchReports: false,
  errorUserMatchReports: null,
  lastFetched: null,

  fetchUserMatchReports: async (user_id: string) => {
    set({ loadingUserMatchReports: true, errorUserMatchReports: null });
    try {
      const data = await getUserMatchReports(user_id);      
      set({ userMatchReports: data, loadingUserMatchReports: false, lastFetched: Date.now() });
    } catch (err) {
      set({ errorUserMatchReports: 'Error loading user match reports: '+err, loadingUserMatchReports: false });
      throw err;
    }
  },

  removeUserMatchReport: async (report_id: string) => {
    try {
      await deleteUserMatchReport(report_id);
      set({ userMatchReports: get().userMatchReports.filter((mr) => mr.report_id !== report_id) });
    } catch (err) {
      set({ errorUserMatchReports: 'Error deleting match report' });
      throw err;
    }
  },
}));
