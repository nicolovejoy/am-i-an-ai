import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import LoginForm from "./LoginForm";
import useAuthStore from "@/store/useAuthStore";

// Mock the auth store
jest.mock("@/store/useAuthStore");

const mockLogin = jest.fn();
const mockClearError = jest.fn();

// Setup the mock implementation with proper type casting
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;
mockedUseAuthStore.mockImplementation((selector) => {
  if (typeof selector === "function") {
    return selector({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: mockLogin,
      register: jest.fn(),
      logout: jest.fn(),
      clearError: mockClearError,
    });
  }
  return {
    login: mockLogin,
    clearError: mockClearError,
  };
});

describe("LoginForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    render(<LoginForm />);

    // Check that form elements are present
    expect(screen.getByLabelText(/EMAIL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/PASSWORD/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /LOGIN/i })).toBeInTheDocument();
    expect(screen.getByText(/Demo credentials/i)).toBeInTheDocument();
  });

  it("handles form submission", async () => {
    render(<LoginForm />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/EMAIL/i), {
      target: { value: "test@example.com" },
    });

    fireEvent.change(screen.getByLabelText(/PASSWORD/i), {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /LOGIN/i }));

    // Check that login was called with correct values
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("shows loading state when isLoading is true", () => {
    // Mock loading state
    mockedUseAuthStore.mockImplementation((selector) => {
      if (typeof selector === "function") {
        return selector({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: true,
          error: null,
          login: mockLogin,
          register: jest.fn(),
          logout: jest.fn(),
          clearError: mockClearError,
        });
      }
      return {
        login: mockLogin,
        clearError: mockClearError,
      };
    });

    render(<LoginForm />);

    // Check for loading text
    expect(
      screen.getByRole("button", { name: /AUTHENTICATING/i })
    ).toBeInTheDocument();

    // Check that inputs are disabled
    expect(screen.getByLabelText(/EMAIL/i)).toBeDisabled();
    expect(screen.getByLabelText(/PASSWORD/i)).toBeDisabled();
  });

  it("displays an error message when there is an error", () => {
    // Mock error state
    mockedUseAuthStore.mockImplementation((selector) => {
      if (typeof selector === "function") {
        return selector({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: "Invalid credentials",
          login: mockLogin,
          register: jest.fn(),
          logout: jest.fn(),
          clearError: mockClearError,
        });
      }
      return {
        login: mockLogin,
        clearError: mockClearError,
      };
    });

    render(<LoginForm />);

    // Check for error message
    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();

    // Click the dismiss button
    fireEvent.click(screen.getByText("DISMISS"));

    // Check that clearError was called
    expect(mockClearError).toHaveBeenCalled();
  });
});
