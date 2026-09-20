import React from 'react';

interface AIQuickActionsProps {
  onSelect: (text: string) => void;
}

const QUICK_ACTIONS = [
  { emoji: '📊', label: 'How am I doing today?' },
  { emoji: '🍎', label: 'Log my food' },
  { emoji: '🏋️', label: 'Plan my workout' },
  { emoji: '💧', label: 'Check my hydration' },
  { emoji: '📈', label: 'Show my progress' },
];

export function AIQuickActions({ onSelect }: AIQuickActionsProps) {
  return (
    <div className="px-4 pb-3">
      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium mb-2.5 uppercase tracking-wide">
        Quick actions
      </p>
      <div className="flex flex-col gap-1.5">
        {QUICK_ACTIONS.map(({ emoji, label }) => (
          <button
            key={label}
            onClick={() => onSelect(label)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-sm
                       bg-neutral-50 dark:bg-neutral-800/60
                       border border-neutral-100 dark:border-neutral-800
                       text-neutral-700 dark:text-neutral-300
                       hover:bg-emerald-50 dark:hover:bg-emerald-950/30
                       hover:border-emerald-200 dark:hover:border-emerald-800
                       hover:text-emerald-700 dark:hover:text-emerald-400
                       transition-all duration-150 group"
          >
            <span className="text-base leading-none">{emoji}</span>
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
