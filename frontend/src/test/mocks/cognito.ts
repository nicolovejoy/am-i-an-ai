export const mockCognitoService = {
  signUp: jest.fn().mockResolvedValue(undefined),
  confirmSignUp: jest.fn().mockResolvedValue(undefined),
  resendConfirmationCode: jest.fn().mockResolvedValue(undefined),
  signIn: jest.fn().mockResolvedValue(undefined),
  signOut: jest.fn(),
  getCurrentUser: jest.fn().mockResolvedValue(null),
};

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
