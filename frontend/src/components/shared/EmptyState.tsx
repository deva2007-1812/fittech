import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}>
      {icon ? (
        <div className="mb-4 text-neutral-300 dark:text-neutral-600">{icon}</div>
      ) : (
        <div className="mb-4 w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
          <AlertCircle size={24} />
        </div>
      )}
      <h3 className="text-base font-semibold text-neutral-700 dark:text-neutral-200 mb-1">{title}</h3>
      {description && <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
