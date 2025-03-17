import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import RegisterForm from "./RegisterForm";
import useAuthStore from "@/store/useAuthStore";

// Mock the auth store
jest.mock("@/store/useAuthStore");

// Type the mocked version of useAuthStore
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;

describe("RegisterForm", () => {
  // Mock functions
  const mockRegister = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default auth store mock
    mockedUseAuthStore.mockImplementation((selector) => {
      if (typeof selector === "function") {
        return selector({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          login: jest.fn(),
          register: mockRegister,
          logout: jest.fn(),
          clearError: mockClearError,
        });
      }
      return {
        register: mockRegister,
        clearError: mockClearError,
      };
    });
  });

  it("renders register form correctly", () => {
    render(<RegisterForm />);

    // Form heading
    expect(screen.getByText("CREATE NEW ACCOUNT")).toBeInTheDocument();

    // Input fields
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    // Submit button
    expect(
      screen.getByRole("button", { name: /register/i })
    ).toBeInTheDocument();
  });

  it("validates form inputs before submission", async () => {
    render(<RegisterForm />);

    // Get form inputs
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Check that required attributes are present
    expect(nameInput).toHaveAttribute("required");
    expect(emailInput).toHaveAttribute("required");
    expect(passwordInput).toHaveAttribute("required");

    // Register function should not be called
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("submits the form with valid data", async () => {
    render(<RegisterForm />);

    // Get form fields and submit button
    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /register/i });

    // Fill form with valid data
    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });

    // Submit form
    fireEvent.click(submitButton);

    // Register function should be called with form data
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("shows loading state during registration", async () => {
    // Mock loading state
    mockedUseAuthStore.mockImplementation((selector) => {
      if (typeof selector === "function") {
        return selector({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: true,
          error: null,
          login: jest.fn(),
          register: mockRegister,
          logout: jest.fn(),
          clearError: mockClearError,
        });
      }
      return {
        isLoading: true,
        register: mockRegister,
        clearError: mockClearError,
      };
    });

    render(<RegisterForm />);

    // Submit button should be disabled
    const submitButton = screen.getByRole("button", {
      name: /creating account/i,
    });
    expect(submitButton).toBeDisabled();

    // Should show loading indicator
    expect(screen.getByText(/CREATING ACCOUNT.../i)).toBeInTheDocument();
  });

  it("displays error message when registration fails", () => {
    // Set up auth store with an error
    mockedUseAuthStore.mockImplementation((selector) => {
      if (typeof selector === "function") {
        return selector({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: "Registration failed",
          login: jest.fn(),
          register: mockRegister,
          logout: jest.fn(),
          clearError: mockClearError,
        });
      }
      return {
        error: "Registration failed",
        register: mockRegister,
        clearError: mockClearError,
        isLoading: false,
      };
    });

    // Render component (with error already in state)
    render(<RegisterForm />);

    // Verify error message appears
    expect(screen.getByText("Registration failed")).toBeInTheDocument();
  });

  it("clears error when form is changed", async () => {
    // Mock error state
    mockedUseAuthStore.mockImplementation((selector) => {
      if (typeof selector === "function") {
        return selector({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: "Registration failed",
          login: jest.fn(),
          register: mockRegister,
          logout: jest.fn(),
          clearError: mockClearError,
        });
      }
      return {
        error: "Registration failed",
        register: mockRegister,
        clearError: mockClearError,
      };
    });

    render(<RegisterForm />);

    // Error is initially displayed
    expect(screen.getByText(/registration failed/i)).toBeInTheDocument();

    // Change a form field
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: "new@example.com" } });

    // Should call clearError
    expect(mockClearError).toHaveBeenCalled();
  });
});
