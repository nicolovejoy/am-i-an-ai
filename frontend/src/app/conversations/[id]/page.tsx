import React from 'react';
import { ConversationView } from '@/components/ConversationView';

interface ConversationPageProps {
  params: {
    id: string;
  };
}

// Generate static params for build-time pre-rendering
export async function generateStaticParams() {
  try {
    // Fetch real conversation IDs from Lambda API for static generation
    const response = await fetch('https://rovxzccsl3.execute-api.us-east-1.amazonaws.com/prod/api/conversations');
    
    if (!response.ok) {
      throw new Error('Failed to fetch conversations');
    }
    
    const data = await response.json();
    
    if (data.success && Array.isArray(data.conversations)) {
      return data.conversations.map((conv: any) => ({
        id: conv.id
      }));
    }
    
    throw new Error('Invalid conversations response format');
  } catch (error) {
    console.warn('Failed to fetch conversations for static generation, using fallback:', error);
    
    // Fallback to mock conversation IDs for static generation
    return [
      { id: '01234567-1111-1111-1111-012345678901' },
      { id: '01234567-4444-4444-4444-012345678901' },
      { id: '01234567-7777-7777-7777-012345678901' },
    ];
  }
}

// Allow dynamic params for conversations created at runtime
export const dynamicParams = true;

export default function ConversationPage({ params }: ConversationPageProps) {
  return <ConversationView conversationId={params.id} />;
}