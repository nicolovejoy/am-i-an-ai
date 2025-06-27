// Authentication types for backend Lambda functions

export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'regular' | 'admin';
}

export interface AuthContext {
  user: User;
  token: string;
  expiresAt?: number;
}