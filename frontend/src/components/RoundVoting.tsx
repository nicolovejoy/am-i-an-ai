'use client';

import { useState } from 'react';
import { useSessionStore, Identity } from '@/store/sessionStore';
import { Card, Button } from './ui';

interface RoundVotingProps {
  responses: Partial<Record<Identity, string>>;
}

export default function RoundVoting({ responses }: RoundVotingProps) {
  const [selectedIdentity, setSelectedIdentity] = useState<Identity | null>(null);
  const { submitVote, myIdentity, timeRemaining } = useSessionStore();

  const handleVote = () => {
    if (selectedIdentity) {
      submitVote(selectedIdentity);
    }
  };

  const isTimeRunningOut = timeRemaining !== null && timeRemaining < 10;
  const responseEntries = Object.entries(responses) as [Identity, string][];

  // Shuffle responses to avoid position bias
  const shuffledResponses = [...responseEntries].sort(() => Math.random() - 0.5);

  return (
    <Card>
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">🗳️ Time to Vote!</h3>
          <p className="text-slate-600">
            Which response sounds most human to you? Click to select, then confirm your vote.
          </p>
          {timeRemaining !== null && (
            <div className={`mt-3 text-sm font-mono px-3 py-1 rounded inline-block ${
              isTimeRunningOut ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {timeRemaining} seconds to vote
            </div>
          )}
        </div>

        <div className="space-y-4">
          {shuffledResponses.map(([identity, response], index) => {
            const isMyResponse = identity === myIdentity;
            const isSelected = selectedIdentity === identity;
            
            return (
              <div
                key={identity}
                className={`
                  relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                  ${isMyResponse 
                    ? 'border-blue-200 bg-blue-50 cursor-not-allowed opacity-60' 
                    : isSelected
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }
                `}
                onClick={() => {
                  if (!isMyResponse) {
                    setSelectedIdentity(identity);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
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
                    <p className="text-slate-800 leading-relaxed">
                      {response}
                    </p>
                  </div>
                  
                  {!isMyResponse && (
                    <div className={`
                      ml-4 w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${isSelected 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-slate-300'
                      }
                    `}>
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
            {selectedIdentity ? `Vote for Response ${
              String.fromCharCode(65 + shuffledResponses.findIndex(([id]) => id === selectedIdentity))
            }` : 'Select a response to vote'}
          </Button>
          
          {!selectedIdentity && (
            <p className="text-sm text-slate-500 text-center">
              Remember: You&apos;re trying to identify which response was written by another human
            </p>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm text-yellow-800">
            <strong>🧠 Voting Tips:</strong>
            <ul className="mt-2 space-y-1 text-yellow-700">
              <li>• Look for personal details and specific experiences</li>
              <li>• Notice natural language patterns and casual tone</li>
              <li>• Consider emotional authenticity and unique perspectives</li>
              <li>• Be aware that AI responses might be too perfect or generic</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}