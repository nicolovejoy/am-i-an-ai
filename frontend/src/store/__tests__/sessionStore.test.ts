import { act, renderHook } from '@testing-library/react';
import { useSessionStore } from '../sessionStore';

describe('sessionStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    const { result } = renderHook(() => useSessionStore());
    act(() => {
      result.current.reset();
    });
    jest.clearAllMocks();
  });

  describe('Identity Assignment', () => {
    it('should assign identities based on match participants', () => {
      const { result } = renderHook(() => useSessionStore());
      
      // Create a mock match
      const mockMatch = {
        matchId: 'test-match-123',
        status: 'round_active' as const,
        currentRound: 1,
        totalRounds: 5,
        participants: [
          { identity: 'A' as const, isAI: false, isConnected: true },
          { identity: 'B' as const, isAI: true, isConnected: true },
          { identity: 'C' as const, isAI: true, isConnected: true },
          { identity: 'D' as const, isAI: true, isConnected: true },
        ],
        rounds: [{
          roundNumber: 1,
          prompt: 'What sound does loneliness make?',
          responses: {},
          votes: {},
          scores: {},
          status: 'responding' as const,
        }],
      };
      
      act(() => {
        result.current.setMatch(mockMatch);
        result.current.setMyIdentity('A');
      });
      
      expect(result.current.myIdentity).toBe('A');
      expect(result.current.match).toEqual(mockMatch);
    });
  });

  describe('Match State Management', () => {
    it('should update match state correctly', () => {
      const { result } = renderHook(() => useSessionStore());
      
      const mockMatch = {
        matchId: 'test-match-123',
        status: 'round_active' as const,
        currentRound: 1,
        totalRounds: 5,
        participants: [
          { identity: 'A' as const, isAI: false, isConnected: true },
          { identity: 'B' as const, isAI: true, isConnected: true },
          { identity: 'C' as const, isAI: true, isConnected: true },
          { identity: 'D' as const, isAI: true, isConnected: true },
        ],
        rounds: [{
          roundNumber: 1,
          prompt: 'What sound does loneliness make?',
          responses: {},
          votes: {},
          scores: {},
          status: 'responding' as const,
        }],
      };
      
      act(() => {
        result.current.setMatch(mockMatch);
      });
      
      expect(result.current.match).toEqual(mockMatch);
      expect(result.current.connectionStatus).toBe('connected');
    });

    it('should handle match not found correctly', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.setMatch(null);
        result.current.setLastError('Match not found');
        result.current.setConnectionStatus('error');
      });
      
      expect(result.current.match).toBeNull();
      expect(result.current.lastError).toBe('Match not found');
      expect(result.current.connectionStatus).toBe('error');
    });
  });

  describe('Response Submission', () => {
    it('should update match with new response', () => {
      const { result } = renderHook(() => useSessionStore());
      
      const mockMatch = {
        matchId: 'test-match-123',
        status: 'round_active' as const,
        currentRound: 1,
        totalRounds: 5,
        participants: [
          { identity: 'A' as const, isAI: false, isConnected: true },
          { identity: 'B' as const, isAI: true, isConnected: true },
          { identity: 'C' as const, isAI: true, isConnected: true },
          { identity: 'D' as const, isAI: true, isConnected: true },
        ],
        rounds: [{
          roundNumber: 1,
          prompt: 'What sound does loneliness make?',
          responses: {},
          votes: {},
          scores: {},
          status: 'responding' as const,
        }],
      };
      
      act(() => {
        result.current.setMatch(mockMatch);
        result.current.setMyIdentity('A');
      });
      
      // Simulate submitting a response
      act(() => {
        result.current.submitResponse('The echo of empty rooms');
      });
      
      expect(result.current.match?.rounds[0].responses['A']).toBe('The echo of empty rooms');
    });
  });

  describe('Vote Submission', () => {
    it('should update match with new vote', () => {
      const { result } = renderHook(() => useSessionStore());
      
      const mockMatch = {
        matchId: 'test-match-123',
        status: 'round_voting' as const,
        currentRound: 1,
        totalRounds: 5,
        participants: [
          { identity: 'A' as const, isAI: false, isConnected: true },
          { identity: 'B' as const, isAI: true, isConnected: true },
          { identity: 'C' as const, isAI: true, isConnected: true },
          { identity: 'D' as const, isAI: true, isConnected: true },
        ],
        rounds: [{
          roundNumber: 1,
          prompt: 'What sound does loneliness make?',
          responses: {
            A: 'The echo of empty rooms',
            B: 'Like whispers in the twilight',
            C: 'Approximately 42 decibels',
            D: 'Like a disco ball made of butterflies!',
          },
          votes: {},
          scores: {},
          status: 'voting' as const,
        }],
      };
      
      act(() => {
        result.current.setMatch(mockMatch);
        result.current.setMyIdentity('A');
      });
      
      // Simulate submitting a vote
      act(() => {
        result.current.submitVote('B');
      });
      
      expect(result.current.match?.rounds[0].votes['A']).toBe('B');
    });
  });

  describe('Robot Response Display', () => {
    it('should display robot responses when status is voting', () => {
      const { result } = renderHook(() => useSessionStore());
      
      const mockMatch = {
        matchId: 'test-match-123',
        status: 'round_voting' as const,
        currentRound: 1,
        totalRounds: 5,
        participants: [
          { identity: 'A' as const, isAI: false, isConnected: true },
          { identity: 'B' as const, isAI: true, isConnected: true },
          { identity: 'C' as const, isAI: true, isConnected: true },
          { identity: 'D' as const, isAI: true, isConnected: true },
        ],
        rounds: [{
          roundNumber: 1,
          prompt: 'What sound does loneliness make?',
          responses: {
            A: 'The echo of empty rooms',
            B: 'Like whispers in the twilight',
            C: 'Approximately 42 decibels',
            D: 'Like a disco ball made of butterflies!',
          },
          votes: {},
          scores: {},
          status: 'voting' as const,
        }],
      };
      
      act(() => {
        result.current.setMatch(mockMatch);
      });
      
      const currentRound = result.current.match?.rounds[0];
      expect(currentRound?.responses).toEqual({
        A: 'The echo of empty rooms',
        B: 'Like whispers in the twilight',
        C: 'Approximately 42 decibels',
        D: 'Like a disco ball made of butterflies!',
      });
      expect(Object.keys(currentRound?.responses || {}).length).toBe(4);
    });

    it('should display robot responses even when status is responding', () => {
      const { result } = renderHook(() => useSessionStore());
      
      const mockMatch = {
        matchId: 'test-match-123',
        status: 'round_active' as const,
        currentRound: 1,
        totalRounds: 5,
        participants: [
          { identity: 'A' as const, isAI: false, isConnected: true },
          { identity: 'B' as const, isAI: true, isConnected: true },
          { identity: 'C' as const, isAI: true, isConnected: true },
          { identity: 'D' as const, isAI: true, isConnected: true },
        ],
        rounds: [{
          roundNumber: 1,
          prompt: 'What sound does loneliness make?',
          responses: {
            A: 'The echo of empty rooms',
            B: 'Like whispers in the twilight',
            C: 'Approximately 42 decibels',
            D: 'Like a disco ball made of butterflies!',
          },
          votes: {},
          scores: {},
          status: 'responding' as const, // Still responding but all responses are in
        }],
      };
      
      act(() => {
        result.current.setMatch(mockMatch);
      });
      
      // The frontend should still be able to access all responses
      const currentRound = result.current.match?.rounds[0];
      expect(currentRound?.responses).toEqual({
        A: 'The echo of empty rooms',
        B: 'Like whispers in the twilight',
        C: 'Approximately 42 decibels',
        D: 'Like a disco ball made of butterflies!',
      });
    });
  });

  describe('Typing Indicators', () => {
    it('should show typing indicators for AI participants', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.setTypingParticipants(['B', 'C']);
      });
      
      expect(result.current.typingParticipants).toEqual(['B', 'C']);
    });

    it('should clear typing indicators when responses arrive', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.setTypingParticipants(['B', 'C', 'D']);
      });
      
      expect(result.current.typingParticipants).toEqual(['B', 'C', 'D']);
      
      act(() => {
        result.current.setTypingParticipants([]);
      });
      
      expect(result.current.typingParticipants).toEqual([]);
    });
  });

  describe('Match Completion', () => {
    it('should handle match completion after round 5', () => {
      const { result } = renderHook(() => useSessionStore());
      
      const mockMatch = {
        matchId: 'test-match-123',
        status: 'completed' as const,
        currentRound: 5,
        totalRounds: 5,
        participants: [
          { identity: 'A' as const, isAI: false, isConnected: true },
          { identity: 'B' as const, isAI: true, isConnected: true },
          { identity: 'C' as const, isAI: true, isConnected: true },
          { identity: 'D' as const, isAI: true, isConnected: true },
        ],
        rounds: Array(5).fill(null).map((_, i) => ({
          roundNumber: i + 1,
          prompt: 'Test prompt',
          responses: {
            A: 'Human response',
            B: 'Robot B response',
            C: 'Robot C response',
            D: 'Robot D response',
          },
          votes: {
            A: 'B',
            B: 'C',
            C: 'D',
            D: 'A',
          },
          scores: {
            A: 0,
            B: 1,
            C: 1,
            D: 1,
          },
          status: 'complete' as const,
        })),
      };
      
      act(() => {
        result.current.setMatch(mockMatch);
      });
      
      expect(result.current.match?.status).toBe('completed');
      expect(result.current.match?.currentRound).toBe(5);
      expect(result.current.match?.rounds.length).toBe(5);
    });
  });

  describe('Store Reset', () => {
    it('should reset all state when reset is called', () => {
      const { result } = renderHook(() => useSessionStore());
      
      const mockMatch = {
        matchId: 'test-match-123',
        status: 'round_active' as const,
        currentRound: 1,
        totalRounds: 5,
        participants: [
          { identity: 'A' as const, isAI: false, isConnected: true },
          { identity: 'B' as const, isAI: true, isConnected: true },
          { identity: 'C' as const, isAI: true, isConnected: true },
          { identity: 'D' as const, isAI: true, isConnected: true },
        ],
        rounds: [{
          roundNumber: 1,
          prompt: 'What sound does loneliness make?',
          responses: {},
          votes: {},
          scores: {},
          status: 'responding' as const,
        }],
      };
      
      act(() => {
        result.current.setMatch(mockMatch);
        result.current.setMyIdentity('A');
        result.current.setConnectionStatus('connected');
        result.current.setTypingParticipants(['B', 'C']);
      });
      
      expect(result.current.match).not.toBeNull();
      expect(result.current.myIdentity).toBe('A');
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.match).toBeNull();
      expect(result.current.myIdentity).toBeNull();
      expect(result.current.connectionStatus).toBe('disconnected');
      expect(result.current.typingParticipants).toEqual([]);
    });
  });

  describe('Voting Stability', () => {
    it('should maintain stable voting order for responses', () => {
      const { result } = renderHook(() => useSessionStore());
      
      const mockMatch = {
        matchId: 'test-match-123',
        status: 'round_voting' as const,
        currentRound: 1,
        totalRounds: 5,
        participants: [
          { identity: 'A' as const, isAI: false, isConnected: true },
          { identity: 'B' as const, isAI: true, isConnected: true },
          { identity: 'C' as const, isAI: true, isConnected: true },
          { identity: 'D' as const, isAI: true, isConnected: true },
        ],
        rounds: [{
          roundNumber: 1,
          prompt: 'What sound does loneliness make?',
          responses: {
            A: 'The echo of empty rooms',
            B: 'Like whispers in the twilight',
            C: 'Approximately 42 decibels',
            D: 'Like a disco ball made of butterflies!',
          },
          votes: {},
          scores: {},
          status: 'voting' as const,
        }],
      };
      
      act(() => {
        result.current.setMatch(mockMatch);
      });
      
      // Get responses in order
      const responses = result.current.match?.rounds[0].responses;
      const orderedIdentities = ['A', 'B', 'C', 'D'] as const;
      const orderedResponses = orderedIdentities.map(id => ({
        identity: id,
        response: responses?.[id] || '',
      }));
      
      // Verify order is maintained
      expect(orderedResponses[0].identity).toBe('A');
      expect(orderedResponses[1].identity).toBe('B');
      expect(orderedResponses[2].identity).toBe('C');
      expect(orderedResponses[3].identity).toBe('D');
      
      // Simulate updating the match (as would happen with polling)
      act(() => {
        result.current.setMatch({
          ...mockMatch,
          rounds: [{
            ...mockMatch.rounds[0],
            votes: { A: 'B' }, // Add a vote
          }],
        });
      });
      
      // Verify order is still maintained
      const updatedResponses = result.current.match?.rounds[0].responses;
      const updatedOrderedResponses = orderedIdentities.map(id => ({
        identity: id,
        response: updatedResponses?.[id] || '',
      }));
      
      expect(updatedOrderedResponses).toEqual(orderedResponses);
    });
  });
});