import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart
} from 'recharts';
import { Plus, TrendingUp } from 'lucide-react';
import { Modal } from '../../components/shared/Modal';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { progressService } from '../../services/progressService';
import { getApiErrorMessage } from '../../services/api';
import { formatShortDate, cn, getLocalDateString } from '../../utils/helpers';
import type { DateRange, ProgressData } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

function ChartCard({
  title,
  children,
  className,
  isEmpty,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  isEmpty?: boolean;
}) {
  return (
    <div className={cn('card p-5', className)}>
      <h3 className="section-title mb-4">{title}</h3>
      {isEmpty ? (
        <div className="h-[180px] flex items-center justify-center text-xs text-neutral-400">
          No records logged yet for this period
        </div>
      ) : (
        children
      )}
    </div>
  );
}

const RANGES: { value: DateRange; label: string }[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
];

export function ProgressPage() {
  const { isDark } = useTheme();
  const [range, setRange] = useState<DateRange>('7d');
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [isSubmittingWeight, setIsSubmittingWeight] = useState(false);

  const fetchProgress = async (selectedRange: DateRange) => {
    setIsLoading(true);
    try {
      const res = await progressService.getProgressData(selectedRange);
      setData(res);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress(range);
  }, [range]);

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const w = Number(weightInput);
    if (isNaN(w) || w < 20 || w > 400) {
      toast.error('Please enter a valid weight in kg (20–400)');
      return;
    }

    setIsSubmittingWeight(true);
    try {
      await progressService.logWeight(w, getLocalDateString());
      toast.success(`Weight (${w} kg) saved to database!`);
      setShowWeightModal(false);
      setWeightInput('');
      await fetchProgress(range);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmittingWeight(false);
    }
  };

  const weightData = (data?.weightHistory || []).map(w => ({
    date: formatShortDate(w.date),
    kg: Number(w.weight),
  }));

  const calData = (data?.calorieHistory || []).map(c => ({
    date: formatShortDate(c.date),
    kcal: Number(c.calories || 0),
  }));

  const waterData = (data?.waterHistory || []).map(w => ({
    date: formatShortDate(w.date),
    ml: Number(w.amount || 0),
  }));

  const sleepData = (data?.sleepHistory || []).map(s => ({
    date: formatShortDate(s.date),
    hrs: Number(s.duration || 0),
  }));

  const workoutData = (data?.workoutHistory || []).map(w => ({
    date: formatShortDate(w.date),
    min: Number(w.duration || 0),
  }));

  const tip = { fontSize: 12, fill: isDark ? '#737373' : '#a3a3a3' };
  const gridStyle = { stroke: isDark ? '#262626' : '#f5f5f5' };
  const tooltipStyle = {
    borderRadius: 12,
    border: isDark ? '1px solid #262626' : 'none',
    boxShadow: isDark ? '0 4px 6px -1px rgba(0,0,0,0.5)' : '0 4px 6px -1px rgba(0,0,0,0.07)',
    fontSize: 12,
    backgroundColor: isDark ? '#171717' : '#ffffff',
    color: isDark ? '#f5f5f5' : '#171717',
  };

  const avgCalories = calData.length > 0
    ? `${Math.round(calData.reduce((s, c) => s + c.kcal, 0) / calData.length)} kcal`
    : '—';

  const avgWater = waterData.length > 0
    ? `${Math.round(waterData.reduce((s, w) => s + w.ml, 0) / waterData.length)} ml`
    : '—';

  const avgSleep = sleepData.length > 0
    ? `${(sleepData.reduce((s, sl) => s + sl.hrs, 0) / sleepData.length).toFixed(1)} hrs`
    : '—';

  const activeDays = workoutData.length > 0
    ? `${workoutData.filter(w => w.min > 0).length}/${workoutData.length}`
    : '—';

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Progress</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Track your fitness metrics over time from database</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWeightModal(true)}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <Plus size={14} /> Log Weight
          </button>
          {/* Range selector */}
          <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
            {RANGES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setRange(value)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  range === value
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center">
          <LoadingSpinner size="lg" label="Loading progress trends…" />
        </div>
      ) : (
        <>
          {/* Summary pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Avg. Calories', value: avgCalories, color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40' },
              { label: 'Avg. Water', value: avgWater, color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40' },
              { label: 'Avg. Sleep', value: avgSleep, color: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40' },
              { label: 'Active Days', value: activeDays, color: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`${color} rounded-2xl p-4 text-center`}>
                <p className="text-lg font-bold">{value}</p>
                <p className="text-xs font-medium opacity-70 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weight */}
            <ChartCard title="⚖️ Weight (kg)" isEmpty={weightData.length === 0}>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={weightData}>
                  <defs>
                    <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} {...gridStyle} />
                  <XAxis dataKey="date" tick={tip} axisLine={false} tickLine={false} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={tip} axisLine={false} tickLine={false} width={35} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} kg`, 'Weight']} />
                  <Area type="monotone" dataKey="kg" stroke="#10b981" strokeWidth={2} fill="url(#wGrad)" dot={{ fill: '#10b981', strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Calories */}
            <ChartCard title="🔥 Calorie Intake (kcal)" isEmpty={calData.length === 0}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={calData} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} {...gridStyle} />
                  <XAxis dataKey="date" tick={tip} axisLine={false} tickLine={false} />
                  <YAxis tick={tip} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} kcal`, 'Calories']} />
                  <Bar dataKey="kcal" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Water */}
            <ChartCard title="💧 Water Intake (ml)" isEmpty={waterData.length === 0}>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={waterData}>
                  <defs>
                    <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} {...gridStyle} />
                  <XAxis dataKey="date" tick={tip} axisLine={false} tickLine={false} />
                  <YAxis tick={tip} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} ml`, 'Water']} />
                  <Area type="monotone" dataKey="ml" stroke="#3b82f6" strokeWidth={2} fill="url(#waterGrad)" dot={{ fill: '#3b82f6', strokeWidth: 0, r: 3 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Sleep */}
            <ChartCard title="🌙 Sleep Duration (hrs)" isEmpty={sleepData.length === 0}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={sleepData} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} {...gridStyle} />
                  <XAxis dataKey="date" tick={tip} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 12]} tick={tip} axisLine={false} tickLine={false} width={30} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} hrs`, 'Sleep']} />
                  <ReferenceLine y={8} stroke="#14b8a6" strokeDasharray="4 4" />
                  <Bar dataKey="hrs" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Workouts */}
            <ChartCard title="⚡ Workout Duration (min)" className="lg:col-span-2" isEmpty={workoutData.length === 0}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={workoutData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} {...gridStyle} />
                  <XAxis dataKey="date" tick={tip} axisLine={false} tickLine={false} />
                  <YAxis tick={tip} axisLine={false} tickLine={false} width={35} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} min`, 'Workout']} />
                  <Bar dataKey="min" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}

      {/* Log Weight Modal */}
      <Modal isOpen={showWeightModal} onClose={() => setShowWeightModal(false)} title="Log Body Weight" size="sm">
        <form onSubmit={handleLogWeight} className="space-y-4">
          <div className="input-group">
            <label htmlFor="weight-input" className="label">Current Weight <span className="text-neutral-400">(kg)</span></label>
            <div className="relative">
              <input
                id="weight-input"
                type="number"
                min={20}
                max={400}
                step={0.1}
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
                placeholder="e.g. 72.5"
                className="input pr-12"
                autoFocus
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400">
                kg
              </span>
            </div>
          </div>
          <button type="submit" disabled={isSubmittingWeight} className="btn-primary w-full">
            {isSubmittingWeight ? <LoadingSpinner size="sm" label="Saving weight…" /> : 'Record Weight'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
