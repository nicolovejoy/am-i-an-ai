import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import NavMenu from "./NavMenu";

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

// Mock next/image to use a div instead of img to avoid lint warnings
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

jest.mock("@/store/useAuthStore", () => ({
  __esModule: true,
  default: () => ({
    user: { id: "123", name: "Test", email: "test@example.com" },
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

describe("NavMenu", () => {
  it("renders without crashing", () => {
    expect(() => render(<NavMenu />)).not.toThrow();
  });
});
