import api from './api';
import type { User, DailyTargets } from '../types';

export const userService = {
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/users/profile');
    localStorage.setItem('fitmind_user', JSON.stringify(response.data));
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<User>('/users/profile', data);
    localStorage.setItem('fitmind_user', JSON.stringify(response.data));
    return response.data;
  },

  completeOnboarding: async (data: Partial<User>): Promise<User> => {
    const response = await api.post<User>('/users/onboarding', data);
    localStorage.setItem('fitmind_user', JSON.stringify(response.data));
    return response.data;
  },

  getDailyTargets: async (): Promise<DailyTargets> => {
    const response = await api.get<DailyTargets>('/users/daily-targets');
    return response.data;
  },
};
