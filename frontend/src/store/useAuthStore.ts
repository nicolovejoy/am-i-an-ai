"use client";

import { create } from "zustand";
import {
  User,
  loginUser,
  logoutUser as apiLogout,
  registerUser,
  LoginCredentials,
  RegisterCredentials,
} from "@/services/api";

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Store implementation with localStorage persistence
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      // Handle session restoration case
      if (credentials.skipApi && credentials.user && credentials.token) {
        set({
          user: credentials.user,
          token: credentials.token,
          isLoading: false,
          isAuthenticated: true,
        });
        return;
      }

      // Normal login flow
      const response = await loginUser(credentials);

      // Save auth data to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", response.token);
      }

      set({
        user: response.user,
        token: response.token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Login failed",
        isAuthenticated: false,
      });
    }
  },

  register: async (credentials: RegisterCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await registerUser(credentials);

      // Save auth data to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(response.user));
        localStorage.setItem("token", response.token);
      }

      set({
        user: response.user,
        token: response.token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Registration failed",
        isAuthenticated: false,
      });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiLogout();

      // Remove auth data from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }

      set({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Logout failed",
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
