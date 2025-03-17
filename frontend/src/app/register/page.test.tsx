import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RegisterPage from "./page";
import useAuthStore from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

// Mock the dependencies
jest.mock("@/store/useAuthStore");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("@/components/RegisterForm", () => {
  return function MockRegisterForm() {
    return <div data-testid="mock-register-form">Mock Register Form</div>;
  };
});

// Setup mocks with proper type casting
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

const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;

describe("RegisterPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders register form when user is not authenticated", () => {
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

    render(<RegisterPage />);

    // Register form should be rendered
    expect(screen.getByTestId("mock-register-form")).toBeInTheDocument();

    // Redirect message should not be shown
    expect(
      screen.queryByText(/Authenticated. Redirecting/i)
    ).not.toBeInTheDocument();

    // Router should not redirect
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows redirecting message and redirects when user is authenticated", async () => {
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

    render(<RegisterPage />);

    // Redirect message should be shown
    expect(screen.getByText(/Authenticated. Redirecting/i)).toBeInTheDocument();

    // Register form should not be rendered
    expect(screen.queryByTestId("mock-register-form")).not.toBeInTheDocument();

    // Fast forward timeout
    jest.runAllTimers();

    // Router should redirect to account page
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/account");
    });
  });
});
