'use client';

import WelcomeDashboard from '@/components/WelcomeDashboard';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DebugEnv from '@/components/DebugEnv';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50" data-page="dashboard">
        <WelcomeDashboard />
        <DebugEnv />
      </div>
    </ProtectedRoute>
  );
}