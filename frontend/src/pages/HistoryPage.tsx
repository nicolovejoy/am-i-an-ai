import { MatchHistory } from '../components/MatchHistory';
import ProtectedRoute from '../components/auth/ProtectedRoute';

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50" data-page="history">
        <div className="py-8 px-4">
          <MatchHistory />
        </div>
      </div>
    </ProtectedRoute>
  );
}