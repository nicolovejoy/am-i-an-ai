import { FiTrendingUp } from "react-icons/fi";
import type { Identity } from "@shared/schemas";

interface CompactScoreboardProps {
  scores: Record<Identity, number>;
  currentPlayer: Identity;
  roundNumber: number;
  totalRounds: number;
}

export default function CompactScoreboard({
  scores,
  currentPlayer,
  roundNumber,
  totalRounds,
}: CompactScoreboardProps) {
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
    <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Title and Round Progress */}
        <div className="flex items-center gap-3">
          <FiTrendingUp className="text-blue-600 w-4 h-4" />
          <div>
            <div className="text-sm font-medium text-slate-700">
              Round {roundNumber}/{totalRounds}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: totalRounds }, (_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i < roundNumber ? "bg-blue-500" : "bg-slate-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Center: Your Score */}
        <div className="text-center">
          <div className="text-xs text-slate-500">Your Score</div>
          <div className="text-xl font-bold text-blue-600">{playerScore}</div>
          <div className="text-xs text-slate-500">Rank #{playerRank}</div>
        </div>

        {/* Right: Compact Leaderboard */}
        <div className="flex items-center gap-2">
          {sortedScores.slice(0, 3).map(({ identity, score, rank }) => {
            const isCurrentPlayer = identity === currentPlayer;
            return (
              <div
                key={identity}
                className={`text-center px-2 py-1 rounded ${
                  isCurrentPlayer
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-slate-50'
                }`}
              >
                <div className="text-xs text-slate-500">
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                </div>
                <div className={`text-sm font-semibold ${
                  isCurrentPlayer ? 'text-blue-600' : 'text-slate-700'
                }`}>
                  {score}
                </div>
                <div className="text-xs text-slate-500">
                  {isCurrentPlayer ? 'You' : `P${identity}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}