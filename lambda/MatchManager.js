"use strict";
/**
 * MatchManager - Core logic for 5-Round Match System
 * Handles match creation, participant management, and round transitions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchManager = void 0;
const types_1 = require("./types");
class MatchManager {
    constructor() {
        this.matches = new Map();
        this.connectionToMatch = new Map();
    }
    /**
     * Create a new match
     */
    createMatch(matchId) {
        const match = {
            matchId,
            status: 'waiting',
            currentRound: 0,
            participants: [],
            rounds: [],
            settings: { ...types_1.DEFAULT_MATCH_SETTINGS },
            createdAt: Date.now()
        };
        this.matches.set(matchId, match);
        return match;
    }
    /**
     * Add a human participant to a match
     */
    addHumanParticipant(matchId, connectionId) {
        const match = this.getMatch(matchId);
        if (!match) {
            throw new Error(`Match ${matchId} not found`);
        }
        if (match.participants.length >= 4) {
            throw new Error('Match is full');
        }
        if (match.status !== 'waiting') {
            throw new Error('Cannot join match in progress');
        }
        // Assign random available identity
        const usedIdentities = new Set(match.participants.map(p => p.identity));
        const availableIdentities = ['A', 'B', 'C', 'D'].filter(id => !usedIdentities.has(id));
        if (availableIdentities.length === 0) {
            throw new Error('No available identities');
        }
        const randomIndex = Math.floor(Math.random() * availableIdentities.length);
        const identity = availableIdentities[randomIndex];
        const participant = {
            id: `human-${Date.now()}-${Math.random()}`,
            connectionId,
            identity,
            type: 'human'
        };
        match.participants.push(participant);
        this.connectionToMatch.set(connectionId, matchId);
        // If we now have 2 humans, add 2 AI participants
        if (match.participants.filter(p => p.type === 'human').length === 2) {
            this.addAIParticipants(matchId);
        }
        return { participant, identity };
    }
    /**
     * Add AI participants to fill the match
     */
    addAIParticipants(matchId) {
        const match = this.getMatch(matchId);
        if (!match)
            return;
        const usedIdentities = new Set(match.participants.map(p => p.identity));
        const availableIdentities = ['A', 'B', 'C', 'D'].filter(id => !usedIdentities.has(id));
        const aiPersonalities = ['curious_student', 'witty_professional', 'friendly_skeptic'];
        // Add AI participants to fill up to 4 total participants
        const targetAIs = 4 - match.participants.length;
        for (let i = 0; i < targetAIs && i < availableIdentities.length; i++) {
            const aiParticipant = {
                id: `ai-${Date.now()}-${i}`,
                connectionId: null,
                identity: availableIdentities[i],
                type: 'ai',
                personality: aiPersonalities[i]
            };
            match.participants.push(aiParticipant);
        }
    }
    /**
     * Start the first round of a match
     */
    startMatch(matchId) {
        const match = this.getMatch(matchId);
        if (!match) {
            throw new Error(`Match ${matchId} not found`);
        }
        if (match.participants.length !== 4) {
            throw new Error('Match needs exactly 4 participants to start');
        }
        if (match.status !== 'waiting') {
            throw new Error('Match already started');
        }
        match.status = 'round_active';
        match.currentRound = 1;
        const round = this.startRound(matchId, 1);
        return round;
    }
    /**
     * Start a specific round
     */
    startRound(matchId, roundNumber) {
        const match = this.getMatch(matchId);
        if (!match) {
            throw new Error(`Match ${matchId} not found`);
        }
        // Get prompt for this round (cycle through available prompts)
        const promptIndex = (roundNumber - 1) % types_1.MATCH_PROMPTS.length;
        const prompt = types_1.MATCH_PROMPTS[promptIndex];
        const round = {
            roundNumber,
            prompt,
            responses: {},
            votes: {},
            scores: {},
            startTime: Date.now()
        };
        match.rounds.push(round);
        match.status = 'round_active';
        return round;
    }
    /**
     * Submit a response for the current round
     */
    submitResponse(matchId, identity, response) {
        const match = this.getMatch(matchId);
        if (!match) {
            throw new Error(`Match ${matchId} not found`);
        }
        if (match.status !== 'round_active') {
            throw new Error('Not in active round');
        }
        const currentRound = this.getCurrentRound(match);
        if (!currentRound) {
            throw new Error('No active round');
        }
        // Store the response
        currentRound.responses[identity] = response;
        // Check if all participants have responded
        if (Object.keys(currentRound.responses).length === 4) {
            match.status = 'round_voting';
            return true; // All responses collected
        }
        return false; // Still waiting for more responses
    }
    /**
     * Submit a vote for the current round
     */
    submitVote(matchId, voterIdentity, humanIdentity) {
        const match = this.getMatch(matchId);
        if (!match) {
            throw new Error(`Match ${matchId} not found`);
        }
        if (match.status !== 'round_voting') {
            throw new Error('Not in voting phase');
        }
        const currentRound = this.getCurrentRound(match);
        if (!currentRound) {
            throw new Error('No active round');
        }
        // Store the vote
        currentRound.votes[voterIdentity] = humanIdentity;
        // Check if all participants have voted
        if (Object.keys(currentRound.votes).length === 4) {
            this.completeRound(matchId);
            return true; // All votes collected
        }
        return false; // Still waiting for more votes
    }
    /**
     * Complete the current round and calculate scores
     */
    completeRound(matchId) {
        const match = this.getMatch(matchId);
        if (!match)
            return;
        const currentRound = this.getCurrentRound(match);
        if (!currentRound)
            return;
        // Calculate scores: 1 point for correctly identifying the human
        const humanParticipant = match.participants.find(p => p.type === 'human');
        if (humanParticipant) {
            const humanIdentity = humanParticipant.identity;
            for (const [voterIdentity, votedIdentity] of Object.entries(currentRound.votes)) {
                const score = votedIdentity === humanIdentity ? 1 : 0;
                currentRound.scores[voterIdentity] = score;
            }
        }
        // Generate AI summary (mock for now)
        currentRound.summary = this.generateRoundSummary(currentRound);
        currentRound.endTime = Date.now();
        // Check if match is complete
        if (match.currentRound >= match.settings.totalRounds) {
            this.completeMatch(matchId);
        }
        else {
            // Start next round
            match.currentRound++;
            this.startRound(matchId, match.currentRound);
        }
    }
    /**
     * Complete the entire match
     */
    completeMatch(matchId) {
        const match = this.getMatch(matchId);
        if (!match)
            return;
        match.status = 'completed';
        match.completedAt = Date.now();
        // Calculate final scores
        const finalScores = {};
        for (const participant of match.participants) {
            const totalScore = match.rounds.reduce((sum, round) => {
                return sum + (round.scores[participant.identity] || 0);
            }, 0);
            finalScores[participant.identity] = totalScore;
        }
        match.finalScores = finalScores;
    }
    /**
     * Generate a round summary (mock AI response for MVP)
     */
    generateRoundSummary(round) {
        const responseCount = Object.keys(round.responses).length;
        const summaries = [
            `Interesting mix of ${responseCount} responses! Let's see what patterns emerge...`,
            `Great variety in these answers. Moving to the next question...`,
            `Some thoughtful responses here. The plot thickens...`,
            `Different perspectives showing. Let's continue...`,
            `Nice range of answers! Time for the next round...`
        ];
        return summaries[Math.floor(Math.random() * summaries.length)];
    }
    /**
     * Get match by ID
     */
    getMatch(matchId) {
        return this.matches.get(matchId);
    }
    /**
     * Get match by connection ID
     */
    getMatchByConnection(connectionId) {
        const matchId = this.connectionToMatch.get(connectionId);
        return matchId ? this.getMatch(matchId) : undefined;
    }
    /**
     * Get current round for a match
     */
    getCurrentRound(match) {
        return match.rounds.find(r => r.roundNumber === match.currentRound);
    }
    /**
     * Remove participant from match
     */
    removeParticipant(connectionId) {
        const matchId = this.connectionToMatch.get(connectionId);
        if (!matchId)
            return;
        const match = this.getMatch(matchId);
        if (!match)
            return;
        // Remove participant
        match.participants = match.participants.filter(p => p.connectionId !== connectionId);
        this.connectionToMatch.delete(connectionId);
        // Clean up empty matches
        if (match.participants.filter(p => p.type === 'human').length === 0) {
            this.matches.delete(matchId);
        }
    }
    /**
     * Get all matches (for testing)
     */
    getAllMatches() {
        return Array.from(this.matches.values());
    }
    /**
     * Clear all matches (for testing)
     */
    clearAllMatches() {
        this.matches.clear();
        this.connectionToMatch.clear();
    }
}
exports.MatchManager = MatchManager;
