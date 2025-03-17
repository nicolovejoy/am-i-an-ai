// test/mocks.ts - Centralized mock setup for tests
// Note: Mocks should be set up before tests import components

// Mock the auth store
export const mockAuthStore = {
  __esModule: true,
  default: () => ({
    isLoggedIn: false,
    login: jest.fn(),
    logout: jest.fn(),
    initialize: jest.fn(),
    user: null,
  }),
};

// Mock Next.js navigation
export const mockNavigation = {
  usePathname: () => "/test",
  useRouter: () => ({
    push: jest.fn(),
  }),
};
