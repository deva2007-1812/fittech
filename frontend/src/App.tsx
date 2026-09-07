import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute, AdminRoute } from './routes/ProtectedRoute';
import { AuthLayout } from './layouts/AuthLayout';
import { AppLayout } from './layouts/AppLayout';
import { LoadingSpinner } from './components/shared/LoadingSpinner';

// Lazy-loaded pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })));
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const DashboardPage = lazy(() => import('./pages/app/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AICoachPage = lazy(() => import('./pages/app/AICoachPage').then(m => ({ default: m.AICoachPage })));
const NutritionPage = lazy(() => import('./pages/app/NutritionPage').then(m => ({ default: m.NutritionPage })));
const WorkoutPage = lazy(() => import('./pages/app/WorkoutPage').then(m => ({ default: m.WorkoutPage })));
const WaterPage = lazy(() => import('./pages/app/WaterPage').then(m => ({ default: m.WaterPage })));
const SleepPage = lazy(() => import('./pages/app/SleepPage').then(m => ({ default: m.SleepPage })));
const ProgressPage = lazy(() => import('./pages/app/ProgressPage').then(m => ({ default: m.ProgressPage })));
const HistoryPage = lazy(() => import('./pages/app/HistoryPage').then(m => ({ default: m.HistoryPage })));
const ProfilePage = lazy(() => import('./pages/app/ProfilePage').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/app/SettingsPage').then(m => ({ default: m.SettingsPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" label="Loading…" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              background: '#fff',
              color: '#171717',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)',
              border: '1px solid #f5f5f5',
              maxWidth: '380px',
            },
            success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>
            </Route>

            {/* Onboarding */}
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
            </Route>

            {/* Protected app routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/ai-coach" element={<AICoachPage />} />
                <Route path="/nutrition" element={<NutritionPage />} />
                <Route path="/workout" element={<WorkoutPage />} />
                <Route path="/water" element={<WaterPage />} />
                <Route path="/sleep" element={<SleepPage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Admin routes */}
            <Route element={<AdminRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
