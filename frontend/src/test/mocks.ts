// test/mocks.ts - Centralized mock setup for tests
// Note: Mocks should be set up before tests import components

// Mock Next.js navigation
export const mockNavigation = {
  usePathname: () => "/test",
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
};

// Mock Cognito service
export const mockCognitoService = {
  signUp: jest.fn().mockResolvedValue({
    user: { username: "test@example.com" },
    userConfirmed: false,
  }),
  confirmSignUp: jest.fn().mockResolvedValue(undefined),
  resendConfirmationCode: jest.fn().mockResolvedValue(undefined),
  signIn: jest.fn().mockResolvedValue({
    accessToken: "mock-access-token",
    idToken: "mock-id-token",
    refreshToken: "mock-refresh-token",
  }),
  signOut: jest.fn().mockResolvedValue(undefined),
  getCurrentUser: jest.fn().mockResolvedValue({
    username: "test@example.com",
    attributes: {
      email: "test@example.com",
      email_verified: "true",
    },
  }),
  forgotPassword: jest.fn().mockResolvedValue(undefined),
  confirmForgotPassword: jest.fn().mockResolvedValue(undefined),
  changePassword: jest.fn().mockResolvedValue(undefined),
};

// Mock Cognito User Pool
export const mockUserPool = {
  getCurrentUser: jest.fn().mockReturnValue({
    getSession: jest.fn().mockResolvedValue({
      isValid: () => true,
      getAccessToken: () => ({
        getJwtToken: () => "mock-access-token",
      }),
      getIdToken: () => ({
        getJwtToken: () => "mock-id-token",
      }),
    }),
    signOut: jest.fn(),
  }),
  signUp: jest
    .fn()
    .mockImplementation(
      (email, password, attributeList, validationData, callback) => {
        callback(null, { user: { username: email } });
      }
    ),
};

// Mock localStorage
export const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
