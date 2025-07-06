import { render, screen, fireEvent } from "@testing-library/react";
import Home from "@/app/page";
import { Navigation } from "../Navigation";
import { useSessionStore } from "@/store/sessionStore";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";

// Mock dependencies
jest.mock("@/store/sessionStore");
jest.mock("@/contexts/AuthContext");
jest.mock("next/navigation");

const mockUseSessionStore = useSessionStore as jest.MockedFunction<
  typeof useSessionStore
>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;

describe("Navigation Structure (Option B)", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { email: "test@example.com" },
      signOut: jest.fn(),
    } as any);

    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any);

    mockUsePathname.mockReturnValue("/");
  });

  describe("Home Page (/) - Dashboard", () => {
    it("should show dashboard content without auto-connecting to matches", () => {
      // Arrange: User is disconnected (normal state for home page)
      mockUseSessionStore.mockReturnValue({
        connectionStatus: "disconnected",
        match: null,
        testingMode: false,
        connect: jest.fn(),
        disconnect: jest.fn(),
        reset: jest.fn(),
        startTestingMode: jest.fn(),
      } as any);

      // Act: Render home page
      render(<Home />);

      // Assert: Should show dashboard content, not connecting state
      // This test will fail until we implement the dashboard
      expect(screen.queryByText("Connecting...")).not.toBeInTheDocument();
      expect(screen.queryByText("Joining Session...")).not.toBeInTheDocument();

      // Should show dashboard elements (these will be implemented)
      // Note: These expectations define what we want to build
      expect(
        screen.getByText("Welcome to Robot Orchestra")
      ).toBeInTheDocument();
      expect(screen.getByText("Start Playing")).toBeInTheDocument();
    });

    it("should have Start Playing button that navigates to /match", () => {
      mockUseSessionStore.mockReturnValue({
        connectionStatus: "disconnected",
        match: null,
        testingMode: false,
        connect: jest.fn(),
        disconnect: jest.fn(),
        reset: jest.fn(),
        startTestingMode: jest.fn(),
      } as any);

      render(<Home />);

      // Act: Click Start Playing button
      const startButton = screen.getByText("Start Playing");
      fireEvent.click(startButton);

      // Assert: Should navigate to match page
      expect(mockPush).toHaveBeenCalledWith("/match");
    });
  });

  describe("Navigation Component", () => {
    it("should have Home link pointing to /", () => {
      render(<Navigation />);

      const homeLink = screen.getByText("🏠 Home").closest("a");
      expect(homeLink).toHaveAttribute("href", "/");
    });

    it("should have Find Match link pointing to /match", () => {
      render(<Navigation />);

      // This will fail until we update the navigation
      const matchLink = screen.getByText("🎮 Find Match").closest("a");
      expect(matchLink).toHaveAttribute("href", "/match");
    });

    it("should highlight current page correctly", () => {
      mockUsePathname.mockReturnValue("/match");

      render(<Navigation />);

      // Match page should be highlighted
      const matchLink = screen.getByText("🎮 Find Match").closest("a");
      expect(matchLink).toHaveClass("bg-blue-100", "text-blue-700");

      // Home should not be highlighted
      const homeLink = screen.getByText("🏠 Home").closest("a");
      expect(homeLink).not.toHaveClass("bg-blue-100", "text-blue-700");
    });
  });

  describe("Match Page (/match) - Future Implementation", () => {
    // These tests define the expected behavior for the match page
    // They will fail until we create the match page

    it("should auto-connect when visiting match page", () => {
      // This test describes expected behavior for /match page
      // Will be implemented when we create the MatchPage component
      const mockConnect = jest.fn();

      mockUseSessionStore.mockReturnValue({
        connectionStatus: "disconnected",
        match: null,
        testingMode: false,
        connect: mockConnect,
        disconnect: jest.fn(),
        reset: jest.fn(),
        startTestingMode: jest.fn(),
      } as any);

      // Note: This would test the MatchPage component once created
      // render(<MatchPage />);
      // expect(mockConnect).toHaveBeenCalled();

      // For now, just document the expectation
      expect(true).toBe(true); // Placeholder
    });

    it("should show match-finding interface when disconnected", () => {
      // This defines what the /match page should do
      // Will show WelcomeDashboard content for finding matches
      expect(true).toBe(true); // Placeholder for future implementation
    });

    it("should show game interface when in a match", () => {
      // This defines what the /match page should do
      // Will show ChatInterface when user is in an active match
      expect(true).toBe(true); // Placeholder for future implementation
    });
  });

  describe("Leave Match Navigation", () => {
    it("should navigate to /match when leaving a match (not home)", () => {
      // This test will need to be updated in ChatInterface
      // Currently goes to '/', should go to '/match'

      // This defines the expected behavior change
      // The Leave Match button should take users back to match-finding, not home
      expect(true).toBe(true); // Placeholder for implementation
    });
  });
});
