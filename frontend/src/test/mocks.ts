// test/mocks.ts - Centralized mock setup for tests
// Note: Mocks should be set up before tests import components

// Mock the auth store
export const mockAuthStore = {
  default: () => ({
    isLoggedIn: false,
    login: () => {},
    logout: () => {},
    initialize: () => {},
    user: null,
  }),
};

// Mock Next.js navigation
export const mockNavigation = {
  usePathname: () => "/test",
  useRouter: () => ({
    push: () => {},
  }),
};
