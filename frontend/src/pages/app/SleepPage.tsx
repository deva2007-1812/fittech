import React, { useState, useEffect } from 'react';
import { Plus, Moon } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Modal } from '../../components/shared/Modal';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { sleepService } from '../../services/sleepService';
import { getApiErrorMessage } from '../../services/api';
import { formatShortDate, cn, getLocalDateString } from '../../utils/helpers';
import type { SleepEntry } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

const SLEEP_GOAL = 8;

export function SleepPage() {
  const { isDark } = useTheme();
  const [todaySleep, setTodaySleep] = useState<SleepEntry | null>(null);
  const [history, setHistory] = useState<SleepEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ duration: '', bedtime: '23:00', wakeTime: '06:30' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchSleepData = async () => {
    try {
      const [today, hist] = await Promise.all([
        sleepService.getTodaySleep(),
        sleepService.getHistory(7).catch(() => []),
      ]);
      setTodaySleep(today);
      setHistory(hist || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSleepData();
  }, []);

  const chartData = history.map(h => ({
    date: formatShortDate(h.date),
    hours: h.duration,
  }));

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const dur = Number(form.duration);
    if (!form.duration || isNaN(dur) || dur < 0.5 || dur > 24) {
      errs.duration = 'Enter valid sleep duration (0.5–24 hrs)';
    }
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsSubmitting(true);
    try {
      await sleepService.logSleep({
        duration: dur,
        bedtime: form.bedtime,
        wakeTime: form.wakeTime,
        date: getLocalDateString(),
      });
      toast.success('Sleep logged to database!', { icon: '😴' });
      setShowModal(false);
      setForm({ duration: '', bedtime: '23:00', wakeTime: '06:30' });
      await fetchSleepData();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const quality = todaySleep
    ? todaySleep.duration >= SLEEP_GOAL ? 'Great' : todaySleep.duration >= 6 ? 'Fair' : 'Poor'
    : null;

  const qualityColor = quality === 'Great' ? 'text-emerald-600' : quality === 'Fair' ? 'text-amber-600' : 'text-red-500';

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" label="Loading sleep records…" />
      </div>
    );
  }

  const avgHours = history.length > 0
    ? (history.reduce((s, h) => s + h.duration, 0) / history.length).toFixed(1)
    : '—';

  const bestNight = history.length > 0
    ? `${Math.max(...history.map(h => h.duration))} hrs`
    : '—';

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Sleep</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Track your rest for optimal recovery</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus size={16} /> Log Sleep
        </button>
      </div>

      {/* Today's sleep */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center flex-shrink-0">
            <Moon size={28} className="text-teal-600" />
          </div>
          <div className="flex-1">
            {todaySleep ? (
              <>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-neutral-900">{todaySleep.duration}</p>
                  <p className="text-lg text-neutral-400 font-medium">hrs</p>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-sm font-semibold ${qualityColor}`}>{quality} sleep</span>
                  {todaySleep.bedtime && (
                    <span className="text-xs text-neutral-400">{todaySleep.bedtime} → {todaySleep.wakeTime}</span>
                  )}
                </div>
                {/* Sleep quality bar */}
                <div className="progress-bar mt-3">
                  <div
                    className={cn('progress-fill', quality === 'Great' ? 'bg-emerald-500' : quality === 'Fair' ? 'bg-amber-400' : 'bg-red-400')}
                    style={{ width: `${Math.min((todaySleep.duration / SLEEP_GOAL) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-1">Target: {SLEEP_GOAL} hrs</p>
              </>
            ) : (
              <div>
                <p className="text-neutral-500 font-medium">No sleep logged yet for today</p>
                <p className="text-xs text-neutral-400 mt-0.5">Aim for 7–9 hours of restful sleep every night.</p>
                <button onClick={() => setShowModal(true)} className="btn-primary mt-3 text-xs">
                  Log last night's sleep
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sleep tips */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Recommended', value: '7–9 hrs', color: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300' },
          { label: 'Your Average', value: avgHours !== '—' ? `${avgHours} hrs` : '—', color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' },
          { label: 'Best Night', value: bestNight, color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${color} rounded-2xl p-4 text-center`}>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs font-medium opacity-70 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Sleep History (Last 7 Days)</h3>
        {chartData.length === 0 ? (
          <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-10">No sleep history recorded yet. Start logging your sleep above!</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#262626' : '#f5f5f5'} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: isDark ? '#737373' : '#a3a3a3' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 12]} tick={{ fontSize: 11, fill: isDark ? '#737373' : '#a3a3a3' }} axisLine={false} tickLine={false} tickCount={5} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: isDark ? '1px solid #262626' : 'none',
                  boxShadow: isDark ? '0 4px 6px -1px rgba(0,0,0,0.5)' : '0 4px 6px -1px rgba(0,0,0,0.07)',
                  fontSize: 13,
                  backgroundColor: isDark ? '#171717' : '#ffffff',
                  color: isDark ? '#f5f5f5' : '#171717',
                }}
                formatter={(v: number) => [`${v} hrs`, 'Sleep']}
              />
              <ReferenceLine y={SLEEP_GOAL} stroke="#14b8a6" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#14b8a6', fontSize: 11, position: 'right' }} />
              <Bar dataKey="hours" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Log Sleep Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Log Sleep" size="sm">
        <form onSubmit={handleLog} className="space-y-4">
          <div className="input-group">
            <label htmlFor="sleep-duration" className="label">Duration (hours)</label>
            <input
              id="sleep-duration"
              type="number"
              min={0.5}
              max={24}
              step={0.25}
              value={form.duration}
              onChange={e => {
                setForm(f => ({ ...f, duration: e.target.value }));
                setErrors(ev => ({ ...ev, duration: '' }));
              }}
              className={`input ${errors.duration ? 'border-red-400' : ''}`}
              placeholder="e.g. 7.5"
            />
            {errors.duration && <p className="text-xs text-red-500 mt-1">{errors.duration}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="input-group">
              <label htmlFor="bedtime" className="label">Bedtime</label>
              <input
                id="bedtime"
                type="time"
                value={form.bedtime}
                onChange={e => setForm(f => ({ ...f, bedtime: e.target.value }))}
                className="input"
              />
            </div>
            <div className="input-group">
              <label htmlFor="wake-time" className="label">Wake time</label>
              <input
                id="wake-time"
                type="time"
                value={form.wakeTime}
                onChange={e => setForm(f => ({ ...f, wakeTime: e.target.value }))}
                className="input"
              />
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? <LoadingSpinner size="sm" label="Saving sleep…" /> : 'Save Sleep Entry'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
