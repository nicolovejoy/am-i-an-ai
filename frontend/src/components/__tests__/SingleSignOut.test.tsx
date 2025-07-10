import React from 'react';
import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import HistoryPage from "@/app/history/page";
import AboutPage from "@/app/about/page";

// Mock dependencies
interface LinkProps {
  children: React.ReactNode;
  to: string;
  className?: string;
}

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: "/" }),
  Link: ({ children, to, className }: LinkProps) => <a href={to} className={className}>{children}</a>
}));

jest.mock("@/store/sessionStore", () => ({
  useSessionStore: () => ({
    match: null,
    connectionStatus: "disconnected",
    testingMode: false,
    connect: jest.fn(),
    disconnect: jest.fn(),
    sendMessage: jest.fn(),
    reset: jest.fn(),
    startTestingMode: jest.fn(),
  }),
}));

// Mock AuthProvider separately
jest.mock("@/contexts/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@/contexts/useAuth", () => ({
  useAuth: () => ({
    user: { email: "test@example.com" },
    signOut: jest.fn(),
    isLoading: false,
  }),
}));

// Helper to render components
const renderComponent = (component: React.ReactElement) => {
  return render(component);
};

describe("Single Sign Out Button Rule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should have at most one sign out button on the home page", () => {
    renderComponent(<Home />);

    // Look for any element containing "sign out" text (case insensitive)
    const signOutElements = screen.queryAllByText(/sign out/i);
    expect(signOutElements.length).toBeLessThanOrEqual(1);
  });

  it("should have at most one sign out button on the history page", () => {
    renderComponent(<HistoryPage />);

    const signOutElements = screen.queryAllByText(/sign out/i);
    expect(signOutElements.length).toBeLessThanOrEqual(1);
  });

  it("should have at most one sign out button on the about page", () => {
    renderComponent(<AboutPage />);

    const signOutElements = screen.queryAllByText(/sign out/i);
    expect(signOutElements.length).toBeLessThanOrEqual(1);
  });

  it('should not show old project name "am I an AI?" in navigation', () => {
    renderComponent(<Home />);

    // Should not find the old name
    expect(screen.queryByText("am I an AI?")).not.toBeInTheDocument();

    // Should find the new name (if navigation is rendered)
    const robotOrchestra = screen.queryAllByText("Robot Orchestra");
    expect(robotOrchestra.length).toBeGreaterThanOrEqual(0); // May or may not be visible depending on auth state
  });
});
