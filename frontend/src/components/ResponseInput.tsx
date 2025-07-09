'use client';

import { useState, useRef, useEffect } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { Card, Button } from './ui';
import { FiSend } from 'react-icons/fi';

export default function PhraseComposer() {
  const [phrase, setPhrase] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { submitResponse } = useSessionStore();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    const trimmedPhrase = phrase.trim();
    if (!trimmedPhrase) return;
    
    submitResponse(trimmedPhrase);
    setPhrase('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const remainingChars = 280 - phrase.length;

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your Musical Phrase</h3>
        </div>

        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Compose your phrase... Express your human musicality!"
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
              disabled={!phrase.trim()}
              className="flex items-center gap-2"
            >
              <FiSend size={16} />
              Play Phrase
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-800">
            <strong>🎵 Tips for human musicality:</strong>
            <ul className="mt-2 space-y-1 text-blue-700">
              <li>• Share personal experiences and emotions</li>
              <li>• Include natural imperfections or casual language</li>
              <li>• Reference specific details or memories</li>
              <li>• Let your unique voice and perspective shine through</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}