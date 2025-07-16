// Temporary file to fix imports - will be replaced by React Query
import type { Match } from '../types';

const API_URL = import.meta.env.VITE_MATCH_SERVICE_API || '';

export const matchService = {
  async getMatchHistory(): Promise<Match[]> {
    const response = await fetch(`${API_URL}/match-history`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('authToken') || ''}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch match history');
    }
    
    return response.json();
  },

  async getMatch(matchId: string): Promise<Match> {
    const response = await fetch(`${API_URL}/matches/${matchId}`, {
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('authToken') || ''}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch match');
    }
    
    return response.json();
  },

  async submitResponse(matchId: string, identity: string, response: string, round: number): Promise<any> {
    const res = await fetch(`${API_URL}/matches/${matchId}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify({ identity, response, round }),
    });
    
    if (!res.ok) {
      throw new Error('Failed to submit response');
    }
    
    return res.json();
  },

  async submitVote(matchId: string, voter: string, votedFor: string, round: number): Promise<any> {
    const res = await fetch(`${API_URL}/matches/${matchId}/votes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify({ voter, votedFor, round }),
    });
    
    if (!res.ok) {
      throw new Error('Failed to submit vote');
    }
    
    return res.json();
  },
};