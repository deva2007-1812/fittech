import React from 'react';
import { cn, calcPercent } from '../../utils/helpers';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  target?: number;
  current?: number;
  icon?: React.ReactNode;
  color?: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose' | 'teal';
  className?: string;
  subtitle?: string;
}

const colorMap = {
  emerald: {
    icon: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    progress: 'bg-emerald-500',
    label: 'text-emerald-600 dark:text-emerald-400',
  },
  blue: {
    icon: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    progress: 'bg-blue-500',
    label: 'text-blue-600 dark:text-blue-400',
  },
  amber: {
    icon: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    progress: 'bg-amber-500',
    label: 'text-amber-600 dark:text-amber-400',
  },
  purple: {
    icon: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
    progress: 'bg-purple-500',
    label: 'text-purple-600 dark:text-purple-400',
  },
  rose: {
    icon: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    progress: 'bg-rose-500',
    label: 'text-rose-600 dark:text-rose-400',
  },
  teal: {
    icon: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
    progress: 'bg-teal-500',
    label: 'text-teal-600 dark:text-teal-400',
  },
};

export function StatCard({
  label,
  value,
  unit,
  target,
  current,
  icon,
  color = 'emerald',
  className,
  subtitle,
}: StatCardProps) {
  const colors = colorMap[color];
  const pct = target && current !== undefined ? calcPercent(current, target) : undefined;

  return (
    <div className={cn('card p-5 flex flex-col gap-3', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{value}</span>
            {unit && <span className="text-sm text-neutral-500 dark:text-neutral-400">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{subtitle}</p>}
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colors.icon)}>
            {icon}
          </div>
        )}
      </div>

      {pct !== undefined && (
        <div>
          <div className="progress-bar">
            <div
              className={cn('progress-fill', colors.progress)}
              style={{ width: `${pct}%` }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-neutral-400 dark:text-neutral-500">{pct}% of goal</span>
            {target && <span className="text-xs text-neutral-400 dark:text-neutral-500">/ {target}{unit}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
