// jest.setup.js
// Setup file for Jest

import "@testing-library/jest-dom";

// Setup mock for localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(() => null),
    removeItem: jest.fn(() => null),
    clear: jest.fn(() => null),
  },
  writable: true,
});

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => "/test",
}));

// Mock Cognito
jest.mock("./src/services/cognito", () => ({
  cognitoService: {
    signUp: jest.fn().mockResolvedValue(undefined),
    confirmSignUp: jest.fn().mockResolvedValue(undefined),
    resendConfirmationCode: jest.fn().mockResolvedValue(undefined),
    signIn: jest.fn().mockResolvedValue(undefined),
    signOut: jest.fn().mockResolvedValue(undefined),
    getCurrentUser: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock environment variables
process.env = {
  ...process.env,
  NEXT_PUBLIC_API_URL: "http://localhost:5001",
  NEXT_PUBLIC_COGNITO_USER_POOL_ID: "test-pool-id",
  NEXT_PUBLIC_COGNITO_CLIENT_ID: "test-client-id",
};

// Don't mock these globally - let individual tests handle their own mocking
// jest.mock("@/store/useAuthStore", () => ({...}));
// jest.mock("next/navigation", () => ({...}));
