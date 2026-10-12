import React from 'react';
import { CheckCircle2, ArrowRight, Dumbbell, Flame, Timer } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { WorkoutEntry } from '../../types';

interface LoggedWorkoutsCardProps {
  entries: WorkoutEntry[];
}

function getExerciseEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('run') || lower.includes('jog')) return '🏃';
  if (lower.includes('cycl') || lower.includes('bike')) return '🚴';
  if (lower.includes('swim')) return '🏊';
  if (lower.includes('yoga') || lower.includes('pilates') || lower.includes('stretch')) return '🧘';
  if (lower.includes('walk')) return '🚶';
  if (lower.includes('hiit') || lower.includes('jump')) return '⚡';
  if (lower.includes('bench') || lower.includes('press') || lower.includes('squat') || lower.includes('deadlift') || lower.includes('weight') || lower.includes('curl')) return '🏋️';
  return '💪';
}

export function LoggedWorkoutsCard({ entries }: LoggedWorkoutsCardProps) {
  if (!entries || entries.length === 0) return null;

  const totalDuration = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const totalCalories = Math.round(entries.reduce((sum, e) => sum + (e.caloriesBurned || 0), 0));

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/90 dark:border-blue-800/80 text-left transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-blue-200/50 dark:border-blue-800/50">
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
          <CheckCircle2 size={14} className="text-blue-600 dark:text-blue-400" />
          <span>Saved to Today's Workout Log</span>
        </div>
        <Link
          to="/workout"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
        >
          View Workouts <ArrowRight size={11} />
        </Link>
      </div>

      {/* Item List */}
      <div className="space-y-2">
        {entries.map(item => {
          const emoji = getExerciseEmoji(item.exercise || '');

          return (
            <div
              key={item.id || item.exercise}
              className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/80 dark:bg-neutral-900/80 border border-blue-100 dark:border-neutral-800 text-xs shadow-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm flex-shrink-0" role="img" aria-label={item.exercise}>
                  {emoji}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                    {item.exercise}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                    {item.duration > 0 && <span>{item.duration} min</span>}
                    {item.sets && (
                      <>
                        <span>·</span>
                        <span>{item.sets} sets {item.reps ? `× ${item.reps} reps` : ''}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                {item.caloriesBurned ? (
                  <span className="inline-flex items-center gap-0.5 font-bold text-orange-600 dark:text-orange-400">
                    <Flame size={11} />
                    {Math.round(item.caloriesBurned)} kcal
                  </span>
                ) : (
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {item.duration}m
                  </span>
                )}
                {item.notes && (
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 max-w-[100px] truncate">
                    {item.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Totals Summary */}
      <div className="mt-2.5 pt-2 border-t border-blue-200/50 dark:border-blue-800/50 flex items-center justify-between text-[11px]">
        <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
          <Dumbbell size={12} className="text-blue-600 dark:text-blue-400" />
          <span>Total Session</span>
        </span>
        <div className="flex items-center gap-2 font-semibold text-neutral-700 dark:text-neutral-300">
          <span className="text-blue-700 dark:text-blue-400 font-bold flex items-center gap-0.5">
            <Timer size={11} /> {totalDuration} mins active
          </span>
          {totalCalories > 0 && (
            <>
              <span className="text-neutral-400">·</span>
              <span className="text-orange-600 dark:text-orange-400 font-bold flex items-center gap-0.5">
                <Flame size={11} /> {totalCalories} kcal burned
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
