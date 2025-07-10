
import { useState, useRef } from 'react';
import { FiSend } from 'react-icons/fi';
import { PLAYER_CONFIG } from '../config/playerConfig';
import { Card } from './ui';

interface PlayerInputProps {
  playerNumber: 1 | 2 | 3 | 4;
  onSendMessage: (message: string) => void;
  isActive: boolean;
  messageCount: number;
}

export function PlayerInput({ playerNumber, onSendMessage, isActive, messageCount }: PlayerInputProps) {
  const [messageInput, setMessageInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const config = PLAYER_CONFIG[playerNumber];

  const handleSendMessage = () => {
    const content = messageInput.trim();
    if (!content || !isActive) return;

    onSendMessage(content);
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card padding="sm">
      {/* Player Assignment Indicator */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: config.color }}
          >
            {playerNumber}
          </div>
          <div>
            <div className="font-semibold text-slate-900">
              You are {config.label}
            </div>
            <div className="text-xs text-slate-500">
              {messageCount} messages sent
            </div>
          </div>
        </div>
        
        {/* Color Legend */}
        <div className="text-xs text-slate-500">
          Your color throughout the game
        </div>
      </div>

      {/* Input Area */}
      <div className="flex gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={!isActive}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-full focus:ring-2 focus:ring-offset-1 text-slate-900 bg-white placeholder-slate-500 text-sm sm:text-base transition-colors"
            style={{
              borderColor: config.borderColor,
              backgroundColor: isActive ? 'white' : '#F8FAFC'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = config.color;
              e.target.style.boxShadow = `0 0 0 3px ${config.bgColor}`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = config.borderColor;
              e.target.style.boxShadow = 'none';
            }}
            maxLength={280}
          />
          
          {/* Character count */}
          <div 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
            style={{ color: messageInput.length > 250 ? '#EF4444' : config.color }}
          >
            {messageInput.length}/280
          </div>
        </div>
        
        <button
          onClick={handleSendMessage}
          disabled={!messageInput.trim() || !isActive}
          className="text-white p-2 sm:p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 min-w-[40px] sm:min-w-[48px]"
          style={{
            backgroundColor: messageInput.trim() && isActive ? config.color : '#CBD5E1'
          }}
          onMouseEnter={(e) => {
            if (messageInput.trim() && isActive) {
              e.currentTarget.style.filter = 'brightness(0.9)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'none';
          }}
        >
          <FiSend size={16} className="sm:hidden" />
          <FiSend size={20} className="hidden sm:block" />
        </button>
      </div>

      {/* Status Messages */}
      {!isActive && (
        <div className="mt-2 text-center text-sm text-slate-500">
          Waiting for all players to join...
        </div>
      )}
    </Card>
  );
}