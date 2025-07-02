import ChatInterface from '@/components/ChatInterface';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function Home() {
  return (
    <ProtectedRoute>
      <ChatInterface />
    </ProtectedRoute>
  );
}