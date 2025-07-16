import { useState, useMemo, useEffect, useCallback } from "react";
import { useSessionStore, type Identity } from "@/store/sessionStore";
import { Card, Button } from "./ui";

interface HumanOrRobotProps {
  responses: Partial<Record<Identity, string>>;
  presentationOrder?: Identity[];
}

export default function HumanOrRobot({
  responses,
  presentationOrder,
}: HumanOrRobotProps) {
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(
    null
  );
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const { submitVote, myIdentity, currentPrompt } = useSessionStore();

  const responseEntries = Object.entries(responses) as [Identity, string][];

  // Use server-provided presentation order if available, otherwise fall back to original order
  const orderedResponses = useMemo(() => {
    try {
      if (presentationOrder && presentationOrder.length > 0) {
        console.log("Using presentation order:", presentationOrder);
        console.log("Available responses:", Object.keys(responses));

        // Use server-provided order - only include identities that have responses
        return presentationOrder
          .filter(identity => responses[identity])
          .map(
            (identity) => [identity, responses[identity]] as [Identity, string]
          );
      }
      // Fallback to alphabetical order if no presentation order provided
      return responseEntries.sort(([a], [b]) => a.localeCompare(b));
    } catch (error) {
      console.error("Error ordering responses:", error);
      // Return original entries if there's an error
      return responseEntries;
    }
  }, [responseEntries, presentationOrder, responses]);

  const handleVote = useCallback(() => {
    if (selectedIdentity) {
      submitVote(selectedIdentity);
    }
  }, [selectedIdentity, submitVote]);

  // Filter out my own response for keyboard navigation
  const selectableResponses = orderedResponses.filter(([identity]) => identity !== myIdentity);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (selectableResponses.length === 0) return;

    switch(e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : selectableResponses.length - 1
        );
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < selectableResponses.length - 1 ? prev + 1 : 0
        );
        break;
      case ' ':
      case 'Enter': {
        e.preventDefault();
        const focusedIdentity = selectableResponses[focusedIndex]?.[0];
        if (focusedIdentity) {
          if (e.key === ' ') {
            setSelectedIdentity(focusedIdentity);
          } else if (e.key === 'Enter' && selectedIdentity) {
            handleVote();
          }
        }
        break;
      }
      case 'Tab': {
        // Let Tab work naturally but update our focused index
        const newIndex = e.shiftKey 
          ? (focusedIndex > 0 ? focusedIndex - 1 : selectableResponses.length - 1)
          : (focusedIndex < selectableResponses.length - 1 ? focusedIndex + 1 : 0);
        setFocusedIndex(newIndex);
        break;
      }
    }
  }, [selectableResponses, focusedIndex, selectedIdentity, handleVote]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Guard against invalid responses
  if (!responses || Object.keys(responses).length === 0) {
    return (
      <Card>
        <div className="text-center p-6">
          <p className="text-slate-600">Waiting for responses...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">🤖 Human or Robot?</h3>
          <p className="text-slate-600">
            Which response was written by a human? Can you spot the human among the robots?
          </p>
        </div>

        {currentPrompt && (
          <div className="bg-slate-100 p-4 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-1">The prompt was:</p>
            <p className="text-slate-900 italic">"{currentPrompt}"</p>
          </div>
        )}

        <div className="space-y-4">
          {orderedResponses.map(([identity, response], index) => {
            const isMyResponse = identity === myIdentity;
            const isSelected = selectedIdentity === identity;
            const selectableIndex = selectableResponses.findIndex(([id]) => id === identity);
            const isFocused = !isMyResponse && selectableIndex === focusedIndex;

            return (
              <div
                key={identity}
                tabIndex={isMyResponse ? -1 : 0}
                className={`
                  relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                  ${
                    isMyResponse
                      ? "border-blue-200 bg-blue-50 cursor-not-allowed opacity-60"
                      : isSelected
                      ? "border-green-500 bg-green-50 shadow-md"
                      : isFocused
                      ? "border-blue-400 bg-blue-50 shadow-sm ring-2 ring-blue-400 ring-offset-2"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }
                `}
                onClick={() => {
                  if (!isMyResponse) {
                    setSelectedIdentity(identity);
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

        <div className="flex flex-col items-center gap-4">
          <Button
            onClick={handleVote}
            disabled={!selectedIdentity}
            size="lg"
            className="w-full sm:w-auto"
          >
            {selectedIdentity
              ? `Vote: Response ${String.fromCharCode(
                  65 +
                    orderedResponses.findIndex(
                      ([id]) => id === selectedIdentity
                    )
                )} is Human`
              : "Select a response to vote"}
          </Button>

          {!selectedIdentity && (
            <p className="text-sm text-slate-500 text-center">
              Find the response written by the real human player
            </p>
          )}
          <p className="text-xs text-slate-400 text-center">
            Use ← → arrows to navigate • Space to select • Enter to vote
          </p>
        </div>
      </div>
    </Card>
  );
}