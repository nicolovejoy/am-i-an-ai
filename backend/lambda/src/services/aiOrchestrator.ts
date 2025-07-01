/**
 * Server-side AI Orchestration Service
 * Consolidated from frontend aiOrchestrator.ts with enhanced server-side capabilities
 */

import { queryDatabase } from '../lib/database';

export interface PersonaParticipant {
  personaId: string;
  role: 'initiator' | 'responder';
  isRevealed: boolean;
  joinedAt: Date;
  lastActiveAt: Date;
}

export interface ConversationContext {
  id: string;
  title: string;
  topic: string;
  status: string;
  participants: PersonaParticipant[];
  messageCount: number;
}

export interface MessageContext {
  id: string;
  conversationId: string;
  authorPersonaId: string;
  content: string;
  type: string;
  sequenceNumber: number;
  timestamp: Date;
  metadata: any;
}

export interface PersonaProfile {
  id: string;
  name: string;
  type: 'human_persona' | 'ai_agent' | 'ai_ambiguous';
  description?: string;
  personality?: any;
  knowledge?: string[];
  communicationStyle?: string;
  modelConfig?: any;
  systemPrompt?: string;
  allowedInteractions?: string[];
}

export interface AIResponseTrigger {
  personaId: string;
  shouldRespond: boolean;
  responseDelay: number; // milliseconds
  responseConfidence: number; // 0-1
  triggerReason: string;
  scoreBreakdown?: {
    topicRelevance: number;
    personalityAlignment: number;
    conversationFlow: number;
    directMention: number;
    frequencyPenalty: number;
    totalScore: number;
    threshold: number;
    decision: string;
  };
}

/**
 * Main AI Orchestration Service
 */
export class AIOrchestrationService {
  /**
   * Analyze conversation and determine which AI personas should respond
   */
  async analyzeAIResponseTriggers(
    conversation: ConversationContext,
    newMessage: MessageContext,
    allPersonas: PersonaProfile[]
  ): Promise<AIResponseTrigger[]> {
    const triggers: AIResponseTrigger[] = [];
    
    // Get AI participants only
    const aiParticipants = conversation.participants.filter(p => {
      const participantPersonaId = (p as any).personaId || (p as any).persona_id;
      const persona = allPersonas.find(persona => persona.id === participantPersonaId);
      console.log('Checking participant:', { participantPersonaId, persona: persona ? { id: persona.id, name: persona.name, type: persona.type } : null });
      return persona && (persona.type === 'ai_agent' || persona.type === 'ai_ambiguous');
    });

    console.log('AI participants found:', aiParticipants.length);
    console.log('AI participants details:', aiParticipants.map(p => ({ personaId: (p as any).personaId || (p as any).persona_id })));

    if (aiParticipants.length === 0) {
      console.log('No AI participants found, returning empty triggers');
      return triggers;
    }

    // Get recent conversation history for context
    const recentMessages = await this.getRecentMessages(conversation.id, 10);
    
    // Analyze each AI participant
    for (const participant of aiParticipants) {
      const participantPersonaId = (participant as any).personaId || (participant as any).persona_id;
      const persona = allPersonas.find(p => p.id === participantPersonaId);
      if (!persona) {
        console.log('Persona not found for participant:', participantPersonaId);
        continue;
      }

      console.log('Analyzing trigger for AI persona:', { id: persona.id, name: persona.name, type: persona.type });
      
      const trigger = await this.analyzePersonaResponseTrigger(
        persona,
        conversation,
        newMessage,
        recentMessages
      );

      console.log('Trigger analysis result:', { 
        personaId: trigger.personaId, 
        shouldRespond: trigger.shouldRespond, 
        reason: trigger.triggerReason,
        confidence: trigger.responseConfidence 
      });

      if (trigger.shouldRespond) {
        triggers.push(trigger);
      }
    }

    return triggers;
  }

  /**
   * Analyze if a specific AI persona should respond
   */
  private async analyzePersonaResponseTrigger(
    persona: PersonaProfile,
    conversation: ConversationContext,
    newMessage: MessageContext,
    recentMessages: MessageContext[]
  ): Promise<AIResponseTrigger> {
    
    let shouldRespond = false;
    let responseConfidence = 0;
    let triggerReason = '';
    let responseDelay = 1000; // Default 1 second delay

    // Skip if message is from this AI persona itself
    if (newMessage.authorPersonaId === persona.id) {
      return {
        personaId: persona.id,
        shouldRespond: false,
        responseDelay: 0,
        responseConfidence: 0,
        triggerReason: 'Message from self'
      };
    }

    // Calculate base response likelihood
    let responseScore = 0;

    // 1. Topic relevance scoring
    const topicScore = this.calculateTopicRelevance(persona, conversation, newMessage);
    responseScore += topicScore * 0.3;

    // 2. Personality-based response likelihood
    const personalityScore = this.calculatePersonalityResponseLikelihood(persona, newMessage);
    responseScore += personalityScore * 0.25;

    // 3. Conversation flow analysis
    const flowScore = this.analyzeConversationFlow(persona, recentMessages);
    responseScore += flowScore * 0.25;

    // 4. Direct mention or question detection
    const mentionScore = this.detectDirectMention(persona, newMessage);
    responseScore += mentionScore * 0.2;

    // 5. Response frequency penalty (avoid over-responding)
    const frequencyPenalty = this.calculateFrequencyPenalty(persona, recentMessages);
    responseScore *= (1 - frequencyPenalty);

    // Determine if should respond (threshold: 0.3 for more engagement)
    shouldRespond = responseScore > 0.3;
    responseConfidence = Math.min(responseScore, 1.0);

    // Calculate response delay based on personality and confidence
    responseDelay = this.calculateResponseDelay(persona, responseConfidence);

    // Generate trigger reason
    triggerReason = this.generateTriggerReason(topicScore, personalityScore, flowScore, mentionScore);
    
    // Add detailed breakdown for UX feedback
    const scoreBreakdown = {
      topicRelevance: topicScore,
      personalityAlignment: personalityScore,
      conversationFlow: flowScore,
      directMention: mentionScore,
      frequencyPenalty: frequencyPenalty,
      totalScore: responseScore,
      threshold: 0.3,
      decision: shouldRespond ? 'will respond' : 'will not respond'
    };
    
    console.log('AI decision breakdown:', { 
      personaName: persona.name,
      scoreBreakdown,
      triggerReason 
    });

    return {
      personaId: persona.id,
      shouldRespond,
      responseDelay,
      responseConfidence,
      triggerReason,
      scoreBreakdown
    };
  }

  /**
   * Calculate topic relevance score (0-1)
   */
  private calculateTopicRelevance(persona: PersonaProfile, conversation: ConversationContext, message: MessageContext): number {
    let score = 0;

    // Check knowledge domain alignment
    if (persona.knowledge && persona.knowledge.length > 0) {
      const messageWords = message.content.toLowerCase().split(/\s+/);
      const knowledgeKeywords = persona.knowledge.flatMap(domain => this.getKeywordsForDomain(domain));
      
      const matchingKeywords = messageWords.filter(word => 
        knowledgeKeywords.some(keyword => word.includes(keyword.toLowerCase()))
      );
      
      score += Math.min(matchingKeywords.length / 10, 0.5); // Max 0.5 from keyword matching
    }

    // Check conversation topic alignment
    if (conversation.topic) {
      const topicWords = conversation.topic.toLowerCase().split(/\s+/);
      const messageWords = message.content.toLowerCase().split(/\s+/);
      const topicOverlap = topicWords.filter(word => messageWords.includes(word)).length;
      score += Math.min(topicOverlap / topicWords.length, 0.3); // Max 0.3 from topic overlap
    }

    // Check allowed interactions
    if (persona.allowedInteractions) {
      const messageType = this.classifyMessageType(message.content);
      if (persona.allowedInteractions.includes(messageType)) {
        score += 0.2; // Boost for allowed interaction type
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate personality-based response likelihood (0-1)
   */
  private calculatePersonalityResponseLikelihood(persona: PersonaProfile, message: MessageContext): number {
    if (!persona.personality) return 0.5; // Default moderate likelihood

    let score = 0;

    // Extract personality traits (assuming Big Five + custom traits)
    const personality = persona.personality;
    
    // Extraversion: More likely to respond to social messages
    const extraversion = personality.extraversion || 50;
    if (this.isSocialMessage(message.content)) {
      score += (extraversion / 100) * 0.3;
    }

    // Openness: More likely to respond to creative/novel topics
    const openness = personality.openness || 50;
    if (this.isCreativeOrNovelMessage(message.content)) {
      score += (openness / 100) * 0.3;
    }

    // Agreeableness: More likely to respond to questions or help requests
    const agreeableness = personality.agreeableness || 50;
    if (this.isQuestionOrHelpRequest(message.content)) {
      score += (agreeableness / 100) * 0.3;
    }

    // Communication style alignment
    if (persona.communicationStyle) {
      const styleMatch = this.doesMessageMatchCommunicationStyle(message.content, persona.communicationStyle);
      score += styleMatch * 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Analyze conversation flow patterns (0-1)
   */
  private analyzeConversationFlow(persona: PersonaProfile, recentMessages: MessageContext[]): number {
    let score = 0;

    // Check if persona has been quiet for a while
    const personaLastMessage = recentMessages
      .filter(m => m.authorPersonaId === persona.id)
      .sort((a, b) => b.sequenceNumber - a.sequenceNumber)[0];

    if (!personaLastMessage) {
      // Never participated - moderate chance to join
      score += 0.4;
    } else {
      const messagesSinceLastResponse = recentMessages.filter(
        m => m.sequenceNumber > personaLastMessage.sequenceNumber
      ).length;

      // Increase likelihood if been quiet for 2-4 messages
      if (messagesSinceLastResponse >= 2 && messagesSinceLastResponse <= 4) {
        score += 0.3;
      } else if (messagesSinceLastResponse > 4) {
        score += 0.5; // Even higher if been quiet longer
      }
    }

    // Check for conversation lulls (encourage engagement)
    const averageGapBetweenMessages = this.calculateAverageMessageGap(recentMessages);
    if (averageGapBetweenMessages > 300000) { // 5 minutes
      score += 0.2;
    }

    // Check if conversation is getting stale (same participants)
    const recentAuthors = recentMessages.slice(0, 5).map(m => m.authorPersonaId);
    const uniqueRecentAuthors = new Set(recentAuthors).size;
    if (uniqueRecentAuthors <= 2) {
      score += 0.3; // Encourage new voice
    }

    return Math.min(score, 1.0);
  }

  /**
   * Detect direct mentions or questions (0-1)
   */
  private detectDirectMention(persona: PersonaProfile, message: MessageContext): number {
    const content = message.content.toLowerCase();
    const personaName = persona.name.toLowerCase();

    // Check for direct name mention
    if (content.includes(personaName)) {
      return 0.9;
    }

    // Check for question patterns that might be directed at AI
    const questionPatterns = [
      /what do you think/i,
      /how would you/i,
      /can you help/i,
      /do you know/i,
      /what about you/i,
      /your opinion/i,
      /your thoughts/i
    ];

    for (const pattern of questionPatterns) {
      if (pattern.test(content)) {
        return 0.6;
      }
    }

    // Check for general questions
    if (content.includes('?')) {
      return 0.3;
    }

    return 0;
  }

  /**
   * Calculate frequency penalty to avoid over-responding (0-1, higher = more penalty)
   */
  private calculateFrequencyPenalty(persona: PersonaProfile, recentMessages: MessageContext[]): number {
    const personaMessages = recentMessages.filter(m => m.authorPersonaId === persona.id);
    const totalMessages = recentMessages.length;

    if (totalMessages === 0) return 0;

    const participationRatio = personaMessages.length / totalMessages;

    // Penalize if persona is dominating conversation (>40%)
    if (participationRatio > 0.4) {
      return Math.min((participationRatio - 0.4) * 2, 0.6); // Max 60% penalty
    }

    return 0;
  }

  /**
   * Calculate response delay based on personality and confidence
   */
  private calculateResponseDelay(persona: PersonaProfile, confidence: number): number {
    let baseDelay = 2000; // 2 second base delay

    // Personality-based adjustments
    if (persona.personality) {
      const extraversion = persona.personality.extraversion || 50;
      const conscientiousness = persona.personality.conscientiousness || 50;

      // More extraverted = faster response
      baseDelay *= (150 - extraversion) / 100;

      // More conscientious = slightly slower (thinking time)
      baseDelay *= (50 + conscientiousness) / 100;
    }

    // Confidence-based adjustments
    // Higher confidence = faster response
    const confidenceMultiplier = (2 - confidence); // 1.0 to 2.0
    baseDelay *= confidenceMultiplier;

    // Add random variation (±30%)
    const variation = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
    baseDelay *= variation;

    // Ensure reasonable bounds (500ms to 10s)
    return Math.max(500, Math.min(baseDelay, 10000));
  }

  /**
   * Generate human-readable trigger reason
   */
  private generateTriggerReason(
    topicScore: number,
    personalityScore: number,
    flowScore: number,
    mentionScore: number
  ): string {
    const reasons = [];

    if (mentionScore > 0.5) {
      reasons.push('directly mentioned or questioned');
    }
    if (topicScore > 0.4) {
      reasons.push('topic relevance');
    }
    if (personalityScore > 0.4) {
      reasons.push('personality alignment');
    }
    if (flowScore > 0.4) {
      reasons.push('conversation flow');
    }

    if (reasons.length === 0) {
      return 'low engagement threshold';
    }

    return reasons.join(', ');
  }

  // Helper methods

  private async getRecentMessages(conversationId: string, limit: number): Promise<MessageContext[]> {
    const query = `
      SELECT id, conversation_id, author_persona_id, content, type, 
             sequence_number, timestamp, metadata
      FROM messages 
      WHERE conversation_id = $1 
        AND is_visible = true 
        AND is_archived = false
      ORDER BY sequence_number DESC 
      LIMIT $2
    `;
    
    const result = await queryDatabase(query, [conversationId, limit]);
    
    return result.rows.map((row: any) => ({
      id: row.id,
      conversationId: row.conversation_id,
      authorPersonaId: row.author_persona_id,
      content: row.content,
      type: row.type,
      sequenceNumber: row.sequence_number,
      timestamp: new Date(row.timestamp),
      metadata: row.metadata || {}
    }));
  }

  private getKeywordsForDomain(domain: string): string[] {
    const domainKeywords: Record<string, string[]> = {
      technology: ['tech', 'software', 'computer', 'digital', 'programming', 'code', 'algorithm', 'data'],
      science: ['research', 'experiment', 'hypothesis', 'theory', 'analysis', 'study', 'discovery'],
      arts: ['creative', 'design', 'music', 'art', 'culture', 'aesthetic', 'beauty', 'expression'],
      business: ['strategy', 'market', 'profit', 'sales', 'management', 'leadership', 'growth'],
      philosophy: ['ethics', 'morality', 'existence', 'truth', 'meaning', 'consciousness', 'reality'],
      psychology: ['behavior', 'mind', 'emotion', 'cognitive', 'mental', 'personality', 'therapy'],
      education: ['learning', 'teaching', 'knowledge', 'curriculum', 'student', 'academic'],
      health: ['wellness', 'medical', 'fitness', 'nutrition', 'disease', 'treatment', 'therapy']
    };

    return domainKeywords[domain] || [];
  }

  private classifyMessageType(content: string): string {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('?')) return 'casual_chat';
    if (lowerContent.includes('debate') || lowerContent.includes('argue')) return 'debate';
    if (lowerContent.includes('story') || lowerContent.includes('imagine')) return 'storytelling';
    if (lowerContent.includes('idea') || lowerContent.includes('brainstorm')) return 'brainstorm';
    if (lowerContent.includes('role') || lowerContent.includes('pretend')) return 'roleplay';
    
    return 'casual_chat';
  }

  private isSocialMessage(content: string): boolean {
    const socialPatterns = [
      /how are you/i,
      /nice to meet/i,
      /good morning/i,
      /have a great/i,
      /thanks/i,
      /hello/i,
      /hi there/i
    ];
    
    return socialPatterns.some(pattern => pattern.test(content));
  }

  private isCreativeOrNovelMessage(content: string): boolean {
    const creativePatterns = [
      /imagine/i,
      /creative/i,
      /innovative/i,
      /unique/i,
      /original/i,
      /artistic/i,
      /design/i
    ];
    
    return creativePatterns.some(pattern => pattern.test(content));
  }

  private isQuestionOrHelpRequest(content: string): boolean {
    return content.includes('?') || 
           /help|assist|support|guide|explain/i.test(content);
  }

  private doesMessageMatchCommunicationStyle(content: string, style: string): number {
    const stylePatterns: Record<string, RegExp[]> = {
      formal: [/indeed/i, /furthermore/i, /therefore/i, /however/i],
      casual: [/yeah/i, /cool/i, /awesome/i, /totally/i],
      academic: [/research/i, /study/i, /analysis/i, /hypothesis/i],
      creative: [/imagine/i, /inspired/i, /artistic/i, /beautiful/i],
      technical: [/algorithm/i, /data/i, /system/i, /process/i],
      empathetic: [/understand/i, /feel/i, /sorry/i, /care/i],
      humorous: [/lol/i, /haha/i, /funny/i, /joke/i]
    };

    const patterns = stylePatterns[style] || [];
    const matches = patterns.filter(pattern => pattern.test(content)).length;
    
    return Math.min(matches / patterns.length, 1.0);
  }

  private calculateAverageMessageGap(messages: MessageContext[]): number {
    if (messages.length < 2) return 0;

    let totalGap = 0;
    for (let i = 1; i < messages.length; i++) {
      const gap = messages[i-1].timestamp.getTime() - messages[i].timestamp.getTime();
      totalGap += gap;
    }

    return totalGap / (messages.length - 1);
  }
}

/**
 * Factory function to create AI orchestration service instance
 */
export function createAIOrchestrator(): AIOrchestrationService {
  return new AIOrchestrationService();
}