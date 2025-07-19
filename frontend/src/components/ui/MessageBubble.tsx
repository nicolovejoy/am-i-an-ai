import type { ReactNode } from 'react';
import type { Identity } from '@shared/schemas';

interface MessageBubbleProps {
  sender: Identity | 'You';
  children: ReactNode;
  timestamp?: number;
  isCurrentUser?: boolean;
  identityMapping?: Record<string, number>;
}

// Inline player styling to avoid import issues
const PLAYER_STYLES = {
  A: {
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-500',
    name: 'Ashley'
  },
  B: {
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300', 
    textColor: 'text-green-500',
    name: 'Brianna'
  },
  C: {
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-300',
    textColor: 'text-rose-900',
    name: 'Chloe'
  },
  D: {
    bgColor: 'bg-fuchsia-100',
    borderColor: 'border-fuchsia-300',
    textColor: 'text-fuchsia-500',
    name: 'David'
  },
  You: {
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-700',
    name: 'You'
  }
} as const;

export default function MessageBubble({ 
  sender, 
  children, 
  timestamp
}: MessageBubbleProps) {
  const style = sender in PLAYER_STYLES 
    ? PLAYER_STYLES[sender as keyof typeof PLAYER_STYLES] 
    : PLAYER_STYLES.You;
  
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`mb-4 p-3 rounded-lg border-2 ${style.bgColor} ${style.borderColor}`}>
      <div className="flex justify-between items-start mb-2">
        <span className={`font-semibold text-sm ${style.textColor}`}>
          {style.name}
        </span>
        {timestamp && (
          <span className="text-xs text-gray-500">
            {formatTime(timestamp)}
          </span>
        )}
      </div>
      <div className="text-gray-800">
        {children}
      </div>
    </div>
  );
}