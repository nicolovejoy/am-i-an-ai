"use client";

// For now we'll simulate an API response
// Later we can connect to a real AI detection API

export type AnalysisResult = {
  result: "human" | "ai" | "unknown";
  confidence: number;
};

export type PastAnalysis = {
  id: string;
  result: "human" | "ai" | "unknown";
  confidence: number;
  timestamp: string;
  title: string;
  tokenCount: number;
};

export type UserProfile = {
  name: string;
  email: string;
  joined: string;
  usageCount: number;
};

export const analyzeText = async (text: string): Promise<AnalysisResult> => {
  console.log(text); // This line is just to use the 'text' parameter
  // This is a simulation - we'll replace with real API call later
  return new Promise((resolve) => {
    // Simulate API call delay
    setTimeout(() => {
      // For demo purposes, randomly determine if text is AI or human
      const isAI = Math.random() > 0.5;
      const confidence = Math.floor(Math.random() * 40) + 60; // 60-99% confidence

      resolve({
        result: isAI ? "ai" : "human",
        confidence: confidence,
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

// New functions for React Query

// Get past analyses
export const getPastAnalyses = async (): Promise<PastAnalysis[]> => {
  // Simulate API call to get past analyses
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "anal1",
          result: "ai",
          confidence: 89,
          timestamp: "2025.03.05.1422",
          title: "Project Proposal",
          tokenCount: 1247,
        },
        {
          id: "anal2",
          result: "human",
          confidence: 92,
          timestamp: "2025.03.03.0917",
          title: "Research Paper",
          tokenCount: 3842,
        },
        {
          id: "anal3",
          result: "ai",
          confidence: 76,
          timestamp: "2025.02.28.1655",
          title: "Marketing Email",
          tokenCount: 651,
        },
      ]);
    }, 1000);
  });
};

// Get user profile
export const getUserProfile = async (): Promise<UserProfile> => {
  // Simulate API call to get user profile
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: "Operator.347",
        email: "user@example.com",
        joined: "Cycle 27.3.1",
        usageCount: 42,
      });
    }, 800);
  });
};

// Delete analysis
export const deleteAnalysis = async (id: string): Promise<void> => {
  console.log(`Deleting analysis ${id}`);
  // Simulate API call to delete an analysis
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
};
