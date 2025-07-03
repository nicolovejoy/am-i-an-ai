import { SessionHistory } from '@/components/SessionHistory';
import { Navigation } from '@/components/Navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="py-8 px-4">
          <SessionHistory />
        </div>
      </div>
    </ProtectedRoute>
  );
}