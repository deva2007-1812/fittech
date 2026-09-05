import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { BottomNavigation } from '../components/layout/BottomNavigation';
import { Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
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
    </div>
  );
}
