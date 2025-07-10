import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { handler } from '../ai-service';
import { AITaskProcessor } from '../../services/ai-task-processor';

// Mock the AITaskProcessor
jest.mock('../../services/ai-task-processor', () => {
  return {
    AITaskProcessor: jest.fn()
  };
});

const mockProcess = jest.fn();

describe('AI Service Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProcess.mockClear();
    
    // Setup mock processor
    (AITaskProcessor as jest.MockedClass<typeof AITaskProcessor>).mockImplementation(() => ({
      process: mockProcess
    } as any));
  });

  const createEvent = (body: any, httpMethod: string = 'POST'): APIGatewayProxyEvent => ({
    body: JSON.stringify(body),
    httpMethod,
    path: '/ai/generate',
    headers: {},
    multiValueHeaders: {},
    isBase64Encoded: false,
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  describe('OPTIONS requests', () => {
    it('should handle OPTIONS request for CORS', async () => {
      const event = createEvent({}, 'OPTIONS');
      
      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;
      
      expect(result.statusCode).toBe(200);
      expect(result.headers).toMatchObject({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
    });
  });

  describe('POST requests', () => {
    it('should process valid prompt generation request', async () => {
      const mockResult = {
        prompt: 'What color represents your mood today?',
        metadata: { round: 1, basedOn: 'starter' }
      };
      mockProcess.mockResolvedValue(mockResult);

      const event = createEvent({
        task: 'generate_prompt',
        inputs: { round: 1 }
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;
      const body = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.task).toBe('generate_prompt');
      expect(body.model).toBe('claude-3-sonnet'); // default model
      expect(body.result).toEqual(mockResult);
      
      expect(mockProcess).toHaveBeenCalledWith({
        task: 'generate_prompt',
        model: 'claude-3-sonnet',
        inputs: { round: 1 },
        options: {}
      });
    });

    it('should process robot response request with custom model', async () => {
      const mockResult = { response: 'Blue, like the endless sky of possibilities' };
      mockProcess.mockResolvedValue(mockResult);

      const event = createEvent({
        task: 'robot_response',
        model: 'claude-3-haiku',
        inputs: {
          personality: 'philosopher',
          prompt: 'What color represents your mood?'
        },
        options: {
          temperature: 0.9,
          maxTokens: 100
        }
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;
      const body = JSON.parse(result.body);

      expect(result.statusCode).toBe(200);
      expect(body.success).toBe(true);
      expect(body.model).toBe('claude-3-haiku');
      expect(body.result).toEqual(mockResult);
    });

    it('should handle validation errors', async () => {
      const event = createEvent({
        task: 'invalid_task',
        inputs: {}
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;
      const body = JSON.parse(result.body);

      expect(result.statusCode).toBe(400);
      expect(body.error).toBe('Invalid request');
      expect(body.details).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const event = createEvent({
        inputs: { round: 1 }
        // missing 'task'
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;
      const body = JSON.parse(result.body);

      expect(result.statusCode).toBe(400);
      expect(body.error).toBe('Invalid request');
    });

    it('should handle processor errors', async () => {
      mockProcess.mockRejectedValue(new Error('Unknown task: invalid'));

      const event = createEvent({
        task: 'generate_prompt',
        inputs: { round: 1 }
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;
      const body = JSON.parse(result.body);

      expect(result.statusCode).toBe(400);
      expect(body.error).toBe('Unknown task: invalid');
    });

    it('should handle rate limit errors', async () => {
      mockProcess.mockRejectedValue(new Error('rate limit exceeded'));

      const event = createEvent({
        task: 'generate_prompt',
        inputs: { round: 1 }
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;
      const body = JSON.parse(result.body);

      expect(result.statusCode).toBe(429);
      expect(body.error).toBe('Rate limit exceeded');
    });

    it('should handle authentication errors', async () => {
      mockProcess.mockRejectedValue(new Error('Invalid API key'));

      const event = createEvent({
        task: 'generate_prompt',
        inputs: { round: 1 }
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;
      const body = JSON.parse(result.body);

      expect(result.statusCode).toBe(401);
      expect(body.error).toBe('Authentication error');
    });

    it('should handle generic errors', async () => {
      mockProcess.mockRejectedValue(new Error('Something went wrong'));

      const event = createEvent({
        task: 'generate_prompt',
        inputs: { round: 1 }
      });

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;
      const body = JSON.parse(result.body);

      expect(result.statusCode).toBe(500);
      expect(body.error).toBe('Internal server error');
    });

    it('should handle empty body', async () => {
      const event = createEvent(null);
      event.body = null;

      const result = await handler(event, {} as any, {} as any) as APIGatewayProxyResult;
      const body = JSON.parse(result.body);

      expect(result.statusCode).toBe(400);
      expect(body.error).toBe('Invalid request');
    });
  });

  describe('Model defaults', () => {
    const testCases = [
      { task: 'generate_prompt', expectedModel: 'claude-3-sonnet' },
      { task: 'robot_response', expectedModel: 'claude-3-haiku' },
      { task: 'analyze_match', expectedModel: 'claude-3-sonnet' },
      { task: 'summarize', expectedModel: 'claude-3-haiku' },
      { task: 'custom', expectedModel: 'claude-3-sonnet' }
    ];

    testCases.forEach(({ task, expectedModel }) => {
      it(`should use ${expectedModel} as default for ${task}`, async () => {
        mockProcess.mockResolvedValue({ result: 'test' });

        const event = createEvent({
          task,
          inputs: {}
        });

        await handler(event, {} as any, {} as any) as APIGatewayProxyResult;

        expect(mockProcess).toHaveBeenCalledWith({
          task,
          model: expectedModel,
          inputs: {},
          options: {}
        });
      });
    });
  });
});