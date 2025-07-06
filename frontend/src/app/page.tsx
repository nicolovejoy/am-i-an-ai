'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to dashboard as the default landing page
    router.push('/dashboard');
  }, [router]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Redirecting to dashboard...</p>
      </div>
    </ProtectedRoute>
  );
}