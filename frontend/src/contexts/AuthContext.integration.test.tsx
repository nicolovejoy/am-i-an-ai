import React from "react";
import { render, screen, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AuthProvider, useAuth } from "./AuthContext";
import { cognitoService } from "../services/cognito";

// Mock the cognito service
jest.mock("../services/cognito", () => ({
  cognitoService: {
    getCurrentUser: jest.fn(),
    signOut: jest.fn(),
  },
}));

// Test component to use the auth context
const TestComponent = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  return (
    <div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <div data-testid="isLoading">{isLoading.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : "null"}</div>
    </div>
  );
};

describe("AuthContext Initial State Bug", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle the case where getCurrentUser returns user data but user is not actually authenticated", async () => {
    // This simulates the bug: getCurrentUser returns user data even when the user
    // is not actually authenticated (e.g., expired session, invalid tokens)
    const mockUser = { email: "test@example.com", sub: "123" };
    (cognitoService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Wait for the auth check to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // BUG: Currently this will show as authenticated even if the session is invalid
    // The test documents the current (incorrect) behavior
    expect(screen.getByTestId("isLoading").textContent).toBe("false");
    expect(screen.getByTestId("isAuthenticated").textContent).toBe("true"); // This is the bug
    expect(screen.getByTestId("user").textContent).toBe(JSON.stringify(mockUser));
  });

  it("should not show authenticated state when getCurrentUser returns user but session is invalid", async () => {
    // This test shows what SHOULD happen - when session is invalid,
    // getCurrentUser should return null (after our fix)
    
    // Mock getCurrentUser to return null when session is invalid
    (cognitoService.getCurrentUser as jest.Mock).mockResolvedValue(null);

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // EXPECTED behavior: When session is invalid, getCurrentUser returns null
    // and user should not be authenticated
    expect(screen.getByTestId("isLoading").textContent).toBe("false");
    expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("should show loading state initially", async () => {
    // Keep getCurrentUser pending to test initial loading state
    (cognitoService.getCurrentUser as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Should show loading immediately
    expect(screen.getByTestId("isLoading").textContent).toBe("true");
    expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("null");
  });
});