import React, { useState, useEffect } from 'react';
import {
  Flame, Droplets, Moon, Dumbbell, Apple,
  TrendingUp, Zap, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/shared/StatCard';
import { MacroProgress } from '../../components/shared/MacroProgress';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { ErrorState } from '../../components/shared/ErrorState';
import { Link } from 'react-router-dom';
import { dashboardService, type DashboardData } from '../../services/dashboardService';
import { nutritionService } from '../../services/nutritionService';
import { getGreeting, formatWater, formatDuration, calcPercent } from '../../utils/helpers';
import type { NutritionLog } from '../../types';

export function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [nutritionLog, setNutritionLog] = useState<NutritionLog | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [dash, nut] = await Promise.all([
        dashboardService.getDashboard(),
        nutritionService.getTodayLog().catch(() => null),
      ]);
      setDashboard(dash);
      setNutritionLog(nut);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" label="Loading your dashboard…" />
      </div>
    );
  }

  if (hasError || !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ErrorState onRetry={loadData} description="Could not load your dashboard. Please verify backend connection." />
      </div>
    );
  }

  const calConsumed = Math.round(dashboard.caloriesConsumed || 0);
  const calTarget = dashboard.calorieTarget || 2000;
  const remaining = calTarget - calConsumed;

  const proteinConsumed = Math.round(dashboard.protein || 0);
  const proteinTarget = Math.round(dashboard.proteinTarget || 150);

  const carbsConsumed = Math.round(dashboard.carbs || 0);
  const carbsTarget = Math.round(dashboard.carbTarget || 250);

  const fatConsumed = Math.round(dashboard.fat || 0);
  const fatTarget = Math.round(dashboard.fatTarget || 55);

  const waterConsumed = dashboard.water || 0;
  const waterTarget = dashboard.waterTarget || 2500;

  const workoutToday = dashboard.workoutDuration || 0;
  const sleepToday = dashboard.sleepDuration || null;
  const currentWeight = dashboard.currentWeight || user?.weight || null;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
            {getGreeting()}, {dashboard.userName?.split(' ')[0] || user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-neutral-500 mt-1 text-sm lg:text-base capitalize">
            Goal: {dashboard.fitnessGoal || 'General Fitness'} · Let's make today healthy.
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-neutral-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ─── Quick Stats Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Calories"
          value={calConsumed}
          unit="kcal"
          current={calConsumed}
          target={calTarget}
          icon={<Flame size={18} />}
          color="amber"
          subtitle={`${remaining > 0 ? remaining + ' remaining' : 'Goal reached!'}`}
        />
        <StatCard
          label="Protein"
          value={proteinConsumed}
          unit="g"
          current={proteinConsumed}
          target={proteinTarget}
          icon={<Apple size={18} />}
          color="emerald"
        />
        <StatCard
          label="Water"
          value={formatWater(waterConsumed)}
          current={waterConsumed}
          target={waterTarget}
          icon={<Droplets size={18} />}
          color="blue"
          subtitle={`of ${formatWater(waterTarget)}`}
        />
        <StatCard
          label="Workout"
          value={workoutToday > 0 ? formatDuration(workoutToday) : '—'}
          icon={<Dumbbell size={18} />}
          color="purple"
          subtitle={workoutToday > 0 ? 'Today' : 'No workout logged'}
        />
        <StatCard
          label="Sleep"
          value={sleepToday ? `${sleepToday}` : '—'}
          unit={sleepToday ? 'hrs' : ''}
          icon={<Moon size={18} />}
          color="teal"
          subtitle={sleepToday ? 'Last night' : 'Not logged yet'}
        />
        <StatCard
          label="Weight"
          value={currentWeight ? `${currentWeight}` : '—'}
          unit={currentWeight ? 'kg' : ''}
          icon={<TrendingUp size={18} />}
          color="rose"
          subtitle="Current"
        />
      </div>

      {/* ─── Two-column section ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Nutrition */}
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Today's Nutrition</h2>
            <Link to="/nutrition" className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:text-emerald-700 transition-colors">
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {/* Calorie ring visualization */}
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f5f5f5" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3"
                  strokeDasharray={`${calcPercent(calConsumed, calTarget)} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-bold text-neutral-900">{calcPercent(calConsumed, calTarget)}%</span>
                <span className="text-[10px] text-neutral-400">of goal</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-neutral-900">{calConsumed}</span>
                <span className="text-sm text-neutral-400">/ {calTarget} kcal</span>
              </div>
              <p className="text-sm text-neutral-500">
                {remaining > 0 ? (
                  <><span className="text-amber-600 font-semibold">{remaining} kcal</span> remaining</>
                ) : (
                  <span className="text-emerald-600 font-semibold">Daily goal reached! 🎉</span>
                )}
              </p>
            </div>
          </div>

          {/* Macros */}
          <div className="space-y-3">
            <MacroProgress label="Protein" current={proteinConsumed} target={proteinTarget} color="#10b981" />
            <MacroProgress label="Carbs" current={carbsConsumed} target={carbsTarget} color="#f59e0b" />
            <MacroProgress label="Fat" current={fatConsumed} target={fatTarget} color="#8b5cf6" />
          </div>

          {/* Recent entries preview */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Recent Food Entries</p>
            {nutritionLog && nutritionLog.entries && nutritionLog.entries.length > 0 ? (
              nutritionLog.entries.slice(0, 3).map(entry => (
                <div key={entry.id} className="flex items-center justify-between py-1.5 border-b border-neutral-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-neutral-800">{entry.foodName}</p>
                    <p className="text-xs text-neutral-400 capitalize">{entry.mealType} · {entry.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-neutral-700">{entry.calories} kcal</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-400 py-2">No food logged yet today. Click 'Log Food' below to get started.</p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* AI Insight Card */}
          <div className="card p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap size={18} className="text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">AI Insight</p>
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {dashboard.aiInsight || 'Stay hydrated and keep tracking your meals for personalized recommendations!'}
                </p>
                <Link to="/ai-coach" className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-3 hover:text-emerald-700 transition-colors">
                  Chat with AI Coach <ChevronRight size={12} />
                </Link>
              </div>
            </div>
          </div>

          {/* Today's Activity */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Today's Activity</h3>
            <div className="space-y-3">
              {[
                { label: 'Workout', value: workoutToday > 0 ? formatDuration(workoutToday) : 'Not logged', icon: <Dumbbell size={16} />, color: 'text-purple-600', bg: 'bg-purple-50' },
                { label: 'Water Intake', value: formatWater(waterConsumed), icon: <Droplets size={16} />, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Sleep Duration', value: sleepToday ? `${sleepToday} hrs` : 'Not logged', icon: <Moon size={16} />, color: 'text-teal-600', bg: 'bg-teal-50' },
                { label: 'Current Weight', value: currentWeight ? `${currentWeight} kg` : 'Not set', icon: <TrendingUp size={16} />, color: 'text-rose-600', bg: 'bg-rose-50' },
              ].map(({ label, value, icon, color, bg }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${bg} ${color} flex items-center justify-center flex-shrink-0`}>
                    {icon}
                  </div>
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-sm text-neutral-600">{label}</p>
                    <p className="text-sm font-semibold text-neutral-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/nutrition', label: 'Log Food', icon: <Apple size={16} />, color: 'from-amber-400 to-amber-500' },
              { to: '/workout', label: 'Log Workout', icon: <Dumbbell size={16} />, color: 'from-purple-400 to-purple-500' },
              { to: '/water', label: 'Log Water', icon: <Droplets size={16} />, color: 'from-blue-400 to-blue-500' },
              { to: '/sleep', label: 'Log Sleep', icon: <Moon size={16} />, color: 'from-teal-400 to-teal-500' },
            ].map(({ to, label, icon, color }) => (
              <Link
                key={to}
                to={to}
                className={`bg-gradient-to-br ${color} text-white rounded-xl p-4 flex flex-col gap-2 hover:opacity-90 active:scale-95 transition-all duration-150`}
              >
                {icon}
                <span className="text-xs font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
