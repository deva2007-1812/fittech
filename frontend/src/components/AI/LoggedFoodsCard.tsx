import React from 'react';
import { CheckCircle2, ArrowRight, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { FoodEntry } from '../../types';

interface LoggedFoodsCardProps {
  entries: FoodEntry[];
}

const MEAL_EMOJI: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
  snacks: '🍎',
};

export function LoggedFoodsCard({ entries }: LoggedFoodsCardProps) {
  if (!entries || entries.length === 0) return null;

  const totalCalories = Math.round(entries.reduce((sum, e) => sum + (e.calories || 0), 0));
  const totalProtein = Math.round(entries.reduce((sum, e) => sum + (e.protein || 0), 0));
  const totalCarbs = Math.round(entries.reduce((sum, e) => sum + (e.carbs || 0), 0));
  const totalFat = Math.round(entries.reduce((sum, e) => sum + (e.fat || 0), 0));

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/80 text-left transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-200/50 dark:border-emerald-800/50">
        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span>Saved to Today's Nutrition Log</span>
        </div>
        <Link
          to="/nutrition"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline"
        >
          View Log <ArrowRight size={11} />
        </Link>
      </div>

      {/* Item List */}
      <div className="space-y-2">
        {entries.map(item => {
          const mealKey = (item.mealType || 'snack').toLowerCase();
          const emoji = MEAL_EMOJI[mealKey] || '🍽️';

          return (
            <div
              key={item.id || item.foodName}
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/80 dark:bg-neutral-900/80 border border-emerald-100 dark:border-neutral-800 text-xs shadow-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm flex-shrink-0" role="img" aria-label={mealKey}>
                  {emoji}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                    {item.foodName}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {item.quantity} {item.unit && !item.quantity.includes(item.unit) ? item.unit : ''} ·{' '}
                    <span className="capitalize font-medium text-emerald-600 dark:text-emerald-400">
                      {mealKey}
                    </span>
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {Math.round(item.calories || 0)} kcal
                </span>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  {Math.round(item.protein || 0)}g P · {Math.round(item.carbs || 0)}g C
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals Summary */}
      <div className="mt-2.5 pt-2 border-t border-emerald-200/50 dark:border-emerald-800/50 flex items-center justify-between text-[11px]">
        <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
          <Utensils size={12} className="text-emerald-600 dark:text-emerald-400" />
          <span>Total Added</span>
        </span>
        <div className="flex items-center gap-2 font-semibold text-neutral-700 dark:text-neutral-300">
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">{totalCalories} kcal</span>
          <span className="text-neutral-400">·</span>
          <span>{totalProtein}g P</span>
          <span className="text-neutral-400">·</span>
          <span>{totalCarbs}g C</span>
          <span className="text-neutral-400">·</span>
          <span>{totalFat}g F</span>
        </div>
      </div>
    </div>
  );
}
