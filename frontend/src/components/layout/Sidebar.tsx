import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Bot, Utensils, Dumbbell, TrendingUp,
  History, User, Settings, Droplets, Moon, LogOut, Menu, X, Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

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
      'hidden md:flex flex-col h-screen sticky top-0 bg-white border-r border-neutral-100 transition-all duration-300 flex-shrink-0',
      collapsed ? 'w-[70px]' : 'w-[220px] lg:w-[240px]'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-neutral-100 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-neutral-900">FitMind</p>
            <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">AI</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
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
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800',
                collapsed && 'justify-center'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-neutral-100 py-3 px-2 space-y-0.5">
        {bottomItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800',
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
          <div className="mt-3 pt-3 border-t border-neutral-100 px-2">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-bold flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-neutral-800 truncate">{user?.name || 'User'}</p>
                <p className="text-[10px] text-neutral-400 truncate">{user?.email || ''}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-150',
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
