import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { mockAIService } from '@/services/mockAI';

export type Identity = 'A' | 'B' | 'C' | 'D';

export interface Message {
  sender: Identity;
  content: string;
  timestamp: number;
  action?: string;
}

export interface Round {
  roundNumber: number;
  prompt: string;
  responses: Partial<Record<Identity, string>>;
  votes: Partial<Record<Identity, Identity>>;
  scores: Partial<Record<Identity, number>>;
  status: 'waiting' | 'responding' | 'voting' | 'complete';
}

export interface Match {
  matchId: string;
  status: 'waiting' | 'round_active' | 'round_voting' | 'completed';
  currentRound: number;
  totalRounds: number;
  participants: Participant[];
  rounds: Round[];
}

export interface Participant {
  identity: Identity;
  isAI?: boolean;
  isConnected: boolean;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface SessionState {
  // Connection
  connectionStatus: ConnectionStatus;
  retryCount: number;
  lastError: string | null;
  ws: WebSocket | null;
  
  // Match data
  match: Match | null;
  myIdentity: Identity | null;
  messages: Message[]; // Keep for backward compatibility during transition
  
  // Current round state
  currentPrompt: string | null;
  myResponse: string | null;
  hasSubmittedResponse: boolean;
  roundResponses: Partial<Record<Identity, string>>;
  hasSubmittedVote: boolean;
  
  // Timer
  sessionStartTime: number | null;
  timeRemaining: number | null; // in seconds
  isSessionActive: boolean;
  
  // Match completion
  isRevealed: boolean;
  identityReveal: Record<Identity, { isAI: boolean; personality?: string }> | null;
  
  // Testing mode
  testingMode: boolean;
  identityMapping: Record<string, number>; // Maps A,B,C,D to player numbers 1,2,3,4
  typingParticipants: Set<Identity>;
  
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  sendMessage: (content: string) => void; // Keep for backward compatibility
  submitResponse: (response: string) => void;
  submitVote: (humanIdentity: Identity) => void;
  startTestingMode: () => void;
  
  // WebSocket event handlers (called by WebSocket events)
  handleConnect: (data: any) => void;
  handleMessage: (data: Message) => void; // Keep for backward compatibility
  handleMatchState: (data: any) => void;
  handleRoundStart: (data: any) => void;
  handleResponseSubmitted: (data: any) => void;
  handleParticipantResponded: (data: any) => void;
  handleRoundVoting: (data: any) => void;
  handleRoundComplete: (data: any) => void;
  handleMatchComplete: (data: any) => void;
  handleParticipantUpdate: (participants: Participant[]) => void;
  handleError: (data: any) => void;
  
  // Timer
  updateTimer: (seconds: number) => void;
  
  // Reset
  reset: () => void;
}

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://ckhxuef2t7.execute-api.us-east-1.amazonaws.com/prod';

export const useSessionStore = create<SessionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      connectionStatus: 'disconnected',
      retryCount: 0,
      lastError: null,
      ws: null,
      match: null,
      myIdentity: null,
      messages: [], // Keep for backward compatibility
      currentPrompt: null,
      myResponse: null,
      hasSubmittedResponse: false,
      roundResponses: {},
      hasSubmittedVote: false,
      sessionStartTime: null,
      timeRemaining: null,
      isSessionActive: false,
      isRevealed: false,
      identityReveal: null,
      testingMode: false,
      identityMapping: { A: 1, B: 2, C: 3, D: 4 },
      typingParticipants: new Set(),

      connect: () => {
        const state = get();
        if (state.ws?.readyState === WebSocket.OPEN || state.testingMode) return;

        set({ connectionStatus: 'connecting', lastError: null });

        console.log('Attempting WebSocket connection to:', WEBSOCKET_URL);

        try {
          const ws = new WebSocket(WEBSOCKET_URL);

          ws.onopen = () => {
            console.log('✅ WebSocket connected successfully');
            set({ connectionStatus: 'connected', ws });
            
            // Send join_match message to get identity
            console.log('Sending join_match message...');
            ws.send(JSON.stringify({ action: 'join_match' }));
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log('📨 Received:', data);

              switch (data.action) {
                case 'match_joined':
                  get().handleConnect(data);
                  break;
                case 'match_state':
                  get().handleMatchState(data);
                  break;
                case 'round_start':
                  get().handleRoundStart(data);
                  break;
                case 'response_submitted':
                  get().handleResponseSubmitted(data);
                  break;
                case 'participant_responded':
                  get().handleParticipantResponded(data);
                  break;
                case 'round_voting':
                  get().handleRoundVoting(data);
                  break;
                case 'round_complete':
                  get().handleRoundComplete(data);
                  break;
                case 'match_complete':
                  get().handleMatchComplete(data);
                  break;
                case 'participants':
                  get().handleParticipantUpdate(data.participants);
                  break;
                case 'error':
                  get().handleError(data);
                  break;
                default:
                  console.log('Unknown message:', data);
              }
            } catch (error) {
              console.error('Failed to parse message:', error);
            }
          };

          ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            console.error('WebSocket readyState:', ws.readyState);
            const currentRetryCount = get().retryCount;
            set({ 
              connectionStatus: 'error',
              retryCount: currentRetryCount + 1,
              lastError: `Connection failed (attempt ${currentRetryCount + 1})`
            });
          };

          ws.onclose = (event) => {
            console.log('🔌 WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
            set({ connectionStatus: 'disconnected', ws: null });
            
            // Auto-retry with exponential backoff if not a manual disconnect and under retry limit
            const currentRetryCount = get().retryCount;
            const isManualDisconnect = event.code === 1000;
            const maxRetries = 5;
            const currentState = get();
            
            if (!isManualDisconnect && currentRetryCount < maxRetries && !currentState.testingMode) {
              const retryDelay = Math.min(1000 * Math.pow(2, currentRetryCount), 30000); // Max 30 seconds
              console.log(`🔄 Retrying connection in ${retryDelay/1000} seconds... (attempt ${currentRetryCount + 1}/${maxRetries})`);
              setTimeout(() => {
                const currentState = get();
                if (currentState.connectionStatus === 'disconnected' && !currentState.testingMode) {
                  currentState.connect();
                }
              }, retryDelay);
            } else if (!isManualDisconnect && currentRetryCount >= maxRetries && !currentState.testingMode) {
              set({ 
                connectionStatus: 'error',
                lastError: `Failed to connect after ${maxRetries} attempts. Please check your internet connection.`
              });
            }
          };

          // Set a connection timeout
          setTimeout(() => {
            if (ws.readyState === WebSocket.CONNECTING) {
              console.error('⏰ WebSocket connection timeout');
              ws.close();
              set({ connectionStatus: 'error' });
            }
          }, 10000); // 10 second timeout

        } catch (error) {
          console.error('💥 Failed to create WebSocket:', error);
          set({ connectionStatus: 'error' });
        }
      },

      disconnect: () => {
        const { ws } = get();
        if (ws) {
          ws.close(1000);
        }
        set({ 
          connectionStatus: 'disconnected',
          retryCount: 0,
          lastError: null,
          ws: null,
          // Clear all session data when disconnecting
          match: null,
          myIdentity: null,
          messages: [],
          currentPrompt: null,
          isSessionActive: false,
          isRevealed: false,
          testingMode: false // Exit testing mode when disconnecting
        });
      },

      sendMessage: (content: string) => {
        // Backward compatibility - delegate to submitResponse
        get().submitResponse(content);
      },

      submitResponse: (response: string) => {
        const state = get();
        
        if (state.testingMode) {
          // Testing mode - handle locally with mock AI
          const message: Message = {
            sender: state.myIdentity!,
            content: response.trim(),
            timestamp: Date.now()
          };
          
          // Add human message
          set(currentState => ({
            messages: [...currentState.messages, message],
            myResponse: response.trim(),
            hasSubmittedResponse: true
          }));
          
          // Schedule AI responses
          mockAIService.scheduleAIResponses(
            response.trim(),
            (identity) => {
              // Start typing indicator
              set(currentState => {
                const newTyping = new Set(currentState.typingParticipants);
                newTyping.add(identity as Identity);
                return { typingParticipants: newTyping };
              });
            },
            (identity) => {
              // End typing indicator
              set(currentState => {
                const newTyping = new Set(currentState.typingParticipants);
                newTyping.delete(identity as Identity);
                return { typingParticipants: newTyping };
              });
            },
            (identity, messageContent) => {
              // Add AI message
              const aiMessage: Message = {
                sender: identity as Identity,
                content: messageContent,
                timestamp: Date.now()
              };
              
              set(currentState => ({
                messages: [...currentState.messages, aiMessage]
              }));
            }
          );
        } else {
          // Normal WebSocket mode
          const { ws, match } = state;
          if (ws?.readyState === WebSocket.OPEN && match) {
            ws.send(JSON.stringify({
              action: 'submit_response',
              roundNumber: match.currentRound,
              response: response.trim()
            }));
            
            // Update local state
            set({
              myResponse: response.trim(),
              hasSubmittedResponse: true
            });
          }
        }
      },

      submitVote: (humanIdentity: Identity) => {
        const state = get();
        const { ws, match } = state;
        
        if (ws?.readyState === WebSocket.OPEN && match) {
          ws.send(JSON.stringify({
            action: 'submit_vote',
            roundNumber: match.currentRound,
            humanIdentity
          }));
          
          // Update local state
          set({
            hasSubmittedVote: true
          });
        }
      },

      startTestingMode: () => {
        // Initialize testing mode with random human identity
        const identities: Identity[] = ['A', 'B', 'C', 'D'];
        const humanIdentity: Identity = identities[Math.floor(Math.random() * 4)];
        const allParticipants: Participant[] = [
          { identity: 'A', isAI: humanIdentity !== 'A', isConnected: true },
          { identity: 'B', isAI: humanIdentity !== 'B', isConnected: true },
          { identity: 'C', isAI: humanIdentity !== 'C', isConnected: true },
          { identity: 'D', isAI: humanIdentity !== 'D', isConnected: true }
        ];
        
        // Create test match
        const testMatch: Match = {
          matchId: `test-${Date.now()}`,
          status: 'round_active',
          currentRound: 1,
          totalRounds: 5,
          participants: allParticipants,
          rounds: []
        };
        
        // Initialize mock AI service
        mockAIService.initializeAIs(humanIdentity, get().identityMapping);
        
        // Set testing mode state
        set({
          testingMode: true,
          connectionStatus: 'connected',
          myIdentity: humanIdentity,
          match: testMatch,
          isSessionActive: true,
          sessionStartTime: Date.now(),
          timeRemaining: 180, // 3 minutes for testing mode
          currentPrompt: "What's one thing that recently surprised you in a good way?"
        });
      },

      handleConnect: (data) => {
        // Handle match_joined event
        const match: Match = data.match || {
          matchId: data.matchId || 'unknown',
          status: data.status || 'waiting',
          currentRound: data.currentRound || 1,
          totalRounds: data.totalRounds || 5,
          participants: data.participants || [],
          rounds: data.rounds || []
        };
        
        set({
          myIdentity: data.identity,
          match,
          sessionStartTime: Date.now(),
          isSessionActive: true,
          timeRemaining: 300 // 5 minutes per round
        });
      },

      handleMatchState: (data) => {
        // Handle match_state updates
        const state = get();
        if (data.match) {
          set({
            match: data.match
          });
        }
      },

      handleError: (data) => {
        console.error('WebSocket error:', data.message);
        set({
          lastError: data.message
        });
      },

      handleRoundStart: (data) => {
        set({
          currentPrompt: data.prompt,
          myResponse: null,
          hasSubmittedResponse: false,
          roundResponses: {},
          hasSubmittedVote: false,
          timeRemaining: data.timeLimit || 90 // 90 seconds to respond
        });
      },

      handleResponseSubmitted: (data) => {
        // Update the responses for the current round
        set(state => ({
          roundResponses: {
            ...state.roundResponses,
            [data.identity]: data.response
          }
        }));
      },

      handleParticipantResponded: (data: any) => {
        // Handle when a participant (human or robot) has responded
        if (data.response) {
          // If response is included, update it
          set(state => ({
            roundResponses: {
              ...state.roundResponses,
              [data.identity]: data.response
            }
          }));
        }
        
        // Could also update UI to show who has responded
        console.log(`${data.identity} has responded to round ${data.roundNumber}`);
      },

      handleRoundVoting: (data) => {
        // All responses are in, time to vote
        set({
          roundResponses: data.responses,
          timeRemaining: 30 // 30 seconds to vote
        });
      },

      handleRoundComplete: (data) => {
        // Round is complete, show results and prepare for next round
        const state = get();
        if (state.match) {
          const updatedMatch = {
            ...state.match,
            currentRound: data.nextRound || state.match.currentRound + 1
          };
          
          set({
            match: updatedMatch,
            currentPrompt: null,
            myResponse: null,
            hasSubmittedResponse: false,
            roundResponses: {},
            hasSubmittedVote: false
          });
        }
      },

      handleMatchComplete: (data) => {
        set({
          isSessionActive: false,
          isRevealed: true,
          identityReveal: data.reveal,
          timeRemaining: 0
        });
      },

      handleMessage: (data) => {
        set(state => ({
          messages: [...state.messages, data]
        }));
      },

      handleParticipantUpdate: (participants) => {
        const state = get();
        if (state.match) {
          const updatedMatch = {
            ...state.match,
            participants
          };
          set({ match: updatedMatch });
        }
      },

      handleSessionEnd: (reveal: any) => {
        set({
          isSessionActive: false,
          isRevealed: true,
          identityReveal: reveal,
          timeRemaining: 0
        });
      },

      updateTimer: (seconds) => {
        set({ timeRemaining: seconds });
        if (seconds <= 0) {
          set({ isSessionActive: false });
        }
      },

      reset: () => {
        const { ws } = get();
        if (ws) ws.close();
        
        // Clear mock AI timers
        mockAIService.clearAllTimers();
        
        set({
          connectionStatus: 'disconnected',
          retryCount: 0,
          lastError: null,
          ws: null,
          match: null,
          myIdentity: null,
          messages: [],
          currentPrompt: null,
          myResponse: null,
          hasSubmittedResponse: false,
          roundResponses: {},
          hasSubmittedVote: false,
          sessionStartTime: null,
          timeRemaining: null,
          isSessionActive: false,
          isRevealed: false,
          identityReveal: null,
          testingMode: false,
          identityMapping: { A: 1, B: 2, C: 3, D: 4 },
          typingParticipants: new Set()
        });
      }
    }),
    {
      name: 'session-store'
    }
  )
);