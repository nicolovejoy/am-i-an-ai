import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import NavMenu from "../NavMenu";
import { useAuth } from "../../contexts/AuthContext";
import { usePathname } from "next/navigation";

// Mock next navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
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
jest.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    user: null,
    signOut: jest.fn(),
  }),
}));

describe("NavMenu", () => {
  const mockUsePathname = usePathname as jest.Mock;
  const mockUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/");
  });

  it("renders logo and brand name", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, signOut: jest.fn() });
    render(<NavMenu />);

    expect(screen.getByText("Am I an AI?")).toBeInTheDocument();
  });

  it("shows About link for all users", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, signOut: jest.fn() });
    render(<NavMenu />);

    // Check for desktop About link
    expect(screen.getByRole("link", { name: "About" })).toBeInTheDocument();
  });

  it("shows Chat link only for authenticated users", () => {
    // Test unauthenticated state
    mockUseAuth.mockReturnValue({ isAuthenticated: false, signOut: jest.fn() });
    render(<NavMenu />);
    expect(
      screen.queryByRole("link", { name: "Chat" })
    ).not.toBeInTheDocument();

    // Test authenticated state
    mockUseAuth.mockReturnValue({ isAuthenticated: true, signOut: jest.fn() });
    render(<NavMenu />);
    expect(screen.getByRole("link", { name: "Chat" })).toBeInTheDocument();
  });

  it("shows Sign In and Sign Up links for unauthenticated users", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, signOut: jest.fn() });
    render(<NavMenu />);

    expect(screen.getByRole("link", { name: "Sign In" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("shows Sign Out button for authenticated users", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, signOut: jest.fn() });
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
      signOut: mockSignOut,
    });
    render(<NavMenu />);

    const signOutButton = screen.getByRole("button", { name: "Sign Out" });
    fireEvent.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalled();
  });
});
