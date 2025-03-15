// frontend/src/components/NavMenu.test.tsx
import React from "react";
import { render } from "@testing-library/react";
import NavMenu from "./NavMenu";
import "@testing-library/jest-dom";
import { describe, expect, jest, test, beforeEach } from "@jest/globals";

// Mock the auth store
jest.mock("@/store/useAuthStore", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isLoggedIn: false,
    login: jest.fn(),
    logout: jest.fn(),
  })),
}));

// Mock Next.js hooks for testing purposes
jest.mock("next/navigation", () => ({
  usePathname: () => "/test",
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("NavMenu component", () => {
  // Basic test to verify Jest is working
  test("true should be true", () => {
    expect(true).toBe(true);
  });

  // Test rendering NavMenu with minimal validation
  // This just ensures the component renders without errors
  test("renders NavMenu component without crashing", () => {
    render(<NavMenu />);
  });
});
