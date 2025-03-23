import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ChatContainer from "./ChatContainer";

// Mock the dynamic import of ChatInterface
jest.mock("next/dynamic", () => () => {
  const MockedChatInterface = () => (
    <div data-testid="chat-interface-dynamic-mock" />
  );
  return {
    __esModule: true,
    default: MockedChatInterface,
  };
});

describe("ChatContainer", () => {
  it("renders the chat interface", () => {
    render(<ChatContainer />);

    // Check if the dynamically loaded ChatInterface is rendered
    expect(
      screen.getByTestId("chat-interface-dynamic-mock")
    ).toBeInTheDocument();
  });
});
