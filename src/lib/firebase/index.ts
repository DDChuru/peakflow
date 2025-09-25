// Export all Firebase configurations and services
export { app, auth, db, storage, functions } from './config';
export { AdminService } from './admin-service';
export { DebtorService } from './debtor-service';
export { CreditorService } from './creditor-service';
export { TransactionService } from './transaction-service';

// Export all financial types
export type {
  Debtor,
  Creditor,
  Transaction,
  PaymentReconciliation,
  DebtorSummary,
  CreditorSummary,
  TransactionSummary
} from '@/types/financial';

// Export auth types
export type {
  User,
  Company,
  UserRole,
  CompanyType,
  AuthState,
  LoginCredentials,
  SignupCredentials,
  PasswordResetRequest,
  RateLimitEntry
} from '@/types/auth';

// Create singleton instances for services
import { AdminService } from './admin-service';
import { DebtorService } from './debtor-service';
import { CreditorService } from './creditor-service';
import { TransactionService } from './transaction-service';

export const adminService = new AdminService();
export const debtorService = new DebtorService();
export const creditorService = new CreditorService();
export const transactionService = new TransactionService();
