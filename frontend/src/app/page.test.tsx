import React from "react";
import { screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "./page";
import { render } from "@/test-utils/custom-render";

// Mock the ChatContainer component
jest.mock("@/components/ChatContainer", () => {
  return function MockChatContainer() {
    return <div data-testid="chat-interface-mock" />;
  };
});

describe("Home Page", () => {
  it("renders the main title", async () => {
    await render(<Home />);

    // Check main title
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/am i an ai\?/i);
  });

  it("renders the chat interface", async () => {
    await render(<Home />);

    // Check if the mocked chat interface component is rendered
    expect(screen.getByTestId("chat-interface-mock")).toBeInTheDocument();
  });
});
