import { create } from 'zustand';
import { getChartData, getSizeDatabase, getUserMetric } from '../services/metric.service';
import type { IChartData, ISizeDatabase, IUserMetric } from '../types/metric.interface';
import type { PeriodTitle } from '../types/dataTableProps.type';

interface MetricState {
  sizeDB: ISizeDatabase | null;
  chartData: IChartData[];
  userMetric: IUserMetric | null;
  loadingSizeDB: boolean;
  loadingChartData: boolean;
  loadingUserMetric: boolean;
  errorMetric: string | null;
  lastFetchedSizeDB: number | null;
  lastFetchedChartData: number | null;
  lastFetchedUserMetric: number | null;

  periodTitle: PeriodTitle;
  setPeriodTitle: (period: PeriodTitle) => void;
  
  fetchSizeDatabase: (period: number) => Promise<void>;
  fetchChartData: (period: number) => Promise<void>;
  fetchUserMetric: (user_id: string) => Promise<void>;
}

export const userMetricStore = create<MetricState>((set) => ({
  sizeDB: null,
  chartData: [],
  userMetric: null,
  loadingSizeDB: false,
  loadingChartData: false,
  loadingUserMetric: false,
  errorMetric: null,
  lastFetchedSizeDB: null,
  lastFetchedChartData: null,
  lastFetchedUserMetric: null,

  periodTitle: 'last7days',
  setPeriodTitle: (period) => set({ periodTitle: period }),
  
  fetchSizeDatabase: async (period: number) => {
    set({ loadingSizeDB: true, errorMetric: null });
    try {
      const data = await getSizeDatabase(period);
      set({ sizeDB: data, loadingSizeDB: false, lastFetchedSizeDB: Date.now() });
    } catch (err) {
      set({ errorMetric: 'Error loading metrics: ' + err, loadingSizeDB: false });
      throw err;
    }
  },

  fetchChartData: async (period: number) => {
    set({ loadingChartData: true, errorMetric: null });
    try {
      const data = await getChartData(period);
      set({ chartData: data, loadingChartData: false, lastFetchedChartData: Date.now() });
    } catch (err) {
      set({ errorMetric: 'Error loading metrics: ' + err, loadingChartData: false });
      throw err;
    }
  },

  fetchUserMetric: async (user_id: string) => {
    set({ loadingUserMetric: true, errorMetric: null });
    try {
      const data = await getUserMetric(user_id);
      set({ userMetric: data, loadingUserMetric: false, lastFetchedUserMetric: Date.now() });
    } catch (err) {
      set({ errorMetric: 'Error loading user metric: ' + err, loadingUserMetric: false });
      throw err;
    }
  },
}));
