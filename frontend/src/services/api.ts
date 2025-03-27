"use client";

// For now we'll simulate an API response
// Later we can connect to a real AI detection API

import { Message } from "@/types/chat";

declare const process: {
  env: {
    NEXT_PUBLIC_API_URL?: string;
  };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

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

// Chat types
export type ChatRequest = {
  message: string;
};

export type ChatResponse = {
  message: string;
  messages?: Message[];
};

// Chat API endpoints
export const sendMessage = async (message: string): Promise<ChatResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return response.json();
  } catch (error) {
    // Instead of console.error, we'll throw the error to be handled by the caller
    throw new Error(
      error instanceof Error ? error.message : "Failed to send message"
    );
  }
};
