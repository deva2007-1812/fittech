import React, { useState } from 'react';
import { Bell, Moon, LogOut, ChevronRight, Shield, User, Palette, Info, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/helpers';
import toast from 'react-hot-toast';

function ToggleSwitch({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex w-11 h-6 rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none',
        checked ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-700'
      )}
    >
      <span className={cn('absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200', checked ? 'left-6' : 'left-1')} />
    </button>
  );
}

function SettingRow({ icon, label, description, right }: { icon: React.ReactNode; label: string; description?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-neutral-100 dark:border-neutral-800/80 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 text-neutral-600 dark:text-neutral-300">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</p>
        {description && <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{description}</p>}
      </div>
      {right}
    </div>
  );
}

export function SettingsPage() {
  const { logout, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [mealReminders, setMealReminders] = useState(true);
  const [waterReminders, setWaterReminders] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Manage your app preferences</p>
      </div>

      {/* Account */}
      <div className="card p-5">
        <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Account</h3>
        <SettingRow
          icon={<User size={16} />}
          label={user?.name ?? 'Your Account'}
          description={user?.email ?? ''}
          right={
            <button onClick={() => navigate('/profile')} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
              <ChevronRight size={18} />
            </button>
          }
        />
        <SettingRow
          icon={<Shield size={16} />}
          label="Privacy & Security"
          description="Manage your data and account security"
          right={<ChevronRight size={18} className="text-neutral-400" />}
        />
      </div>

      {/* Notifications */}
      <div className="card p-5">
        <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Notifications</h3>
        <SettingRow
          icon={<Bell size={16} />}
          label="Push Notifications"
          description="Receive important updates and reminders"
          right={<ToggleSwitch id="push-notif" checked={notifications} onChange={setNotifications} />}
        />
        <SettingRow
          icon={<Bell size={16} />}
          label="Meal Reminders"
          description="Get reminded to log your meals"
          right={<ToggleSwitch id="meal-rem" checked={mealReminders} onChange={setMealReminders} />}
        />
        <SettingRow
          icon={<Bell size={16} />}
          label="Water Reminders"
          description="Hourly nudges to stay hydrated"
          right={<ToggleSwitch id="water-rem" checked={waterReminders} onChange={setWaterReminders} />}
        />
      </div>

      {/* Appearance */}
      <div className="card p-5">
        <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Appearance</h3>
        <SettingRow
          icon={isDark ? <Moon size={16} className="text-emerald-400" /> : <Sun size={16} className="text-amber-500" />}
          label="Dark Mode"
          description={isDark ? "Dark theme active" : "Light theme active"}
          right={
            <ToggleSwitch
              id="dark-mode"
              checked={isDark}
              onChange={() => {
                toggleTheme();
                toast.success(isDark ? 'Switched to Light Mode' : 'Switched to Dark Mode', {
                  icon: isDark ? '☀️' : '🌙',
                });
              }}
            />
          }
        />
        <SettingRow
          icon={<Palette size={16} />}
          label="Accent Color"
          description="Emerald Green"
          right={<div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-800 shadow" />}
        />
      </div>

      {/* About */}
      <div className="card p-5">
        <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">About</h3>
        <SettingRow
          icon={<Info size={16} />}
          label="App Version"
          description="FitMind AI v1.0.0"
        />
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full btn-danger py-3 text-sm font-semibold"
      >
        <LogOut size={16} />
        Sign out of FitMind AI
      </button>
    </div>
  );
}
