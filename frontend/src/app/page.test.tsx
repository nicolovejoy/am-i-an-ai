import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "./page";

// Mock the useAuth hook
const mockUseAuth = {
  isAuthenticated: false,
  isLoading: false,
  user: null as { email: string; sub: string; } | null,
  checkAuth: jest.fn(),
  signOut: jest.fn(),
};

jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth,
}));

describe("Home Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.isAuthenticated = false;
    mockUseAuth.isLoading = false;
    mockUseAuth.user = null;
  });

  it("renders the main title when not authenticated", () => {
    render(<Home />);

    // Check main title for unauthenticated view
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/about am i an ai\?/i);
  });

  it("renders the dashboard when authenticated", () => {
    // Mock authenticated state
    mockUseAuth.isAuthenticated = true;
    mockUseAuth.user = { email: "test@example.com", sub: "123" };

    render(<Home />);

    // Check if authenticated dashboard is rendered
    const welcomeHeading = screen.getByRole("heading", { level: 1 });
    expect(welcomeHeading).toHaveTextContent(/welcome to am i an ai\?/i);
    
    // Check for dashboard navigation cards
    expect(screen.getByText("Conversations")).toBeInTheDocument();
    expect(screen.getByText("Start New Chat")).toBeInTheDocument();
    expect(screen.getByText("Personas")).toBeInTheDocument();
    
    // Check that we're not showing the unauthenticated view
    expect(screen.queryByText(/About Am I an AI/i)).not.toBeInTheDocument();
  });

  it("shows loading state", () => {
    // Mock loading state
    mockUseAuth.isLoading = true;

    render(<Home />);

    // Should show loading spinner
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it("shows get started link when not authenticated", () => {
    render(<Home />);

    // Check for Get Started link
    const getStartedLink = screen.getByRole('link', { name: /get started/i });
    expect(getStartedLink).toBeInTheDocument();
    expect(getStartedLink).toHaveAttribute('href', '/auth/signup');
  });
});
