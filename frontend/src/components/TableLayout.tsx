
import { Card } from './ui';
import { PLAYER_CONFIG } from '../config/playerConfig';
import type { Identity } from '../store/sessionStore';

interface Message {
  id: string;
  sender: Identity;
  content: string;
  timestamp: number;
}

interface Participant {
  identity: Identity;
  playerNumber: 1 | 2 | 3 | 4;
  messageCount: number;
  lastMessage?: string;
  isTyping?: boolean;
}

interface TableLayoutProps {
  participants: Participant[];
  messages: Message[];
  identityMapping: Record<string, number>; // Maps A,B,C,D to 1,2,3,4
  myIdentity: Identity;
}

export function TableLayout({ participants, messages, myIdentity }: TableLayoutProps) {
  // Create a map of player positions to participants
  const playerPositions = new Map<number, Participant>();
  participants.forEach(p => {
    playerPositions.set(p.playerNumber, p);
  });

  // Get recent messages for each player
  const getRecentMessage = (playerNumber: number): string | undefined => {
    const participant = playerPositions.get(playerNumber);
    if (!participant) return undefined;
    
    // Find the most recent message from this participant
    const playerMessages = messages.filter(m => m.sender === participant.identity);
    return playerMessages[playerMessages.length - 1]?.content;
  };

  const renderPlayerSlot = (playerNumber: 1 | 2 | 3 | 4) => {
    const config = PLAYER_CONFIG[playerNumber];
    const participant = playerPositions.get(playerNumber);
    const isMe = participant?.identity === myIdentity;
    const recentMessage = getRecentMessage(playerNumber);

    return (
      <div 
        key={playerNumber}
        className={`
          relative p-4 rounded-lg border-2 transition-all
          ${participant ? `border-${config.borderColor} bg-${config.bgColor}` : 'border-slate-200 bg-slate-50'}
          ${isMe ? 'ring-2 ring-offset-2 ring-' + config.color : ''}
        `}
        style={{
          borderColor: participant ? config.borderColor : '#E2E8F0',
          backgroundColor: participant ? config.bgColor : '#F8FAFC'
        }}
      >
        {/* Player Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: config.color }}
            >
              {playerNumber}
            </div>
            <div>
              <div className="font-semibold text-slate-900">
                {config.label} {isMe && '(You)'}
              </div>
              {participant && (
                <div className="text-xs text-slate-500">
                  {participant.messageCount} messages
                </div>
              )}
            </div>
          </div>
          {participant?.isTyping && (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
        </div>

        {/* Recent Message Preview */}
        {participant ? (
          <div className="mt-3">
            {recentMessage ? (
              <div className="text-sm text-slate-700 italic line-clamp-2">
                &ldquo;{recentMessage}&rdquo;
              </div>
            ) : (
              <div className="text-sm text-slate-400 italic">
                No messages yet...
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 text-sm text-slate-400 italic">
            Waiting for player...
          </div>
        )}

        {/* Player Status */}
        {participant && (
          <div className="absolute top-2 right-2">
            <div className={`w-2 h-2 rounded-full ${participant ? 'bg-green-500' : 'bg-slate-300'}`} />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-slate-900">🎮 Table for Four</h3>
        <p className="text-sm text-slate-600">
          Each player sees the same view • Random seating each game
        </p>
      </div>

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Top Row */}
        <div>{renderPlayerSlot(1)}</div>
        <div>{renderPlayerSlot(2)}</div>
        
        {/* Bottom Row */}
        <div>{renderPlayerSlot(3)}</div>
        <div>{renderPlayerSlot(4)}</div>
      </div>

      {/* Center Table Info */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 rounded-full">
          <span className="text-sm text-slate-600">
            {participants.length}/4 players connected
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-sm text-slate-600">
            {messages.length} total messages
          </span>
        </div>
      </div>
    </Card>
  );
}