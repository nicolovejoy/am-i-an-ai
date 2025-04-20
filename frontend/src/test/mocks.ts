// test/mocks.ts - Centralized mock setup for tests
// Note: Mocks should be set up before tests import components

// Mock Next.js navigation
export const mockNavigation = {
  usePathname: () => "/test",
  useRouter: () => ({
    push: jest.fn(),
  }),
};

// Mock Cognito service
export const mockCognitoService = {
  signUp: jest.fn().mockResolvedValue(undefined),
  confirmSignUp: jest.fn().mockResolvedValue(undefined),
  resendConfirmationCode: jest.fn().mockResolvedValue(undefined),
  signIn: jest.fn().mockResolvedValue(undefined),
  signOut: jest.fn(),
  getCurrentUser: jest.fn().mockResolvedValue(null),
};

// Mock Cognito User Pool
export const mockUserPool = {
  getCurrentUser: jest.fn().mockReturnValue(null),
  signUp: jest
    .fn()
    .mockImplementation(
      (email, password, attributeList, validationData, callback) => {
        callback(null, { user: { username: email } });
      }
    ),
};
