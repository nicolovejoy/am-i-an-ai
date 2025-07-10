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
  presentationOrder?: Identity[];
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
  playerName?: string;
}