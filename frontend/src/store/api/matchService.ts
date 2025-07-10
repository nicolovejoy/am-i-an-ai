import type { Match } from '../types';
import { cognitoService } from '../../services/cognito';

const MATCH_SERVICE_API = 
  import.meta.env.VITE_MATCH_SERVICE_API || 
  "https://api.robotorchestra.org";

const MATCH_HISTORY_API =
  import.meta.env.VITE_MATCH_HISTORY_API ||
  "https://api.robotorchestra.org/matches/history";

// API Response types
type CreateMatchResponse = Match;
interface SubmitResponseResult {
  success: boolean;
  match?: Match;
}
interface SubmitVoteResult {
  success: boolean;
  match?: Match;
}

class MatchServiceError extends Error {
  status?: number;
  responseText?: string;
  
  constructor(
    message: string,
    status?: number,
    responseText?: string
  ) {
    super(message);
    this.name = 'MatchServiceError';
    this.status = status;
    this.responseText = responseText;
  }
}

// Helper function to get headers with authorization
async function getAuthHeaders(): Promise<HeadersInit> {
  const idToken = await cognitoService.getIdToken();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  
  if (idToken) {
    headers["Authorization"] = `Bearer ${idToken}`;
  }
  
  return headers;
}

export const matchService = {
  async createMatch(playerName: string): Promise<Match> {
    const url = `${MATCH_SERVICE_API}/matches`;
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ playerName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new MatchServiceError(
          `Failed to create match: ${response.statusText}`,
          response.status,
          errorText
        );
      }

      const matchData: CreateMatchResponse = await response.json();
      return matchData;
    } catch (error) {
      if (error instanceof MatchServiceError) {
        throw error;
      }
      
      // Network or other errors
      throw new MatchServiceError(
        `Network error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  async getMatch(matchId: string): Promise<Match> {
    const url = `${MATCH_SERVICE_API}/matches/${matchId}`;
    
    try {
      const response = await fetch(url, {
        headers: await getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new MatchServiceError(
          `Failed to fetch match: ${response.statusText}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof MatchServiceError) {
        throw error;
      }
      
      throw new MatchServiceError(
        `Network error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  async submitResponse(
    matchId: string,
    identity: string,
    response: string,
    round: number
  ): Promise<SubmitResponseResult> {
    const url = `${MATCH_SERVICE_API}/matches/${matchId}/responses`;
    
    try {
      const apiResponse = await fetch(url, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          identity,
          response: response.trim(),
          round,
        }),
      });

      if (!apiResponse.ok) {
        throw new MatchServiceError(
          `Failed to submit response: ${apiResponse.statusText}`,
          apiResponse.status
        );
      }

      return await apiResponse.json();
    } catch (error) {
      if (error instanceof MatchServiceError) {
        throw error;
      }
      
      throw new MatchServiceError(
        `Network error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  async submitVote(
    matchId: string,
    voter: string,
    votedFor: string,
    round: number
  ): Promise<SubmitVoteResult> {
    const url = `${MATCH_SERVICE_API}/matches/${matchId}/votes`;
    
    try {
      const apiResponse = await fetch(url, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          voter,
          votedFor,
          round,
        }),
      });

      if (!apiResponse.ok) {
        throw new MatchServiceError(
          `Failed to submit vote: ${apiResponse.statusText}`,
          apiResponse.status
        );
      }

      return await apiResponse.json();
    } catch (error) {
      if (error instanceof MatchServiceError) {
        throw error;
      }
      
      throw new MatchServiceError(
        `Network error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },

  async getMatchHistory(): Promise<Match[]> {
    try {
      const response = await fetch(MATCH_HISTORY_API, {
        headers: await getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new MatchServiceError(
          `Failed to fetch match history: ${response.statusText}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof MatchServiceError) {
        throw error;
      }
      
      throw new MatchServiceError(
        `Network error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
};

// Export for debugging in development
if (process.env.NODE_ENV === 'development') {
  console.log('Match Service API:', MATCH_SERVICE_API);
  console.log('Match History API:', MATCH_HISTORY_API);
}