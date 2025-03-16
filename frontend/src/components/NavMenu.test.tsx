/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import NavMenu from "./NavMenu";
import * as authStore from "../store/useAuthStore";

// Mock the next/navigation hook
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// Mock the auth store
const mockUser = {
  id: "user123",
  name: "Operator.347",
  email: "user@example.com",
};

const mockLogin = jest.fn();
const mockLogout = jest.fn();
const mockInitialize = jest.fn();

describe("NavMenu", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    // Mock the useAuthStore hook
    jest.spyOn(authStore, "default").mockImplementation((selector) => {
      const state = {
        isLoggedIn: true,
        user: mockUser,
        login: mockLogin,
        logout: mockLogout,
        initialize: mockInitialize,
      };
      return selector ? selector(state) : state;
    });
  });

  it("renders navigation links", () => {
    render(<NavMenu />);

    // Check for main navigation links in desktop view
    expect(
      screen.getByText("Home", { selector: "a[href='/']" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Text Analysis", { selector: "a[href='/analysis']" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("About", { selector: "a[href='/about']" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Donate", { selector: "a[href='/donate']" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Account", { selector: "a[href='/account']" })
    ).toBeInTheDocument();
  });

  it("shows login button when not logged in", () => {
    // Mock the store to return not logged in
    jest.spyOn(authStore, "default").mockImplementation((selector) => {
      const state = {
        isLoggedIn: false,
        user: null,
        login: mockLogin,
        logout: mockLogout,
        initialize: mockInitialize,
      };
      return selector ? selector(state) : state;
    });

    render(<NavMenu />);
    const loginButton = screen.getByRole("button", { name: /login/i });
    expect(loginButton).toBeInTheDocument();

    fireEvent.click(loginButton);
    expect(mockLogin).toHaveBeenCalledWith(mockUser);
  });

  it("shows logout button when logged in", () => {
    render(<NavMenu />);
    const logoutButton = screen.getByRole("button", { name: /logout/i });
    expect(logoutButton).toBeInTheDocument();

    fireEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalled();
  });

  it("toggles mobile menu when hamburger button is clicked", () => {
    render(<NavMenu />);

    // Find and click the mobile menu button
    const menuButton = screen.getByRole("button", { name: /open main menu/i });
    fireEvent.click(menuButton);

    // Check that mobile menu items are visible
    const mobileMenu = screen.getByRole("navigation");
    expect(mobileMenu).toBeInTheDocument();
  });
});
