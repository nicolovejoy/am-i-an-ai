import { User } from "@/services/api";

export type { User };

export interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}
