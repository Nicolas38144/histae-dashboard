import api from './http.service';
import type { IChartData, ISizeDatabase } from '../types/metric.interface';

export const getSizeDatabase = async (period: number): Promise<ISizeDatabase | null> => {
  try {
    const res = await api.get(`/metrics/size-db/${period}`);
    const sizeDB: ISizeDatabase = res.data;
    return sizeDB;
  } catch (err) {
    console.error('Erreur getSizeDB API:', err);
    return null;
  }
};

export const getChartData = async (period: number): Promise<IChartData[]> => {
  try {
    const res = await api.get(`/metrics/chart-data/${period}`);
    const sizeDB: IChartData[] = res.data;
    return sizeDB;
  } catch (err) {
    console.error('Erreur getSizeDB API:', err);
    return [];
  }
};
