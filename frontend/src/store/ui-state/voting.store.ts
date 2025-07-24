import { create } from 'zustand';
import type { Identity } from '@shared/schemas';

interface VotingState {
  // Voting feedback state
  showFeedback: boolean;
  votedFor: Identity | null;
  correctAnswer: Identity | null;
  pointsEarned: number;
  totalScore: number;
  
  // Actions
  setVoteFeedback: (params: {
    votedFor: Identity;
    correctAnswer: Identity;
    pointsEarned: number;
    totalScore: number;
  }) => void;
  clearVoteFeedback: () => void;
}

export const useVotingStore = create<VotingState>((set) => ({
  // Initial state
  showFeedback: false,
  votedFor: null,
  correctAnswer: null,
  pointsEarned: 0,
  totalScore: 0,
  
  // Actions
  setVoteFeedback: (params) => set({
    showFeedback: true,
    ...params,
  }),
  
  clearVoteFeedback: () => set({
    showFeedback: false,
    votedFor: null,
    correctAnswer: null,
    pointsEarned: 0,
    totalScore: 0,
  }),
}));