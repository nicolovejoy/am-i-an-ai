// Get API configuration from environment
const API_BASE_URL = import.meta.env.VITE_MATCH_SERVICE_API || "https://api.robotorchestra.org";

export type AIModel = 'claude-3-sonnet' | 'claude-3-haiku' | 'claude-3-opus';
export type AITask = 'generate_prompt' | 'robot_response' | 'analyze_match' | 'summarize' | 'custom';

export interface AIRequest {
  task: AITask;
  model?: AIModel;
  inputs: Record<string, unknown>;
  options?: {
    temperature?: number;
    maxTokens?: number;
    streaming?: boolean;
  };
}

export interface AIResponse<T = unknown> {
  success: boolean;
  task: AITask;
  model: AIModel;
  result: T;
}

export interface PromptResult {
  prompt: string;
  metadata: {
    round: number;
    basedOn: string;
    theme?: string;
    model: string;
    timestamp: string;
  };
}

export interface RobotResponseResult {
  response: string;
}

export interface MatchAnalysisResult {
  analysis: string;
  type: string;
  matchId: string;
}

export interface SummaryResult {
  summary: string;
  style: string;
  originalLength: number;
  summaryLength: number;
}

class AIService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    return {
      'Content-Type': 'application/json',
    };
  }

  async generate<T = unknown>(request: AIRequest): Promise<T> {
    const url = `${API_BASE_URL}/ai/generate`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 429) {
          throw new Error('AI rate limit exceeded. Please try again in a moment.');
        } else if (response.status === 401) {
          throw new Error('AI authentication error. Please contact support.');
        }
        
        // Try to get error message from response
        let errorMessage = `AI request failed: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = `AI error: ${errorData.error}`;
          }
        } catch {
          // Use default error message if JSON parsing fails
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json() as AIResponse<T>;
      
      if (!data.success) {
        throw new Error(`AI generation failed: ${JSON.stringify(data)}`);
      }
      
      return data.result;
    } catch (error) {
      console.error('AI service error:', error);
      
      // Re-throw if it's already a formatted error
      if (error instanceof Error && error.message?.includes('AI')) {
        throw error;
      }
      
      throw new Error('Failed to generate AI response');
    }
  }

  // Convenience method for generating prompts
  async generatePrompt(
    round: number, 
    previousPrompts?: string[], 
    responses?: Record<string, string>[],
    theme?: string
  ): Promise<PromptResult> {
    return this.generate<PromptResult>({
      task: 'generate_prompt',
      inputs: { 
        round, 
        previousPrompts, 
        responses, 
        theme 
      }
    });
  }

  // Convenience method for generating robot responses
  async generateRobotResponse(
    personality: string, 
    prompt: string, 
    context?: { round?: number; previousResponses?: unknown }
  ): Promise<RobotResponseResult> {
    return this.generate<RobotResponseResult>({
      task: 'robot_response',
      model: 'claude-3-haiku', // Use faster model for real-time responses
      inputs: { 
        personality, 
        prompt, 
        context 
      },
      options: {
        temperature: 0.85,
        maxTokens: 150
      }
    });
  }

  // Analyze completed match
  async analyzeMatch(
    match: unknown, 
    analysisType: 'themes' | 'difficulty' | 'highlights' | 'general' = 'general'
  ): Promise<MatchAnalysisResult> {
    return this.generate<MatchAnalysisResult>({
      task: 'analyze_match',
      inputs: { 
        match, 
        analysisType 
      },
      options: {
        maxTokens: 500
      }
    });
  }

  // Summarize text
  async summarize(
    text: string, 
    style: 'brief' | 'detailed' | 'highlights' = 'brief'
  ): Promise<SummaryResult> {
    return this.generate<SummaryResult>({
      task: 'summarize',
      model: 'claude-3-haiku', // Use faster model for summaries
      inputs: { 
        text, 
        style 
      },
      options: {
        temperature: 0.3,
        maxTokens: style === 'brief' ? 100 : 300
      }
    });
  }

  // Custom AI task
  async custom(
    systemPrompt: string, 
    userPrompt: string,
    options?: { model?: AIModel; temperature?: number; maxTokens?: number }
  ): Promise<{ result: string }> {
    return this.generate<{ result: string }>({
      task: 'custom',
      model: options?.model,
      inputs: { 
        systemPrompt, 
        userPrompt 
      },
      options: {
        temperature: options?.temperature,
        maxTokens: options?.maxTokens
      }
    });
  }
}

// Export singleton instance
export const aiService = new AIService();

// Export for testing
export { AIService };