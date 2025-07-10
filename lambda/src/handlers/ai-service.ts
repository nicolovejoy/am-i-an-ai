import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda';
import { AITaskProcessor } from '../services/ai-task-processor';
import { z } from 'zod';

// Request validation schema
const AIRequestSchema = z.object({
  task: z.enum(['generate_prompt', 'robot_response', 'analyze_match', 'summarize', 'custom']),
  model: z.enum(['claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus']).optional(),
  inputs: z.record(z.any()),
  options: z.object({
    temperature: z.number().min(0).max(1).optional(),
    maxTokens: z.number().min(1).max(4096).optional(),
    streaming: z.boolean().optional()
  }).optional()
});

const processor = new AITaskProcessor();

function getDefaultModel(task: string): string {
  const modelMap: Record<string, string> = {
    'generate_prompt': 'claude-3-sonnet',
    'robot_response': 'claude-3-haiku',
    'analyze_match': 'claude-3-sonnet',
    'summarize': 'claude-3-haiku',
    'custom': 'claude-3-sonnet'
  };
  return modelMap[task] || 'claude-3-sonnet';
}

export const handler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
  console.log('AI Service request:', event.path, event.httpMethod);

  // Enable CORS
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Parse and validate request
    const body = JSON.parse(event.body || '{}');
    const validationResult = AIRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Invalid request', 
          details: validationResult.error.flatten() 
        })
      };
    }

    const { task, model, inputs, options } = validationResult.data;

    // Process AI task
    const result = await processor.process({
      task,
      model: model || getDefaultModel(task),
      inputs,
      options: options || {}
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        task,
        model: model || getDefaultModel(task),
        result
      })
    };
  } catch (error) {
    console.error('AI service error:', error);
    
    // Determine error type and status code
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error instanceof Error) {
      if (error.message.includes('Unknown task')) {
        statusCode = 400;
        errorMessage = error.message;
      } else if (error.message.includes('rate limit')) {
        statusCode = 429;
        errorMessage = 'Rate limit exceeded';
      } else if (error.message.includes('Invalid API key') || error.message.includes('authentication')) {
        statusCode = 401;
        errorMessage = 'Authentication error';
      }
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({ 
        error: errorMessage
      })
    };
  }
};