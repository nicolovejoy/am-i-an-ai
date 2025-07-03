'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui';

interface GameHeaderProps {
  sessionMode: 'production' | 'testing';
  messageCount: number;
  timeRemaining: number; // in seconds
  participantCount: number;
  isActive: boolean;
}

export function GameHeader({ 
  sessionMode, 
  messageCount, 
  timeRemaining, 
  participantCount,
  isActive 
}: GameHeaderProps) {
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  useEffect(() => {
    if (!isActive || displayTime <= 0) return;

    const timer = setInterval(() => {
      setDisplayTime(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, displayTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionLimits = () => {
    if (sessionMode === 'testing') {
      return { timeLimit: 180, messageLimit: 10 }; // 3 min, 10 messages
    }
    return { timeLimit: 300, messageLimit: 20 }; // 5 min, 20 messages
  };

  const limits = getSessionLimits();
  const timeProgress = ((limits.timeLimit - displayTime) / limits.timeLimit) * 100;
  const messageProgress = (messageCount / limits.messageLimit) * 100;

  return (
    <Card className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-sm font-medium text-slate-600">Mode</div>
            <div className="text-lg font-bold text-slate-900">
              {sessionMode === 'testing' ? 'Testing' : 'Game'}
            </div>
            <div className="text-xs text-slate-500">
              {sessionMode === 'testing' ? '1H + 3AI' : '2H + 2AI'}
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm font-medium text-slate-600">Time</div>
            <div className={`text-lg font-bold ${displayTime <= 30 ? 'text-red-600' : 'text-slate-900'}`}>
              {formatTime(displayTime)}
            </div>
            <div className="w-16 bg-slate-200 rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all duration-1000 ${
                  timeProgress > 80 ? 'bg-red-500' : timeProgress > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, timeProgress)}%` }}
              />
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm font-medium text-slate-600">Messages</div>
            <div className={`text-lg font-bold ${messageCount >= limits.messageLimit - 2 ? 'text-red-600' : 'text-slate-900'}`}>
              {messageCount} / {limits.messageLimit}
            </div>
            <div className="w-16 bg-slate-200 rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all ${
                  messageProgress > 80 ? 'bg-red-500' : messageProgress > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, messageProgress)}%` }}
              />
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm font-medium text-slate-600">Participants</div>
            <div className="text-lg font-bold text-slate-900">
              {participantCount} / 4
            </div>
            <div className="text-xs text-slate-500">
              {participantCount < 4 ? 'Waiting...' : 'Ready!'}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className={`text-sm font-medium ${isActive ? 'text-green-600' : 'text-slate-500'}`}>
            {isActive ? '🟢 Active' : '⚪ Waiting'}
          </div>
        </div>
      </div>
    </Card>
  );
}