import type { Round, Identity } from '@shared/schemas';

export function calculateCumulativeScores(rounds: Round[]): Record<Identity, number> {
  const cumulativeScores: Record<string, number> = {};
  
  for (const round of rounds) {
    if (round.scores) {
      for (const [participant, score] of Object.entries(round.scores)) {
        cumulativeScores[participant] = (cumulativeScores[participant] || 0) + (score as number);
      }
    }
  }
  
  return cumulativeScores as Record<Identity, number>;
}