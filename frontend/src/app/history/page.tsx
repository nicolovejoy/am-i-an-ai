import { SessionHistory } from '@/components/SessionHistory';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <div className="py-8 px-4">
          <SessionHistory />
        </div>
      </div>
    </ProtectedRoute>
  );
}