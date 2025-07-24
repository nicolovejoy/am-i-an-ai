import { useState, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiEdit3 } from 'react-icons/fi';
import { Card, Button } from './ui';
import { useSubmitResponse } from '@/store/server-state/match.mutations';
import { useMyIdentity, useCurrentRound, useMatch } from '@/store/server-state/match.queries';
import { useUIStore } from '@/store/ui-state/ui.store';
import { useGrammarCorrection } from '@/hooks/useGrammarCorrection';
import CorrectionPreview from './CorrectionPreview';
import CountdownTimer from './CountdownTimer';

export default function ResponseInputV2() {
  const [response, setResponse] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [correctionResult, setCorrectionResult] = useState<{
    corrected: string;
    changes: Array<{ original: string; corrected: string; type: string }>;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Server state
  const myIdentity = useMyIdentity();
  const currentRound = useCurrentRound();
  const { data: match } = useMatch(sessionStorage.getItem('currentMatchId'));
  const submitResponse = useSubmitResponse();
  const grammarCorrection = useGrammarCorrection();
  
  // UI state - use individual selectors
  const setLocalTyping = useUIStore(state => state.setLocalTyping);
  const animationsEnabled = useUIStore(state => state.animationsEnabled);
  
  // Get match ID from session
  const matchId = sessionStorage.getItem('currentMatchId');
  
  // Timer configuration
  const timeLimit = match?.responseTimeLimit || 30; // Default 30 seconds

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmedResponse = response.trim();
    if (!matchId || !myIdentity || !currentRound) return;
    
    // Submit even if empty (when timer expires)
    const finalResponse = trimmedResponse || '(No response)';
    
    // Submit the response
    submitResponse.mutate(
      {
        matchId,
        identity: myIdentity,
        response: finalResponse,
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
  }, [response, matchId, myIdentity, currentRound, submitResponse, setLocalTyping]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  const handlePolish = async () => {
    const trimmedResponse = response.trim();
    if (!trimmedResponse) return;
    
    try {
      const result = await grammarCorrection.mutateAsync({
        text: trimmedResponse,
        preserveStyle: true
      });
      
      setCorrectionResult(result);
      setShowPreview(true);
    } catch (error) {
      console.error('Grammar correction failed:', error);
      // Could show a toast notification here
    }
  };
  
  const acceptCorrection = () => {
    if (correctionResult) {
      setResponse(correctionResult.corrected);
      textareaRef.current?.focus();
    }
  };
  
  const rejectCorrection = () => {
    textareaRef.current?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponse(e.target.value);
    setLocalTyping(e.target.value.length > 0);
  };

  const remainingChars = 150 - response.length;
  const isSubmitting = submitResponse.isPending;

  return (
    <>
      <Card className={animationsEnabled ? 'transition-all duration-200' : ''}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your Response</h3>
          {isSubmitting && (
            <span className="text-sm text-slate-500">Submitting...</span>
          )}
        </div>
        
        {/* Countdown Timer */}
        <CountdownTimer
          duration={timeLimit}
          onExpire={handleSubmit}
          isActive={!isSubmitting}
        />

        <div className="space-y-3">
          <textarea
            ref={textareaRef}
            value={response}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            placeholder="Write a short response... Be authentic!"
            className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 bg-slate-50 placeholder-slate-500 disabled:opacity-50"
            maxLength={150}
            disabled={isSubmitting}
          />
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-slate-500">
              <span className={remainingChars < 20 ? 'text-orange-600' : ''}>
                {remainingChars} characters remaining
              </span>
              <span className="ml-4 text-slate-400 hidden sm:inline">
                Tip: ⌘/Ctrl + Enter to submit
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handlePolish}
                disabled={!response.trim() || grammarCorrection.isPending}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <FiEdit3 size={16} />
                Polish
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!response.trim() || isSubmitting}
                className="flex items-center justify-center gap-2 flex-1 sm:flex-initial"
              >
                <FiSend size={16} />
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      </Card>
      
      {correctionResult && (
        <CorrectionPreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          original={response}
          corrected={correctionResult.corrected}
          changes={correctionResult.changes}
          onAccept={acceptCorrection}
          onReject={rejectCorrection}
        />
      )}
    </>
  );
}