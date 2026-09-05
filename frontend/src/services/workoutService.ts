import api from './api';
import type { WorkoutEntry } from '../types';

export const workoutService = {
  getTodayWorkouts: async (): Promise<WorkoutEntry[]> => {
    const response = await api.get<WorkoutEntry[]>('/workouts/today');
    return response.data;
  },

  getWorkoutsByDate: async (date: string): Promise<WorkoutEntry[]> => {
    const response = await api.get<WorkoutEntry[]>(`/workouts/date/${date}`);
    return response.data;
  },

  addWorkout: async (data: Omit<WorkoutEntry, 'id' | 'userId' | 'createdAt'>): Promise<WorkoutEntry> => {
    const response = await api.post<WorkoutEntry>('/workouts', data);
    return response.data;
  },

  deleteWorkout: async (id: string): Promise<void> => {
    await api.delete(`/workouts/${id}`);
  },

  getHistory: async (days: number = 7): Promise<WorkoutEntry[]> => {
    const response = await api.get<WorkoutEntry[]>(`/workouts/history?days=${days}`);
    return response.data;
  },
};
