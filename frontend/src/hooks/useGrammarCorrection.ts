import { useMutation } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_MATCH_SERVICE_API || '';

interface GrammarCorrectionRequest {
  text: string;
  preserveStyle?: boolean;
}

interface GrammarCorrectionResult {
  corrected: string;
  changes: Array<{
    original: string;
    corrected: string;
    type: 'spelling' | 'grammar' | 'punctuation' | 'capitalization';
  }>;
  confidence: number;
}

async function requestGrammarCorrection(request: GrammarCorrectionRequest): Promise<GrammarCorrectionResult> {
  const response = await fetch(`${API_URL}/ai/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      task: 'grammar_correction',
      model: 'claude-3-haiku',
      inputs: request,
      options: {
        temperature: 0.1,
        maxTokens: 200
      }
    }),
  });

  if (!response.ok) {
    throw new Error('Grammar correction failed');
  }

  const data = await response.json();
  return data.result;
}

export function useGrammarCorrection() {
  return useMutation({
    mutationFn: requestGrammarCorrection,
    mutationKey: ['grammar-correction'],
  });
}