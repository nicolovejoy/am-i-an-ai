import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import NavMenu from "./NavMenu";
import useAuthStore from "@/store/useAuthStore";

// Mock next navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// Mock the auth store
jest.mock("@/store/useAuthStore");
const mockLogout = jest.fn();

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
      login: jest.fn(),
      register: jest.fn(),
      logout: mockLogout,
      clearError: jest.fn(),
    });
  }
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    logout: mockLogout,
  };
});

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: {
    className?: string;
    alt?: string;
    src?: string;
    width?: number;
    height?: number;
    priority?: boolean;
  }) => (
    <div
      data-testid="mock-image"
      className={props.className}
      aria-label={props.alt}
    />
  ),
}));

// No need to mock the auth store as we're not testing that functionality

describe("NavMenu Component", () => {
  it("renders without crashing", () => {
    expect(() => render(<NavMenu />)).not.toThrow();
  });

  it("displays all main navigation links", () => {
    render(<NavMenu />);

    // Check for main navigation links
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Text Analysis")).toBeInTheDocument();
    expect(screen.getByText("About")).toBeInTheDocument();
    expect(screen.getByText("Donate")).toBeInTheDocument();
  });
});
