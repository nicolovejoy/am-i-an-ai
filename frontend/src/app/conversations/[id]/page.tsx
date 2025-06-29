import React from 'react';
import { ConversationViewWithZustand as ConversationView } from '@/components/ConversationViewWithZustand';

interface ConversationPageProps {
  params: {
    id: string;
  };
}

// Generate static params using real conversation IDs from seeded database
export async function generateStaticParams() {
  // These are the actual conversation IDs from your seeded database
  // From database-seed.sql and seed.sql files
  return [
    { id: '770e8400-e29b-41d4-a716-446655440001' }, // Creative Writing Discussion
    { id: '770e8400-e29b-41d4-a716-446655440002' }, // Philosophy of AI Consciousness  
    { id: '770e8400-e29b-41d4-a716-446655440003' }, // Technology Trends 2024
  ];
}

// Allow dynamic params for conversations created at runtime
export const dynamicParams = true;

export default function ConversationPage({ params }: ConversationPageProps) {
  return <ConversationView conversationId={params.id} />;
}