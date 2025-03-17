import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProtectedRoute from "./ProtectedRoute";
import useAuthStore from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

// Mock the dependencies
jest.mock("@/store/useAuthStore");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Setup router mock
const mockPush = jest.fn();
const mockedUseRouter = useRouter as jest.Mock;
mockedUseRouter.mockReturnValue({
  push: mockPush,
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
});

// Setup auth store mock
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;

describe("ProtectedRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders children when user is authenticated", () => {
    // Mock authenticated state
    mockedUseAuthStore.mockImplementation((selector) => {
      if (typeof selector === "function") {
        return selector({
          user: { id: "123", name: "Test User", email: "test@example.com" },
          token: "fake-token",
          isAuthenticated: true,
          isLoading: false,
          error: null,
          login: jest.fn(),
          register: jest.fn(),
          logout: jest.fn(),
          clearError: jest.fn(),
        });
      }
      return {
        isAuthenticated: true,
        user: { id: "123", name: "Test User", email: "test@example.com" },
      };
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Children should be rendered
    expect(screen.getByText("Protected Content")).toBeInTheDocument();

    // Should not redirect
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("redirects to login when user is not authenticated", () => {
    // Mock unauthenticated state
    mockedUseAuthStore.mockImplementation((selector) => {
      if (typeof selector === "function") {
        return selector({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          login: jest.fn(),
          register: jest.fn(),
          logout: jest.fn(),
          clearError: jest.fn(),
        });
      }
      return {
        isAuthenticated: false,
        user: null,
      };
    });

    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    // Access denied message should be displayed
    expect(
      screen.getByText("Access denied. Redirecting to login...")
    ).toBeInTheDocument();

    // Children should not be rendered
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();

    // Should redirect to login
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
