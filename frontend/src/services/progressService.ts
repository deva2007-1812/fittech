import api from './api';
import type { ProgressData, WeightEntry, DateRange } from '../types';

export const progressService = {
  getProgressData: async (range: DateRange = '7d'): Promise<ProgressData> => {
    const response = await api.get<ProgressData>(`/progress?range=${range}`);
    return response.data;
  },

  logWeight: async (weight: number, date?: string): Promise<WeightEntry> => {
    const response = await api.post<WeightEntry>('/progress/weight', { weight, date });
    return response.data;
  },

  getWeightHistory: async (range: DateRange = '30d'): Promise<WeightEntry[]> => {
    const response = await api.get<WeightEntry[]>(`/progress/weight?range=${range}`);
    return response.data;
  },
};
