import React from "react";
import { render, screen, act } from "@testing-library/react";
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
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  return (
    <div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <div data-testid="isLoading">{isLoading.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : "null"}</div>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should provide initial loading state", async () => {
    // Mock getCurrentUser to return a pending promise that never resolves
    (cognitoService.getCurrentUser as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    expect(screen.getByTestId("isLoading").textContent).toBe("true");
    expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("should handle successful authentication", async () => {
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

    expect(screen.getByTestId("isLoading").textContent).toBe("false");
    expect(screen.getByTestId("isAuthenticated").textContent).toBe("true");
    expect(screen.getByTestId("user").textContent).toBe(
      JSON.stringify(mockUser)
    );
  });

  it("should handle failed authentication", async () => {
    (cognitoService.getCurrentUser as jest.Mock).mockRejectedValue(
      new Error("Auth failed")
    );

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

    expect(screen.getByTestId("isLoading").textContent).toBe("false");
    expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("should handle sign out", async () => {
    const mockUser = { email: "test@example.com", sub: "123" };
    (cognitoService.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

    await act(async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
    });

    // Wait for initial auth check
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Click sign out button
    await act(async () => {
      screen.getByText("Sign Out").click();
    });

    expect(cognitoService.signOut).toHaveBeenCalled();
    expect(screen.getByTestId("isAuthenticated").textContent).toBe("false");
    expect(screen.getByTestId("user").textContent).toBe("null");
  });

  it("should throw error when used outside AuthProvider", () => {
    // Suppress console error for this test
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useAuth must be used within an AuthProvider");

    consoleSpy.mockRestore();
  });
});
