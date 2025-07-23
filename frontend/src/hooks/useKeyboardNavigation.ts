import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcuts {
  'Escape'?: () => void;
  'Enter'?: () => void;
  'ArrowUp'?: () => void;
  'ArrowDown'?: () => void;
  'ArrowLeft'?: () => void;
  'ArrowRight'?: () => void;
  [key: string]: (() => void) | undefined;
}

export function useKeyboardNavigation(shortcuts: KeyboardShortcuts) {

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger if user is typing in an input or textarea
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    // Check for meta key combinations
    if (event.metaKey || event.ctrlKey) {
      return;
    }

    const handler = shortcuts[event.key];
    if (handler) {
      event.preventDefault();
      handler();
    }
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Global keyboard shortcuts for accessibility
export function useGlobalKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleGlobalKeys = (event: KeyboardEvent) => {
      // Alt + H: Go to home
      if (event.altKey && event.key === 'h') {
        event.preventDefault();
        navigate('/');
      }
      
      // Alt + D: Go to dashboard
      if (event.altKey && event.key === 'd') {
        event.preventDefault();
        navigate('/dashboard');
      }
      
      // Alt + M: Go to current match
      if (event.altKey && event.key === 'm') {
        event.preventDefault();
        const matchId = sessionStorage.getItem('currentMatchId');
        if (matchId) {
          navigate('/match');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [navigate]);
}