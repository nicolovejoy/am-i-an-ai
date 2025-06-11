import { ConversationView } from '@/components/ConversationView';

// This file handles cases where a conversation ID wasn't pre-generated
// but should still be accessible via client-side routing
export default function ConversationNotFound() {
  // Extract the conversation ID from the current URL
  if (typeof window !== 'undefined') {
    const pathSegments = window.location.pathname.split('/');
    const conversationId = pathSegments[pathSegments.length - 1];
    
    if (conversationId && conversationId !== 'not-found') {
      // Render the conversation view with the dynamic ID
      return <ConversationView conversationId={conversationId} />;
    }
  }
  
  // Fallback for actual not found cases
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold text-[#2D3748] mb-4">Conversation Not Found</h1>
        <p className="text-[#4A5568] mb-6">
          The conversation you're looking for doesn't exist or may have been deleted.
        </p>
        <a
          href="/conversations"
          className="inline-flex items-center px-4 py-2 bg-[#8B6B4A] text-white font-medium rounded-md hover:bg-[#7A5A3A] transition-colors"
        >
          ← Back to Conversations
        </a>
      </div>
    </div>
  );
}