import React from 'react';
import { Outlet } from 'react-router-dom';
import { Zap } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Left panel – branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-emerald-600 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full border-2 border-white" />
          <div className="absolute top-40 left-40 w-40 h-40 rounded-full border-2 border-white" />
          <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full border-2 border-white" />
          <div className="absolute bottom-40 right-40 w-48 h-48 rounded-full border-2 border-white" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-white text-xl font-bold">FitMind AI</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Your personal
              <br />
              <span className="text-emerald-200">AI fitness coach.</span>
            </h1>
            <p className="text-emerald-100 mt-4 text-lg leading-relaxed">
              Track nutrition, workouts, sleep, and water — powered by AI insights tailored to you.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Personalized daily nutrition targets',
              'AI-powered meal logging via voice',
              'Workout & sleep tracking',
              'Meaningful progress insights',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-400/30 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <p className="text-emerald-100 text-sm">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-emerald-200/60 text-xs">© 2025 FitMind AI. Built for a healthier you.</p>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-neutral-900">FitMind AI</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
