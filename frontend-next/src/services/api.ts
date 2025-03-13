"use client";

// For now we'll simulate an API response
// Later we can connect to a real AI detection API

export type AnalysisResult = {
  result: "human" | "ai" | "unknown";
  confidence: number;
};

export const analyzeText = async (text: string): Promise<AnalysisResult> => {
  // This is a simulation - we'll replace with real API call later
  return new Promise((resolve) => {
    // Simulate API call delay
    setTimeout(() => {
      // For demo purposes, randomly determine if text is AI or human
      const isAI = Math.random() > 0.5;
      const confidence = Math.floor(Math.random() * 40) + 60; // 60-99% confidence

      resolve({
        result: isAI ? "ai" : "human",
        confidence: confidence / 100, // Next.js version uses 0-1 range
      });
    }, 2000); // Simulate 2 second API call
  });
};

// For future implementation with Next.js API routes
// export const analyzeText = async (text: string): Promise<AnalysisResult> => {
//   try {
//     const response = await fetch('/api/analyze', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ text }),
//     });
//
//     if (!response.ok) {
//       throw new Error('Failed to analyze text');
//     }
//
//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.error('Error analyzing text:', error);
//     return { result: 'unknown', confidence: 0 };
//   }
// };
