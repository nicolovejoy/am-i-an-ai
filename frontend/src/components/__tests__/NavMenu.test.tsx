import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import NavMenu from "../NavMenu";
import { usePathname } from "next/navigation";

// Mock next navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn().mockReturnValue("/"),
}));

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

// Mock AuthContext
const mockUseAuth = jest.fn();
jest.mock("../../contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("NavMenu", () => {
  const mockUsePathname = usePathname as jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/");
    // Set default mock return value
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      user: null,
      signOut: jest.fn(),
    });
  });

  it("renders logo and brand name", () => {
    render(<NavMenu />);
    expect(screen.getByText("Am I an AI?")).toBeInTheDocument();
  });

  it("shows About link for all users", () => {
    render(<NavMenu />);
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
  });

  it("shows Chat link only for authenticated users", () => {
    // Test unauthenticated state
    render(<NavMenu />);
    expect(
      screen.queryByRole("link", { name: "Chat" })
    ).not.toBeInTheDocument();

    // Test authenticated state
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: null,
      signOut: jest.fn(),
    });
    render(<NavMenu />);
    expect(screen.getByRole("link", { name: "Chat" })).toBeInTheDocument();
  });

  it("shows Sign In and Sign Up links for unauthenticated users", () => {
    render(<NavMenu />);
    expect(screen.getByRole("link", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("shows Sign Out button for authenticated users", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: null,
      signOut: jest.fn(),
    });
    render(<NavMenu />);
    expect(
      screen.getByRole("button", { name: "Sign Out" })
    ).toBeInTheDocument();
  });

  it("toggles mobile menu when button is clicked", () => {
    render(<NavMenu />);

    // Mobile menu should be hidden initially
    expect(screen.queryByLabelText("Mobile menu")).not.toBeInTheDocument();

    // Click the mobile menu button
    const menuButton = screen.getByLabelText("Toggle mobile menu");
    fireEvent.click(menuButton);

    // Mobile menu should now be visible
    expect(screen.getByLabelText("Mobile menu")).toBeInTheDocument();

    // Click again to close
    fireEvent.click(menuButton);

    // Mobile menu should be hidden again
    expect(screen.queryByLabelText("Mobile menu")).not.toBeInTheDocument();
  });

  it("calls signOut when clicking Sign Out button", () => {
    const mockSignOut = jest.fn();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      error: null,
      user: null,
      signOut: mockSignOut,
    });
    render(<NavMenu />);

    const signOutButton = screen.getByRole("button", { name: "Sign Out" });
    fireEvent.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalled();
  });
});
