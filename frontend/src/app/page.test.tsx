import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "./page";

// Mock the ChatContainer component
jest.mock("@/components/ChatContainer", () => {
  return function MockChatContainer() {
    return <div data-testid="chat-interface-mock" />;
  };
});

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

  it("renders the chat interface when authenticated", () => {
    // Mock authenticated state
    mockUseAuth.isAuthenticated = true;
    mockUseAuth.user = { email: "test@example.com", sub: "123" };

    render(<Home />);

    // Check if the mocked chat interface component is rendered
    expect(screen.getByTestId("chat-interface-mock")).toBeInTheDocument();
    
    // Check main title for authenticated view
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/am i an ai\?/i);
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
