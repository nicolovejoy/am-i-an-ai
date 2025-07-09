import { create } from "zustand";
import { devtools } from "zustand/middleware";

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
 // in seconds
  isSessionActive: boolean;

  // Match completion
  isRevealed: boolean;
  identityReveal: Record<
    Identity,
    { isAI: boolean; personality?: string }
  > | null;

  // Testing mode
  identityMapping: Record<string, number>; // Maps A,B,C,D to player numbers 1,2,3,4
  typingParticipants: Set<Identity>;
}

interface SessionActions {
  // Individual State Setters
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLastError: (error: string | null) => void;
  setMatch: (match: Match | null) => void;
  setMyIdentity: (identity: Identity | null) => void;
  setMessages: (messages: Message[]) => void;
  setCurrentPrompt: (prompt: string | null) => void;
  setMyResponse: (response: string | null) => void;
  setHasSubmittedResponse: (submitted: boolean) => void;
  setRoundResponses: (responses: Partial<Record<Identity, string>>) => void;
  setHasSubmittedVote: (submitted: boolean) => void;
  setIsSessionActive: (active: boolean) => void;
  setIsRevealed: (revealed: boolean) => void;
  setIdentityReveal: (reveal: Record<Identity, { isAI: boolean; personality?: string }> | null) => void;
  setTypingParticipants: (participants: Set<Identity>) => void;

  // Complex Actions
  createRealMatch: (playerName: string) => Promise<void>;
  submitResponse: (response: string) => void;
  submitVote: (humanIdentity: Identity) => void;
  pollMatchUpdates: (matchId: string) => Promise<void>;
  resetRoundState: () => void;
  resetSession: () => void;

  // Legacy methods (for backward compatibility)
  connect: () => void;
  disconnect: () => void;
  sendMessage: (content: string) => void;
  reset: () => void;
}

type SessionStore = SessionState & SessionActions;

const MATCH_HISTORY_API =
  process.env.NEXT_PUBLIC_MATCH_HISTORY_API ||
  "https://api.robotorchestra.org/matches/history";

const MATCH_SERVICE_API =
  process.env.NEXT_PUBLIC_MATCH_SERVICE_API ||
  "https://api.robotorchestra.org";

// Debug logging
console.log('MATCH_SERVICE_API configured as:', MATCH_SERVICE_API);
console.log('Environment:', {
  NEXT_PUBLIC_MATCH_SERVICE_API: process.env.NEXT_PUBLIC_MATCH_SERVICE_API,
  NODE_ENV: process.env.NODE_ENV
});

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
      isSessionActive: false,
      isRevealed: false,
      identityReveal: null,
      identityMapping: { A: 1, B: 2, C: 3, D: 4 },
      typingParticipants: new Set(),

      // Individual State Setters
      setConnectionStatus: (status) => set({ connectionStatus: status }),
      setLastError: (error) => set({ lastError: error }),
      setMatch: (match) => set({ match }),
      setMyIdentity: (identity) => set({ myIdentity: identity }),
      setMessages: (messages) => set({ messages }),
      setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
      setMyResponse: (response) => set({ myResponse: response }),
      setHasSubmittedResponse: (submitted) => set({ hasSubmittedResponse: submitted }),
      setRoundResponses: (responses) => set({ roundResponses: responses }),
      setHasSubmittedVote: (submitted) => set({ hasSubmittedVote: submitted }),
      setIsSessionActive: (active) => set({ isSessionActive: active }),
      setIsRevealed: (revealed) => set({ isRevealed: revealed }),
      setIdentityReveal: (reveal) => set({ identityReveal: reveal }),
      setTypingParticipants: (participants) => set({ typingParticipants: participants }),

      // Legacy connect method - redirects to dashboard
      connect: () => {
        window.location.href = '/dashboard';
      },

      createRealMatch: async (playerName: string) => {
        try {
          get().setConnectionStatus("connecting");

          const url = `${MATCH_SERVICE_API}/matches`;
          console.log('Creating match at URL:', url);
          console.log('With payload:', { playerName });
          console.log('Using API base:', MATCH_SERVICE_API);

          let response;
          try {
            response = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                playerName,
              }),
            });
          } catch (error) {
            console.error('Network error during fetch:', error);
            console.error('Failed URL:', url);
            if (error instanceof Error) {
              console.error('Error type:', error.constructor.name);
              console.error('Error stack:', error.stack);
              console.error('Error message:', error.message);
              throw new Error(`Network error: ${error.message}`);
            } else {
              throw new Error(`Network error: ${String(error)}`);
            }
          }

          console.log('Response status:', response.status);
          console.log('Response headers:', response.headers);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response body:', errorText);
            throw new Error(`Failed to create match: ${response.status} ${response.statusText} - ${errorText}`);
          }

          const matchData = await response.json();
          console.log('Match created successfully:', matchData);
          
          // Backend now returns correct format, no conversion needed
          const match: Match = matchData;

          // Set the human identity based on the participant data
          const humanParticipant = matchData.participants?.find((p: any) => !p.isAI);
          const myIdentity = humanParticipant?.identity || 'A';

          // Get the current round's prompt
          const currentRound = match.rounds?.find(
            (r: any) => r.roundNumber === match.currentRound
          );
          const currentPrompt = currentRound?.prompt || "Waiting for match to start...";

          get().setConnectionStatus("connected");
          get().setMatch(match);
          get().setMyIdentity(myIdentity);
          get().setIsSessionActive(true);
          get().setCurrentPrompt(currentPrompt);

        } catch (error) {
          console.error("Failed to create real match:", error);
          console.error("Error details:", {
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            error: error
          });
          get().setConnectionStatus("error");
          get().setLastError(error instanceof Error ? error.message : "Unknown error");
          throw error; // Re-throw so the UI can handle it
        }
      },

      // Legacy disconnect method
      disconnect: () => {
        get().setConnectionStatus("disconnected");
        get().setLastError(null);
        get().setMatch(null);
        get().setMyIdentity(null);
        get().setMessages([]);
        get().setCurrentPrompt(null);
        get().setIsSessionActive(false);
        get().setIsRevealed(false);
      },

      sendMessage: (content: string) => {
        // Backward compatibility - delegate to submitResponse
        get().submitResponse(content);
      },

      submitResponse: (response: string) => {
        // Submit response via API
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
              get().setMatch(result.match);
              
              // Update current prompt if we moved to a new round
              const currentRound = result.match.rounds?.find(
                (r: any) => r.roundNumber === result.match.currentRound
              );
              if (currentRound?.prompt) {
                get().setCurrentPrompt(currentRound.prompt);
              }
              
              // Update round responses whenever they exist
              if (currentRound?.responses) {
                get().setRoundResponses(currentRound.responses);
              }
            }
          } catch (error) {
            console.error("Failed to submit response:", error);
            get().setLastError(error instanceof Error ? error.message : "Failed to submit response");
          }
        };

        submitResponseAsync();

        get().setMyResponse(response.trim());
        get().setHasSubmittedResponse(true);
      },

      submitVote: (humanIdentity: Identity) => {
        console.log("Vote submitted for:", humanIdentity);
        
        const currentState = get();
        
        // Submit via API
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
                get().setMatch(result.match);
                
                // Update current prompt if we moved to a new round
                const currentRound = result.match.rounds?.find(
                  (r: any) => r.roundNumber === result.match.currentRound
                );
                if (currentRound?.prompt) {
                  get().setCurrentPrompt(currentRound.prompt);
                  // Reset round state for new round
                  get().resetRoundState();
                }
              }
            } catch (error) {
              console.error("Failed to submit vote:", error);
              get().setLastError(error instanceof Error ? error.message : "Failed to submit vote");
            }
          };

          submitVoteAsync();

        get().setHasSubmittedVote(true);
      },



      pollMatchUpdates: async (matchId: string) => {
        try {
          const response = await fetch(`${MATCH_SERVICE_API}/matches/${matchId}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch match: ${response.statusText}`);
          }
          const matchData = await response.json();
          get().setMatch(matchData);

          // Update current round info if needed
          const currentRound = matchData.rounds?.find(
            (r: any) => r.roundNumber === matchData.currentRound
          );
          if (currentRound) {
            get().setCurrentPrompt(currentRound.prompt);
            get().setRoundResponses(currentRound.responses || {});
          }
        } catch (error) {
          console.error("Failed to poll match updates:", error);
          get().setLastError(error instanceof Error ? error.message : "Failed to fetch match updates");
        }
      },

      resetRoundState: () => {
        get().setHasSubmittedResponse(false);
        get().setHasSubmittedVote(false);
        get().setMyResponse(null);
        get().setRoundResponses({});
      },

      resetSession: () => {
        get().setConnectionStatus("disconnected");
        get().setLastError(null);
        get().setMatch(null);
        get().setMyIdentity(null);
        get().setMessages([]);
        get().setCurrentPrompt(null);
        get().setMyResponse(null);
        get().setHasSubmittedResponse(false);
        get().setRoundResponses({});
        get().setHasSubmittedVote(false);
        get().setIsSessionActive(false);
        get().setIsRevealed(false);
        get().setIdentityReveal(null);
        get().setTypingParticipants(new Set());
      },

      // Legacy reset method (alias to resetSession)
      reset: () => {
        get().resetSession();
      },
    }),
    {
      name: "session-store",
    }
  )
);