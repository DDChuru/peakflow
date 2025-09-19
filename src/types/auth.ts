export type UserRole = 'admin' | 'developer' | 'client';

export interface User {
  uid: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  imageUrl?: string;
  companyId?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export type CompanyType = 'client' | 'peakflow';

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  domain?: string;
  logoUrl?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  createdBy?: string;
}

export interface AuthState {
  user: User | null;
  company: Company | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupCredentials {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

export interface PasswordResetRequest {
  identifier: string; // email or phone number
  type: 'email' | 'phone';
}

export interface RateLimitEntry {
  identifier: string;
  attempts: number;
  lastAttempt: Date;
  blockedUntil?: Date;
}