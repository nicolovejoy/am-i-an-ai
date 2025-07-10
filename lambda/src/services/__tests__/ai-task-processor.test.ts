import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { AITaskProcessor } from '../ai-task-processor';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');

describe('AITaskProcessor', () => {
  let processor: AITaskProcessor;
  let mockSend: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock client
    mockSend = jest.fn();
    (BedrockRuntimeClient as jest.MockedClass<typeof BedrockRuntimeClient>).mockImplementation(() => ({
      send: mockSend
    } as any));
    
    processor = new AITaskProcessor();
  });

  const mockBedrockResponse = (text: string) => {
    mockSend.mockResolvedValue({
      body: new TextEncoder().encode(JSON.stringify({
        content: [{ text }]
      }))
    });
  };

  describe('generatePrompt', () => {
    it('should generate initial prompt for round 1', async () => {
      const promptText = 'What small detail brings unexpected joy to your day?';
      mockBedrockResponse(promptText);

      const result = await processor.process({
        task: 'generate_prompt',
        model: 'claude-3-sonnet',
        inputs: { round: 1 },
        options: {}
      });

      expect(result.prompt).toBe(promptText);
      expect(result.metadata).toMatchObject({
        round: 1,
        basedOn: 'starter',
        model: 'claude-3-sonnet'
      });
      
      // Verify Bedrock was called with correct parameters
      expect(mockSend).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
      const command = mockSend.mock.calls[0][0];
      const body = JSON.parse(command.input.body);
      
      expect(body.system).toContain('Human or Robot');
      expect(body.messages[0].content).toContain('opening prompt');
    });

    it('should generate contextual prompt for subsequent rounds', async () => {
      const promptText = 'What hidden pattern do you notice in everyday life?';
      mockBedrockResponse(promptText);

      const result = await processor.process({
        task: 'generate_prompt',
        model: 'claude-3-sonnet',
        inputs: {
          round: 2,
          previousPrompts: ['What brings you joy?'],
          responses: [{
            A: 'The smell of coffee in the morning',
            B: 'Patterns in data sets',
            C: 'When algorithms converge elegantly',
            D: 'Sunlight through leaves'
          }]
        },
        options: { temperature: 0.8 }
      });

      expect(result.prompt).toBe(promptText);
      expect(result.metadata.round).toBe(2);
      expect(result.metadata.basedOn).toBe('previous_responses');
      
      const command = mockSend.mock.calls[0][0];
      const body = JSON.parse(command.input.body);
      
      expect(body.messages[0].content).toContain('Based on these responses');
      expect(body.temperature).toBe(0.8);
    });
  });

  describe('generateRobotResponse', () => {
    it('should generate philosopher response', async () => {
      const responseText = 'In silence, we find the loudest truths about ourselves.';
      mockBedrockResponse(responseText);

      const result = await processor.process({
        task: 'robot_response',
        model: 'claude-3-haiku',
        inputs: {
          personality: 'philosopher',
          prompt: 'What does silence mean to you?'
        },
        options: { temperature: 0.85 }
      });

      expect(result.response).toBe(responseText);
      
      const command = mockSend.mock.calls[0][0];
      const body = JSON.parse(command.input.body);
      
      expect(body.system).toContain('philosophical thinker');
      expect(body.messages[0].content).toContain('What does silence mean to you?');
      expect(body.max_tokens).toBe(200); // default
    });

    it('should generate comedian response with context', async () => {
      const responseText = 'Silence is when my WiFi disconnects and suddenly I can hear my thoughts!';
      mockBedrockResponse(responseText);

      const result = await processor.process({
        task: 'robot_response',
        model: 'claude-3-haiku',
        inputs: {
          personality: 'comedian',
          prompt: 'What does silence mean to you?',
          context: { round: 3 }
        },
        options: { maxTokens: 150 }
      });

      expect(result.response).toBe(responseText);
      
      const command = mockSend.mock.calls[0][0];
      const body = JSON.parse(command.input.body);
      
      expect(body.system).toContain('witty');
      expect(body.messages[0].content).toContain('round 3');
      expect(body.max_tokens).toBe(150);
    });

    it('should use default philosopher personality for unknown personality', async () => {
      mockBedrockResponse('Response text');

      await processor.process({
        task: 'robot_response',
        model: 'claude-3-haiku',
        inputs: {
          personality: 'unknown',
          prompt: 'Test prompt'
        },
        options: {}
      });

      const command = mockSend.mock.calls[0][0];
      const body = JSON.parse(command.input.body);
      
      expect(body.system).toContain('philosophical thinker');
    });
  });

  describe('analyzeMatch', () => {
    const mockMatch = {
      matchId: 'test-123',
      rounds: [
        {
          prompt: 'What color are thoughts?',
          responses: { A: 'Blue', B: 'Clear', C: 'Rainbow', D: 'Gray' },
          votes: { A: 'B', B: 'A', C: 'A', D: 'C' }
        }
      ],
      participants: []
    };

    it('should analyze match themes', async () => {
      const analysisText = 'The match explored abstract concepts through color metaphors...';
      mockBedrockResponse(analysisText);

      const result = await processor.process({
        task: 'analyze_match',
        model: 'claude-3-sonnet',
        inputs: {
          match: mockMatch,
          analysisType: 'themes'
        },
        options: {}
      });

      expect(result.analysis).toBe(analysisText);
      expect(result.type).toBe('themes');
      expect(result.matchId).toBe('test-123');
      
      const command = mockSend.mock.calls[0][0];
      const body = JSON.parse(command.input.body);
      
      expect(body.messages[0].content).toContain('narrative themes');
    });

    it('should provide general analysis for unknown type', async () => {
      mockBedrockResponse('General analysis...');

      const result = await processor.process({
        task: 'analyze_match',
        model: 'claude-3-sonnet',
        inputs: {
          match: mockMatch,
          analysisType: 'unknown'
        },
        options: {}
      });

      expect(result.type).toBe('unknown');
      
      const command = mockSend.mock.calls[0][0];
      const body = JSON.parse(command.input.body);
      
      expect(body.messages[0].content).toContain('overall analysis');
    });
  });

  describe('summarize', () => {
    it('should create brief summary', async () => {
      const summaryText = 'A game exploring human vs AI responses through creative prompts.';
      mockBedrockResponse(summaryText);

      const longText = 'This is a very long text about the game...'.repeat(10);
      
      const result = await processor.process({
        task: 'summarize',
        model: 'claude-3-haiku',
        inputs: {
          text: longText,
          style: 'brief'
        },
        options: {}
      });

      expect(result.summary).toBe(summaryText);
      expect(result.style).toBe('brief');
      expect(result.originalLength).toBe(longText.length);
      expect(result.summaryLength).toBe(summaryText.length);
      
      const command = mockSend.mock.calls[0][0];
      const body = JSON.parse(command.input.body);
      
      expect(body.messages[0].content).toContain('one clear, concise sentence');
      expect(body.temperature).toBe(0.3);
    });

    it('should create detailed summary', async () => {
      mockBedrockResponse('Detailed summary...');

      await processor.process({
        task: 'summarize',
        model: 'claude-3-haiku',
        inputs: {
          text: 'Text to summarize',
          style: 'detailed'
        },
        options: { maxTokens: 500 }
      });

      const command = mockSend.mock.calls[0][0];
      const body = JSON.parse(command.input.body);
      
      expect(body.messages[0].content).toContain('comprehensive summary');
      expect(body.max_tokens).toBe(500);
    });
  });

  describe('customTask', () => {
    it('should process custom task', async () => {
      const customResult = 'Custom AI response';
      mockBedrockResponse(customResult);

      const result = await processor.process({
        task: 'custom',
        model: 'claude-3-opus',
        inputs: {
          systemPrompt: 'You are a helpful assistant',
          userPrompt: 'Generate a haiku'
        },
        options: { temperature: 0.9 }
      });

      expect(result.result).toBe(customResult);
      
      const command = mockSend.mock.calls[0][0];
      const body = JSON.parse(command.input.body);
      
      expect(body.system).toBe('You are a helpful assistant');
      expect(body.messages[0].content).toBe('Generate a haiku');
      expect(body.temperature).toBe(0.9);
      expect(command.input.modelId).toContain('opus');
    });

    it('should throw error if missing required prompts', async () => {
      await expect(processor.process({
        task: 'custom',
        model: 'claude-3-sonnet',
        inputs: { userPrompt: 'Test' }, // missing systemPrompt
        options: {}
      })).rejects.toThrow('Custom task requires both systemPrompt and userPrompt');
    });
  });

  describe('error handling', () => {
    it('should throw error for unknown task', async () => {
      await expect(processor.process({
        task: 'unknown_task',
        model: 'claude-3-sonnet',
        inputs: {},
        options: {}
      })).rejects.toThrow('Unknown task: unknown_task');
    });

    it('should handle Bedrock errors', async () => {
      mockSend.mockRejectedValue(new Error('Bedrock error'));

      await expect(processor.process({
        task: 'generate_prompt',
        model: 'claude-3-sonnet',
        inputs: { round: 1 },
        options: {}
      })).rejects.toThrow('Bedrock error');
    });

    it('should handle unexpected response format', async () => {
      mockSend.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          // Missing content field
        }))
      });

      await expect(processor.process({
        task: 'generate_prompt',
        model: 'claude-3-sonnet',
        inputs: { round: 1 },
        options: {}
      })).rejects.toThrow('Unexpected response format from Bedrock');
    });
  });

  describe('model mapping', () => {
    it('should map model names correctly', async () => {
      mockBedrockResponse('Test');

      const models = [
        { input: 'claude-3-opus', expected: 'anthropic.claude-3-opus-20240229-v1:0' },
        { input: 'claude-3-sonnet', expected: 'anthropic.claude-3-sonnet-20240229-v1:0' },
        { input: 'claude-3-haiku', expected: 'anthropic.claude-3-haiku-20240307-v1:0' }
      ];

      for (const { input, expected } of models) {
        await processor.process({
          task: 'custom',
          model: input,
          inputs: {
            systemPrompt: 'Test',
            userPrompt: 'Test'
          },
          options: {}
        });

        const command = mockSend.mock.calls[mockSend.mock.calls.length - 1][0];
        expect(command.input.modelId).toBe(expected);
      }
    });

    it('should use sonnet as default for unknown model', async () => {
      mockBedrockResponse('Test');

      await processor.process({
        task: 'custom',
        model: 'unknown-model' as any,
        inputs: {
          systemPrompt: 'Test',
          userPrompt: 'Test'
        },
        options: {}
      });

      const command = mockSend.mock.calls[0][0];
      expect(command.input.modelId).toBe('anthropic.claude-3-sonnet-20240229-v1:0');
    });
  });
});