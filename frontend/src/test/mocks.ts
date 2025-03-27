// test/mocks.ts - Centralized mock setup for tests
// Note: Mocks should be set up before tests import components

// Mock Next.js navigation
export const mockNavigation = {
  usePathname: () => "/test",
  useRouter: () => ({
    push: jest.fn(),
  }),
};
