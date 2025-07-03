'use client';

import { useState, useRef, useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { Card, Button } from './ui';
import { FiSend } from 'react-icons/fi';

export default function ResponseInput() {
  const [response, setResponse] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { submitResponse, timeRemaining } = useSessionStore();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    const trimmedResponse = response.trim();
    if (!trimmedResponse) return;
    
    submitResponse(trimmedResponse);
    setResponse('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const remainingChars = 280 - response.length;
  const isTimeRunningOut = timeRemaining !== null && timeRemaining < 30;

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your Response</h3>
          {timeRemaining !== null && (
            <div className={`text-sm font-mono px-3 py-1 rounded ${
              isTimeRunningOut ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')} remaining
            </div>
          )}
        </div>

        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your response here... Be creative and human!"
            className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-slate-50 placeholder-slate-500"
            maxLength={280}
          />
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              <span className={remainingChars < 20 ? 'text-orange-600' : ''}>
                {remainingChars} characters remaining
              </span>
              <span className="ml-4 text-slate-400">
                Tip: ⌘/Ctrl + Enter to submit
              </span>
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={!response.trim()}
              className="flex items-center gap-2"
            >
              <FiSend size={16} />
              Submit Response
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800">
            <strong>💡 Tips for sounding human:</strong>
            <ul className="mt-2 space-y-1 text-blue-700">
              <li>• Use personal experiences and emotions</li>
              <li>• Include small imperfections or casual language</li>
              <li>• Reference specific details or memories</li>
              <li>• Show your personality and unique perspective</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}