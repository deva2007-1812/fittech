import api from './api';
import type { FoodEntry, NutritionLog, MealType } from '../types';

export interface FoodSearchResult {
  id: string;
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
}

export const nutritionService = {
  getTodayLog: async (): Promise<NutritionLog> => {
    const response = await api.get<NutritionLog>('/nutrition/today');
    return response.data;
  },

  getLogByDate: async (date: string): Promise<NutritionLog> => {
    const response = await api.get<NutritionLog>(`/nutrition/log/${date}`);
    return response.data;
  },

  searchFoods: async (query: string): Promise<FoodSearchResult[]> => {
    if (!query.trim()) return [];
    const response = await api.get<FoodSearchResult[]>(`/foods/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },

  addFoodEntry: async (data: {
    foodName: string;
    quantity: string;
    mealType: MealType;
    date?: string;
  }): Promise<FoodEntry> => {
    const response = await api.post<FoodEntry>('/nutrition/entries', data);
    return response.data;
  },

  analyzeFoodText: async (text: string): Promise<FoodEntry[]> => {
    const response = await api.post<FoodEntry[]>('/ai/food-analysis', { text });
    return response.data;
  },

  deleteFoodEntry: async (id: string): Promise<void> => {
    await api.delete(`/nutrition/entries/${id}`);
  },

  getHistory: async (days: number = 7): Promise<NutritionLog[]> => {
    const response = await api.get<NutritionLog[]>(`/nutrition/history?days=${days}`);
    return response.data;
  },
};
