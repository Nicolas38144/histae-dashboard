import { create } from 'zustand';
import { getChartData, getSizeDatabase } from '../services/metric.service';
import type { IChartData, ISizeDatabase } from '../types/metric.interface';
import type { PeriodTitle } from '../types/dataTableProps.type';

interface MetricState {
  sizeDB: ISizeDatabase | null;
  chartData: IChartData[];
  loadingSizeDB: boolean;
  loadingChartData: boolean;
  error: string | null;
  lastFetchedSizeDB: number | null;
  lastFetchedChartData: number | null;

  periodTitle: PeriodTitle;
  setPeriodTitle: (period: PeriodTitle) => void;
  
  fetchSizeDatabase: (period: number) => Promise<void>;
  fetchChartData: (period: number) => Promise<void>;
}

export const useMetricStore = create<MetricState>((set) => ({
  sizeDB: null,
  chartData: [],
  loadingSizeDB: false,
  loadingChartData: false,
  error: null,
  lastFetchedSizeDB: null,
  lastFetchedChartData: null,

  periodTitle: 'last7days',
  setPeriodTitle: (period) => set({ periodTitle: period }),
  
  fetchSizeDatabase: async (period: number) => {
    set({ loadingSizeDB: true, error: null });
    try {
      const data = await getSizeDatabase(period);
      set({ sizeDB: data, loadingSizeDB: false, lastFetchedSizeDB: Date.now() });
    } catch (err) {
      set({ error: 'Error loading metrics: ' + err, loadingSizeDB: false });
      throw err;
    }
  },

  fetchChartData: async (period: number) => {
    set({ loadingChartData: true, error: null });
    try {
      const data = await getChartData(period);
      set({ chartData: data, loadingChartData: false, lastFetchedChartData: Date.now() });
    } catch (err) {
      set({ error: 'Error loading metrics: ' + err, loadingChartData: false });
      throw err;
    }
  },
}));
