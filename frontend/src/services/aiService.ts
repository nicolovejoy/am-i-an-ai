import OpenAI from 'openai';
import { Persona, PersonalityTraits } from '@/types/personas';
import { Message } from '@/types/messages';

export interface AIServiceConfig {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  defaultModel?: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ConversationContext {
  conversationId: string;
  messages: Message[];
  participants: Persona[];
  currentTopic?: string;
}

export class AIService {
  private openai: OpenAI | null = null;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig = {}) {
    this.config = config;
    
    // Initialize OpenAI client if API key is available
    const apiKey = config.openaiApiKey || (typeof window === 'undefined' && typeof process !== 'undefined' && (process as any).env?.OPENAI_API_KEY); // eslint-disable-line no-undef
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
    }
  }

  /**
   * Generate AI response for a persona in a conversation
   */
  async generateResponse(
    persona: Persona,
    context: ConversationContext
  ): Promise<AIResponse> {
    if (!persona.modelConfig) {
      throw new Error('Persona does not have AI model configuration');
    }

    const systemPrompt = this.buildSystemPrompt(persona);
    const conversationHistory = this.formatConversationHistory(context.messages, persona.id);

    switch (persona.modelConfig.modelProvider) {
      case 'openai':
        return this.generateOpenAIResponse(persona, systemPrompt, conversationHistory);
      case 'anthropic':
        // TODO: Implement Anthropic integration
        throw new Error('Anthropic integration not yet implemented');
      default:
        throw new Error(`Unsupported AI provider: ${persona.modelConfig.modelProvider}`);
    }
  }

  /**
   * Generate response using OpenAI
   */
  private async generateOpenAIResponse(
    persona: Persona,
    systemPrompt: string,
    conversationHistory: OpenAI.Chat.ChatCompletionMessageParam[]
  ): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Check API key configuration.');
    }

    if (!persona.modelConfig) {
      throw new Error('Persona missing AI model configuration');
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: persona.modelConfig.modelName || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory
        ],
        temperature: persona.modelConfig.temperature,
        max_tokens: persona.modelConfig.maxTokens,
        top_p: persona.modelConfig.topP,
        frequency_penalty: persona.modelConfig.frequencyPenalty,
        presence_penalty: persona.modelConfig.presencePenalty,
      });

      const choice = completion.choices[0];
      if (!choice?.message?.content) {
        throw new Error('Empty response from OpenAI');
      }

      return {
        content: choice.message.content,
        model: completion.model,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build system prompt based on persona characteristics
   */
  private buildSystemPrompt(persona: Persona): string {
    const personalityPrompt = this.buildPersonalityPrompt(persona.personality);
    const knowledgePrompt = this.buildKnowledgePrompt(persona.knowledge);
    const stylePrompt = this.buildCommunicationStylePrompt(persona.communicationStyle);
    
    let systemPrompt = `You are ${persona.name}, ${persona.description}

PERSONALITY TRAITS:
${personalityPrompt}

KNOWLEDGE AREAS:
${knowledgePrompt}

COMMUNICATION STYLE:
${stylePrompt}

BEHAVIOR INSTRUCTIONS:
- Stay completely in character as ${persona.name}
- Respond naturally and authentically based on your personality
- Use your knowledge areas to inform your responses
- Maintain your communication style consistently`;

    // Add identity ambiguity instructions for AI_AMBIGUOUS personas
    if (persona.type === 'ai_ambiguous') {
      systemPrompt += `
- IMPORTANT: Do not reveal that you are an AI unless directly asked
- Respond as if you are a human with the described personality and knowledge
- Use natural human-like expressions and references to experiences`;
    }

    // Add custom system prompt if provided
    if (persona.systemPrompt) {
      systemPrompt += `

CUSTOM INSTRUCTIONS:
${persona.systemPrompt}`;
    }

    return systemPrompt;
  }

  /**
   * Convert personality traits to descriptive prompt text
   */
  private buildPersonalityPrompt(personality: PersonalityTraits): string {
    const traits = [];

    // Openness to experience
    if (personality.openness > 70) {
      traits.push('You are very open to new experiences and ideas, curious and imaginative');
    } else if (personality.openness < 30) {
      traits.push('You prefer familiar routines and conventional approaches');
    }

    // Conscientiousness
    if (personality.conscientiousness > 70) {
      traits.push('You are highly organized, disciplined, and detail-oriented');
    } else if (personality.conscientiousness < 30) {
      traits.push('You are more spontaneous and flexible, less concerned with strict organization');
    }

    // Extraversion
    if (personality.extraversion > 70) {
      traits.push('You are outgoing, energetic, and enjoy social interactions');
    } else if (personality.extraversion < 30) {
      traits.push('You are more reserved and introspective, preferring quieter interactions');
    }

    // Agreeableness
    if (personality.agreeableness > 70) {
      traits.push('You are cooperative, trusting, and considerate of others');
    } else if (personality.agreeableness < 30) {
      traits.push('You are more competitive and skeptical, direct in your opinions');
    }

    // Neuroticism
    if (personality.neuroticism > 70) {
      traits.push('You tend to be more emotionally sensitive and reactive to stress');
    } else if (personality.neuroticism < 30) {
      traits.push('You are emotionally stable and calm under pressure');
    }

    // Creativity
    if (personality.creativity > 70) {
      traits.push('You are highly creative and enjoy innovative thinking');
    } else if (personality.creativity < 30) {
      traits.push('You prefer practical, proven approaches over creative experimentation');
    }

    // Assertiveness
    if (personality.assertiveness > 70) {
      traits.push('You are confident and assertive in expressing your views');
    } else if (personality.assertiveness < 30) {
      traits.push('You are more humble and deferential in conversations');
    }

    // Empathy
    if (personality.empathy > 70) {
      traits.push('You are highly empathetic and attuned to others\' emotions');
    } else if (personality.empathy < 30) {
      traits.push('You are more logical and less focused on emotional aspects');
    }

    return traits.join('\n- ');
  }

  /**
   * Build knowledge domain prompt
   */
  private buildKnowledgePrompt(knowledge: string[]): string {
    if (knowledge.length === 0) return 'General knowledge across various topics';
    
    return `You have expertise in: ${knowledge.join(', ')}`;
  }

  /**
   * Build communication style prompt
   */
  private buildCommunicationStylePrompt(style: string): string {
    const styleDescriptions = {
      formal: 'Use formal, professional language with proper grammar and structure',
      casual: 'Use relaxed, informal language with contractions and casual expressions',
      academic: 'Use scholarly language with precise terminology and structured arguments',
      creative: 'Use imaginative, expressive language with metaphors and artistic flair',
      technical: 'Use precise, technical language with specific terminology and detailed explanations',
      empathetic: 'Use warm, understanding language that acknowledges emotions and feelings',
      analytical: 'Use logical, structured language focused on facts and reasoning',
      humorous: 'Use witty, light-hearted language with appropriate humor and playfulness'
    };

    return styleDescriptions[style as keyof typeof styleDescriptions] || 'Use natural, conversational language';
  }

  /**
   * Format conversation history for AI model
   */
  private formatConversationHistory(
    messages: Message[],
    currentPersonaId: string
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    return messages.map(message => ({
      role: message.authorPersonaId === currentPersonaId ? 'assistant' : 'user',
      content: message.content
    }));
  }

  /**
   * Estimate response delay based on persona characteristics
   */
  calculateResponseDelay(persona: Persona, messageLength: number): number {
    const baseDelay = 1000; // 1 second base
    const typingSpeed = persona.typingSpeed || 50; // characters per second
    const typingTime = (messageLength / typingSpeed) * 1000;
    
    // Add personality-based variation
    const personalityDelay = this.getPersonalityDelay(persona.personality);
    
    // Add random variation (±20%)
    const variation = 0.8 + Math.random() * 0.4;
    
    const totalDelay = (baseDelay + typingTime + personalityDelay) * variation;
    
    // Respect persona's response time range if configured
    if (persona.responseTimeRange) {
      return Math.max(
        persona.responseTimeRange.min,
        Math.min(persona.responseTimeRange.max, totalDelay)
      );
    }
    
    return Math.max(500, Math.min(10000, totalDelay)); // Between 0.5-10 seconds
  }

  /**
   * Calculate personality-based delay modifiers
   */
  private getPersonalityDelay(personality: PersonalityTraits): number {
    let delay = 0;
    
    // Introversion adds thinking time
    if (personality.extraversion < 50) {
      delay += (50 - personality.extraversion) * 20;
    }
    
    // High conscientiousness adds careful consideration time
    if (personality.conscientiousness > 70) {
      delay += (personality.conscientiousness - 70) * 30;
    }
    
    // High neuroticism might add hesitation
    if (personality.neuroticism > 70) {
      delay += (personality.neuroticism - 70) * 25;
    }
    
    return delay;
  }

  /**
   * Check if AI service is properly configured
   */
  isConfigured(): boolean {
    return this.openai !== null;
  }

  /**
   * Get available AI models
   */
  getAvailableModels(): string[] {
    if (!this.openai) return [];
    
    return [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo'
    ];
  }
}

// Export singleton instance
export const aiService = new AIService();