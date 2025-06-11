import { Persona } from '@/types/personas';
import { Message } from '@/types/messages';
import { Conversation } from '@/types/conversations';
import { KNOWLEDGE_DOMAIN_KEYWORDS } from '@/shared/constants/ai';

export interface AIResponseTrigger {
  personaId: string;
  priority: number; // 0-1, higher means more likely to respond
  reason: string;
  suggestedDelay: number; // milliseconds
}

export interface OrchestrationContext {
  conversation: Conversation;
  newMessage: Message;
  allParticipants: Persona[];
  aiParticipants: Persona[];
  recentMessages: Message[];
}

export class AIOrchestrator {
  /**
   * Determine which AI personas should respond to a new message
   * For demo mode - works with mock data passed directly
   */
  async analyzeResponseTriggers(
    conversation: Conversation,
    newMessage: Message,
    allParticipants: Persona[],
    recentMessages: Message[]
  ): Promise<AIResponseTrigger[]> {
    try {
      // Filter AI personas
      const aiParticipants = allParticipants.filter(p => 
        p.type === 'ai_agent' || p.type === 'ai_ambiguous'
      );

      if (aiParticipants.length === 0) {
        return [];
      }

      const context: OrchestrationContext = {
        conversation,
        newMessage,
        allParticipants,
        aiParticipants,
        recentMessages: recentMessages.slice().reverse(), // Chronological order
      };

      // Analyze each AI persona for response triggers
      const triggers: AIResponseTrigger[] = [];
      
      for (const aiPersona of aiParticipants) {
        const trigger = this.analyzePersonaResponseTrigger(aiPersona, context);
        if (trigger) {
          triggers.push(trigger);
        }
      }

      // Sort by priority (highest first)
      return triggers.sort((a, b) => b.priority - a.priority);

    } catch (error) {
      // Error is logged internally
      return [];
    }
  }

  /**
   * Analyze if a specific AI persona should respond
   */
  private analyzePersonaResponseTrigger(
    persona: Persona,
    context: OrchestrationContext
  ): AIResponseTrigger | null {
    let priority = 0;
    const reasons: string[] = [];
    let baseDelay = 2000; // 2 seconds base delay

    // Don't respond to own messages
    if (context.newMessage.authorPersonaId === persona.id) {
      return null;
    }

    // Check if persona was directly mentioned or addressed
    const isDirectlyAddressed = this.isPersonaDirectlyAddressed(persona, context.newMessage);
    if (isDirectlyAddressed) {
      priority += 0.8;
      reasons.push('directly addressed');
      baseDelay = 1000; // Faster response when directly addressed
    }

    // Check conversation flow patterns
    const conversationFlowScore = this.analyzeConversationFlow(persona, context);
    priority += conversationFlowScore.score;
    if (conversationFlowScore.reason) {
      reasons.push(conversationFlowScore.reason);
    }

    // Check topic relevance based on persona knowledge
    const topicRelevance = this.analyzeTopicRelevance(persona, context);
    priority += topicRelevance;
    if (topicRelevance > 0.3) {
      reasons.push('topic expertise');
    }

    // Check personality-based response likelihood
    const personalityScore = this.analyzePersonalityTriggers(persona, context);
    priority += personalityScore;

    // Apply conversation frequency limits
    const frequencyPenalty = this.calculateFrequencyPenalty(persona, context);
    priority -= frequencyPenalty;

    // Calculate response delay based on personality
    const personalityDelay = this.calculatePersonalityDelay(persona);
    const totalDelay = baseDelay + personalityDelay;

    // Only suggest response if priority is above threshold
    if (priority < 0.2) {
      return null;
    }

    return {
      personaId: persona.id,
      priority: Math.max(0, Math.min(1, priority)),
      reason: reasons.join(', ') || 'conversation flow',
      suggestedDelay: totalDelay,
    };
  }

  /**
   * Check if persona is directly addressed in the message
   */
  private isPersonaDirectlyAddressed(persona: Persona, message: Message): boolean {
    const content = message.content.toLowerCase();
    const personaName = persona.name.toLowerCase();
    
    // Check for direct name mentions
    if (content.includes(personaName)) {
      return true;
    }

    // Check for question patterns that might be directed at the persona
    const questionPatterns = [
      `@${personaName}`,
      `${personaName},`,
      `${personaName}?`,
      `${personaName}!`,
    ];

    return questionPatterns.some(pattern => content.includes(pattern.toLowerCase()));
  }

  /**
   * Analyze conversation flow to determine if persona should respond
   */
  private analyzeConversationFlow(
    persona: Persona,
    context: OrchestrationContext
  ): { score: number; reason?: string } {
    const recentMessages = context.recentMessages.slice(-5); // Last 5 messages
    
    if (recentMessages.length === 0) {
      return { score: 0.3, reason: 'conversation starter' };
    }

    // Check how long since persona last spoke
    const lastPersonaMessageIndex = recentMessages.findLastIndex(
      m => m.authorPersonaId === persona.id
    );

    if (lastPersonaMessageIndex === -1) {
      // Persona hasn't spoken yet in recent history
      return { score: 0.4, reason: 'new participant' };
    }

    const messagesSinceLastResponse = recentMessages.length - 1 - lastPersonaMessageIndex;
    
    if (messagesSinceLastResponse >= 3) {
      return { score: 0.5, reason: 're-engagement after silence' };
    }
    
    if (messagesSinceLastResponse === 1) {
      // Persona just spoke, lower priority unless directly addressed
      return { score: 0.1 };
    }

    return { score: 0.2 };
  }

  /**
   * Calculate topic relevance based on persona knowledge domains
   */
  private analyzeTopicRelevance(persona: Persona, context: OrchestrationContext): number {
    const messageContent = context.newMessage.content.toLowerCase();
    const personaKnowledge = persona.knowledge || [];
    
    // Use shared knowledge domain keywords

    let relevanceScore = 0;
    for (const domain of personaKnowledge) {
      const keywords = KNOWLEDGE_DOMAIN_KEYWORDS[domain as keyof typeof KNOWLEDGE_DOMAIN_KEYWORDS] || [];
      const matches = keywords.filter(keyword => messageContent.includes(keyword));
      if (matches.length > 0) {
        relevanceScore += 0.2 * matches.length;
      }
    }

    return Math.min(0.6, relevanceScore);
  }

  /**
   * Analyze personality traits for response likelihood
   */
  private analyzePersonalityTriggers(persona: Persona, context: OrchestrationContext): number {
    const personality = persona.personality;
    let score = 0;

    // Extraverted personas more likely to respond
    if (personality.extraversion > 60) {
      score += 0.2;
    }

    // Agreeable personas more likely to engage supportively
    if (personality.agreeableness > 60) {
      score += 0.15;
    }

    // Empathetic personas respond to emotional content
    const messageContent = context.newMessage.content.toLowerCase();
    const emotionalWords = ['feel', 'sad', 'happy', 'excited', 'worried', 'confused'];
    if (personality.empathy > 60 && emotionalWords.some(word => messageContent.includes(word))) {
      score += 0.25;
    }

    // Assertive personas more likely to offer opinions
    if (personality.assertiveness > 60 && messageContent.includes('?')) {
      score += 0.2;
    }

    return score;
  }

  /**
   * Calculate penalty for personas that have been responding too frequently
   */
  private calculateFrequencyPenalty(persona: Persona, context: OrchestrationContext): number {
    const recentMessages = context.recentMessages.slice(-10);
    const personaMessages = recentMessages.filter(m => m.authorPersonaId === persona.id);
    
    const responseRatio = personaMessages.length / recentMessages.length;
    
    // Apply penalty if persona has been too dominant in conversation
    if (responseRatio > 0.5) {
      return 0.3; // Significant penalty for over-participation
    }
    
    if (responseRatio > 0.3) {
      return 0.15; // Moderate penalty
    }
    
    return 0;
  }

  /**
   * Calculate response delay based on personality
   */
  private calculatePersonalityDelay(persona: Persona): number {
    const personality = persona.personality;
    let delay = 0;

    // Introverted personas take longer to respond
    if (personality.extraversion < 50) {
      delay += (50 - personality.extraversion) * 50; // Up to 2.5 seconds
    }

    // Conscientious personas take time to think
    if (personality.conscientiousness > 70) {
      delay += (personality.conscientiousness - 70) * 30; // Up to 900ms
    }

    // Neurotic personas might hesitate
    if (personality.neuroticism > 60) {
      delay += (personality.neuroticism - 60) * 25; // Up to 1 second
    }

    // Add random variation (±20%)
    const variation = 0.8 + Math.random() * 0.4;
    
    return delay * variation;
  }

}

// Export singleton instance
export const aiOrchestrator = new AIOrchestrator();