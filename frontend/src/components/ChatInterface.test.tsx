import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import ChatInterface from "./ChatInterface";

jest.useFakeTimers();

// Mock scrollIntoView since it's not available in the test environment
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe("ChatInterface", () => {
  it("renders the component and shows initial greeting", async () => {
    render(<ChatInterface />);

    // Advance timers to trigger the initial greeting
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    await waitFor(() => {
      expect(screen.getByText("Hello, how are you?")).toBeInTheDocument();
    });
  });

  it("allows user to input and submit messages", async () => {
    render(<ChatInterface />);

    // Get the input field and submit button
    const input = screen.getByPlaceholderText("Type your message...");
    const submitButton = screen.getByRole("button", { name: /send message/i });

    // Type a message
    await act(async () => {
      fireEvent.change(input, {
        target: { value: "I am doing well, thanks!" },
      });
    });

    // Submit the message
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Check if user message appears
    await waitFor(() => {
      expect(screen.getByText("I am doing well, thanks!")).toBeInTheDocument();
    });

    // Advance timers to trigger the response
    await act(async () => {
      jest.advanceTimersByTime(2500);
    });

    // Check if response appears
    await waitFor(() => {
      expect(
        screen.getByText(
          "Thanks for sharing. What brings you to our site today?"
        )
      ).toBeInTheDocument();
    });
  });
});
