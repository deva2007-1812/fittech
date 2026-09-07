import api from './api';
import type {
  AdminStats,
  AdminUser,
  AdminFoodItem,
  FoodAdminPayload,
  AdminUserActivity
} from '../types';

export const adminService = {
  // Get system statistics
  getStats: async (): Promise<AdminStats> => {
    const res = await api.get<AdminStats>('/admin/stats');
    return res.data;
  },

  // Get all users
  getUsers: async (): Promise<AdminUser[]> => {
    const res = await api.get<AdminUser[]>('/admin/users');
    return res.data;
  },

  // Update user role
  updateUserRole: async (userId: string, role: string): Promise<AdminUser> => {
    const res = await api.put<AdminUser>(`/admin/users/${userId}/role`, { role });
    return res.data;
  },

  // Delete user
  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },

  // Get user activity
  getUserActivity: async (userId: string): Promise<AdminUserActivity> => {
    const res = await api.get<AdminUserActivity>(`/admin/users/${userId}/activity`);
    return res.data;
  },

  // Food management
  getAllFoods: async (query?: string): Promise<AdminFoodItem[]> => {
    const res = await api.get<AdminFoodItem[]>('/foods', {
      params: query ? { query } : undefined,
    });
    return res.data;
  },

  addFood: async (payload: FoodAdminPayload): Promise<AdminFoodItem> => {
    const res = await api.post<AdminFoodItem>('/admin/foods', payload);
    return res.data;
  },

  updateFood: async (foodId: string, payload: FoodAdminPayload): Promise<AdminFoodItem> => {
    const res = await api.put<AdminFoodItem>(`/admin/foods/${foodId}`, payload);
    return res.data;
  },

  deleteFood: async (foodId: string): Promise<void> => {
    await api.delete(`/admin/foods/${foodId}`);
  },
};
