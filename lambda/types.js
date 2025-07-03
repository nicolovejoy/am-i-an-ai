"use strict";
/**
 * Core type definitions for 5-Round Match System
 * Clean Match/Round architecture replacing Session/Message terminology
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AI_PERSONALITIES = exports.DEFAULT_MATCH_SETTINGS = exports.MATCH_PROMPTS = void 0;
/**
 * Hardcoded prompts for MVP (replace with AI generation later)
 */
exports.MATCH_PROMPTS = [
    "What's one thing that recently surprised you in a good way?",
    "If you could teleport anywhere right now, where would you go?",
    "What's one small thing that often makes your day better?",
    "What's a random act of kindness you've seen or done?",
    "What's a beloved sound or smell that triggers nostalgia?",
    "What's a new idea you just came up with?"
];
/**
 * Default match settings for MVP
 */
exports.DEFAULT_MATCH_SETTINGS = {
    responseTimeLimit: 90, // 90 seconds max per response
    votingTimeLimit: 30, // 30 seconds for voting
    roundTimeLimit: 300, // 5 minutes total per round
    totalRounds: 5 // 5 rounds per match
};
/**
 * AI personalities for mock responses
 */
exports.AI_PERSONALITIES = {
    curious_student: "Curious and asking questions, uses casual language",
    witty_professional: "Professional but with dry humor, concise responses",
    friendly_skeptic: "Friendly but questions assumptions, thoughtful responses"
};
