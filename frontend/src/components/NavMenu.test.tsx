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

// Mock AuthContext
jest.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    user: null,
    signOut: jest.fn(),
  }),
}));

describe("NavMenu", () => {
  it("renders navigation links", () => {
    render(<NavMenu />);

    // Check for main navigation links
    expect(screen.getByText("About")).toBeInTheDocument();
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
