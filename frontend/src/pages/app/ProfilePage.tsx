import React, { useState } from 'react';
import { Save, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { getApiErrorMessage } from '../../services/api';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import { ACTIVITY_LABELS, GOAL_LABELS } from '../../utils/helpers';
import type { ActivityLevel, FitnessGoal } from '../../types';
import toast from 'react-hot-toast';

const ACTIVITY_OPTIONS: ActivityLevel[] = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'];
const GOAL_OPTIONS: FitnessGoal[] = ['maintain_weight', 'improve_fitness', 'weight_management'];

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? '',
    age: user?.age?.toString() ?? '',
    height: user?.height?.toString() ?? '',
    weight: user?.weight?.toString() ?? '',
    activityLevel: user?.activityLevel ?? 'moderately_active' as ActivityLevel,
    fitnessGoal: user?.fitnessGoal ?? 'improve_fitness' as FitnessGoal,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updated = await userService.updateProfile({
        name: form.name,
        age: Number(form.age) || undefined,
        height: Number(form.height) || undefined,
        weight: Number(form.weight) || undefined,
        activityLevel: form.activityLevel,
        fitnessGoal: form.fitnessGoal,
      });
      updateUser(updated);
      toast.success('Profile updated!');
      setIsEditing(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Profile</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Manage your personal information</p>
      </div>

      {/* Avatar */}
      <div className="card p-6 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-3xl font-bold">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors" aria-label="Change photo">
            <Camera size={12} />
          </button>
        </div>
        <div>
          <p className="text-xl font-bold text-neutral-900">{user?.name}</p>
          <p className="text-sm text-neutral-500">{user?.email}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1 capitalize">{user?.fitnessGoal ? GOAL_LABELS[user.fitnessGoal] : 'Goal not set'}</p>
        </div>
        <div className="ml-auto">
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm">
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Profile Form */}
      <div className="card p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="input-group sm:col-span-2">
              <label htmlFor="profile-name" className="label">Full name</label>
              <input id="profile-name" type="text" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input" disabled={!isEditing} />
            </div>
            <div className="input-group">
              <label htmlFor="profile-age" className="label">Age</label>
              <input id="profile-age" type="number" value={form.age}
                onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                className="input" disabled={!isEditing} placeholder="Years" />
            </div>
            <div className="input-group">
              <label htmlFor="profile-weight" className="label">Weight (kg)</label>
              <input id="profile-weight" type="number" step="0.1" value={form.weight}
                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))}
                className="input" disabled={!isEditing} />
            </div>
            <div className="input-group sm:col-span-2">
              <label htmlFor="profile-height" className="label">Height (cm)</label>
              <input id="profile-height" type="number" value={form.height}
                onChange={e => setForm(f => ({ ...f, height: e.target.value }))}
                className="input" disabled={!isEditing} />
            </div>
          </div>

          {/* Activity Level */}
          <div className="input-group">
            <label htmlFor="profile-activity" className="label">Activity Level</label>
            <select id="profile-activity" value={form.activityLevel}
              onChange={e => setForm(f => ({ ...f, activityLevel: e.target.value as ActivityLevel }))}
              className="input" disabled={!isEditing}>
              {ACTIVITY_OPTIONS.map(level => (
                <option key={level} value={level}>{ACTIVITY_LABELS[level]}</option>
              ))}
            </select>
          </div>

          {/* Fitness Goal */}
          <div className="input-group">
            <label htmlFor="profile-goal" className="label">Fitness Goal</label>
            <select id="profile-goal" value={form.fitnessGoal}
              onChange={e => setForm(f => ({ ...f, fitnessGoal: e.target.value as FitnessGoal }))}
              className="input" disabled={!isEditing}>
              {GOAL_OPTIONS.map(goal => (
                <option key={goal} value={goal}>{GOAL_LABELS[goal]}</option>
              ))}
            </select>
          </div>

          {isEditing && (
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={isLoading} className="btn-primary flex-1">
                {isLoading ? <LoadingSpinner size="sm" /> : <><Save size={16} /> Save changes</>}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Stats */}
      <div className="card p-5">
        <h3 className="section-title mb-4">Body Stats</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Height', value: user?.height ? `${user.height} cm` : '—' },
            { label: 'Weight', value: user?.weight ? `${user.weight} kg` : '—' },
            { label: 'Age', value: user?.age ? `${user.age} yrs` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-neutral-50 rounded-xl p-4">
              <p className="text-lg font-bold text-neutral-900">{value}</p>
              <p className="text-xs text-neutral-500 font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
