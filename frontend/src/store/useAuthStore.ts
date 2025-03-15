"use client";

import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  initialize: (isLoggedIn: boolean, user: User | null) => void;
}

// Safely access localStorage
const saveToStorage = (key: string, value: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const removeFromStorage = (key: string) => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(key);
  }
};

// In a real app, this would include API calls to your authentication endpoints
const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,

  login: (user) => {
    set({ isLoggedIn: true, user });

    // Save to localStorage for persistence
    saveToStorage("auth_status", { isLoggedIn: true, user });
  },

  logout: () => {
    set({ isLoggedIn: false, user: null });

    // Clear from localStorage
    removeFromStorage("auth_status");
  },

  initialize: (isLoggedIn, user) => {
    set({ isLoggedIn, user });
  },
}));

export default useAuthStore;
