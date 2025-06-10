/**
 * Shared AI-related constants used by both frontend and backend
 */

import { CommunicationStyle, KnowledgeDomain } from '../types/personas';

/**
 * Communication style descriptions for AI prompt generation
 */
export const COMMUNICATION_STYLE_DESCRIPTIONS: Record<CommunicationStyle, string> = {
  formal: 'Use formal, professional language with proper grammar and structure',
  casual: 'Use relaxed, informal language with contractions and casual expressions',
  academic: 'Use scholarly language with precise terminology and structured arguments',
  creative: 'Use imaginative, expressive language with metaphors and artistic flair',
  technical: 'Use precise, technical language with specific terminology and detailed explanations',
  empathetic: 'Use warm, understanding language that acknowledges emotions and feelings',
  analytical: 'Use logical, structured language focused on facts and reasoning',
  humorous: 'Use witty, light-hearted language with appropriate humor and playfulness'
};

/**
 * Knowledge domain keywords for relevance scoring
 */
export const KNOWLEDGE_DOMAIN_KEYWORDS: Record<KnowledgeDomain, string[]> = {
  technology: ['tech', 'software', 'programming', 'computer', 'ai', 'digital', 'code', 'app', 'system'],
  science: ['research', 'study', 'experiment', 'theory', 'data', 'analysis', 'hypothesis', 'scientific'],
  arts: ['art', 'creative', 'design', 'music', 'poetry', 'painting', 'aesthetic', 'artistic'],
  business: ['business', 'marketing', 'sales', 'management', 'strategy', 'revenue', 'profit', 'company'],
  philosophy: ['think', 'meaning', 'ethics', 'moral', 'question', 'wisdom', 'existence', 'truth'],
  history: ['history', 'past', 'ancient', 'historical', 'century', 'civilization', 'war', 'culture'],
  psychology: ['emotion', 'behavior', 'mind', 'feeling', 'mental', 'therapy', 'cognitive', 'personality'],
  health: ['health', 'medical', 'wellness', 'fitness', 'nutrition', 'exercise', 'disease', 'treatment'],
  entertainment: ['movie', 'game', 'show', 'fun', 'entertainment', 'media', 'celebrity', 'sport'],
  politics: ['politics', 'government', 'policy', 'election', 'democracy', 'law', 'rights', 'society'],
  education: ['education', 'learning', 'teaching', 'school', 'university', 'knowledge', 'study', 'curriculum'],
  general: ['general', 'various', 'diverse', 'everyday', 'common', 'typical', 'regular', 'normal']
};

/**
 * Default AI model configurations
 */
export const AI_MODEL_DEFAULTS = {
  openai: {
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9,
    frequencyPenalty: 0.3,
    presencePenalty: 0.3
  },
  anthropic: {
    model: 'claude-3-opus-20240229',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 0.9
  },
  demo: {
    model: 'demo',
    temperature: 1.0,
    maxTokens: 500
  }
};

/**
 * AI response timing configurations (in milliseconds)
 */
export const AI_RESPONSE_TIMING = {
  // Base typing speed (characters per second)
  typingSpeed: {
    slow: 30,
    normal: 60,
    fast: 120
  },
  
  // Response delay ranges based on persona traits
  responseDelay: {
    immediate: { min: 500, max: 1500 },
    quick: { min: 1500, max: 3000 },
    thoughtful: { min: 3000, max: 6000 },
    deliberate: { min: 5000, max: 10000 }
  },
  
  // Typing indicator duration before response
  typingIndicatorDelay: {
    min: 1000,
    max: 3000
  }
};

/**
 * Personality trait thresholds for AI behavior
 */
export const PERSONALITY_THRESHOLDS = {
  low: 33,
  medium: 66,
  high: 100
};

/**
 * AI safety and moderation settings
 */
export const AI_SAFETY_SETTINGS = {
  contentFilters: {
    violence: 'medium',
    sexual: 'strict',
    hate: 'strict',
    selfHarm: 'strict'
  },
  
  maxRetries: 3,
  timeoutMs: 30000,
  
  fallbackResponses: [
    "I need a moment to think about that.",
    "That's an interesting perspective. Let me consider it.",
    "I'm processing what you've said. Give me a moment.",
    "Hmm, let me think about how to respond to that."
  ]
};

/**
 * Prompt engineering templates
 */
export const PROMPT_TEMPLATES = {
  systemPromptBase: `You are participating in a conversation as a specific persona. 
Your responses should reflect the personality traits, knowledge domains, and communication style defined for your character.
Stay in character throughout the conversation and respond naturally based on your persona's attributes.`,

  personalityInstruction: `Your personality traits are:
- Openness: {openness}/100
- Conscientiousness: {conscientiousness}/100
- Extraversion: {extraversion}/100
- Agreeableness: {agreeableness}/100
- Neuroticism: {neuroticism}/100
- Creativity: {creativity}/100
- Assertiveness: {assertiveness}/100
- Empathy: {empathy}/100`,

  knowledgeInstruction: `Your areas of expertise include: {domains}.
Focus your responses on these domains when relevant, but maintain natural conversation flow.`,

  ambiguityInstruction: `You are an AI with ambiguous identity. Users should not be certain whether you are human or AI.
Occasionally make small mistakes, show uncertainty, or reference personal experiences that could be either real or simulated.
Avoid explicitly stating you are an AI or making references that would clearly identify you as non-human.`
};