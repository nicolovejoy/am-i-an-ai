import { ReactNode } from 'react';
import { Identity } from '@/store/sessionStore';
import { PLAYER_CONFIG, getPlayerNumber, IDENTITY_NAMES } from '../../config/playerConfig';

interface MessageBubbleProps {
  sender: Identity | 'You';
  children: ReactNode;
  timestamp?: number;
  isCurrentUser?: boolean;
  identityMapping?: Record<string, number>; // Maps identities to player numbers
}

export function MessageBubble({ sender, children, timestamp, isCurrentUser = false, identityMapping = {} }: MessageBubbleProps) {
  // Get player number from identity mapping
  const getPlayerInfo = (sender: Identity | 'You') => {
    if (isCurrentUser || sender === 'You') {
      // For current user, we need to find their player number from the mapping
      return null; // Will be handled separately
    }
    
    const playerNumber = getPlayerNumber(sender as Identity, identityMapping);
    return PLAYER_CONFIG[playerNumber];
  };

  const getMessageColors = (sender: Identity | 'You') => {
    // For current user, we need their actual identity to get colors
    let actualSender = sender;
    if (sender === 'You' && isCurrentUser) {
      // This shouldn't happen, but fallback to gray
      return {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-900'
      };
    }
    
    const playerNumber = getPlayerNumber(actualSender as Identity, identityMapping);
    const config = PLAYER_CONFIG[playerNumber];
    
    return {
      bg: config.bgColor,
      border: config.borderColor,
      text: 'text-slate-900'
    };
  };

  const getSenderLabel = (sender: Identity | 'You') => {
    if (isCurrentUser || sender === 'You') return 'You';
    
    // Return the identity name (Ashley, Brianna, Chloe, David)
    return IDENTITY_NAMES[sender as Identity];
  };

  const colors = getMessageColors(sender);
  const alignmentClass = isCurrentUser ? 'ml-auto' : '';
  const borderClass = isCurrentUser ? 'ring-2 ring-slate-400' : '';
  
  return (
    <div className={`mb-3 max-w-[75%] ${alignmentClass}`}>
      <div className={`border rounded-2xl px-4 py-3 ${colors.bg} ${colors.border} ${colors.text} ${borderClass}`}>
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