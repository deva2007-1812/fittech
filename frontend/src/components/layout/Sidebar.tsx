import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Bot, Utensils, Dumbbell, TrendingUp,
  History, User, Settings, Droplets, Moon, Sun, LogOut, Menu, X, Zap,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/helpers';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/ai-coach', icon: Bot, label: 'AI Coach' },
  { to: '/nutrition', icon: Utensils, label: 'Nutrition' },
  { to: '/workout', icon: Dumbbell, label: 'Workout' },
  { to: '/water', icon: Droplets, label: 'Water' },
  { to: '/sleep', icon: Moon, label: 'Sleep' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/history', icon: History, label: 'History' },
];

const bottomItems = [
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast.error('Failed to log out');
    }
  };

  return (
    <aside className={cn(
      'hidden md:flex flex-col h-screen sticky top-0 bg-white dark:bg-neutral-900 border-r border-neutral-100 dark:border-neutral-800 transition-all duration-300 flex-shrink-0',
      collapsed ? 'w-[70px]' : 'w-[220px] lg:w-[240px]'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">FitMind</p>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">AI</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <Menu size={16} /> : <X size={16} />}
        </button>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 hover:text-neutral-800 dark:hover:text-neutral-200',
                collapsed && 'justify-center'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* Admin Link if User is Admin */}
        {isAdmin && (
          <div className="pt-2 mt-2 border-t border-neutral-100 dark:border-neutral-800">
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold shadow-sm'
                    : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-neutral-800/80 hover:text-purple-800 dark:hover:text-purple-300',
                  collapsed && 'justify-center'
                )
              }
              title={collapsed ? 'Admin Portal' : undefined}
            >
              <ShieldCheck size={18} className="flex-shrink-0 text-purple-600 dark:text-purple-400" />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span>Admin Portal</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">PRO</span>
                </div>
              )}
            </NavLink>
          </div>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-neutral-100 dark:border-neutral-800 py-3 px-2 space-y-0.5">
        {/* Quick Theme Toggle */}
        <button
          onClick={() => {
            toggleTheme();
            toast.success(isDark ? 'Switched to Light Mode' : 'Switched to Dark Mode', {
              icon: isDark ? '☀️' : '🌙',
            });
          }}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
            'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 hover:text-neutral-800 dark:hover:text-neutral-200',
            collapsed && 'justify-center'
          )}
          title={collapsed ? (isDark ? 'Light Mode' : 'Dark Mode') : undefined}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun size={18} className="flex-shrink-0 text-amber-400" />
          ) : (
            <Moon size={18} className="flex-shrink-0 text-neutral-500" />
          )}
          {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 hover:text-neutral-800 dark:hover:text-neutral-200',
                collapsed && 'justify-center'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* User + Logout */}
        {!collapsed && (
          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 px-2">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-sm font-bold flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">{user?.name || 'User'}</p>
                  {isAdmin && (
                    <span className="text-[9px] font-bold px-1 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">ADMIN</span>
                  )}
                </div>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">{user?.email || ''}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-150',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Log out' : undefined}
          aria-label="Log out"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}

