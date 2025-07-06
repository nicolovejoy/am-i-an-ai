import { act, renderHook } from '@testing-library/react';
import { useSessionStore } from '../sessionStore';
import { mockAIService } from '@/services/mockAI';

// Mock the mockAIService
jest.mock('@/services/mockAI', () => ({
  mockAIService: {
    initializeAIs: jest.fn(),
    scheduleAIResponses: jest.fn(),
    clearAllTimers: jest.fn(),
  }
}));

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
    it('should assign identities randomly (not always A)', () => {
      const identities = [];
      
      // Mock Math.random to return different values  
      const mockRandom = jest.spyOn(Math, 'random');
      mockRandom
        .mockReturnValueOnce(0.8) // D (3)
        .mockReturnValueOnce(0.2) // A (0)
        .mockReturnValueOnce(0.5) // C (2)
        .mockReturnValueOnce(0.1); // A (0)
      
      for (let i = 0; i < 4; i++) {
        const { result } = renderHook(() => useSessionStore());
        
        act(() => {
          result.current.reset();
        });
        
        act(() => {
          result.current.startTestingMode();
        });
        
        identities.push(result.current.myIdentity || '');
      }
      
      console.log('Assigned identities:', identities);
      console.log('Unique identities:', new Set(identities));
      
      // Check that we got different identities
      const uniqueIdentities = new Set(identities);
      expect(uniqueIdentities.size).toBeGreaterThan(1);
      expect(identities).toEqual(['D', 'A', 'C', 'A']);
      
      mockRandom.mockRestore();
    });

    it('should maintain identity mapping consistency across the session', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.startTestingMode();
      });
      
      const initialMapping = result.current.identityMapping;
      
      // Send some messages
      act(() => {
        result.current.sendMessage('Test message 1');
      });
      
      act(() => {
        result.current.sendMessage('Test message 2');
      });
      
      // Mapping should remain the same
      expect(result.current.identityMapping).toEqual(initialMapping);
    });
  });

  describe('Testing Mode', () => {
    it('should initialize with human as random identity and AIs as others in testing mode', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.startTestingMode();
      });
      
      expect(result.current.testingMode).toBe(true);
      expect(result.current.myIdentity).toMatch(/^[ABCD]$/); // Random identity
      expect(result.current.match?.participants).toHaveLength(4);
      expect(result.current.match?.participants.some(p => p.identity === 'A')).toBe(true);
      expect(result.current.match?.participants.some(p => p.identity === 'B')).toBe(true);
      expect(result.current.match?.participants.some(p => p.identity === 'C')).toBe(true);
      expect(result.current.match?.participants.some(p => p.identity === 'D')).toBe(true);
    });

    it('should handle messages locally in testing mode', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.startTestingMode();
      });
      
      act(() => {
        result.current.sendMessage('Hello everyone!');
      });
      
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].sender).toBe(result.current.myIdentity);
      expect(result.current.messages[0].content).toBe('Hello everyone!');
      expect(mockAIService.scheduleAIResponses).toHaveBeenCalledWith(
        'Hello everyone!',
        expect.any(Function),
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('should set connected status in testing mode', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.startTestingMode();
      });
      
      expect(result.current.connectionStatus).toBe('connected');
      expect(result.current.isSessionActive).toBe(true);
    });
  });

  describe('Legacy Methods', () => {
    it('should delegate connect() to startTestingMode()', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.connect();
      });
      
      expect(result.current.testingMode).toBe(true);
      expect(result.current.connectionStatus).toBe('connected');
    });

    it('should reset state on disconnect()', () => {
      const { result } = renderHook(() => useSessionStore());
      
      // Set up some state
      act(() => {
        result.current.startTestingMode();
      });
      
      act(() => {
        result.current.disconnect();
      });
      
      expect(result.current.testingMode).toBe(false);
      expect(result.current.connectionStatus).toBe('disconnected');
      expect(result.current.myIdentity).toBeNull();
    });
  });

  describe('Response and Vote Submission', () => {
    it('should handle response submission in testing mode', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.startTestingMode();
      });
      
      act(() => {
        result.current.submitResponse('My test response');
      });
      
      expect(result.current.myResponse).toBe('My test response');
      expect(result.current.hasSubmittedResponse).toBe(true);
    });

    it('should handle vote submission', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.startTestingMode();
      });
      
      act(() => {
        result.current.submitVote('B');
      });
      
      expect(result.current.hasSubmittedVote).toBe(true);
    });

    it('should log when not in testing mode for response submission', () => {
      const { result } = renderHook(() => useSessionStore());
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      act(() => {
        result.current.submitResponse('Test response');
      });
      
      expect(consoleSpy).toHaveBeenCalledWith('Not in testing mode - response submission not implemented');
      expect(result.current.myResponse).toBe('Test response');
      expect(result.current.hasSubmittedResponse).toBe(true);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Typing Indicators', () => {
    it('should update typing participants', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.startTestingMode();
      });
      
      act(() => {
        result.current.sendMessage('Test message');
      });
      
      // Simulate AI typing through the scheduled callback
      const scheduleCall = (mockAIService.scheduleAIResponses as jest.Mock).mock.calls[0];
      if (scheduleCall) {
        const [, onTypingStart, onTypingEnd] = scheduleCall;
        
        act(() => {
          onTypingStart('B');
        });
        
        expect(result.current.typingParticipants.has('B')).toBe(true);
        
        act(() => {
          onTypingEnd('B');
        });
        
        expect(result.current.typingParticipants.has('B')).toBe(false);
      }
    });
  });

  describe('Timer Management', () => {
    it('should update timer and mark session inactive when time runs out', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.startTestingMode();
      });
      
      expect(result.current.isSessionActive).toBe(true);
      
      act(() => {
        result.current.updateTimer(0);
      });
      
      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isSessionActive).toBe(false);
    });
  });

  describe('Store Reset', () => {
    it('should reset state properly', () => {
      const { result } = renderHook(() => useSessionStore());
      
      // Set up some state
      act(() => {
        result.current.startTestingMode();
        result.current.sendMessage('Test');
      });
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.testingMode).toBe(false);
      expect(result.current.messages).toHaveLength(0);
      expect(result.current.myIdentity).toBeNull();
      expect(result.current.connectionStatus).toBe('disconnected');
      expect(mockAIService.clearAllTimers).toHaveBeenCalled();
    });
  });
});