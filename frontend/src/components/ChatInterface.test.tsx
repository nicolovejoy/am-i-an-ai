import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatInterface from "./ChatInterface";

jest.useFakeTimers();

describe("ChatInterface", () => {
  it("renders the component and shows initial greeting", async () => {
    render(<ChatInterface />);

    // Advance timers to trigger the initial greeting
    jest.advanceTimersByTime(1500);

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
    fireEvent.change(input, { target: { value: "I am doing well, thanks!" } });

    // Submit the message
    fireEvent.click(submitButton);

    // Check if user message appears
    await waitFor(() => {
      expect(screen.getByText("I am doing well, thanks!")).toBeInTheDocument();
    });

    // Advance timers to trigger the response
    jest.advanceTimersByTime(2500);

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
