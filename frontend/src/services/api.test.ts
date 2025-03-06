import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { analyzeText } from './api';

// Set up mock server
const server = setupServer(
  http.post('*/analyze', async ({ request }) => {
    const body = (await request.json()) as { text: string };
    const text = body.text;

    // Mock different responses based on the input
    if (text.includes('human')) {
      return HttpResponse.json({
        result: 'human',
        confidence: 85,
      });
    } else if (text.includes('ai')) {
      return HttpResponse.json({
        result: 'ai',
        confidence: 92,
      });
    } else {
      return HttpResponse.json({
        result: 'unknown',
        confidence: 50,
      });
    }
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('API Service', () => {
  // For the demo implementation using setTimeout, let's just make sure it returns expected format
  it('returns analysis result in the expected format', async () => {
    const result = await analyzeText('Sample text');

    expect(result).toHaveProperty('result');
    expect(['human', 'ai', 'unknown']).toContain(result.result);
    expect(result).toHaveProperty('confidence');
    expect(typeof result.confidence).toBe('number');
  });

  // This test will only be relevant once you connect to a real API
  // Currently we're using a mock implementation with setTimeout
  // Leave this commented out until you implement the real API
  /*
  it('calls API with the provided text and returns proper response for human text', async () => {
    const result = await analyzeText('This is human written text example');
    
    expect(result).toEqual({
      result: 'human',
      confidence: 85
    });
  });

  it('returns correct response for AI text', async () => {
    const result = await analyzeText('This is ai generated text example');
    
    expect(result).toEqual({
      result: 'ai',
      confidence: 92
    });
  });

  it('handles unknown cases properly', async () => {
    const result = await analyzeText('Some ambiguous text');
    
    expect(result).toEqual({
      result: 'unknown',
      confidence: 50
    });
  });
  */
});
