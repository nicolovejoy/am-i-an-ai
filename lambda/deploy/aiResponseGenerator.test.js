const { AIResponseGenerator, ROBOT_PERSONALITIES } = require('./aiResponseGenerator');

describe('AIResponseGenerator', () => {
  let generator;
  let mockOpenAIClient;
  let mockClaudeClient;

  beforeEach(() => {
    // Mock OpenAI client
    mockOpenAIClient = {
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    };

    // Mock Claude client
    mockClaudeClient = {
      messages: {
        create: jest.fn()
      }
    };

    // Create generator with mocked clients
    generator = new AIResponseGenerator({
      openAIClient: mockOpenAIClient,
      claudeClient: mockClaudeClient,
      provider: 'openai' // default to OpenAI
    });
  });

  describe('generateResponse', () => {
    const testPrompt = "What's your favorite childhood memory?";

    it('should generate a response using OpenAI with the correct personality', async () => {
      const mockResponse = "I remember playing in my grandmother's garden...";
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: mockResponse } }]
      });

      const response = await generator.generateResponse(
        testPrompt,
        ROBOT_PERSONALITIES.curious_student
      );

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('enthusiastic learner')
          },
          {
            role: 'user',
            content: testPrompt
          }
        ],
        max_tokens: 150,
        temperature: 0.9
      });

      expect(response).toBe(mockResponse);
    });

    it('should generate a response using Claude when configured', async () => {
      generator = new AIResponseGenerator({
        openAIClient: mockOpenAIClient,
        claudeClient: mockClaudeClient,
        provider: 'claude'
      });

      const mockResponse = "Building sandcastles at the beach was magical...";
      mockClaudeClient.messages.create.mockResolvedValue({
        content: [{ text: mockResponse }]
      });

      const response = await generator.generateResponse(
        testPrompt,
        ROBOT_PERSONALITIES.witty_professional
      );

      expect(mockClaudeClient.messages.create).toHaveBeenCalledWith({
        model: 'claude-3-haiku-20240307',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: expect.stringContaining('experienced and confident')
        }]
      });

      expect(response).toBe(mockResponse);
    });

    it('should handle API errors gracefully with fallback response', async () => {
      mockOpenAIClient.chat.completions.create.mockRejectedValue(
        new Error('API rate limit exceeded')
      );

      const response = await generator.generateResponse(
        testPrompt,
        ROBOT_PERSONALITIES.friendly_neighbor
      );

      // Should return a fallback response
      expect(response).toMatch(/I remember/);
      expect(response.length).toBeGreaterThan(20);
      expect(response.length).toBeLessThan(200);
    });

    it('should respect max token limits', async () => {
      const longResponse = "a".repeat(500);
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: longResponse } }]
      });

      const response = await generator.generateResponse(
        testPrompt,
        ROBOT_PERSONALITIES.curious_student,
        { maxTokens: 50 }
      );

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({ max_tokens: 50 })
      );
    });

    it('should include game context in the prompt', async () => {
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: "Test response" } }]
      });

      const context = {
        roundNumber: 3,
        previousResponses: ["Earlier response 1", "Earlier response 2"],
        otherParticipants: ["A", "B", "C"]
      };

      await generator.generateResponse(
        testPrompt,
        ROBOT_PERSONALITIES.curious_student,
        { context }
      );

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('round 3')
          })
        ]),
        max_tokens: 150,
        temperature: 0.9
      });
    });
  });

  describe('generateResponseWithTiming', () => {
    it('should add realistic delay before returning response', async () => {
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: "Quick response" } }]
      });

      const startTime = Date.now();
      const result = await generator.generateResponseWithTiming(
        "Test prompt",
        ROBOT_PERSONALITIES.curious_student,
        { minDelay: 2000, maxDelay: 3000 }
      );

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      expect(elapsed).toBeGreaterThanOrEqual(2000);
      expect(elapsed).toBeLessThan(3100); // Allow some overhead
      expect(result.response).toBe("Quick response");
      expect(result.responseTime).toBeGreaterThanOrEqual(2);
      expect(result.responseTime).toBeLessThan(3.1);
    });
  });

  describe('personality system', () => {
    it('should have required personalities defined', () => {
      expect(ROBOT_PERSONALITIES.curious_student).toBeDefined();
      expect(ROBOT_PERSONALITIES.witty_professional).toBeDefined();
      expect(ROBOT_PERSONALITIES.friendly_neighbor).toBeDefined();
    });

    it('should have valid temperature settings for each personality', () => {
      Object.values(ROBOT_PERSONALITIES).forEach(personality => {
        expect(personality.temperature).toBeGreaterThanOrEqual(0);
        expect(personality.temperature).toBeLessThanOrEqual(1);
        expect(personality.description).toBeTruthy();
        expect(personality.traits).toBeInstanceOf(Array);
        expect(personality.traits.length).toBeGreaterThan(0);
      });
    });
  });

  describe('fallback responses', () => {
    it('should generate contextual fallback responses when API fails', async () => {
      mockOpenAIClient.chat.completions.create.mockRejectedValue(
        new Error('Network error')
      );

      const responses = new Set();
      
      // Generate multiple responses to check for variety
      for (let i = 0; i < 5; i++) {
        const response = await generator.generateResponse(
          "What's your favorite food?",
          ROBOT_PERSONALITIES.curious_student
        );
        responses.add(response);
      }

      // Should have some variety in fallback responses
      expect(responses.size).toBeGreaterThan(1);
      
      // All responses should be reasonable
      responses.forEach(response => {
        expect(response.length).toBeGreaterThan(10);
        expect(response).toMatch(/[.!?]$/); // Should end with punctuation
      });
    });
  });
});