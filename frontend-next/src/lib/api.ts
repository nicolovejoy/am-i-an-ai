// API Service for the "Am I an AI?" application

export interface AnalysisResult {
  result: "human" | "ai" | "unknown";
  confidence: number;
  details?: string;
}

// Simulated AI text analysis function
export async function analyzeText(text: string): Promise<AnalysisResult> {
  // This is a placeholder function that simulates API call latency
  // In a real application, this would make a fetch request to a backend API

  return new Promise((resolve) => {
    // Simulate API latency
    setTimeout(() => {
      // Simple simulation logic
      if (!text || text.trim().length < 10) {
        resolve({
          result: "unknown",
          confidence: 0.5,
          details: "Text too short for meaningful analysis",
        });
        return;
      }

      // Arbitrary text analysis factors
      const wordCount = text.split(/\s+/).length;
      const avgWordLength = text.length / wordCount;
      const longSentences = text
        .split(/[.!?]+/)
        .filter((s) => s.trim().split(/\s+/).length > 12).length;

      // Extremely simplified "AI detection" based on text statistics
      // Not an actual AI detection algorithm
      let isAiScore = 0;

      // More structured/formal language often has longer average word length
      if (avgWordLength > 5.5) isAiScore += 0.2;

      // Many AI models tend to create longer, more complex sentences
      if (longSentences > 2) isAiScore += 0.3;

      // Add some randomness to simulate real-world unpredictability
      isAiScore += Math.random() * 0.3;

      let result: "human" | "ai" | "unknown";
      let confidence: number;

      if (isAiScore > 0.7) {
        result = "ai";
        confidence = isAiScore;
      } else if (isAiScore < 0.4) {
        result = "human";
        confidence = 1 - isAiScore;
      } else {
        result = "unknown";
        confidence = 0.5;
      }

      resolve({
        result,
        confidence,
        details: `Analysis based on ${wordCount} words`,
      });
    }, 1500); // 1.5 second delay to simulate API call
  });
}

// In a future version, you could add other API calls here:
// export async function getHistory() {...}
// export async function saveResult(result: AnalysisResult) {...}
// etc.
