import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AccountPage from "./page";
import useAuthStore from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the dependencies
jest.mock("@/store/useAuthStore");
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));
jest.mock("@/components/ProtectedRoute", () => {
  return function MockProtectedRoute({
    children,
  }: {
    children: React.ReactNode;
  }) {
    // For testing purposes, we'll just render the children directly
    // The ProtectedRoute component is tested separately
    return <div data-testid="protected-route-wrapper">{children}</div>;
  };
});

// Mock the useQueries hook
jest.mock("@/hooks/useQueries", () => ({
  useUserProfile: () => ({
    data: { name: "Test User", email: "test@example.com" },
    isLoading: false,
    error: null,
  }),
}));

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
const mockLogout = jest.fn();

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("AccountPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authenticated state by default
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
          logout: mockLogout,
          clearError: jest.fn(),
        });
      }
      return {
        isAuthenticated: true,
        user: { id: "123", name: "Test User", email: "test@example.com" },
        logout: mockLogout,
      };
    });
  });

  const renderWithQueryClient = (ui: React.ReactElement) => {
    const testQueryClient = createTestQueryClient();
    return render(
      <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>
    );
  };

  it("renders account page inside ProtectedRoute wrapper", () => {
    renderWithQueryClient(<AccountPage />);

    // Should be wrapped in ProtectedRoute
    expect(screen.getByTestId("protected-route-wrapper")).toBeInTheDocument();

    // Account page content should be rendered
    expect(screen.getByText("USER TERMINAL ACCESS")).toBeInTheDocument();
  });

  it("shows user information when authenticated", () => {
    renderWithQueryClient(<AccountPage />);

    // User information should be displayed
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("has a working logout button", () => {
    renderWithQueryClient(<AccountPage />);

    // Find and click the logout button (which is actually called "TERMINATE SYSTEM ACCESS" in the UI)
    const logoutButton = screen.getByText("TERMINATE SYSTEM ACCESS");
    expect(logoutButton).toBeInTheDocument();
    logoutButton.click();

    // Logout function should have been called
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
