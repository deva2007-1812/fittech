import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Utensils, Dumbbell, Droplets, Moon, Shield, ShieldAlert,
  Search, Plus, Trash2, Edit3, Eye, RefreshCw, CheckCircle2,
  AlertTriangle, Database, Activity, Sparkles, X, UserCheck
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import type {
  AdminStats,
  AdminUser,
  AdminFoodItem,
  FoodAdminPayload,
  AdminUserActivity
} from '../../types';
import { LoadingSpinner } from '../../components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

export function AdminDashboardPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'foods'>('overview');

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [foods, setFoods] = useState<AdminFoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');
  const [foodSearch, setFoodSearch] = useState('');

  // Modals
  const [selectedUserActivity, setSelectedUserActivity] = useState<AdminUserActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [editingFood, setEditingFood] = useState<AdminFoodItem | null>(null);
  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [foodForm, setFoodForm] = useState<FoodAdminPayload>({
    name: '',
    servingSize: 100,
    servingUnit: 'g',
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
  });

  const loadData = async (showToast = false) => {
    try {
      setIsRefreshing(true);
      const [statsData, usersData, foodsData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
        adminService.getAllFoods(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setFoods(foodsData);
      if (showToast) toast.success('Admin data synchronized');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load admin data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered lists
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesRole =
        userRoleFilter === 'ALL' || u.role?.toUpperCase() === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

  const filteredFoods = useMemo(() => {
    return foods.filter(f =>
      f.name.toLowerCase().includes(foodSearch.toLowerCase())
    );
  }, [foods, foodSearch]);

  // Handle Role Toggle
  const handleToggleRole = async (targetUser: AdminUser) => {
    const newRole = targetUser.role?.toUpperCase() === 'ADMIN' ? 'USER' : 'ADMIN';
    const confirmMessage =
      newRole === 'ADMIN'
        ? `Promote ${targetUser.name} (${targetUser.email}) to Administrator?`
        : `Demote ${targetUser.name} (${targetUser.email}) to standard User?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const updated = await adminService.updateUserRole(targetUser.id, newRole);
      setUsers(prev => prev.map(u => (u.id === targetUser.id ? updated : u)));
      toast.success(`Updated ${targetUser.name}'s role to ${newRole}`);
      // Refresh stats
      const statsData = await adminService.getStats();
      setStats(statsData);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (targetUser: AdminUser) => {
    if (targetUser.id === currentUser?.id) {
      toast.error('You cannot delete your own admin account');
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to permanently delete user "${targetUser.name}" (${targetUser.email}) and all their logged data? This action is irreversible.`
      )
    ) {
      return;
    }

    try {
      await adminService.deleteUser(targetUser.id);
      setUsers(prev => prev.filter(u => u.id !== targetUser.id));
      toast.success(`Deleted user ${targetUser.name}`);
      const statsData = await adminService.getStats();
      setStats(statsData);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // View Activity Modal
  const handleViewActivity = async (userId: string) => {
    try {
      setActivityLoading(true);
      const activity = await adminService.getUserActivity(userId);
      setSelectedUserActivity(activity);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch user activity');
    } finally {
      setActivityLoading(false);
    }
  };

  // Food Management Actions
  const handleOpenFoodModal = (food?: AdminFoodItem) => {
    if (food) {
      setEditingFood(food);
      setFoodForm({
        name: food.name,
        servingSize: food.servingSize,
        servingUnit: food.servingUnit,
        calories: food.calories,
        protein: food.protein,
        carbohydrates: food.carbohydrates,
        fat: food.fat,
        fiber: food.fiber || 0,
      });
    } else {
      setEditingFood(null);
      setFoodForm({
        name: '',
        servingSize: 100,
        servingUnit: 'g',
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        fiber: 0,
      });
    }
    setIsFoodModalOpen(true);
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodForm.name.trim()) {
      toast.error('Food name is required');
      return;
    }

    try {
      if (editingFood) {
        const updated = await adminService.updateFood(editingFood.id, foodForm);
        setFoods(prev => prev.map(f => (f.id === editingFood.id ? updated : f)));
        toast.success(`Updated "${updated.name}"`);
      } else {
        const created = await adminService.addFood(foodForm);
        setFoods(prev => [created, ...prev]);
        toast.success(`Added "${created.name}" to database`);
      }
      setIsFoodModalOpen(false);
      const statsData = await adminService.getStats();
      setStats(statsData);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save food');
    }
  };

  const handleDeleteFood = async (food: AdminFoodItem) => {
    if (!window.confirm(`Delete "${food.name}" from the master food database?`)) return;

    try {
      await adminService.deleteFood(food.id);
      setFoods(prev => prev.filter(f => f.id !== food.id));
      toast.success(`Deleted "${food.name}"`);
      const statsData = await adminService.getStats();
      setStats(statsData);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete food');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <LoadingSpinner size="lg" label="Loading Admin Console..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-purple-950 to-neutral-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={13} className="text-purple-300" />
                Administrator Console
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                System Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">FitMind Management Portal</h1>
            <p className="text-neutral-400 text-sm mt-1 max-w-xl">
              Inspect application metrics, manage users, modify security roles, and manage the master food database.
            </p>
          </div>

          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/10 text-white text-sm font-medium transition-all backdrop-blur self-start sm:self-center"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Database'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 gap-2 sm:gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Activity size={17} />
          Overview & Stats
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Users size={17} />
          User Accounts ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('foods')}
          className={`pb-3 px-3 sm:px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'foods'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Database size={17} />
          Food Catalog ({foods.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & STATS */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Total Users</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Users size={18} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900">{stats.totalUsers}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                <span className="font-semibold text-purple-700">{stats.adminUsers} Admin</span>
                <span>•</span>
                <span>{stats.standardUsers} Standard</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Food Logs</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Utensils size={18} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900">{stats.totalFoodLogs}</p>
              <p className="text-xs text-neutral-400 mt-2">Recorded user meals</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Workout Logs</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Dumbbell size={18} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900">{stats.totalWorkoutLogs}</p>
              <p className="text-xs text-neutral-400 mt-2">Fitness sessions logged</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Master Foods</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Database size={18} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-neutral-900">{stats.totalFoodsInDatabase}</p>
              <p className="text-xs text-neutral-400 mt-2">Verified catalog items</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Droplets size={18} className="text-cyan-500" />
                Hydration & Sleep Metrics
              </h3>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-cyan-50/60 border border-cyan-100">
                  <span className="text-xs font-medium text-cyan-800">Water Log Entries</span>
                  <p className="text-xl font-bold text-cyan-950 mt-1">{stats.totalWaterLogs}</p>
                </div>
                <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
                  <span className="text-xs font-medium text-indigo-800">Sleep Log Entries</span>
                  <p className="text-xl font-bold text-indigo-950 mt-1">{stats.totalSleepLogs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                Administrative Controls
              </h3>
              <p className="text-sm text-neutral-600">
                You have full superuser rights to elevate any user account to Administrator or manage the master food database.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setActiveTab('users')}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                >
                  Manage Users & Roles →
                </button>
                <button
                  onClick={() => {
                    setActiveTab('foods');
                    handleOpenFoodModal();
                  }}
                  className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  + Add Master Food Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
          {/* Controls */}
          <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-500">Filter:</span>
              <select
                value={userRoleFilter}
                onChange={e => setUserRoleFilter(e.target.value as any)}
                className="px-3 py-2 text-sm rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="ALL">All Roles ({users.length})</option>
                <option value="ADMIN">Admins Only</option>
                <option value="USER">Standard Users</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50/80 text-xs font-semibold text-neutral-500 uppercase border-b border-neutral-100">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Profile Info</th>
                  <th className="px-5 py-3.5">Joined</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-neutral-400">
                      No users found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(targetUser => {
                    const isAdmin = targetUser.role?.toUpperCase() === 'ADMIN';
                    const isSelf = targetUser.id === currentUser?.id;

                    return (
                      <tr key={targetUser.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm">
                              {targetUser.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-neutral-900">{targetUser.name}</p>
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 font-medium">You</span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-400">{targetUser.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isAdmin
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {isAdmin ? <Shield size={12} /> : <UserCheck size={12} />}
                            {targetUser.role || 'USER'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-xs text-neutral-600">
                          {targetUser.profileComplete ? (
                            <div>
                              <p className="font-medium text-neutral-800">
                                {targetUser.age ? `${targetUser.age} yrs` : ''}
                                {targetUser.weight ? ` • ${targetUser.weight} kg` : ''}
                                {targetUser.height ? ` • ${targetUser.height} cm` : ''}
                              </p>
                              <p className="text-[11px] text-neutral-400 capitalize">
                                {targetUser.fitnessGoal?.replace('_', ' ') || 'General fitness'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-amber-600 italic">Onboarding pending</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-xs text-neutral-400">
                          {targetUser.createdAt
                            ? new Date(targetUser.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleViewActivity(targetUser.id)}
                              title="Inspect user activity logs"
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              onClick={() => handleToggleRole(targetUser)}
                              disabled={isSelf}
                              title={isAdmin ? 'Demote to USER' : 'Promote to ADMIN'}
                              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                isSelf
                                  ? 'opacity-40 cursor-not-allowed text-neutral-400 bg-neutral-100'
                                  : isAdmin
                                  ? 'text-amber-700 hover:bg-amber-50 border border-amber-200'
                                  : 'text-purple-700 hover:bg-purple-50 border border-purple-200'
                              }`}
                            >
                              {isAdmin ? 'Make User' : 'Make Admin'}
                            </button>

                            {!isSelf && (
                              <button
                                onClick={() => handleDeleteUser(targetUser)}
                                title="Delete user account"
                                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FOOD DATABASE */}
      {activeTab === 'foods' && (
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={foodSearch}
                onChange={e => setFoodSearch(e.target.value)}
                placeholder="Search food catalog..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <button
              onClick={() => handleOpenFoodModal()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-sm font-semibold shadow-sm transition-all self-start sm:self-center"
            >
              <Plus size={16} />
              Add Food Item
            </button>
          </div>

          {/* Foods Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50/80 text-xs font-semibold text-neutral-500 uppercase border-b border-neutral-100">
                <tr>
                  <th className="px-5 py-3.5">Food Name</th>
                  <th className="px-5 py-3.5">Serving</th>
                  <th className="px-5 py-3.5">Calories</th>
                  <th className="px-5 py-3.5">Protein</th>
                  <th className="px-5 py-3.5">Carbs</th>
                  <th className="px-5 py-3.5">Fat</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredFoods.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-neutral-400">
                      No foods found. Click "Add Food Item" to insert a new entry.
                    </td>
                  </tr>
                ) : (
                  filteredFoods.map(food => (
                    <tr key={food.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-neutral-900">{food.name}</td>
                      <td className="px-5 py-3.5 text-xs text-neutral-600">
                        {food.servingSize} {food.servingUnit}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-bold text-neutral-800">
                        {food.calories} kcal
                      </td>
                      <td className="px-5 py-3.5 text-xs text-emerald-600 font-medium">{food.protein}g</td>
                      <td className="px-5 py-3.5 text-xs text-amber-600 font-medium">{food.carbohydrates}g</td>
                      <td className="px-5 py-3.5 text-xs text-red-600 font-medium">{food.fat}g</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenFoodModal(food)}
                            title="Edit food item"
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteFood(food)}
                            title="Delete food item"
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT FOOD */}
      {isFoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900">
                {editingFood ? 'Edit Master Food Item' : 'Add New Master Food'}
              </h3>
              <button
                onClick={() => setIsFoodModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Food Name *</label>
                <input
                  type="text"
                  required
                  value={foodForm.name}
                  onChange={e => setFoodForm({ ...foodForm, name: e.target.value })}
                  placeholder="e.g., Grilled Chicken Breast"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Serving Size *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={foodForm.servingSize}
                    onChange={e => setFoodForm({ ...foodForm, servingSize: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Serving Unit *</label>
                  <input
                    type="text"
                    required
                    value={foodForm.servingUnit}
                    onChange={e => setFoodForm({ ...foodForm, servingUnit: e.target.value })}
                    placeholder="e.g., g, serving, cup"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Calories (kcal) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={foodForm.calories}
                    onChange={e => setFoodForm({ ...foodForm, calories: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Protein (g) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={foodForm.protein}
                    onChange={e => setFoodForm({ ...foodForm, protein: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Carbs (g) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={foodForm.carbohydrates}
                    onChange={e => setFoodForm({ ...foodForm, carbohydrates: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Fat (g) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={foodForm.fat}
                    onChange={e => setFoodForm({ ...foodForm, fat: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsFoodModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-all"
                >
                  {editingFood ? 'Save Changes' : 'Create Food Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: USER ACTIVITY INSPECTOR */}
      {selectedUserActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Activity Log Inspector</h3>
                <p className="text-xs text-neutral-500">
                  {selectedUserActivity.userName} ({selectedUserActivity.userEmail})
                </p>
              </div>
              <button
                onClick={() => setSelectedUserActivity(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-5 pr-1 flex-1">
              {/* Food Logs */}
              <div>
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Utensils size={14} className="text-emerald-600" />
                  Recent Meals ({selectedUserActivity.recentFoodLogs?.length || 0})
                </h4>
                {selectedUserActivity.recentFoodLogs?.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic">No food logs recorded.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedUserActivity.recentFoodLogs.map(item => (
                      <div key={item.id} className="p-2.5 rounded-xl bg-neutral-50 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-neutral-800">{item.foodName}</p>
                          <p className="text-[11px] text-neutral-400">
                            {item.quantity} {item.unit} • {item.mealType} • {item.date}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">{item.calories} kcal</p>
                          <p className="text-[10px] text-neutral-400">P:{item.protein}g C:{item.carbs}g F:{item.fat}g</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Workout Logs */}
              <div>
                <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Dumbbell size={14} className="text-blue-600" />
                  Recent Workouts ({selectedUserActivity.recentWorkoutLogs?.length || 0})
                </h4>
                {selectedUserActivity.recentWorkoutLogs?.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic">No workout logs recorded.</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedUserActivity.recentWorkoutLogs.map(w => (
                      <div key={w.id} className="p-2.5 rounded-xl bg-neutral-50 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-neutral-800">{w.exercise}</p>
                          <p className="text-[11px] text-neutral-400">
                            {w.duration} mins {w.sets ? `• ${w.sets} sets` : ''} • {w.date}
                          </p>
                        </div>
                        {w.caloriesBurned && (
                          <span className="font-semibold text-blue-600">{w.caloriesBurned} kcal</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Water & Sleep */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Droplets size={14} className="text-cyan-600" />
                    Water ({selectedUserActivity.recentWaterLogs?.length || 0})
                  </h4>
                  {selectedUserActivity.recentWaterLogs?.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">No water logs.</p>
                  ) : (
                    <div className="space-y-1">
                      {selectedUserActivity.recentWaterLogs.map(w => (
                        <div key={w.id} className="p-2 rounded-lg bg-cyan-50/50 flex justify-between text-xs">
                          <span>{w.date}</span>
                          <span className="font-bold text-cyan-800">{w.amount} ml</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Moon size={14} className="text-indigo-600" />
                    Sleep ({selectedUserActivity.recentSleepLogs?.length || 0})
                  </h4>
                  {selectedUserActivity.recentSleepLogs?.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic">No sleep logs.</p>
                  ) : (
                    <div className="space-y-1">
                      {selectedUserActivity.recentSleepLogs.map(s => (
                        <div key={s.id} className="p-2 rounded-lg bg-indigo-50/50 flex justify-between text-xs">
                          <span>{s.date}</span>
                          <span className="font-bold text-indigo-800">{s.duration} hrs</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => setSelectedUserActivity(null)}
                className="px-4 py-2 text-sm font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
