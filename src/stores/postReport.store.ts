import { create } from 'zustand';
import {
  getPostReports,
  deletePostReport,
  getPostReportOrigin,
} from '../services/postReport.service';
import type { IDecryptedPostReport, IDecryptedUserPostReport } from '../types/postReport.interface';
import type { PeriodTitle } from '../types/dataTableProps.type';

interface PostReportState {
  postReports: IDecryptedPostReport[];
  postReportOrigin: IDecryptedUserPostReport[];
  loadingPostReport: boolean;
  loadingPostReportOrigin: boolean;
  errorPostReport: string | null;
  lastFetchedPostReport: number | null;

  periodTitle: PeriodTitle;
  setPeriodTitle: (period: PeriodTitle) => void;

  fetchPostReports: (period: number) => Promise<void>;
  fetchPostReportOrigin: (user_id: string) => Promise<void>;
  removePostReport: (id: string) => Promise<void>;
}

export const usePostReportStore = create<PostReportState>((set, get) => ({
  postReports: [],
  postReportOrigin: [],
  loadingPostReport: false,
  loadingPostReportOrigin: false,
  errorPostReport: null,
  lastFetchedPostReport: null,

  periodTitle: 'last7days',
  setPeriodTitle: (period) => set({ periodTitle: period }),

  fetchPostReports: async (period: number) => {
    set({ loadingPostReport: true, errorPostReport: null });
    try {
      const data = await getPostReports(period);
      set({ postReports: data, loadingPostReport: false, lastFetchedPostReport: Date.now() });
    } catch (err) {
      set({ errorPostReport: 'Error loading post reports: '+err, loadingPostReport: false });
      throw err;
    }
  },
  
  fetchPostReportOrigin: async (user_id: string) => {
    set({ loadingPostReportOrigin: true, errorPostReport: null });
    try {
      const data = await getPostReportOrigin(user_id);
      set({ postReportOrigin: data, loadingPostReportOrigin: false, lastFetchedPostReport: Date.now() });
    } catch (err) {
      set({ errorPostReport: 'Error loading posts: '+err, loadingPostReportOrigin: false });
      throw err;
    }
  },

  removePostReport: async (id: string) => {
    try {
      await deletePostReport(id);
      set({ postReports: get().postReports.filter((v) => v.id !== id) });
    } catch (err) {
      set({ errorPostReport: 'Error deleting post report' });
      throw err;
    }
  },
}));
