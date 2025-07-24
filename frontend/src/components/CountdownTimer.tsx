import { useEffect, useState } from 'react';
import { FiClock } from 'react-icons/fi';

interface CountdownTimerProps {
  duration: number; // seconds
  onExpire: () => void;
  isActive: boolean;
}

export default function CountdownTimer({ duration, onExpire, isActive }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [hasExpired, setHasExpired] = useState(false);

  // Reset timer when duration changes or when activated
  useEffect(() => {
    if (isActive) {
      setTimeRemaining(duration);
      setHasExpired(false);
    }
  }, [duration, isActive]);

  // Countdown logic
  useEffect(() => {
    if (!isActive || hasExpired || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setHasExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, hasExpired, timeRemaining]);

  // Handle expiration
  useEffect(() => {
    if (hasExpired && isActive) {
      onExpire();
    }
  }, [hasExpired, isActive, onExpire]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = ((duration - timeRemaining) / duration) * 100;
  
  // Determine color based on time remaining
  const getColor = () => {
    if (timeRemaining <= 10) return 'text-red-600 bg-red-50 border-red-200';
    if (timeRemaining <= 20) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const getProgressColor = () => {
    if (timeRemaining <= 10) return 'bg-red-500';
    if (timeRemaining <= 20) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  if (!isActive) return null;

  return (
    <div className={`rounded-lg border-2 p-3 transition-all duration-300 ${getColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FiClock className={`w-4 h-4 ${timeRemaining <= 10 ? 'animate-pulse' : ''}`} />
          <span className="text-sm font-medium">Time Remaining</span>
        </div>
        <span className={`text-lg font-bold ${timeRemaining <= 10 ? 'animate-pulse' : ''}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${getProgressColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {timeRemaining <= 10 && (
        <div className="mt-2 text-xs text-center font-medium animate-pulse">
          Hurry up! Time is running out!
        </div>
      )}
    </div>
  );
}