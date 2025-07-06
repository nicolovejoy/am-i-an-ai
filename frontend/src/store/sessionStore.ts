import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { mockAIService } from "@/services/mockAI";

export type Identity = "A" | "B" | "C" | "D";

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
  status: "waiting" | "responding" | "voting" | "complete";
}

export interface Match {
  matchId: string;
  status: "waiting" | "round_active" | "round_voting" | "completed";
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

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

interface SessionState {
  // Connection (for testing mode compatibility)
  connectionStatus: ConnectionStatus;
  lastError: string | null;

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
  identityReveal: Record<
    Identity,
    { isAI: boolean; personality?: string }
  > | null;

  // Testing mode
  testingMode: boolean;
  identityMapping: Record<string, number>; // Maps A,B,C,D to player numbers 1,2,3,4
  typingParticipants: Set<Identity>;
}

interface SessionActions {
  // Actions
  startTestingMode: () => void;
  submitResponse: (response: string) => void;
  submitVote: (humanIdentity: Identity) => void;

  // Timer
  updateTimer: (seconds: number) => void;

  // Reset
  reset: () => void;

  // Legacy methods (for backward compatibility)
  connect: () => void;
  disconnect: () => void;
  sendMessage: (content: string) => void;
}

type SessionStore = SessionState & SessionActions;

const MATCH_HISTORY_API =
  process.env.NEXT_PUBLIC_MATCH_HISTORY_API ||
  "https://api.robotorchestra.org/matches/history";

export const useSessionStore = create<SessionStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      connectionStatus: "disconnected",
      lastError: null,
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

      // Legacy connect method (now just starts testing mode)
      connect: () => {
        console.log("Connect called - starting testing mode");
        get().startTestingMode();
      },

      // Legacy disconnect method
      disconnect: () => {
        set({
          connectionStatus: "disconnected",
          lastError: null,
          match: null,
          myIdentity: null,
          messages: [],
          currentPrompt: null,
          isSessionActive: false,
          isRevealed: false,
          testingMode: false,
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
            timestamp: Date.now(),
          };

          // Add human message
          set((currentState) => ({
            messages: [...currentState.messages, message],
            myResponse: response.trim(),
            hasSubmittedResponse: true,
          }));

          // Schedule AI responses
          mockAIService.scheduleAIResponses(
            response.trim(),
            (identity) => {
              // Start typing indicator
              set((currentState) => {
                const newTyping = new Set(currentState.typingParticipants);
                newTyping.add(identity as Identity);
                return { typingParticipants: newTyping };
              });
            },
            (identity) => {
              // End typing indicator
              set((currentState) => {
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
                timestamp: Date.now(),
              };

              set((currentState) => ({
                messages: [...currentState.messages, aiMessage],
              }));
            }
          );
        } else {
          console.log("Not in testing mode - response submission not implemented");
          // TODO: Implement REST API call for response submission
          set({
            myResponse: response.trim(),
            hasSubmittedResponse: true,
          });
        }
      },

      submitVote: (humanIdentity: Identity) => {
        console.log("Vote submitted for:", humanIdentity);
        // TODO: Implement REST API call for vote submission
        set({
          hasSubmittedVote: true,
        });
      },

      startTestingMode: () => {
        // Initialize testing mode with random human identity
        const identities: Identity[] = ["A", "B", "C", "D"];
        const humanIdentity: Identity =
          identities[Math.floor(Math.random() * 4)];
        const allParticipants: Participant[] = [
          { identity: "A", isAI: humanIdentity !== "A", isConnected: true },
          { identity: "B", isAI: humanIdentity !== "B", isConnected: true },
          { identity: "C", isAI: humanIdentity !== "C", isConnected: true },
          { identity: "D", isAI: humanIdentity !== "D", isConnected: true },
        ];

        // Create test match
        const testMatch: Match = {
          matchId: `test-${Date.now()}`,
          status: "round_active",
          currentRound: 1,
          totalRounds: 5,
          participants: allParticipants,
          rounds: [],
        };

        // Initialize mock AI service
        mockAIService.initializeAIs(humanIdentity, get().identityMapping);

        // Set testing mode state
        set({
          testingMode: true,
          connectionStatus: "connected",
          myIdentity: humanIdentity,
          match: testMatch,
          isSessionActive: true,
          sessionStartTime: Date.now(),
          timeRemaining: 180, // 3 minutes for testing mode
          currentPrompt:
            "What's one thing that recently surprised you in a good way?",
        });
      },

      updateTimer: (seconds) => {
        set({ timeRemaining: seconds });
        if (seconds <= 0) {
          set({ isSessionActive: false });
        }
      },

      reset: () => {
        // Clear mock AI timers
        mockAIService.clearAllTimers();

        set({
          connectionStatus: "disconnected",
          lastError: null,
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
          typingParticipants: new Set(),
        });
      },
    }),
    {
      name: "session-store",
    }
  )
);