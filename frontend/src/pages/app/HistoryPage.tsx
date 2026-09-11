import React, { useState, useEffect } from 'react';
import { Calendar, Utensils, Dumbbell, Droplets, Moon, ChevronRight } from 'lucide-react';
import { nutritionService } from '../../services/nutritionService';
import { workoutService } from '../../services/workoutService';
import { waterService } from '../../services/waterService';
import { sleepService } from '../../services/sleepService';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { formatDate, formatWater, formatDuration, getLocalDateString } from '../../utils/helpers';
import type { NutritionLog, WorkoutEntry, SleepEntry } from '../../types';

interface DaySummary {
  date: string;
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  sleep: number;
  workouts: WorkoutEntry[];
}

export function HistoryPage() {
  const [days, setDays] = useState<DaySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const [nutritionHist, workoutHist, waterHist, sleepHist] = await Promise.all([
        nutritionService.getHistory(7).catch(() => [] as NutritionLog[]),
        workoutService.getHistory(7).catch(() => [] as WorkoutEntry[]),
        waterService.getHistory(7).catch(() => [] as { date: string; amount: number }[]),
        sleepService.getHistory(7).catch(() => [] as SleepEntry[]),
      ]);

      // Construct last 7 dates
      const list: DaySummary[] = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = getLocalDateString(d);

        const nut = (nutritionHist || []).find(n => n.date === dateStr);
        const wks = (workoutHist || []).filter(w => w.date === dateStr);
        const wat = (waterHist || []).find(w => w.date === dateStr);
        const slp = (sleepHist || []).find(s => s.date === dateStr);

        return {
          date: dateStr,
          label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : formatDate(d),
          calories: Math.round(nut?.totals?.calories || 0),
          protein: Math.round(nut?.totals?.protein || 0),
          carbs: Math.round(nut?.totals?.carbs || 0),
          fat: Math.round(nut?.totals?.fat || 0),
          water: wat ? Number(wat.amount) : 0,
          sleep: slp ? Number(slp.duration) : 0,
          workouts: wks || [],
        };
      });

      setDays(list);
      setExpandedDay(list[0]?.date || null);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">History</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Your recorded activity over the past 7 days</p>
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center">
          <LoadingSpinner size="lg" label="Loading activity history…" />
        </div>
      ) : (
        <div className="space-y-3">
          {days.map(day => {
            const hasData = day.calories > 0 || day.water > 0 || day.sleep > 0 || day.workouts.length > 0;
            const workoutMins = day.workouts.reduce((s, w) => s + (w.duration || 0), 0);

            return (
              <div key={day.date} className="card overflow-hidden">
                {/* Day header */}
                <button
                  onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                    <Calendar size={18} className="text-neutral-500 dark:text-neutral-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{day.label}</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">
                      {hasData
                        ? `${day.calories} kcal · ${formatWater(day.water)} · ${day.sleep > 0 ? day.sleep + 'h sleep' : 'No sleep logged'} · ${workoutMins > 0 ? workoutMins + 'm workout' : 'No workout'}`
                        : 'No activity logged'}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-neutral-400 transition-transform duration-200 ${
                      expandedDay === day.date ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {/* Expanded detail */}
                {expandedDay === day.date && (
                  <div className="px-5 pb-5 border-t border-neutral-100 dark:border-neutral-800 animate-fade-in">
                    <div className="pt-4 grid grid-cols-2 gap-3">
                      <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
                        <Utensils size={16} className="text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">Nutrition</p>
                          <p className="text-sm font-bold text-amber-900 dark:text-amber-100">{day.calories} kcal</p>
                          <p className="text-[11px] text-amber-600 dark:text-amber-400">P: {day.protein}g · C: {day.carbs}g · F: {day.fat}g</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
                        <Droplets size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold">Water</p>
                          <p className="text-sm font-bold text-blue-900 dark:text-blue-100">{formatWater(day.water)}</p>
                          <p className="text-[11px] text-blue-600 dark:text-blue-400">Hydration intake</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl">
                        <Moon size={16} className="text-teal-600 dark:text-teal-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-teal-700 dark:text-teal-300 font-semibold">Sleep</p>
                          <p className="text-sm font-bold text-teal-900 dark:text-teal-100">{day.sleep > 0 ? `${day.sleep} hrs` : '—'}</p>
                          <p className="text-[11px] text-teal-600 dark:text-teal-400">Rest & recovery</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl">
                        <Dumbbell size={16} className="text-purple-600 dark:text-purple-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold">Workout</p>
                          <p className="text-sm font-bold text-purple-900 dark:text-purple-100">{workoutMins > 0 ? formatDuration(workoutMins) : '—'}</p>
                          <p className="text-[11px] text-purple-600 dark:text-purple-400">{day.workouts.length} exercise(s)</p>
                        </div>
                      </div>
                    </div>

                    {day.workouts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5">Exercises:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {day.workouts.map(w => (
                            <span key={w.id} className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium">
                              {w.exercise} ({w.duration}m)
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
