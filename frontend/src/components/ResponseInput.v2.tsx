import { useState, useRef, useEffect } from 'react';
import { FiSend } from 'react-icons/fi';
import { Card, Button } from './ui';
import { useSubmitResponse } from '@/store/server-state/match.mutations';
import { useMyIdentity, useCurrentRound } from '@/store/server-state/match.queries';
import { useUIStore } from '@/store/ui-state/ui.store';

export default function ResponseInputV2() {
  const [response, setResponse] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Server state
  const myIdentity = useMyIdentity();
  const currentRound = useCurrentRound();
  const submitResponse = useSubmitResponse();
  
  // UI state
  const { setLocalTyping, animationsEnabled } = useUIStore();
  
  // Get match ID from session
  const matchId = sessionStorage.getItem('currentMatchId');

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = () => {
    const trimmedResponse = response.trim();
    if (!trimmedResponse || !matchId || !myIdentity || !currentRound) return;
    
    // Submit the response
    submitResponse.mutate(
      {
        matchId,
        identity: myIdentity,
        response: trimmedResponse,
        round: currentRound.roundNumber,
      },
      {
        onSuccess: () => {
          setResponse('');
          setLocalTyping(false);
        },
        onError: (error) => {
          console.error('Failed to submit response:', error);
          // Could show toast notification here
        },
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponse(e.target.value);
    setLocalTyping(e.target.value.length > 0);
  };

  const remainingChars = 280 - response.length;
  const isSubmitting = submitResponse.isPending;

  return (
    <Card className={animationsEnabled ? 'transition-all duration-200' : ''}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your Response</h3>
          {isSubmitting && (
            <span className="text-sm text-slate-500">Submitting...</span>
          )}
        </div>

        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={response}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            placeholder="Write your response... Let your humanity shine through!"
            className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-slate-50 placeholder-slate-500 disabled:opacity-50"
            maxLength={280}
            disabled={isSubmitting}
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
              disabled={!response.trim() || isSubmitting}
              className="flex items-center gap-2"
            >
              <FiSend size={16} />
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}