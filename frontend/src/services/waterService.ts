import api from './api';
import type { WaterEntry, WaterLog } from '../types';

export const waterService = {
  getTodayLog: async (): Promise<WaterLog> => {
    const response = await api.get<WaterLog>('/water/today');
    return response.data;
  },

  addWater: async (amount: number, date?: string): Promise<WaterEntry> => {
    const response = await api.post<WaterEntry>('/water', { amount, date });
    return response.data;
  },

  getHistory: async (days: number = 7): Promise<{ date: string; amount: number }[]> => {
    const response = await api.get(`/water/history?days=${days}`);
    return response.data;
  },

  deleteWater: async (id: string): Promise<void> => {
    await api.delete(`/water/${id}`);
  },
};
