import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We had trouble loading this data. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
      <div className="mb-4 w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-400">
        <AlertTriangle size={24} />
      </div>
      <h3 className="text-base font-semibold text-neutral-700 dark:text-neutral-200 mb-1">{title}</h3>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">{description}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-5 text-xs">
          <RefreshCw size={14} />
          Try again
        </button>
      )}
    </div>
  );
}
