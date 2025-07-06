// Event Schemas for Kafka Migration Phase 1
// Validation functions for match events, robot commands, and robot events

export interface BaseEvent {
  eventId: string;
  timestamp: number;
  matchId: string;
}

export interface MatchEvent extends BaseEvent {
  eventType: string;
  data: any;
}

export interface RobotCommand {
  commandId: string;
  robotId: string;
  matchId: string;
  action: string;
  data: any;
}

export interface RobotEvent extends BaseEvent {
  robotId: string;
  eventType: string;
  data: any;
}

// Match event type definitions
export interface MatchStartedData {
  participants: string[];
  humanParticipant: string;
  robotParticipants: string[];
  createdAt: number;
}

export interface RoundStartedData {
  round: number;
  prompt: string;
  activeParticipants: string[];
}

export interface ResponseSubmittedData {
  round: number;
  participantId: string;
  participantType: 'human' | 'robot';
  response: string;
  submittedAt: number;
  robotType?: string;
  processingTime?: number;
  model?: string;
  generatedAt?: number;
}

export interface RoundCompletedData {
  round: number;
  responses: Array<{
    participantId: string;
    response: string;
  }>;
  completedAt: number;
}

export interface VotingStartedData {
  allResponses: Array<{
    participantId: string;
    response: string;
  }>;
  startedAt: number;
}

export interface VoteSubmittedData {
  voterId: string;
  humanGuess: string;
  submittedAt: number;
}

export interface MatchCompletedData {
  humanParticipant: string;
  humanGuess: string;
  result: 'correct' | 'incorrect';
  actualRobots: string[];
  completedAt: number;
  duration: number;
}

// Robot command data definitions
export interface GenerateResponseData {
  round: number;
  prompt: string;
  context: {
    otherResponses: Array<{
      participantId: string;
      response: string;
    }>;
    matchPhase: string;
  };
}

// Robot event data definitions
export interface ResponseGeneratedData {
  round: number;
  response: string;
  processingTime: number;
  model: string;
}

export interface ResponseErrorData {
  round: number;
  error: string;
  retryCount: number;
}

/**
 * Validates a match event structure
 */
export function validateMatchEvent(event: any): boolean {
  if (!event || typeof event !== 'object') {
    return false;
  }

  // Check required base fields
  if (!event.eventId || typeof event.eventId !== 'string') {
    return false;
  }

  if (!event.eventType || typeof event.eventType !== 'string') {
    return false;
  }

  if (!event.matchId || typeof event.matchId !== 'string') {
    return false;
  }

  if (!event.timestamp || typeof event.timestamp !== 'number') {
    return false;
  }

  if (!event.data || typeof event.data !== 'object') {
    return false;
  }

  // Validate specific event types
  switch (event.eventType) {
    case 'match.started':
      return validateMatchStartedData(event.data);
    case 'round.started':
      return validateRoundStartedData(event.data);
    case 'response.submitted':
    case 'response.generated':
      return validateResponseSubmittedData(event.data);
    case 'round.completed':
      return validateRoundCompletedData(event.data);
    case 'voting.started':
      return validateVotingStartedData(event.data);
    case 'vote.submitted':
      return validateVoteSubmittedData(event.data);
    case 'match.completed':
      return validateMatchCompletedData(event.data);
    default:
      // Allow unknown event types for future extensibility
      return true;
  }
}

/**
 * Validates a robot command structure
 */
export function validateRobotCommand(command: any): boolean {
  if (!command || typeof command !== 'object') {
    return false;
  }

  // Check required fields
  const requiredFields = ['commandId', 'robotId', 'matchId', 'action', 'data'];
  for (const field of requiredFields) {
    if (!command[field]) {
      return false;
    }
  }

  // Validate specific actions
  switch (command.action) {
    case 'generate_response':
      return validateGenerateResponseData(command.data);
    default:
      // Allow unknown actions for future extensibility
      return true;
  }
}

/**
 * Validates a robot event structure
 */
export function validateRobotEvent(event: any): boolean {
  if (!event || typeof event !== 'object') {
    return false;
  }

  // Check required fields
  const requiredFields = ['eventId', 'robotId', 'matchId', 'eventType', 'data'];
  for (const field of requiredFields) {
    if (!event[field]) {
      return false;
    }
  }

  // Validate specific event types
  switch (event.eventType) {
    case 'response.generated':
      return validateResponseGeneratedData(event.data);
    case 'response.error':
      return validateResponseErrorData(event.data);
    default:
      // Allow unknown event types for future extensibility
      return true;
  }
}

// Data validation helper functions
function validateMatchStartedData(data: any): boolean {
  return !!(
    data.participants &&
    Array.isArray(data.participants) &&
    data.participants.length === 4 &&
    data.humanParticipant &&
    data.robotParticipants &&
    Array.isArray(data.robotParticipants) &&
    data.robotParticipants.length === 3 &&
    data.createdAt &&
    typeof data.createdAt === 'number'
  );
}

function validateRoundStartedData(data: any): boolean {
  return !!(
    typeof data.round === 'number' &&
    data.round >= 1 &&
    data.round <= 5 &&
    data.prompt &&
    typeof data.prompt === 'string' &&
    data.activeParticipants &&
    Array.isArray(data.activeParticipants)
  );
}

function validateResponseSubmittedData(data: any): boolean {
  return !!(
    typeof data.round === 'number' &&
    data.participantId &&
    data.participantType &&
    ['human', 'robot'].includes(data.participantType) &&
    data.response &&
    typeof data.response === 'string' &&
    (data.submittedAt || data.generatedAt) &&
    typeof (data.submittedAt || data.generatedAt) === 'number'
  );
}

function validateRoundCompletedData(data: any): boolean {
  return !!(
    typeof data.round === 'number' &&
    data.responses &&
    Array.isArray(data.responses) &&
    data.responses.length === 4 &&
    data.completedAt &&
    typeof data.completedAt === 'number'
  );
}

function validateVotingStartedData(data: any): boolean {
  return !!(
    data.allResponses &&
    Array.isArray(data.allResponses) &&
    data.startedAt &&
    typeof data.startedAt === 'number'
  );
}

function validateVoteSubmittedData(data: any): boolean {
  return !!(
    data.voterId &&
    data.humanGuess &&
    data.submittedAt &&
    typeof data.submittedAt === 'number'
  );
}

function validateMatchCompletedData(data: any): boolean {
  return !!(
    data.humanParticipant &&
    data.humanGuess &&
    data.result &&
    ['correct', 'incorrect'].includes(data.result) &&
    data.actualRobots &&
    Array.isArray(data.actualRobots) &&
    data.completedAt &&
    typeof data.completedAt === 'number' &&
    data.duration &&
    typeof data.duration === 'number'
  );
}

function validateGenerateResponseData(data: any): boolean {
  return !!(
    typeof data.round === 'number' &&
    data.prompt &&
    typeof data.prompt === 'string' &&
    data.context &&
    typeof data.context === 'object'
  );
}

function validateResponseGeneratedData(data: any): boolean {
  return !!(
    typeof data.round === 'number' &&
    data.response &&
    typeof data.response === 'string' &&
    typeof data.processingTime === 'number' &&
    data.model &&
    typeof data.model === 'string'
  );
}

function validateResponseErrorData(data: any): boolean {
  return !!(
    typeof data.round === 'number' &&
    data.error &&
    typeof data.error === 'string' &&
    typeof data.retryCount === 'number'
  );
}

/**
 * Creates a properly formatted event ID
 */
export function createEventId(prefix = 'evt'): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}${random}`;
}

/**
 * Creates a properly formatted command ID
 */
export function createCommandId(): string {
  return createEventId('cmd');
}

/**
 * Event type constants
 */
export const EVENT_TYPES = {
  MATCH_STARTED: 'match.started',
  ROUND_STARTED: 'round.started',
  RESPONSE_SUBMITTED: 'response.submitted',
  RESPONSE_GENERATED: 'response.generated',
  ROUND_COMPLETED: 'round.completed',
  VOTING_STARTED: 'voting.started',
  VOTE_SUBMITTED: 'vote.submitted',
  MATCH_COMPLETED: 'match.completed',
  RESPONSE_ERROR: 'response.error'
} as const;

/**
 * Robot command action constants
 */
export const COMMAND_ACTIONS = {
  GENERATE_RESPONSE: 'generate_response'
} as const;