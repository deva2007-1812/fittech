import React, { lazy, Suspense } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { Outlet } from 'react-router-dom';

// Lazy-load the AI Coach to avoid blocking the initial render
const FloatingAICoach = lazy(() =>
  import('../components/AI/FloatingAICoach').then(m => ({ default: m.FloatingAICoach }))
);

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <BottomNavigation />

      {/* Floating AI Coach — persistent across all authenticated routes */}
      <Suspense fallback={null}>
        <FloatingAICoach />
      </Suspense>
    </div>
  );
}
