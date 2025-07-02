import { ReactNode } from 'react';
import { Identity } from '@/store/sessionStore';

interface MessageBubbleProps {
  sender: Identity | 'You';
  children: ReactNode;
  timestamp?: number;
  isCurrentUser?: boolean;
}

export function MessageBubble({ sender, children, timestamp, isCurrentUser = false }: MessageBubbleProps) {
  // Color scheme from UX mock
  const getMessageColors = (sender: Identity | 'You') => {
    if (isCurrentUser || sender === 'You') {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-slate-900'
      };
    }
    
    switch (sender) {
      case 'A':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200', 
          text: 'text-slate-900'
        };
      case 'B':
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-900'
        };
      case 'C':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-slate-900'
        };
      case 'D':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          text: 'text-slate-900'
        };
      default:
        return {
          bg: 'bg-slate-50',
          border: 'border-slate-200',
          text: 'text-slate-900'
        };
    }
  };

  const getSenderLabel = (sender: Identity | 'You') => {
    if (isCurrentUser || sender === 'You') return 'You';
    
    switch (sender) {
      case 'A': return 'Participant 1';
      case 'B': return 'Participant 2'; 
      case 'C': return 'Participant 3';
      case 'D': return 'Participant 4';
      default: return `Participant ${sender}`;
    }
  };

  const colors = getMessageColors(sender);
  const alignmentClass = isCurrentUser ? 'ml-auto' : '';
  
  return (
    <div className={`mb-3 max-w-[75%] ${alignmentClass}`}>
      <div className={`border rounded-2xl px-4 py-3 ${colors.bg} ${colors.border} ${colors.text}`}>
        <div className="text-xs font-semibold text-slate-600 mb-1">
          {getSenderLabel(sender)}
        </div>
        <div className="text-sm leading-relaxed break-words">
          {children}
        </div>
        {timestamp && (
          <div className="text-xs text-slate-500 mt-1">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}