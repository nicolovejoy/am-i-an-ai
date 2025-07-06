'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AdminConsole } from '@/components/AdminConsole';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not admin
    if (user && user.email !== 'nlovejoy@me.com') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || user.email !== 'nlovejoy@me.com') {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50" data-page="admin">
        <AdminConsole />
      </div>
    </ProtectedRoute>
  );
}