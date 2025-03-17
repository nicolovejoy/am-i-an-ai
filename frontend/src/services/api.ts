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

// Auth types
export type LoginCredentials = {
  email?: string;
  password?: string;
  user?: User;
  token?: string;
  skipApi?: boolean;
};

export type RegisterCredentials = {
  name: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  user: User;
  token: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
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

// Auth API endpoints
export const loginUser = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  // For demo purposes, we'll simulate a successful login with a fake user and token
  // In a real app, this would be an API call to your authentication endpoint

  // Fake login delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Simple validation to simulate API behavior
  if (!credentials.email || !credentials.password) {
    throw new Error("Email and password are required");
  }

  // Just for demo - check for a test user
  if (
    credentials.email === "demo@example.com" &&
    credentials.password === "password"
  ) {
    return {
      user: {
        id: "user-123",
        name: "Demo User",
        email: "demo@example.com",
      },
      token: "fake-jwt-token-xyz",
    };
  }

  // Simulate failed login
  throw new Error("Invalid credentials");
};

export const registerUser = async (
  credentials: RegisterCredentials
): Promise<AuthResponse> => {
  // Fake registration delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simple validation to simulate API behavior
  if (!credentials.name || !credentials.email || !credentials.password) {
    throw new Error("Name, email, and password are required");
  }

  // In a real app, this would create a new user in your backend
  // For demo, we'll just return a successful registration with the user info
  return {
    user: {
      id: `user-${Date.now()}`,
      name: credentials.name,
      email: credentials.email,
    },
    token: "fake-jwt-token-new-user",
  };
};

export const logoutUser = async (): Promise<void> => {
  // In a real app, this might notify the backend about the logout
  // For demo, we'll just simulate a short delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return;
};

export const getUserProfile = async (): Promise<UserProfile> => {
  // Fake API call delay
  await new Promise((resolve) => setTimeout(resolve, 700));

  // Return mock profile data
  return {
    name: "Demo User",
    email: "demo@example.com",
    joined: new Date().toISOString(),
    usageCount: Math.floor(Math.random() * 50),
  };
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
