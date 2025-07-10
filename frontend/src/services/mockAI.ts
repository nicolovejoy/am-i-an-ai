// Mock AI Response System for Testing
// Each AI participant echoes their persona name for now

export interface AIPersona {
  name: string;
  identity: 'A' | 'B' | 'C' | 'D';
  playerNumber: 1 | 2 | 3 | 4;
  responseDelay: number; // milliseconds
  typingDuration: number; // milliseconds
}

// Mock personas for testing
export const MOCK_AI_PERSONAS: Record<string, Omit<AIPersona, 'identity' | 'playerNumber'>> = {
  CasualGamer: {
    name: 'CasualGamer',
    responseDelay: 2000,
    typingDuration: 1500
  },
  PhilosophyStudent: {
    name: 'PhilosophyStudent',
    responseDelay: 4000,
    typingDuration: 2500
  },
  TechEnthusiast: {
    name: 'TechEnthusiast',
    responseDelay: 3000,
    typingDuration: 2000
  }
};

export class MockAIService {
  private activeAIs: Map<string, AIPersona> = new Map();
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();
  private responseTimers: Map<string, NodeJS.Timeout> = new Map();

  // Initialize AI participants for a session
  initializeAIs(humanIdentity: 'A' | 'B' | 'C' | 'D', identityMapping: Record<string, number>) {
    this.clearAllTimers();
    this.activeAIs.clear();

    // Assign the three AI personas to the remaining identities
    const allIdentities: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const aiIdentities = allIdentities.filter(id => id !== humanIdentity);
    const personas = Object.values(MOCK_AI_PERSONAS);

    aiIdentities.forEach((identity, index) => {
      const persona = personas[index];
      this.activeAIs.set(identity, {
        ...persona,
        identity,
        playerNumber: identityMapping[identity] as 1 | 2 | 3 | 4
      });
    });
  }

  // Mock AI response generation
  async generateResponse(
    aiIdentity: 'A' | 'B' | 'C' | 'D',
    conversationContext: { messages: unknown[], lastHumanMessage: string }
  ): Promise<string> {
    const ai = this.activeAIs.get(aiIdentity);
    if (!ai) return '';

    // For now, just echo the persona name with some context
    const responses = [
      `[${ai.name}]: Interesting point about "${conversationContext.lastHumanMessage}"`,
      `[${ai.name}]: I was just thinking the same thing!`,
      `[${ai.name}]: That's a great question to consider.`,
      `[${ai.name}]: From my perspective, ${conversationContext.lastHumanMessage.toLowerCase()} makes sense.`,
      `[${ai.name}]: I'd love to hear more about that.`
    ];

    // Pick a random response
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Schedule AI responses after human message
  scheduleAIResponses(
    humanMessage: string,
    onTypingStart: (identity: string) => void,
    onTypingEnd: (identity: string) => void,
    onMessage: (identity: string, message: string) => void
  ) {
    // Randomly select 0-2 AIs to respond (not all AIs respond to every message)
    const respondingAIs = Array.from(this.activeAIs.entries())
      .filter(() => Math.random() > 0.4) // 60% chance each AI responds
      .slice(0, 2); // Max 2 AIs respond at once

    respondingAIs.forEach(([identity, ai]) => {
      // Clear any existing timers for this AI
      this.clearTimersForAI(identity);

      // Start typing after delay
      const typingTimer = setTimeout(() => {
        onTypingStart(identity);

        // Generate and send message after typing duration
        const responseTimer = setTimeout(async () => {
          onTypingEnd(identity);
          
          const response = await this.generateResponse(
            identity as 'A' | 'B' | 'C' | 'D',
            { messages: [], lastHumanMessage: humanMessage }
          );
          
          onMessage(identity, response);
        }, ai.typingDuration);

        this.responseTimers.set(identity, responseTimer);
      }, ai.responseDelay);

      this.typingTimers.set(identity, typingTimer);
    });
  }

  // Clear timers for a specific AI
  private clearTimersForAI(identity: string) {
    const typingTimer = this.typingTimers.get(identity);
    const responseTimer = this.responseTimers.get(identity);
    
    if (typingTimer) {
      clearTimeout(typingTimer);
      this.typingTimers.delete(identity);
    }
    
    if (responseTimer) {
      clearTimeout(responseTimer);
      this.responseTimers.delete(identity);
    }
  }

  // Clear all timers
  clearAllTimers() {
    this.typingTimers.forEach(timer => clearTimeout(timer));
    this.responseTimers.forEach(timer => clearTimeout(timer));
    this.typingTimers.clear();
    this.responseTimers.clear();
  }

  // Get active AI participants
  getActiveAIs() {
    return Array.from(this.activeAIs.values());
  }
}

// Singleton instance
export const mockAIService = new MockAIService();