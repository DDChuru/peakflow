export type BankAccountStatus = 'active' | 'inactive' | 'closed';

export type BankAccountType =
  | 'checking'
  | 'savings'
  | 'credit-card'
  | 'loan'
  | 'cash'
  | 'investment'
  | 'other';

export interface BankSignatory {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: 'preparer' | 'approver' | 'administrator' | 'viewer';
  approvalLimit?: number;
  requiresTwoFactor?: boolean;
}

export interface BankAccountLimits {
  singleTransaction?: number;
  daily?: number;
  weekly?: number;
  monthly?: number;
}

export interface BankAccountBalance {
  ledger: number;
  available?: number;
  pending?: number;
  currency: string;
  asOf?: Date;
}

export interface BankAccountIntegration {
  provider?: string;
  connectionId?: string;
  accountExternalId?: string;
  status?: 'connected' | 'syncing' | 'error' | 'disconnected';
  lastSyncedAt?: Date;
}

export interface BankAccount {
  id: string;
  companyId: string;
  name: string;
  accountNumber: string;
  accountNumberMasked?: string;
  accountType: BankAccountType;
  bankName: string;
  branch?: string;
  branchCode?: string;
  country?: string;
  currency: string;
  glAccountId: string;
  isPrimary: boolean;
  status: BankAccountStatus;
  signatories: BankSignatory[];
  limits?: BankAccountLimits;
  balance: BankAccountBalance;
  approvalThreshold?: number;
  integration?: BankAccountIntegration;
  lastReconciledAt?: Date;
  lastStatementAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface BankAccountSnapshot {
  id: string;
  bankAccountId: string;
  companyId: string;
  fiscalPeriodId: string;
  currency: string;
  ledgerBalance: number;
  availableBalance?: number;
  pendingBalance?: number;
  capturedAt: Date;
}

export type TransferStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled' | 'failed';

export type TransferType = 'internal' | 'external' | 'wire' | 'ach' | 'check';

export interface TransferApproval {
  approvedBy: string;
  approvedAt: Date;
  notes?: string;
  signatoryId: string;
}

export interface BankTransfer {
  id: string;
  companyId: string;
  type: TransferType;
  status: TransferStatus;

  // Source account
  fromAccountId: string;
  fromAccountName: string;
  fromAccountNumber: string;

  // Destination account
  toAccountId?: string; // Optional for external transfers
  toAccountName: string;
  toAccountNumber: string;
  toBankName?: string; // For external transfers

  // Transfer details
  amount: number;
  currency: string;
  description: string;
  reference?: string;

  // Approval workflow
  requiresApproval: boolean;
  approvalThreshold?: number;
  approvedBy?: TransferApproval[];
  approvalNotes?: string;

  // Scheduling
  scheduledDate?: Date;
  executedDate?: Date;

  // Fees and rates
  fees?: number;
  exchangeRate?: number;
  convertedAmount?: number;

  // Journal posting
  journalEntryId?: string;
  glTransactionId?: string;

  // External details
  routingNumber?: string;
  swiftCode?: string;
  beneficiaryAddress?: string;

  // Tracking
  externalReferenceId?: string;
  confirmationNumber?: string;

  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface TransferValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiresApproval: boolean;
  approvers: BankSignatory[];
}

export interface BankAccountValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
