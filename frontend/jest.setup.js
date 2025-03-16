// jest.setup.js
// Setup file for Jest

import "@testing-library/jest-dom";

// Mock the auth store
jest.mock("@/store/useAuthStore", () => ({
  __esModule: true,
  default: () => ({
    isLoggedIn: false,
    login: jest.fn(),
    logout: jest.fn(),
    initialize: jest.fn(),
    user: null,
  }),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/test",
  useRouter: () => ({
    push: jest.fn(),
  }),
}));
