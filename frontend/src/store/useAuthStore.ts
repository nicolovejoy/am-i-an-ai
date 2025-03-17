"use client";

import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

// Store implementation with localStorage persistence
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (user: User) => {
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({ user });
  },
  logout: () => {
    // Remove from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
    set({ user: null });
  },
}));

export default useAuthStore;
