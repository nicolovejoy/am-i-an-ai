import { Card } from "./ui";
import { FiTrendingUp, FiAward } from "react-icons/fi";
import type { Identity } from "@shared/schemas";

interface ScoreboardProps {
  scores: Record<Identity, number>;
  currentPlayer: Identity;
  roundNumber: number;
  totalRounds: number;
}

export default function Scoreboard({
  scores,
  currentPlayer,
  roundNumber,
  totalRounds,
}: ScoreboardProps) {
  // Sort players by score
  const sortedScores = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([identity, score], index) => ({
      identity: identity as Identity,
      score,
      rank: index + 1,
    }));

  const playerScore = scores[currentPlayer] || 0;
  const playerRank = sortedScores.findIndex(s => s.identity === currentPlayer) + 1;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FiTrendingUp className="text-blue-600" />
            Scoreboard
          </h3>
          <span className="text-sm text-slate-600">
            Round {roundNumber} of {totalRounds}
          </span>
        </div>

        {/* Player's Score Highlight */}
        <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-600">Your Score</div>
              <div className="text-2xl font-bold text-blue-600">{playerScore}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600">Rank</div>
              <div className="text-2xl font-bold text-slate-800">
                #{playerRank}
              </div>
            </div>
          </div>
        </div>

        {/* All Players */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-600">All Players</div>
          {sortedScores.map(({ identity, score, rank }) => {
            const isCurrentPlayer = identity === currentPlayer;
            return (
              <div
                key={identity}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isCurrentPlayer
                    ? 'bg-blue-100 border border-blue-300'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {rank === 1 && <FiAward className="text-yellow-500" />}
                  <span className={`font-medium ${
                    isCurrentPlayer ? 'text-blue-700' : 'text-slate-700'
                  }`}>
                    Participant {identity}
                    {isCurrentPlayer && ' (You)'}
                  </span>
                </div>
                <span className={`font-bold ${
                  isCurrentPlayer ? 'text-blue-600' : 'text-slate-800'
                }`}>
                  {score}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="pt-2">
          <div className="text-xs text-slate-600 mb-1">Match Progress</div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(roundNumber / totalRounds) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}