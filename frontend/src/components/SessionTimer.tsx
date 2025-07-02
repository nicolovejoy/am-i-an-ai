'use client';

import { useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';

export default function SessionTimer() {
  const { timeRemaining, isSessionActive, updateTimer } = useSessionStore();

  useEffect(() => {
    if (!isSessionActive || timeRemaining === null) return;

    const interval = setInterval(() => {
      const newTime = Math.max(0, timeRemaining - 1);
      updateTimer(newTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, isSessionActive, updateTimer]);

  if (!isSessionActive || timeRemaining === null) {
    return null;
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining > 300) return 'text-green-600'; // > 5 minutes
    if (timeRemaining > 120) return 'text-yellow-600'; // > 2 minutes
    return 'text-red-600'; // < 2 minutes
  };

  const getProgressWidth = () => {
    const totalTime = 600; // 10 minutes
    return Math.max(0, (timeRemaining / totalTime) * 100);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <div className="text-xs text-gray-500">Time remaining</div>
        <div className={`text-sm font-mono font-bold ${getTimeColor()}`}>
          {formatTime(timeRemaining)}
        </div>
      </div>
      
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${
            timeRemaining > 300 ? 'bg-green-500' :
            timeRemaining > 120 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${getProgressWidth()}%` }}
        />
      </div>
    </div>
  );
}