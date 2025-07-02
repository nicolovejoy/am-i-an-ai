export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface AuthUser {
  email: string;
  sub: string;
  role?: 'user' | 'moderator' | 'admin';
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AuthError | null;
  user: AuthUser | null;
}