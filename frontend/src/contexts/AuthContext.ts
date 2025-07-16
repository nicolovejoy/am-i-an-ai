import { createContext } from 'react';
import type { User } from '@aws-amplify/auth';

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendCode: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);