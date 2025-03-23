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

describe("Home Page", () => {
  it("renders the main title", () => {
    render(<Home />);

    // Check main title as a whole instead of individual parts
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/am i an ai\?/i);

    // Check for styled spans
    expect(screen.getByText("Am I")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("renders the chat interface", () => {
    render(<Home />);

    // Check if the mocked chat interface component is rendered
    expect(screen.getByTestId("chat-interface-mock")).toBeInTheDocument();
  });
});
