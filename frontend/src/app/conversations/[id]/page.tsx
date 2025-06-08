import React from 'react';
import { ConversationView } from '@/components/ConversationView';

interface ConversationPageProps {
  params: {
    id: string;
  };
}

// Generate static params for build-time pre-rendering
export async function generateStaticParams() {
  // Return mock conversation IDs for static generation
  return [
    { id: '01234567-1111-1111-1111-012345678901' },
    { id: '01234567-4444-4444-4444-012345678901' },
    { id: '01234567-7777-7777-7777-012345678901' },
  ];
}

// Enable dynamic params for conversations not in generateStaticParams
export const dynamicParams = true;

export default function ConversationPage({ params }: ConversationPageProps) {
  return <ConversationView conversationId={params.id} />;
}