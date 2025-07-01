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
    _conversation: ConversationContext,
    newMessage: MessageContext,
    recentMessages: MessageContext[]
  ): Promise<AIResponseTrigger> {
    
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

    // SIMPLIFIED: Always respond for now during development
    // TODO: Re-enable sophisticated scoring when ready for production
    
    // Simple frequency check to avoid immediate back-to-back responses
    const lastPersonaMessage = recentMessages
      .filter(m => m.authorPersonaId === persona.id)
      .sort((a, b) => b.sequenceNumber - a.sequenceNumber)[0];
    
    // Don't respond if we just sent the previous message
    if (lastPersonaMessage && recentMessages[0]?.id === lastPersonaMessage.id) {
      return {
        personaId: persona.id,
        shouldRespond: false,
        responseDelay: 0,
        responseConfidence: 0,
        triggerReason: 'Just responded'
      };
    }

    // No delay for development - immediate responses
    const responseDelay = 0;
    
    console.log('AI decision (SIMPLIFIED):', { 
      personaName: persona.name,
      decision: 'will respond',
      mode: 'development - always respond'
    });

    return {
      personaId: persona.id,
      shouldRespond: true,
      responseDelay,
      responseConfidence: 1.0,
      triggerReason: 'development mode - always respond',
      scoreBreakdown: {
        topicRelevance: 1.0,
        personalityAlignment: 1.0,
        conversationFlow: 1.0,
        directMention: 1.0,
        frequencyPenalty: 0,
        totalScore: 1.0,
        threshold: 0.0,
        decision: 'will respond'
      }
    };
  }

  // TODO: Re-enable sophisticated scoring methods when ready for production
  // Removed unused helper methods for simplified AI response logic

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
}

/**
 * Factory function to create AI orchestration service instance
 */
export function createAIOrchestrator(): AIOrchestrationService {
  return new AIOrchestrationService();
}