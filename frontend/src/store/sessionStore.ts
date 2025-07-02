import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type Identity = 'A' | 'B' | 'C' | 'D';

export interface Message {
  sender: Identity;
  content: string;
  timestamp: number;
  action?: string;
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
  
  // Session data
  sessionId: string | null;
  myIdentity: Identity | null;
  participants: Participant[];
  messages: Message[];
  
  // Timer
  sessionStartTime: number | null;
  timeRemaining: number | null; // in seconds
  isSessionActive: boolean;
  
  // Reveal phase
  isRevealed: boolean;
  identityReveal: Record<Identity, { isAI: boolean; personality?: string }> | null;
  
  // Actions
  connect: () => void;
  disconnect: () => void;
  sendMessage: (content: string) => void;
  
  // WebSocket event handlers (called by WebSocket events)
  handleConnect: (data: any) => void;
  handleMessage: (data: Message) => void;
  handleParticipantUpdate: (participants: Participant[]) => void;
  handleSessionEnd: (reveal: any) => void;
  
  // Timer
  updateTimer: (seconds: number) => void;
  
  // Reset
  reset: () => void;
}

const WEBSOCKET_URL = process.env.NODE_ENV === 'development' 
  ? 'wss://ip1n2fcaw2.execute-api.us-east-1.amazonaws.com/prod'
  : 'wss://ip1n2fcaw2.execute-api.us-east-1.amazonaws.com/prod';

export const useSessionStore = create<SessionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      connectionStatus: 'disconnected',
      retryCount: 0,
      lastError: null,
      ws: null,
      sessionId: null,
      myIdentity: null,
      participants: [],
      messages: [],
      sessionStartTime: null,
      timeRemaining: null,
      isSessionActive: false,
      isRevealed: false,
      identityReveal: null,

      connect: () => {
        const state = get();
        if (state.ws?.readyState === WebSocket.OPEN) return;

        set({ connectionStatus: 'connecting', lastError: null });

        console.log('Attempting WebSocket connection to:', WEBSOCKET_URL);

        try {
          const ws = new WebSocket(WEBSOCKET_URL);

          ws.onopen = () => {
            console.log('✅ WebSocket connected successfully');
            set({ connectionStatus: 'connected', ws });
            
            // Send join message to get identity
            console.log('Sending join message...');
            ws.send(JSON.stringify({ action: 'join' }));
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log('📨 Received:', data);

              switch (data.action) {
                case 'connected':
                  get().handleConnect(data);
                  break;
                case 'message':
                  get().handleMessage(data);
                  break;
                case 'participants':
                  get().handleParticipantUpdate(data.participants);
                  break;
                case 'session_end':
                  get().handleSessionEnd(data.reveal);
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
            
            if (!isManualDisconnect && currentRetryCount < maxRetries) {
              const retryDelay = Math.min(1000 * Math.pow(2, currentRetryCount), 30000); // Max 30 seconds
              console.log(`🔄 Retrying connection in ${retryDelay/1000} seconds... (attempt ${currentRetryCount + 1}/${maxRetries})`);
              setTimeout(() => {
                const currentState = get();
                if (currentState.connectionStatus === 'disconnected') {
                  currentState.connect();
                }
              }, retryDelay);
            } else if (!isManualDisconnect && currentRetryCount >= maxRetries) {
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
          ws: null 
        });
      },

      sendMessage: (content: string) => {
        const { ws } = get();
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            action: 'message',
            content: content.trim()
          }));
        }
      },

      handleConnect: (data) => {
        // Calculate time remaining based on server session start time
        const serverTime = data.serverTime || Date.now();
        const sessionStartTime = data.sessionStartTime || serverTime;
        const timeSinceStart = (serverTime - sessionStartTime) / 1000; // seconds
        const timeRemaining = Math.max(0, 600 - timeSinceStart); // 10 minutes total
        
        set({
          myIdentity: data.identity,
          sessionId: data.sessionId,
          sessionStartTime: sessionStartTime,
          isSessionActive: true,
          timeRemaining: Math.floor(timeRemaining)
        });
      },

      handleMessage: (data) => {
        set(state => ({
          messages: [...state.messages, data]
        }));
      },

      handleParticipantUpdate: (participants) => {
        set({ participants });
      },

      handleSessionEnd: (reveal) => {
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
        
        set({
          connectionStatus: 'disconnected',
          retryCount: 0,
          lastError: null,
          ws: null,
          sessionId: null,
          myIdentity: null,
          participants: [],
          messages: [],
          sessionStartTime: null,
          timeRemaining: null,
          isSessionActive: false,
          isRevealed: false,
          identityReveal: null
        });
      }
    }),
    {
      name: 'session-store'
    }
  )
);