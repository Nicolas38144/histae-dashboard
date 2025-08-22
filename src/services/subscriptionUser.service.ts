import api from './http.service';
import type { ISubscriptionUser } from '../types/subscription.interface';

export const getSubscriptionUsers = async (user_id: string): Promise<ISubscriptionUser[]> => {
  try {
    const res = await api.get(`/subscription-users/${user_id}`);
    const users: ISubscriptionUser[] = res.data;
    return users;
  } catch (err) {
    console.error('Error getSubscriptionUsers API:', err);
    return [];
  }
};

export const getNbSubscriptionUser = async (plan_name: string): Promise<number> => {
  try {
    const res = await api.get(`/subscription-users/metrics/${plan_name}`);
    const nbSubscription: number = res.data;
    return nbSubscription;
  } catch (err) {
    console.error('Error getNbSubscriptionUser API:', err);
    return -1;
  }
};

export const createSubscriptionUser = async (user_id: string, plan_id: string): Promise<ISubscriptionUser | null> => {
  try {
    const res = await api.post(`/subscription-users`, { user_id, plan_id });
    const createdSubscriptionUser: ISubscriptionUser = res.data;
    return createdSubscriptionUser;
  } catch (err) {
    console.error('Error updateSubscriptionUser API:', err);
    return null;
  }
};

export const updateSubscriptionUser = async (user_id: string): Promise<ISubscriptionUser | null> => {
  try {
    const res = await api.patch(`/subscription-users/${user_id}`, {});
    const updatedSubscriptionUser: ISubscriptionUser = res.data;
    return updatedSubscriptionUser;
  } catch (err) {
    console.error('Error updateSubscriptionUser API:', err);
    return null;
  }
};

export const deleteSubscriptionUser = async (id: string): Promise<void> => {
  try {
    await api.delete(`/subscription-users/${id}`);
  } catch (err) {
    console.error('Error deleteSubscriptionUser API:', err);
  }
};