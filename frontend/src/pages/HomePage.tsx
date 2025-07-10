import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedRoute from '../components/auth/ProtectedRoute';

export default function HomePage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to dashboard as the default landing page
    navigate('/dashboard');
  }, [navigate]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Redirecting to dashboard...</p>
      </div>
    </ProtectedRoute>
  );
}