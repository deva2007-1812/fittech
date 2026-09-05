import api from './api';

export interface DashboardData {
  userName: string;
  fitnessGoal: string;
  caloriesConsumed: number;
  calorieTarget: number;
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbTarget: number;
  fat: number;
  fatTarget: number;
  water: number;
  waterTarget: number;
  workoutDuration: number;
  sleepDuration: number;
  currentWeight: number | null;
  aiInsight: string;
}

export const dashboardService = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await api.get<DashboardData>('/dashboard');
    return response.data;
  },
};
