import api from './api';
import type { ChatMessage, AIInsight, FoodEntry, WorkoutEntry } from '../types';

export const aiService = {
  sendMessage: async (
    message: string,
    history?: { role: string; content: string }[]
  ): Promise<{ reply: string; loggedFoods?: FoodEntry[]; loggedWorkouts?: WorkoutEntry[] }> => {
    const response = await api.post<{ reply: string; loggedFoods?: FoodEntry[]; loggedWorkouts?: WorkoutEntry[] }>('/ai/chat', { message, history });
    return response.data;
  },

  getDailyInsight: async (): Promise<AIInsight> => {
    const response = await api.get<AIInsight>('/ai/insight');
    return response.data;
  },

  getChatHistory: async (): Promise<ChatMessage[]> => {
    const response = await api.get<ChatMessage[]>('/ai/history');
    return response.data;
  },

  analyzeFoodText: async (text: string): Promise<FoodEntry[]> => {
    const response = await api.post<FoodEntry[]>('/ai/food-analysis', { text });
    return response.data;
  },

  analyzeWorkoutText: async (text: string): Promise<WorkoutEntry[]> => {
    const response = await api.post<WorkoutEntry[]>('/ai/workout-analysis', { text });
    return response.data;
  },

  processVoiceText: async (transcript: string): Promise<{
    reply: string;
    foodEntries?: FoodEntry[];
    loggedFoods?: FoodEntry[];
    workoutEntries?: WorkoutEntry[];
    loggedWorkouts?: WorkoutEntry[];
  }> => {
    const response = await api.post<{
      reply: string;
      foodEntries?: FoodEntry[];
      loggedFoods?: FoodEntry[];
      workoutEntries?: WorkoutEntry[];
      loggedWorkouts?: WorkoutEntry[];
    }>('/ai/voice', { transcript });
    return response.data;
  },
};
