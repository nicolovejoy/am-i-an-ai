import { act, renderHook } from "@testing-library/react";
import useAuthStore from "./useAuthStore";
import * as apiService from "@/services/api";

// Mock the API service
jest.mock("@/services/api", () => ({
  loginUser: jest.fn(),
  registerUser: jest.fn(),
  logoutUser: jest.fn(),
}));

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

// Access the mocked API service
const mockedLoginUser = apiService.loginUser as jest.Mock;
const mockedLogoutUser = apiService.logoutUser as jest.Mock;

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    mockLocalStorage.clear();

    // Reset the store to initial state between tests
    act(() => {
      const store = useAuthStore.getState();
      store.user = null;
      store.token = null;
      store.isAuthenticated = false;
      store.isLoading = false;
      store.error = null;
    });
  });

  describe("login", () => {
    it("should set isLoading to true when login starts", async () => {
      // Arrange
      mockedLoginUser.mockResolvedValue({
        user: { id: "123", name: "Test User", email: "test@example.com" },
        token: "fake-token",
      });

      // Act
      const { result } = renderHook(() => useAuthStore());

      // Initial state
      expect(result.current.isLoading).toBe(false);

      // Start login
      await act(async () => {
        await result.current.login({
          email: "test@example.com",
          password: "password123",
        });
      });

      // Assert
      expect(mockedLoginUser).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(result.current.user).toEqual({
        id: "123",
        name: "Test User",
        email: "test@example.com",
      });
      expect(result.current.token).toBe("fake-token");
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();

      // Should store user and token in localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify({
          id: "123",
          name: "Test User",
          email: "test@example.com",
        })
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "token",
        "fake-token"
      );
    });

    it("should set error when login fails", async () => {
      // Arrange
      const errorMessage = "Invalid credentials";
      mockedLoginUser.mockRejectedValue(new Error(errorMessage));

      // Act
      const { result } = renderHook(() => useAuthStore());

      // Start login
      await act(async () => {
        await result.current.login({
          email: "test@example.com",
          password: "wrong-password",
        });
      });

      // Assert
      expect(mockedLoginUser).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "wrong-password",
      });
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);

      // Should not store anything in localStorage
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe("logout", () => {
    it("should clear auth state on logout", async () => {
      // Arrange - first login
      mockedLoginUser.mockResolvedValue({
        user: { id: "123", name: "Test User", email: "test@example.com" },
        token: "fake-token",
      });

      const { result } = renderHook(() => useAuthStore());

      // Login first
      await act(async () => {
        await result.current.login({
          email: "test@example.com",
          password: "password123",
        });
      });

      // Reset mock counts after login
      jest.clearAllMocks();

      // Act - logout
      mockedLogoutUser.mockResolvedValue({ success: true });

      await act(async () => {
        await result.current.logout();
      });

      // Assert
      expect(mockedLogoutUser).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);

      // Should clear localStorage
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("user");
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith("token");
    });
  });

  describe("clearError", () => {
    it("should clear error state", () => {
      // Arrange - set an error
      act(() => {
        const store = useAuthStore.getState();
        store.error = "Some error";
      });

      const { result } = renderHook(() => useAuthStore());
      expect(result.current.error).toBe("Some error");

      // Act - clear error
      act(() => {
        result.current.clearError();
      });

      // Assert
      expect(result.current.error).toBeNull();
    });
  });
});
