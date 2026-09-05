// ─── Auth & User ──────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
  height?: number; // cm
  weight?: number; // kg
  activityLevel?: ActivityLevel;
  fitnessGoal?: FitnessGoal;
  profileComplete?: boolean;
  createdAt?: string;
}

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active';

export type FitnessGoal =
  | 'maintain_weight'
  | 'improve_fitness'
  | 'weight_management';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// ─── Nutrition ────────────────────────────────────────────────────────────────
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface FoodEntry {
  id: string;
  userId: string;
  foodName: string;
  quantity: string;
  calories: number;
  protein: number; // g
  carbs: number;   // g
  fat: number;     // g
  mealType: MealType;
  date: string;    // ISO date string
  createdAt?: string;
}

export interface NutritionLog {
  date: string;
  entries: FoodEntry[];
  totals: MacroTotals;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number; // ml
}

// ─── Workout ──────────────────────────────────────────────────────────────────
export interface WorkoutEntry {
  id: string;
  userId: string;
  exercise: string;
  duration: number; // minutes
  sets?: number;
  reps?: number;
  notes?: string;
  date: string;
  createdAt?: string;
}

// ─── Water ────────────────────────────────────────────────────────────────────
export interface WaterEntry {
  id: string;
  userId: string;
  amount: number; // ml
  date: string;
  createdAt?: string;
}

export interface WaterLog {
  date: string;
  totalAmount: number;
  dailyTarget: number;
  entries: WaterEntry[];
}

// ─── Sleep ────────────────────────────────────────────────────────────────────
export interface SleepEntry {
  id: string;
  userId: string;
  duration: number; // hours
  bedtime?: string;
  wakeTime?: string;
  date: string;
  createdAt?: string;
}

// ─── Progress ─────────────────────────────────────────────────────────────────
export interface WeightEntry {
  id: string;
  userId: string;
  weight: number; // kg
  date: string;
  createdAt?: string;
}

export interface ProgressData {
  weightHistory: WeightEntry[];
  calorieHistory: { date: string; calories: number }[];
  waterHistory: { date: string; amount: number }[];
  sleepHistory: { date: string; duration: number }[];
  workoutHistory: { date: string; duration: number }[];
}

// ─── AI / Chat ────────────────────────────────────────────────────────────────
export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  isLoading?: boolean;
}

export interface AIInsight {
  id: string;
  message: string;
  category: 'nutrition' | 'workout' | 'sleep' | 'water' | 'general';
  createdAt: string;
}

// ─── API / Shared ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type DateRange = '7d' | '30d' | '90d';
