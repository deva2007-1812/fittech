import api from './api';
import type { SleepEntry } from '../types';

export const sleepService = {
  getTodaySleep: async (): Promise<SleepEntry | null> => {
    const response = await api.get<SleepEntry | null>('/sleep/today');
    return response.data;
  },

  logSleep: async (data: {
    duration: number;
    bedtime?: string;
    wakeTime?: string;
    date?: string;
  }): Promise<SleepEntry> => {
    const response = await api.post<SleepEntry>('/sleep', data);
    return response.data;
  },

  getHistory: async (days: number = 7): Promise<SleepEntry[]> => {
    const response = await api.get<SleepEntry[]>(`/sleep/history?days=${days}`);
    return response.data;
  },
};
