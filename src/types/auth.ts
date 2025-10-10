export type UserRole = 'admin' | 'developer' | 'client';

// Supported currencies in the system
export type SupportedCurrency = 'USD' | 'ZAR' | 'EUR' | 'ZWD' | 'ZIG';

export interface User {
  uid: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  imageUrl?: string;
  companyId?: string; // TODO: Rename to primaryCompanyId in Phase 6
  phoneNumber?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  // TODO (Phase 6): Add for multi-company access
  // primaryCompanyId?: string;
  // accessibleCompanyIds?: string[];
}

export type CompanyType = 'client' | 'peakflow' | 'manageAccounts';

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  industry?: string;
  domain?: string;
  logoUrl?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  defaultCurrency?: SupportedCurrency;
  vatNumber?: string; // VAT/Tax registration number
  vatPercentage?: number; // 0-100, e.g., 15 for 15%
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