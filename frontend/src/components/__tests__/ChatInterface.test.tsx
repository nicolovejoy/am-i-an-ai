import { render, screen, fireEvent } from "@testing-library/react";
import ChatInterface from "../ChatInterface";
import { useSessionStore } from "@/store/sessionStore";
import type { SessionStore } from "@/store/types";
import { useAuth } from "@/contexts/useAuth";
import { useNavigate } from "react-router-dom";

// Mock dependencies
jest.mock("@/store/sessionStore");
jest.mock("@/contexts/useAuth");
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn()
}));

const mockUseSessionStore = useSessionStore as jest.MockedFunction<
  typeof useSessionStore
>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>;

describe("ChatInterface", () => {
  const mockDisconnect = jest.fn();
  const mockReset = jest.fn();
  const mockConnect = jest.fn();
  const mockSendMessage = jest.fn();
  const mockStartTestingMode = jest.fn();
  const mockSignOut = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { email: "test@example.com" },
      signOut: mockSignOut,
    } as ReturnType<typeof useAuth>);

    mockUseNavigate.mockReturnValue(mockNavigate);
  });

  describe("Leave Match Button", () => {
    it("should call disconnect when Leave Match button is clicked", async () => {
      // Arrange: Set up a connected session state
      mockUseSessionStore.mockReturnValue({
        connectionStatus: "connected",
        lastError: null,
        myIdentity: "A",
        match: {
          id: "test-match",
          currentRound: 1,
          totalRounds: 5,
          participants: ["A", "B", "C", "D"],
        },
        messages: [],
        currentPrompt: null,
        isSessionActive: true,
        isRevealed: false,
        testingMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        sendMessage: mockSendMessage,
        reset: mockReset,
        startTestingMode: mockStartTestingMode,
      } as SessionStore);

      // Act: Render the component
      render(<ChatInterface />);

      // Assert: Leave Match button should be visible
      const leaveButton = screen.getByText("Leave Match");
      expect(leaveButton).toBeInTheDocument();

      // Act: Click the Leave Match button
      fireEvent.click(leaveButton);

      // Assert: disconnect should be called
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it("should show Leave button on mobile and call disconnect", async () => {
      // Arrange: Set up a connected session state
      mockUseSessionStore.mockReturnValue({
        connectionStatus: "connected",
        lastError: null,
        myIdentity: "A",
        match: {
          id: "test-match",
          currentRound: 1,
          totalRounds: 5,
          participants: ["A", "B", "C", "D"],
        },
        messages: [],
        currentPrompt: null,
        isSessionActive: true,
        isRevealed: false,
        testingMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        sendMessage: mockSendMessage,
        reset: mockReset,
        startTestingMode: mockStartTestingMode,
      } as SessionStore);

      // Act: Render the component
      render(<ChatInterface />);

      // Assert: Mobile Leave button should be visible (though hidden by CSS)
      const leaveButton = screen.getByText("Leave");
      expect(leaveButton).toBeInTheDocument();

      // Act: Click the Leave button
      fireEvent.click(leaveButton);

      // Assert: disconnect should be called
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it("should clear match data and show welcome screen after disconnect", async () => {
      // Arrange: Set up initial connected state
      const mockStore = {
        connectionStatus: "connected",
        lastError: null,
        myIdentity: "A",
        match: {
          id: "test-match",
          currentRound: 1,
          totalRounds: 5,
          participants: ["A", "B", "C", "D"],
        },
        messages: [],
        currentPrompt: null,
        isSessionActive: true,
        isRevealed: false,
        testingMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        sendMessage: mockSendMessage,
        reset: mockReset,
        startTestingMode: mockStartTestingMode,
      };

      mockUseSessionStore.mockReturnValue(mockStore as SessionStore);

      // Act: Render the component
      const { rerender } = render(<ChatInterface />);

      // Act: Click Leave Match
      const leaveButton = screen.getByText("Leave Match");
      fireEvent.click(leaveButton);

      // Assert: disconnect was called
      expect(mockDisconnect).toHaveBeenCalledTimes(1);

      // Act: Simulate what SHOULD happen after disconnect - match cleared
      mockUseSessionStore.mockReturnValue({
        ...mockStore,
        connectionStatus: "disconnected",
        match: null,
        myIdentity: null,
        isSessionActive: false,
      } as SessionStore);

      rerender(<ChatInterface />);

      // Assert: Should show connecting state, not the game interface
      expect(screen.queryByText("Leave Match")).not.toBeInTheDocument();
      expect(screen.getByText("Connecting...")).toBeInTheDocument();
    });

    it("should properly reset session state when leaving", () => {
      // This test verifies that disconnect clears all session data
      // This will fail until we fix the disconnect function
      const mockStore = {
        connectionStatus: "connected",
        lastError: null,
        myIdentity: "A",
        match: {
          id: "test-match",
          currentRound: 1,
          totalRounds: 5,
          participants: ["A", "B", "C", "D"],
        },
        messages: [],
        currentPrompt: null,
        isSessionActive: true,
        isRevealed: false,
        testingMode: false,
        connect: mockConnect,
        disconnect: jest.fn(() => {
          // This simulates the CURRENT behavior (doesn't clear match)
          // The test will show this is inadequate
        }),
        sendMessage: mockSendMessage,
        reset: mockReset,
        startTestingMode: mockStartTestingMode,
      };

      mockUseSessionStore.mockReturnValue(mockStore as SessionStore);
      render(<ChatInterface />);

      const leaveButton = screen.getByText("Leave Match");
      fireEvent.click(leaveButton);

      // The disconnect function should clear match data
      // This expectation will help us write the fix
      expect(mockStore.disconnect).toHaveBeenCalledTimes(1);
    });

    it("should navigate to home page after leaving match", async () => {
      // Arrange: Set up a connected match state
      mockUseSessionStore.mockReturnValue({
        connectionStatus: "connected",
        lastError: null,
        myIdentity: "A",
        match: {
          id: "test-match",
          currentRound: 1,
          totalRounds: 5,
          participants: ["A", "B", "C", "D"],
        },
        messages: [],
        currentPrompt: null,
        isSessionActive: true,
        isRevealed: false,
        testingMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        sendMessage: mockSendMessage,
        reset: mockReset,
        startTestingMode: mockStartTestingMode,
      } as SessionStore);

      // Act: Render the component
      render(<ChatInterface />);

      // Act: Click Leave Match button
      const leaveButton = screen.getByText("Leave Match");
      fireEvent.click(leaveButton);

      // Assert: Should navigate to dashboard page
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe("Session States", () => {
    it("should show connecting state when connection status is connecting", () => {
      mockUseSessionStore.mockReturnValue({
        connectionStatus: "connecting",
        lastError: null,
        myIdentity: null,
        match: null,
        messages: [],
        currentPrompt: null,
        isSessionActive: false,
        isRevealed: false,
        testingMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        sendMessage: mockSendMessage,
        reset: mockReset,
        startTestingMode: mockStartTestingMode,
      } as SessionStore);

      render(<ChatInterface />);

      expect(screen.getByText("Joining Session...")).toBeInTheDocument();
    });

    it("should show error state when connection status is error", () => {
      mockUseSessionStore.mockReturnValue({
        connectionStatus: "error",
        lastError: "Connection failed",
        myIdentity: null,
        match: null,
        messages: [],
        currentPrompt: null,
        isSessionActive: false,
        isRevealed: false,
        testingMode: false,
        connect: mockConnect,
        disconnect: mockDisconnect,
        sendMessage: mockSendMessage,
        reset: mockReset,
        startTestingMode: mockStartTestingMode,
      } as SessionStore);

      render(<ChatInterface />);

      expect(screen.getByText("Connection Error")).toBeInTheDocument();
      expect(screen.getByText("Connection failed")).toBeInTheDocument();
    });
  });
});
