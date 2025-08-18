import api from './http.service';
import type { IChartData, ISizeDatabase, IUserMetric } from '../types/metric.interface';

export const getSizeDatabase = async (period: number): Promise<ISizeDatabase | null> => {
  try {
    const res = await api.get(`/metrics/size-db/${period}`);
    const sizeDB: ISizeDatabase = res.data;
    return sizeDB;
  } catch (err) {
    console.error('Error getSizeDatabase API:', err);
    return null;
  }
};

export const getChartData = async (period: number): Promise<IChartData[]> => {
  try {
    const res = await api.get(`/metrics/chart-data/${period}`);
    const sizeDB: IChartData[] = res.data;
    return sizeDB;
  } catch (err) {
    console.error('Error getChartData API:', err);
    return [];
  }
};

export const getUserMetric = async (user_id: string): Promise<IUserMetric | null> => {
  try {
    const res = await api.get(`/metrics/user/${user_id}`);
    const userMetric: IUserMetric = res.data;
    return userMetric;
  } catch (err) {
    console.error('Error getUserMetric API:', err);
    return null;
  }
};
