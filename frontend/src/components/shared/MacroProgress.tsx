import React from 'react';
import { cn, calcPercent } from '../../utils/helpers';

interface MacroProgressProps {
  label: string;
  current: number;
  target: number;
  unit?: string;
  color: string;
  className?: string;
}

export function MacroProgress({ label, current, target, unit = 'g', color, className }: MacroProgressProps) {
  const pct = calcPercent(current, target);

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
        <span className="text-neutral-500 dark:text-neutral-400">
          <span className="font-semibold text-neutral-800 dark:text-neutral-100">{Math.round(current)}</span>
          /{target}{unit}
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, backgroundColor: color }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${pct}%`}
        />
      </div>
    </div>
  );
}
