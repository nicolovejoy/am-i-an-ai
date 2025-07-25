import { useEffect, useState } from 'react';
import { FiClock } from 'react-icons/fi';

interface CountdownTimerProps {
  duration: number; // seconds
  onExpire: () => void;
  isActive: boolean;
  initialTime?: number; // Optional: start from a specific time instead of duration
  onTimeUpdate?: (timeRemaining: number) => void; // Optional: callback to track time
}

export default function CountdownTimer({ duration, onExpire, isActive, initialTime, onTimeUpdate }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime ?? duration);
  const [hasExpired, setHasExpired] = useState(false);
  const [hasBeenActivated, setHasBeenActivated] = useState(false);

  // Initialize timer when first activated or when initialTime changes
  useEffect(() => {
    if (isActive && (!hasBeenActivated || initialTime !== undefined)) {
      setTimeRemaining(initialTime ?? duration);
      setHasExpired(false);
      setHasBeenActivated(true);
    }
  }, [duration, isActive, initialTime, hasBeenActivated]);

  // Countdown logic
  useEffect(() => {
    if (!isActive || hasExpired || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setHasExpired(true);
          return 0;
        }
        // Call the callback if provided
        if (onTimeUpdate) {
          onTimeUpdate(newTime);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, hasExpired, timeRemaining, onTimeUpdate]);

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