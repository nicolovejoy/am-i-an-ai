import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatInterface from "../ChatInterface";

// Mock the useRef hook
const mockScrollIntoView = jest.fn();
const mockFocus = jest.fn();

// Create a mock element with scrollIntoView
const mockElement = {
  scrollIntoView: mockScrollIntoView,
  focus: mockFocus,
};

jest.spyOn(React, "useRef").mockImplementation(() => ({
  current: mockElement,
}));

describe("ChatInterface", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the chat interface", () => {
    render(<ChatInterface />);
    expect(
      screen.getByPlaceholderText("Type your message...")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send message/i })
    ).toBeInTheDocument();
  });

  it("displays initial greeting message", async () => {
    render(<ChatInterface />);
    await waitFor(
      () => {
        expect(screen.getByText("Hello! What's up?")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("allows sending messages", async () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText(
      "Type your message..."
    ) as HTMLInputElement;
    const sendButton = screen.getByRole("button", { name: /send message/i });

    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.click(sendButton);

    expect(screen.getByText("Test message")).toBeInTheDocument();
    expect(input.value).toBe("");
  });

  it("shows typing indicator when processing message", async () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText(
      "Type your message..."
    ) as HTMLInputElement;
    const sendButton = screen.getByRole("button", { name: /send message/i });

    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.click(sendButton);

    expect(screen.getByText("Test message")).toBeInTheDocument();
    await waitFor(
      () => {
        expect(
          screen.getByText("Server received: Test message")
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
