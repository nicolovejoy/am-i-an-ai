import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AuthProvider } from "./AuthProvider";
import useAuthStore from "@/store/useAuthStore";

// Mock the auth store
jest.mock("@/store/useAuthStore");

const mockLoginFn = jest.fn();

// Setup the mock with proper type casting
const mockedUseAuthStore = useAuthStore as unknown as jest.Mock;
mockedUseAuthStore.mockReturnValue({
  login: mockLoginFn,
  isAuthenticated: false,
  user: null,
  token: null,
});

// Also mock getState
(useAuthStore.getState as jest.Mock) = jest.fn().mockReturnValue({
  login: mockLoginFn,
});

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

describe("AuthProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  it("initializes without attempting to restore session when no token in localStorage", () => {
    // Mock empty localStorage (no token)
    mockLocalStorage.getItem.mockReturnValue(null);

    render(
      <AuthProvider>
        <div>Test Child</div>
      </AuthProvider>
    );

    // Login should not be called
    expect(mockLoginFn).not.toHaveBeenCalled();
  });

  it("attempts to restore session when token is in localStorage", () => {
    // Mock localStorage with token
    const mockUser = {
      id: "123",
      name: "Test User",
      email: "test@example.com",
    };
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === "user") return JSON.stringify(mockUser);
      if (key === "token") return "fake-token";
      return null;
    });

    render(
      <AuthProvider>
        <div>Test Child</div>
      </AuthProvider>
    );

    // Should attempt to restore session
    expect(mockLoginFn).toHaveBeenCalledWith({
      user: mockUser,
      token: "fake-token",
      skipApi: true,
    });
  });

  it("renders children correctly", () => {
    const { getByText } = render(
      <AuthProvider>
        <div>Test Child Content</div>
      </AuthProvider>
    );

    expect(getByText("Test Child Content")).toBeInTheDocument();
  });

  it("handles invalid JSON in localStorage gracefully", () => {
    // Mock localStorage with invalid JSON
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === "user") return "invalid-json";
      if (key === "token") return "fake-token";
      return null;
    });

    // Should not throw
    expect(() => {
      render(
        <AuthProvider>
          <div>Test Child</div>
        </AuthProvider>
      );
    }).not.toThrow();

    // Login should not be called with invalid data
    expect(mockLoginFn).not.toHaveBeenCalled();
  });
});
