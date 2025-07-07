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
  createRealMatch: (playerName: string) => Promise<void>;
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

const MATCH_SERVICE_API =
  process.env.NEXT_PUBLIC_MATCH_SERVICE_API ||
  "https://api.robotorchestra.org";

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

      createRealMatch: async (playerName: string) => {
        try {
          set({ connectionStatus: "connecting" });

          const response = await fetch(`${MATCH_SERVICE_API}/matches`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              playerName,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to create match: ${response.statusText}`);
          }

          const matchData = await response.json();
          
          // Convert API response to our internal match format
          const match: Match = {
            matchId: matchData.matchId,
            status: matchData.status === 'waiting' ? 'waiting' : 'round_active',
            currentRound: matchData.currentRound || 0,
            totalRounds: matchData.totalRounds || 5,
            participants: matchData.participants || [],
            rounds: matchData.rounds || [],
          };

          // Set the human identity based on the participant data
          const humanParticipant = matchData.participants?.find((p: any) => p.isHuman);
          const myIdentity = humanParticipant?.identity || 'A';

          // Get the current round's prompt
          const currentRound = match.rounds?.find(
            (r: any) => r.roundNumber === match.currentRound
          );
          const currentPrompt = currentRound?.prompt || "Waiting for match to start...";

          set({
            connectionStatus: "connected",
            match,
            myIdentity,
            isSessionActive: true,
            sessionStartTime: Date.now(),
            timeRemaining: 180, // 3 minutes default
            testingMode: false,
            currentPrompt,
          });

        } catch (error) {
          console.error("Failed to create real match:", error);
          set({
            connectionStatus: "error",
            lastError: error instanceof Error ? error.message : "Unknown error",
          });
        }
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
          // Real mode - submit via API
          const currentState = get();
          if (!currentState.match?.matchId || !currentState.myIdentity) {
            console.error("Cannot submit response: no active match or identity");
            return;
          }

          const submitResponseAsync = async () => {
            try {
              const apiResponse = await fetch(
                `${MATCH_SERVICE_API}/matches/${currentState.match!.matchId}/responses`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    identity: currentState.myIdentity,
                    response: response.trim(),
                    round: currentState.match!.currentRound || 1,
                  }),
                }
              );

              if (!apiResponse.ok) {
                throw new Error(`Failed to submit response: ${apiResponse.statusText}`);
              }

              const result = await apiResponse.json();
              console.log("Response submitted successfully", result);
              
              // Update match state if response includes updated match data
              if (result.match) {
                set({ match: result.match });
                
                // Update current prompt if we moved to a new round
                const currentRound = result.match.rounds?.find(
                  (r: any) => r.roundNumber === result.match.currentRound
                );
                if (currentRound?.prompt) {
                  set({ currentPrompt: currentRound.prompt });
                }
                
                // Update round responses if we're in voting phase
                if (currentRound?.status === 'voting' && currentRound?.responses) {
                  set({ roundResponses: currentRound.responses });
                }
              }
            } catch (error) {
              console.error("Failed to submit response:", error);
              set({
                lastError: error instanceof Error ? error.message : "Failed to submit response",
              });
            }
          };

          submitResponseAsync();

          set({
            myResponse: response.trim(),
            hasSubmittedResponse: true,
          });
        }
      },

      submitVote: (humanIdentity: Identity) => {
        console.log("Vote submitted for:", humanIdentity);
        
        const currentState = get();
        
        if (!currentState.testingMode) {
          // Real mode - submit via API
          if (!currentState.match?.matchId || !currentState.myIdentity) {
            console.error("Cannot submit vote: no active match or identity");
            return;
          }

          const submitVoteAsync = async () => {
            try {
              const apiResponse = await fetch(
                `${MATCH_SERVICE_API}/matches/${currentState.match!.matchId}/votes`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    voter: currentState.myIdentity,
                    votedFor: humanIdentity,
                    round: currentState.match!.currentRound || 1,
                  }),
                }
              );

              if (!apiResponse.ok) {
                throw new Error(`Failed to submit vote: ${apiResponse.statusText}`);
              }

              const result = await apiResponse.json();
              console.log("Vote submitted successfully", result);
              
              // Update match state if response includes updated match data
              if (result.match) {
                set({ match: result.match });
                
                // Update current prompt if we moved to a new round
                const currentRound = result.match.rounds?.find(
                  (r: any) => r.roundNumber === result.match.currentRound
                );
                if (currentRound?.prompt) {
                  set({ 
                    currentPrompt: currentRound.prompt,
                    // Reset round state for new round
                    hasSubmittedResponse: false,
                    hasSubmittedVote: false,
                    myResponse: null,
                    roundResponses: {},
                  });
                }
              }
            } catch (error) {
              console.error("Failed to submit vote:", error);
              set({
                lastError: error instanceof Error ? error.message : "Failed to submit vote",
              });
            }
          };

          submitVoteAsync();
        }

        // Only set hasSubmittedVote for the current round if not moving to new round
        if (!result?.match || result.match.currentRound === get().match?.currentRound) {
          set({
            hasSubmittedVote: true,
          });
        }
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