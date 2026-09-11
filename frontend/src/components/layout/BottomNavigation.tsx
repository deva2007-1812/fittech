import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Bot, Utensils, Dumbbell, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/helpers';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { to: '/ai-coach', icon: Bot, label: 'AI Coach' },
  { to: '/workout', icon: Dumbbell, label: 'Workout' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
];

export function BottomNavigation() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-150 min-w-[56px]',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'w-10 h-7 flex items-center justify-center rounded-full transition-all',
                  isActive && 'bg-emerald-50 dark:bg-emerald-950/60'
                )}>
                  <Icon size={20} />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
