import { useCallback, useEffect, useMemo } from "react";
import { FiCheckCircle } from "react-icons/fi";
import { Card, Button } from "./ui";
import type { Identity } from "@shared/schemas";
import { useMyIdentity, useCurrentRound } from "@/store/server-state/match.queries";
import { useSubmitVote } from "@/store/server-state/match.mutations";
import { useUIStore } from "@/store/ui-state/ui.store";
import toast from "react-hot-toast";

interface HumanOrRobotProps {
  responses: Record<string, string>;
  presentationOrder?: Identity[];
}

export default function HumanOrRobot({
  responses,
  presentationOrder,
}: HumanOrRobotProps) {
  // Server state
  const myIdentity = useMyIdentity();
  const currentRound = useCurrentRound();
  const submitVote = useSubmitVote();
  
  // UI state - use individual selectors to avoid re-render issues
  const selectedResponse = useUIStore(state => state.selectedResponse);
  const setSelectedResponse = useUIStore(state => state.setSelectedResponse);
  const focusedIndex = useUIStore(state => state.focusedIndex);
  const setFocusedIndex = useUIStore(state => state.setFocusedIndex);
  const isKeyboardNavEnabled = useUIStore(state => state.isKeyboardNavEnabled);
  const soundEnabled = useUIStore(state => state.soundEnabled);

  const matchId = sessionStorage.getItem('currentMatchId');

  // Use server-provided presentation order if available
  const orderedResponses = useMemo(() => {
    const responseEntries = Object.entries(responses) as [Identity, string][];
    console.log('Presentation order from server:', presentationOrder);
    console.log('Available responses:', Object.keys(responses));
    console.log('Response count:', responseEntries.length);
    
    // If presentation order is incomplete or missing, use all responses in random order
    if (!presentationOrder || presentationOrder.length !== responseEntries.length) {
      console.warn(`Invalid presentation order (${presentationOrder?.length || 0} vs ${responseEntries.length} responses), using all responses`);
      // Use a stable sort based on identity to ensure consistent order
      const sorted = [...responseEntries].sort(([a], [b]) => a.localeCompare(b));
      console.log('Using sorted responses:', sorted.map(([id]) => id));
      return sorted;
    }
    
    return presentationOrder.map(identity => {
      const entry = responseEntries.find(([id]) => id === identity);
      return entry || [identity, ''] as [Identity, string];
    });
  }, [responses, presentationOrder]);

  // Filter out my own response for keyboard navigation
  const selectableResponses = orderedResponses.filter(([identity]) => identity !== myIdentity);

  const handleVote = useCallback(() => {
    if (!selectedResponse || !matchId || !myIdentity || !currentRound) return;

    submitVote.mutate(
      {
        matchId,
        voter: myIdentity,
        votedFor: selectedResponse,
        round: currentRound.roundNumber,
      },
      {
        onSuccess: () => {
          if (soundEnabled) {
            // Play success sound
            console.log('Playing vote success sound');
          }
          toast.success('Vote submitted!');
          setSelectedResponse(null);
        },
        onError: (error) => {
          toast.error('Failed to submit vote');
          console.error('Vote submission failed:', error);
        },
      }
    );
  }, [selectedResponse, matchId, myIdentity, currentRound, submitVote, soundEnabled, setSelectedResponse]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isKeyboardNavEnabled || selectableResponses.length === 0) return;

    switch (e.key) {
      case 'ArrowUp':
      case 'k':
        e.preventDefault();
        setFocusedIndex(Math.max(0, focusedIndex - 1));
        break;
      case 'ArrowDown':
      case 'j':
        e.preventDefault();
        setFocusedIndex(Math.min(selectableResponses.length - 1, focusedIndex + 1));
        break;
      case ' ': {
        e.preventDefault();
        const [identity] = selectableResponses[focusedIndex];
        setSelectedResponse(identity);
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (e.metaKey || e.ctrlKey) {
          // Cmd+Enter or Ctrl+Enter submits the vote if one is selected
          if (selectedResponse) {
            handleVote();
          }
        } else {
          // Plain Enter selects the focused response
          const [identity] = selectableResponses[focusedIndex];
          setSelectedResponse(identity);
        }
        break;
      }
      case 'v':
        if (selectedResponse) {
          e.preventDefault();
          handleVote();
        }
        break;
    }
  }, [isKeyboardNavEnabled, selectableResponses, focusedIndex, selectedResponse, handleVote, setFocusedIndex, setSelectedResponse]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Auto-focus first selectable response
  useEffect(() => {
    if (selectableResponses.length > 0 && focusedIndex >= selectableResponses.length) {
      setFocusedIndex(0);
    }
  }, [selectableResponses.length, focusedIndex, setFocusedIndex]);

  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Which response was written by a human?
          </h3>
          {isKeyboardNavEnabled && (
            <span className="text-xs text-slate-500">
              Use ↑↓ or j/k to navigate
            </span>
          )}
        </div>

        <div className="space-y-3">
          {orderedResponses.map(([identity, response], index) => {
            const isMyResponse = identity === myIdentity;
            const isSelected = selectedResponse === identity;
            const isFocused = !isMyResponse && 
              selectableResponses.findIndex(([id]) => id === identity) === focusedIndex;

            return (
              <div
                key={identity}
                className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${isMyResponse 
                    ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                    : isSelected
                    ? "bg-green-50 border-green-500 cursor-pointer"
                    : isFocused && isKeyboardNavEnabled
                    ? "bg-blue-50 border-blue-400 cursor-pointer"
                    : "bg-white border-slate-200 hover:border-slate-300 cursor-pointer"
                  }
                `}
                onClick={() => {
                  if (!isMyResponse) {
                    setSelectedResponse(identity);
                    const newIndex = selectableResponses.findIndex(([id]) => id === identity);
                    if (newIndex !== -1) setFocusedIndex(newIndex);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-sm font-medium text-slate-500">
                        Response {String.fromCharCode(65 + index)}
                      </div>
                      {isMyResponse && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Your response
                        </span>
                      )}
                      {isSelected && !isMyResponse && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 leading-relaxed break-words whitespace-pre-wrap">
                      {response || <span className="text-slate-400">...</span>}
                    </p>
                  </div>

                  {!isMyResponse && (
                    <div
                      className={`
                      ml-4 w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${
                        isSelected
                          ? "border-green-500 bg-green-500"
                          : "border-slate-300"
                      }
                    `}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-slate-600">
            {selectedResponse ? (
              <span>
                You think{" "}
                <span className="font-semibold">
                  Response {String.fromCharCode(65 + orderedResponses.findIndex(([id]) => id === selectedResponse))}
                </span>{" "}
                was written by a human
              </span>
            ) : (
              <span>Select the response you think was written by a human</span>
            )}
          </div>
          <Button
            onClick={handleVote}
            disabled={!selectedResponse || submitVote.isPending}
            className="flex items-center gap-2"
          >
            <FiCheckCircle size={16} />
            {submitVote.isPending ? 'Submitting...' : 'Submit Vote'}
          </Button>
        </div>

        {isKeyboardNavEnabled && (
          <div className="text-xs text-slate-500 text-center">
            Press <kbd className="px-1 py-0.5 bg-slate-100 rounded">Space</kbd> or{" "}
            <kbd className="px-1 py-0.5 bg-slate-100 rounded">Enter</kbd> to select,{" "}
            <kbd className="px-1 py-0.5 bg-slate-100 rounded">⌘+Enter</kbd> to vote
          </div>
        )}
      </div>
    </Card>
  );
}