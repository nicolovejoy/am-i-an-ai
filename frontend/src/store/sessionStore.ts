import { create } from "zustand";
import { devtools } from "zustand/middleware";

// Minimal session store for auth reset functionality
interface SessionStore {
  reset: () => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionStore>()(
  devtools(
    (set) => ({
      reset: () => {
        // This is called when user signs out
        // Additional cleanup can be added here if needed
      },
      resetSession: () => {
        // Reset session state for starting a new match
        set({});
      },
    }),
    {
      name: "session-store",
    }
  )
);