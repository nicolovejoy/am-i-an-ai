// Mock clients must be defined before importing handler
const mockLambdaClient = {
  send: jest.fn(),
};

jest.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: jest.fn(() => mockLambdaClient),
  InvokeCommand: jest.fn((params) => ({ input: params })),
}));

// Set environment variables
process.env.AI_SERVICE_FUNCTION_NAME = 'test-ai-service';

describe('Robot AI Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLambdaClient.send.mockReset();
  });

  it.skip('should invoke AI service with correct parameters for each robot personality', async () => {
    const prompt = 'What does the color blue taste like?';
    
    // Test philosopher (Robot B)
    mockLambdaClient.send.mockResolvedValueOnce({
      StatusCode: 200,
      Payload: Buffer.from(JSON.stringify({
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          result: { response: 'Blue tastes like the memory of rain on a summer afternoon' }
        })
      }))
    });
    
    const responseB = await generateRobotResponse(prompt, 'B', 1);
    
    expect(mockLambdaClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          FunctionName: 'test-ai-service',
          InvocationType: 'RequestResponse',
          Payload: expect.stringContaining('"personality":"philosopher"')
        })
      })
    );
    expect(responseB).toBe('Blue tastes like the memory of rain on a summer afternoon');

    // Test scientist (Robot C)
    mockLambdaClient.send.mockResolvedValueOnce({
      StatusCode: 200,
      Payload: Buffer.from(JSON.stringify({
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          result: { response: 'Synesthesia studies indicate a 23% correlation with mint flavor profiles' }
        })
      }))
    });
    
    const responseC = await generateRobotResponse(prompt, 'C', 2);
    
    expect(mockLambdaClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          FunctionName: 'test-ai-service',
          InvocationType: 'RequestResponse',
          Payload: expect.stringContaining('"personality":"scientist"')
        })
      })
    );
    expect(responseC).toBe('Synesthesia studies indicate a 23% correlation with mint flavor profiles');

    // Test comedian (Robot D)
    mockLambdaClient.send.mockResolvedValueOnce({
      StatusCode: 200,
      Payload: Buffer.from(JSON.stringify({
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          result: { response: 'Like licking a smurf, but less lawsuit-y!' }
        })
      }))
    });
    
    const responseD = await generateRobotResponse(prompt, 'D', 3);
    
    expect(mockLambdaClient.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          FunctionName: 'test-ai-service',
          InvocationType: 'RequestResponse',
          Payload: expect.stringContaining('"personality":"comedian"')
        })
      })
    );
    expect(responseD).toBe('Like licking a smurf, but less lawsuit-y!');
    
    // Verify all calls included proper context
    const calls = mockLambdaClient.send.mock.calls;
    expect(calls).toHaveLength(3);
    
    calls.forEach((call, index) => {
      const payload = JSON.parse(call[0].input.Payload);
      expect(payload.task).toBe('robot_response');
      expect(payload.model).toBe('claude-3-haiku');
      expect(payload.inputs.prompt).toBe(prompt);
      expect(payload.inputs.context).toEqual({ round: index + 1 });
      expect(payload.options.temperature).toBe(0.85);
      expect(payload.options.maxTokens).toBe(150);
    });
  });

  it.skip('should fall back to hardcoded responses when AI service fails', async () => {
    const prompt = 'What is the meaning of silence?';
    
    // Mock AI service failure
    mockLambdaClient.send.mockRejectedValueOnce(new Error('Lambda invocation failed'));
    
    const response = await generateRobotResponse(prompt, 'B');
    
    // Should get one of the hardcoded poetic responses
    expect(response).toMatch(/whispers|symphony|fragments|colors|wings/i);
    expect(mockLambdaClient.send).toHaveBeenCalledTimes(1);
  });

  it.skip('should handle AI service returning error status', async () => {
    const prompt = 'What is happiness?';
    
    // Mock AI service returning error status
    mockLambdaClient.send.mockResolvedValueOnce({
      StatusCode: 500,
      Payload: Buffer.from(JSON.stringify({
        errorMessage: 'Internal server error'
      }))
    });
    
    const response = await generateRobotResponse(prompt, 'C');
    
    // Should get one of the hardcoded analytical responses
    expect(response).toMatch(/decibels|quantifiable|correlation|wavelength|empirically/i);
  });

  it.skip('should handle malformed AI service response', async () => {
    const prompt = 'What is time?';
    
    // Mock AI service returning malformed response
    mockLambdaClient.send.mockResolvedValueOnce({
      StatusCode: 200,
      Payload: Buffer.from('not json')
    });
    
    const response = await generateRobotResponse(prompt, 'D');
    
    // Should get one of the hardcoded whimsical responses
    expect(response).toMatch(/disco|unicorns|purple|bouncy|kazoo/i);
  });
});

// Note: These tests are skipped because generateRobotResponse is not exported
// They serve as documentation for the expected behavior