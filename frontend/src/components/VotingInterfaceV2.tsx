'use client';

import { useState } from 'react';
import { Card, Button } from './ui';
import { PLAYER_CONFIG } from '../config/playerConfig';

interface Player {
  playerNumber: 1 | 2 | 3 | 4;
  identity: 'A' | 'B' | 'C' | 'D';
  messageCount: number;
}

interface VotingInterfaceV2Props {
  players: Player[];
  myPlayerNumber: 1 | 2 | 3 | 4;
  onSubmitVote: (selectedPlayerNumbers: number[]) => void;
  sessionMode: 'production' | 'testing';
}

export function VotingInterfaceV2({ 
  players, 
  myPlayerNumber, 
  onSubmitVote,
  sessionMode 
}: VotingInterfaceV2Props) {
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Filter out current player from voting options
  const votablePlayers = players.filter(p => p.playerNumber !== myPlayerNumber);
  const expectedAICount = sessionMode === 'testing' ? 3 : 2;

  const toggleSelection = (playerNumber: number) => {
    if (hasSubmitted) return;

    setSelectedPlayers(prev => {
      if (prev.includes(playerNumber)) {
        return prev.filter(num => num !== playerNumber);
      } else {
        return [...prev, playerNumber];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedPlayers.length === 0) return;
    
    setHasSubmitted(true);
    onSubmitVote(selectedPlayers);
  };

  const getSelectionStyle = (playerNumber: number) => {
    const config = PLAYER_CONFIG[playerNumber as 1 | 2 | 3 | 4];
    if (!selectedPlayers.includes(playerNumber)) return {};
    
    return {
      borderColor: config.color,
      borderWidth: '3px',
      backgroundColor: config.bgColor,
      transform: 'scale(1.05)'
    };
  };

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          🤖 Who Are The AIs?
        </h2>
        <p className="text-slate-600">
          Vote for the players you think are AI
          {sessionMode === 'testing' ? ' (Select 3 players)' : ' (Select 2 players)'}
        </p>
        <div className="mt-2 inline-flex items-center space-x-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: PLAYER_CONFIG[myPlayerNumber].color }}
          >
            {myPlayerNumber}
          </div>
          <span className="text-sm text-slate-600">
            You are <strong>Player {myPlayerNumber}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {votablePlayers.map((player) => {
          const config = PLAYER_CONFIG[player.playerNumber];
          const isSelected = selectedPlayers.includes(player.playerNumber);
          
          return (
            <button
              key={player.playerNumber}
              onClick={() => toggleSelection(player.playerNumber)}
              disabled={hasSubmitted}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${hasSubmitted ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}
              `}
              style={{
                borderColor: isSelected ? config.color : config.borderColor,
                backgroundColor: isSelected ? config.bgColor : 'white',
                borderWidth: isSelected ? '3px' : '2px',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: config.color }}
                  >
                    {player.playerNumber}
                  </div>
                  <span className="font-semibold text-slate-900">
                    Player {player.playerNumber}
                  </span>
                </div>
                {isSelected && (
                  <span 
                    className="text-2xl font-bold"
                    style={{ color: config.color }}
                  >
                    ✓
                  </span>
                )}
              </div>
              <div className="text-sm text-slate-600">
                {player.messageCount} messages sent
              </div>
              {isSelected && (
                <div 
                  className="text-xs font-medium mt-1"
                  style={{ color: config.color }}
                >
                  Selected as AI
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="text-center">
        <div className="mb-4">
          <span className="text-sm text-slate-600">
            Selected: {selectedPlayers.length} / {expectedAICount}
          </span>
        </div>

        {!hasSubmitted ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedPlayers.length === 0}
            variant="primary"
            size="lg"
          >
            {selectedPlayers.length === 0 
              ? 'Select players to vote' 
              : `Submit Vote (${selectedPlayers.length} selected)`}
          </Button>
        ) : (
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <span className="text-lg">✓</span>
            <span className="font-medium">Vote submitted! Waiting for results...</span>
          </div>
        )}
      </div>

      {selectedPlayers.length > expectedAICount && !hasSubmitted && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-yellow-800 text-sm">
            💡 Tip: There are only {expectedAICount} AIs in this session. 
            You&apos;ve selected {selectedPlayers.length} players.
          </p>
        </div>
      )}
    </Card>
  );
}