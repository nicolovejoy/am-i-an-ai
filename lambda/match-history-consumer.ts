// Match History Consumer Lambda
// Consumes Kafka match events and builds match history for API

import { MatchEvent, EVENT_TYPES } from './kafka-schemas/schemas';

export interface MatchHistoryRecord {
  matchId: string;
  status: 'completed' | 'in_progress';
  humanParticipant: string;
  robotParticipants: string[];
  rounds: RoundSummary[];
  createdAt: number;
  completedAt?: number;
  duration?: number;
  result?: 'correct' | 'incorrect';
}

export interface RoundSummary {
  round: number;
  prompt: string;
  responses: Array<{
    participantId: string;
    participantType: 'human' | 'robot';
    response: string;
    robotType?: string;
  }>;
  humanGuess?: string;
  startedAt: number;
  completedAt?: number;
}

export class MatchHistoryConsumer {
  private matches: Map<string, MatchHistoryRecord> = new Map();

  async processEvent(event: MatchEvent): Promise<void> {
    const { matchId, eventType, data } = event;

    // Validate basic event structure first
    if (!event || !eventType || !matchId || !data) {
      throw new Error('Invalid event format');
    }

    switch (eventType) {
      case EVENT_TYPES.MATCH_STARTED:
        await this.handleMatchStarted(matchId, data);
        break;

      case EVENT_TYPES.ROUND_STARTED:
        await this.handleRoundStarted(matchId, data);
        break;

      case EVENT_TYPES.RESPONSE_SUBMITTED:
      case EVENT_TYPES.RESPONSE_GENERATED:
        await this.handleResponseSubmitted(matchId, data);
        break;

      case EVENT_TYPES.VOTE_SUBMITTED:
        await this.handleVoteSubmitted(matchId, data);
        break;

      case EVENT_TYPES.MATCH_COMPLETED:
        await this.handleMatchCompleted(matchId, data);
        break;

      default:
        // Log unknown event types but don't fail
        console.log(`Unknown event type: ${eventType}`);
    }
  }

  private async handleMatchStarted(matchId: string, data: any): Promise<void> {
    if (!data.participants || !Array.isArray(data.participants) || data.participants.length !== 4) {
      throw new Error('Invalid match started data');
    }

    if (!data.humanParticipant || !data.robotParticipants || !Array.isArray(data.robotParticipants)) {
      throw new Error('Invalid match started data');
    }

    const match: MatchHistoryRecord = {
      matchId,
      status: 'in_progress',
      humanParticipant: data.humanParticipant,
      robotParticipants: data.robotParticipants,
      rounds: [],
      createdAt: data.createdAt
    };

    this.matches.set(matchId, match);
  }

  private async handleRoundStarted(matchId: string, data: any): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match) {
      // Handle gracefully - might be processing events out of order
      console.warn(`Round started for unknown match: ${matchId}`);
      return;
    }

    const round: RoundSummary = {
      round: data.round,
      prompt: data.prompt,
      responses: [],
      startedAt: Date.now()
    };

    // Ensure we have the right number of rounds
    while (match.rounds.length < data.round) {
      if (match.rounds.length === data.round - 1) {
        match.rounds.push(round);
      } else {
        // Fill in missing rounds with placeholder
        match.rounds.push({
          round: match.rounds.length + 1,
          prompt: 'Unknown prompt',
          responses: [],
          startedAt: 0
        });
      }
    }
  }

  private async handleResponseSubmitted(matchId: string, data: any): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match) {
      console.warn(`Response submitted for unknown match: ${matchId}`);
      return;
    }

    const roundIndex = data.round - 1;
    if (roundIndex < 0 || roundIndex >= match.rounds.length) {
      console.warn(`Response for unknown round ${data.round} in match ${matchId}`);
      return;
    }

    const response = {
      participantId: data.participantId,
      participantType: data.participantType,
      response: data.response,
      ...(data.robotType && { robotType: data.robotType })
    };

    // Check if response already exists (avoid duplicates)
    const existingIndex = match.rounds[roundIndex].responses.findIndex(
      r => r.participantId === data.participantId
    );

    if (existingIndex >= 0) {
      match.rounds[roundIndex].responses[existingIndex] = response;
    } else {
      match.rounds[roundIndex].responses.push(response);
    }
  }

  private async handleVoteSubmitted(matchId: string, data: any): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match) {
      console.warn(`Vote submitted for unknown match: ${matchId}`);
      return;
    }

    // Assume vote is for the last round (current round)
    if (match.rounds.length > 0) {
      const lastRound = match.rounds[match.rounds.length - 1];
      lastRound.humanGuess = data.humanGuess;
    }
  }

  private async handleMatchCompleted(matchId: string, data: any): Promise<void> {
    const match = this.matches.get(matchId);
    if (!match) {
      console.warn(`Match completed for unknown match: ${matchId}`);
      return;
    }

    match.status = 'completed';
    match.result = data.result;
    match.completedAt = data.completedAt;
    match.duration = data.duration;
  }

  getMatchHistory(matchId: string): MatchHistoryRecord | null {
    return this.matches.get(matchId) || null;
  }

  getAllMatches(): MatchHistoryRecord[] {
    return Array.from(this.matches.values())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getCompletedMatches(): MatchHistoryRecord[] {
    return this.getAllMatches()
      .filter(match => match.status === 'completed');
  }
}

// Lambda handler for API Gateway
export async function handler(_event: any, _context: any) {
  const consumer = new MatchHistoryConsumer();
  
  try {
    // For now, return sample data
    // In real implementation, this would connect to Kafka and process events
    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify({
        matches: consumer.getAllMatches(),
        timestamp: Date.now()
      })
    };

    return response;
  } catch (error) {
    console.error('Error in match history handler:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}