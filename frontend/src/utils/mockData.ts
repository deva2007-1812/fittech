import type { NutritionLog, WorkoutEntry, WaterLog, SleepEntry, WeightEntry, ChatMessage, AIInsight, User } from '../types';

// ─── Mock User ────────────────────────────────────────────────────────────────
export const MOCK_USER: User = {
  id: 'u1',
  email: 'demo@fitmind.ai',
  name: 'Alex Johnson',
  age: 28,
  height: 178,
  weight: 72,
  activityLevel: 'moderately_active',
  fitnessGoal: 'improve_fitness',
  profileComplete: true,
  createdAt: new Date().toISOString(),
};

// ─── Mock Daily Targets ───────────────────────────────────────────────────────
export const MOCK_TARGETS = {
  calories: 2100,
  protein: 150,
  carbs: 260,
  fat: 70,
  water: 2500,
};

// ─── Mock Today Nutrition ─────────────────────────────────────────────────────
export const MOCK_NUTRITION_LOG: NutritionLog = {
  date: new Date().toISOString().split('T')[0],
  entries: [
    { id: '1', userId: 'u1', foodName: 'Oatmeal with berries', quantity: '1 bowl', calories: 320, protein: 12, carbs: 58, fat: 6, mealType: 'breakfast', date: new Date().toISOString() },
    { id: '2', userId: 'u1', foodName: 'Boiled eggs', quantity: '2 eggs', calories: 140, protein: 12, carbs: 1, fat: 10, mealType: 'breakfast', date: new Date().toISOString() },
    { id: '3', userId: 'u1', foodName: 'Chicken breast + rice', quantity: '200g + 1 cup', calories: 450, protein: 48, carbs: 52, fat: 5, mealType: 'lunch', date: new Date().toISOString() },
    { id: '4', userId: 'u1', foodName: 'Greek yogurt', quantity: '150g', calories: 130, protein: 15, carbs: 9, fat: 3, mealType: 'snacks', date: new Date().toISOString() },
  ],
  totals: { calories: 1040, protein: 87, carbs: 120, fat: 24 },
};

// ─── Mock Workouts ────────────────────────────────────────────────────────────
export const MOCK_WORKOUTS: WorkoutEntry[] = [
  { id: 'w1', userId: 'u1', exercise: 'Running', duration: 30, date: new Date().toISOString(), notes: 'Morning jog' },
  { id: 'w2', userId: 'u1', exercise: 'Push-ups', duration: 15, sets: 3, reps: 15, date: new Date().toISOString() },
];

// ─── Mock Water Log ───────────────────────────────────────────────────────────
export const MOCK_WATER_LOG: WaterLog = {
  date: new Date().toISOString().split('T')[0],
  totalAmount: 1750,
  dailyTarget: 2500,
  entries: [
    { id: 'wt1', userId: 'u1', amount: 300, date: new Date().toISOString() },
    { id: 'wt2', userId: 'u1', amount: 500, date: new Date().toISOString() },
    { id: 'wt3', userId: 'u1', amount: 250, date: new Date().toISOString() },
    { id: 'wt4', userId: 'u1', amount: 400, date: new Date().toISOString() },
    { id: 'wt5', userId: 'u1', amount: 300, date: new Date().toISOString() },
  ],
};

// ─── Mock Sleep ───────────────────────────────────────────────────────────────
export const MOCK_SLEEP: SleepEntry = {
  id: 's1', userId: 'u1', duration: 7.5, bedtime: '23:00', wakeTime: '06:30',
  date: new Date().toISOString().split('T')[0],
};

// ─── Mock AI Insight ──────────────────────────────────────────────────────────
export const MOCK_INSIGHT: AIInsight = {
  id: 'i1',
  message: "Your nutrition is on track today! You're at 49% of your calorie goal. Consider adding a protein-rich food to your next meal — you still have 63g of protein remaining.",
  category: 'nutrition',
  createdAt: new Date().toISOString(),
};

// ─── Mock Chat History ────────────────────────────────────────────────────────
export const MOCK_CHAT: ChatMessage[] = [
  {
    id: 'c1', role: 'assistant',
    content: "Hi! I'm your FitMind AI coach. I can help you log meals, answer nutrition questions, and give personalized advice. What would you like to know today?",
    timestamp: new Date(Date.now() - 60000).toISOString(),
  },
];

// ─── Mock Progress Data (last 7 days) ────────────────────────────────────────
const last7 = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return d.toISOString().split('T')[0];
});

export const MOCK_WEIGHT_HISTORY: WeightEntry[] = last7.map((date, i) => ({
  id: `w${i}`, userId: 'u1', weight: 72 - i * 0.15 + Math.random() * 0.3, date,
}));

export const MOCK_CALORIE_HISTORY = last7.map((date, i) => ({
  date, calories: 1800 + Math.round(Math.random() * 500 - 100 + i * 30),
}));

export const MOCK_WATER_HISTORY = last7.map((date, i) => ({
  date, amount: 1800 + Math.round(Math.random() * 700 - 200 + i * 50),
}));

export const MOCK_SLEEP_HISTORY = last7.map((date) => ({
  date, duration: +(6.5 + Math.random() * 2).toFixed(1),
}));

export const MOCK_WORKOUT_HISTORY = last7.map((date, i) => ({
  date, duration: i % 2 === 0 ? Math.round(30 + Math.random() * 30) : 0,
}));
