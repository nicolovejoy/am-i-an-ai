import { useAuth } from '../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import { AdminConsole } from '../components/AdminConsole';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Wait for auth to load before checking
    if (isLoading) return;
    
    // Check if user is admin
    if (user) {
      if (user.email === 'nlovejoy@me.com') {
        setIsAuthorized(true);
      } else {
        console.log('Admin access denied for:', user.email);
        setIsAuthorized(false);
        navigate('/dashboard');
      }
    }
  }, [user, isLoading, navigate]);

  // Show loading state while checking auth
  if (isLoading || isAuthorized === null) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Checking authorization...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Don't render if not authorized
  if (!isAuthorized) {
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