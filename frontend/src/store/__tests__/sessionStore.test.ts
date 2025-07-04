import { act, renderHook } from '@testing-library/react';
import { useSessionStore } from '../sessionStore';
import { mockAIService } from '@/services/mockAI';

// Mock WebSocket
class MockWebSocket {
  readyState: number = WebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  
  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen(new Event('open'));
    }, 0);
  }
  
  send(data: string) {
    // Mock implementation
  }
  
  close(code?: number) {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: code || 1000 }));
    }
  }
}

// Mock the WebSocket globally
global.WebSocket = MockWebSocket as any;

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
    it('should initialize with human as A and AIs as B, C, D in testing mode', () => {
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

    it('should not attempt WebSocket connection in testing mode', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.startTestingMode();
      });
      
      const connectSpy = jest.spyOn(result.current, 'connect');
      
      act(() => {
        result.current.connect();
      });
      
      expect(result.current.ws).toBeNull();
      expect(result.current.connectionStatus).toBe('connected');
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
  });

  describe('Message Handling', () => {
    it('should add messages to the store', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.handleMessage({
          sender: 'B',
          content: 'Test message',
          timestamp: Date.now()
        });
      });
      
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].sender).toBe('B');
      expect(result.current.messages[0].content).toBe('Test message');
    });

    it('should update typing participants', () => {
      const { result } = renderHook(() => useSessionStore());
      
      act(() => {
        result.current.startTestingMode();
      });
      
      // Simulate AI typing
      const scheduleCallback = (mockAIService.scheduleAIResponses as jest.Mock).mock.calls[0];
      if (scheduleCallback) {
        const [, onTypingStart, onTypingEnd] = scheduleCallback;
        
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

  describe('Participant Management', () => {
    it('should update participants list when received from server', () => {
      const { result } = renderHook(() => useSessionStore());
      
      // Initialize testing mode to create a match
      act(() => {
        result.current.startTestingMode();
      });
      
      const participants = [
        { identity: 'A' as const, isAI: false, isConnected: true },
        { identity: 'B' as const, isAI: false, isConnected: true }
      ];
      
      act(() => {
        result.current.handleParticipantUpdate(participants);
      });
      
      expect(result.current.match?.participants).toEqual(participants);
    });
  });

  describe('Connection Management', () => {
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