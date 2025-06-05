import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import NavMenu from "./NavMenu";

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

// Mock AuthContext with mutable state
const mockAuthState = {
  isAuthenticated: false,
  isLoading: false,
  error: null,
  user: null as { email: string; sub: string; } | null,
  signOut: jest.fn(),
};

jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

describe("NavMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState.isAuthenticated = false;
    mockAuthState.user = null;
  });

  it("renders navigation links", () => {
    render(<NavMenu />);

    // Check for main navigation links
    expect(screen.getByText("About")).toBeInTheDocument();
  });

  it("shows sign in and sign up links when not authenticated", () => {
    render(<NavMenu />);
    
    expect(screen.getByText("Sign In")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Chat")).not.toBeInTheDocument();
  });

  it("shows authenticated user links when authenticated", () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { email: "test@example.com", sub: "123" };
    
    render(<NavMenu />);
    
    expect(screen.getByText("Chat")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Sign Out")).toBeInTheDocument();
    expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign Up")).not.toBeInTheDocument();
  });

  it("shows profile link in mobile menu when authenticated", () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { email: "test@example.com", sub: "123" };
    
    render(<NavMenu />);

    // Open mobile menu
    const menuButton = screen.getByLabelText("Toggle mobile menu");
    fireEvent.click(menuButton);

    // Check that profile appears in both desktop and mobile
    const profileLinks = screen.getAllByText("Profile");
    expect(profileLinks).toHaveLength(2);
  });

  it("calls signOut when sign out button is clicked", () => {
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { email: "test@example.com", sub: "123" };
    
    render(<NavMenu />);
    
    fireEvent.click(screen.getByText("Sign Out"));
    expect(mockAuthState.signOut).toHaveBeenCalled();
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
});
