import React, { useState, useEffect } from 'react';
import { Plus, Droplets, Trash2 } from 'lucide-react';
import { waterService } from '../../services/waterService';
import { getApiErrorMessage } from '../../services/api';
import { formatWater, calcPercent } from '../../utils/helpers';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import type { WaterLog } from '../../types';
import { cn } from '../../utils/helpers';
import toast from 'react-hot-toast';

const QUICK_AMOUNTS = [150, 250, 350, 500];

export function WaterPage() {
  const [log, setLog] = useState<WaterLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  const fetchWater = async () => {
    try {
      const data = await waterService.getTodayLog();
      setLog(data);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWater();
  }, []);

  const totalAmount = log?.totalAmount ?? 0;
  const dailyTarget = log?.dailyTarget || 2500;
  const pct = calcPercent(totalAmount, dailyTarget);
  const remaining = Math.max(0, dailyTarget - totalAmount);

  const addWater = async (amount: number) => {
    if (isAdding) return;
    setIsAdding(true);
    try {
      await waterService.addWater(amount);
      toast.success(`+${formatWater(amount)} logged!`, { icon: '💧' });
      await fetchWater();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsAdding(false);
    }
  };

  const handleCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(customAmount);
    if (isNaN(amount) || amount <= 0 || amount > 5000) {
      toast.error('Enter a valid amount (1–5000 ml)');
      return;
    }
    addWater(amount);
    setCustomAmount('');
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await waterService.deleteWater(id);
      toast.success('Water entry removed');
      await fetchWater();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const fillHeight = Math.min(pct, 100);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner size="lg" label="Loading water intake…" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Water Intake</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Stay hydrated throughout the day</p>
      </div>

      {/* Visual water tracker */}
      <div className="card p-8 flex flex-col items-center gap-6">
        {/* Bottle visualization */}
        <div className="relative">
          <div className="w-32 h-48 rounded-b-3xl rounded-t-xl border-4 border-blue-200 relative overflow-hidden bg-blue-50">
            {/* Water fill */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-blue-400 transition-all duration-700 ease-out"
              style={{ height: `${fillHeight}%` }}
            >
              {/* Wave effect */}
              <div className="absolute -top-3 left-0 right-0 h-6 opacity-50">
                <svg viewBox="0 0 100 12" preserveAspectRatio="none" className="w-full h-full">
                  <path d="M0,6 C20,0 40,12 60,6 C80,0 100,12 100,6 L100,12 L0,12 Z" fill="#93c5fd" />
                </svg>
              </div>
            </div>
            {/* Percentage text */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <span className={cn('text-2xl font-bold', pct > 50 ? 'text-white' : 'text-blue-600')}>{pct}%</span>
            </div>
          </div>
          {/* Droplet icon at top */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center">
            <Droplets size={16} className="text-white" />
          </div>
        </div>

        {/* Stats */}
        <div className="text-center space-y-1">
          <p className="text-3xl font-bold text-neutral-900">{formatWater(totalAmount)}</p>
          <p className="text-sm text-neutral-500">of {formatWater(dailyTarget)} daily target</p>
          {remaining > 0 ? (
            <p className="text-sm text-blue-600 font-medium">{formatWater(remaining)} more to go</p>
          ) : (
            <p className="text-sm text-emerald-600 font-semibold">🎉 Daily goal reached!</p>
          )}
        </div>
      </div>

      {/* Quick add */}
      <div className="card p-5 space-y-4">
        <h3 className="section-title">Add Water</h3>
        <div className="grid grid-cols-4 gap-3">
          {QUICK_AMOUNTS.map(amount => (
            <button
              key={amount}
              onClick={() => addWater(amount)}
              disabled={isAdding}
              className="flex flex-col items-center gap-1.5 py-4 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 transition-all duration-150 disabled:opacity-60"
            >
              <Droplets size={18} />
              <span className="text-xs font-semibold">+{formatWater(amount)}</span>
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <form onSubmit={handleCustom} className="flex gap-3">
          <input
            type="number"
            min={1}
            max={5000}
            value={customAmount}
            onChange={e => setCustomAmount(e.target.value)}
            className="input flex-1"
            placeholder="Custom amount (ml)"
            aria-label="Custom water amount in ml"
          />
          <button type="submit" disabled={isAdding} className="btn-primary flex-shrink-0">
            {isAdding ? <LoadingSpinner size="sm" /> : <><Plus size={16} /> Add</>}
          </button>
        </form>
      </div>

      {/* Today's entries */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Today's Entries</h3>
        {!log?.entries || log.entries.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-6">No water logged yet today. Click an amount above to log 💧</p>
        ) : (
          <div className="space-y-2">
            {[...log.entries].reverse().map((entry, i) => (
              <div key={entry.id} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0 group">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                  <span className="text-sm text-neutral-600">Entry {log.entries.length - i}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-blue-600">{formatWater(entry.amount)}</span>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-all duration-150"
                    aria-label={`Delete water entry ${formatWater(entry.amount)}`}
                  >
                    {deletingId === entry.id ? <LoadingSpinner size="sm" /> : <Trash2 size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
