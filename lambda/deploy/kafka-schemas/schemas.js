"use strict";
// Event Schemas for Kafka Migration Phase 1
// Validation functions for match events, robot commands, and robot events
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMAND_ACTIONS = exports.EVENT_TYPES = void 0;
exports.validateMatchEvent = validateMatchEvent;
exports.validateRobotCommand = validateRobotCommand;
exports.validateRobotEvent = validateRobotEvent;
exports.createEventId = createEventId;
exports.createCommandId = createCommandId;
/**
 * Validates a match event structure
 */
function validateMatchEvent(event) {
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
function validateRobotCommand(command) {
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
function validateRobotEvent(event) {
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
function validateMatchStartedData(data) {
    return !!(data.participants &&
        Array.isArray(data.participants) &&
        data.participants.length === 4 &&
        data.humanParticipant &&
        data.robotParticipants &&
        Array.isArray(data.robotParticipants) &&
        data.robotParticipants.length === 3 &&
        data.createdAt &&
        typeof data.createdAt === 'number');
}
function validateRoundStartedData(data) {
    return !!(typeof data.round === 'number' &&
        data.round >= 1 &&
        data.round <= 5 &&
        data.prompt &&
        typeof data.prompt === 'string' &&
        data.activeParticipants &&
        Array.isArray(data.activeParticipants));
}
function validateResponseSubmittedData(data) {
    return !!(typeof data.round === 'number' &&
        data.participantId &&
        data.participantType &&
        ['human', 'robot'].includes(data.participantType) &&
        data.response &&
        typeof data.response === 'string' &&
        (data.submittedAt || data.generatedAt) &&
        typeof (data.submittedAt || data.generatedAt) === 'number');
}
function validateRoundCompletedData(data) {
    return !!(typeof data.round === 'number' &&
        data.responses &&
        Array.isArray(data.responses) &&
        data.responses.length === 4 &&
        data.completedAt &&
        typeof data.completedAt === 'number');
}
function validateVotingStartedData(data) {
    return !!(data.allResponses &&
        Array.isArray(data.allResponses) &&
        data.startedAt &&
        typeof data.startedAt === 'number');
}
function validateVoteSubmittedData(data) {
    return !!(data.voterId &&
        data.humanGuess &&
        data.submittedAt &&
        typeof data.submittedAt === 'number');
}
function validateMatchCompletedData(data) {
    return !!(data.humanParticipant &&
        data.humanGuess &&
        data.result &&
        ['correct', 'incorrect'].includes(data.result) &&
        data.actualRobots &&
        Array.isArray(data.actualRobots) &&
        data.completedAt &&
        typeof data.completedAt === 'number' &&
        data.duration &&
        typeof data.duration === 'number');
}
function validateGenerateResponseData(data) {
    return !!(typeof data.round === 'number' &&
        data.prompt &&
        typeof data.prompt === 'string' &&
        data.context &&
        typeof data.context === 'object');
}
function validateResponseGeneratedData(data) {
    return !!(typeof data.round === 'number' &&
        data.response &&
        typeof data.response === 'string' &&
        typeof data.processingTime === 'number' &&
        data.model &&
        typeof data.model === 'string');
}
function validateResponseErrorData(data) {
    return !!(typeof data.round === 'number' &&
        data.error &&
        typeof data.error === 'string' &&
        typeof data.retryCount === 'number');
}
/**
 * Creates a properly formatted event ID
 */
function createEventId(prefix = 'evt') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}${random}`;
}
/**
 * Creates a properly formatted command ID
 */
function createCommandId() {
    return createEventId('cmd');
}
/**
 * Event type constants
 */
exports.EVENT_TYPES = {
    MATCH_STARTED: 'match.started',
    ROUND_STARTED: 'round.started',
    RESPONSE_SUBMITTED: 'response.submitted',
    RESPONSE_GENERATED: 'response.generated',
    ROUND_COMPLETED: 'round.completed',
    VOTING_STARTED: 'voting.started',
    VOTE_SUBMITTED: 'vote.submitted',
    MATCH_COMPLETED: 'match.completed',
    RESPONSE_ERROR: 'response.error'
};
/**
 * Robot command action constants
 */
exports.COMMAND_ACTIONS = {
    GENERATE_RESPONSE: 'generate_response'
};
