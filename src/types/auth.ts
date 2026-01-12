import { UserRole } from './navigation';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  roles: UserRole[];
  activeRole: UserRole;
  token?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  role: UserRole;
}
