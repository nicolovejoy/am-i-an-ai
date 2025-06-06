import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Toast } from "./Toast";

describe("Toast", () => {
  const defaultProps = {
    id: "test-toast",
    type: "success" as const,
    title: "Test Title",
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with title", () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("renders with message", () => {
    render(<Toast {...defaultProps} message="Test message" />);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("renders with action button", () => {
    const actionClick = jest.fn();
    render(
      <Toast
        {...defaultProps}
        action={{ label: "Action", onClick: actionClick }}
      />
    );
    
    const actionButton = screen.getByText("Action");
    expect(actionButton).toBeInTheDocument();
    
    fireEvent.click(actionButton);
    expect(actionClick).toHaveBeenCalled();
  });

  it("calls onClose when close button is clicked", async () => {
    render(<Toast {...defaultProps} />);
    
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);
    
    // Wait for the animation delay
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalledWith("test-toast");
    }, { timeout: 500 });
  });

  it("auto-dismisses after duration", async () => {
    render(<Toast {...defaultProps} duration={100} />);
    
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalledWith("test-toast");
    }, { timeout: 500 });
  });

  it("renders correct styles for different types", () => {
    const { rerender } = render(<Toast {...defaultProps} type="success" />);
    expect(screen.getByTestId("toast-success")).toBeInTheDocument();

    rerender(<Toast {...defaultProps} type="error" />);
    expect(screen.getByTestId("toast-error")).toBeInTheDocument();

    rerender(<Toast {...defaultProps} type="warning" />);
    expect(screen.getByTestId("toast-warning")).toBeInTheDocument();

    rerender(<Toast {...defaultProps} type="info" />);
    expect(screen.getByTestId("toast-info")).toBeInTheDocument();
  });
});