export type JournalEntryStatus = 'draft' | 'posted' | 'voided';
export type JournalSource =
  | 'manual'
  | 'bank_import'
  | 'bank_transfer'
  | 'accounts_receivable'
  | 'accounts_payable'
  | 'accrual'
  | 'revaluation'
  | 'adjustment'
  | 'opening_balance';

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;  // Full account name for display
  description?: string;
  debit: number;
  credit: number;
  currency: string;
  exchangeRate?: number;
  dimensions?: Record<string, string>;
}

export interface JournalEntry {
  id: string;
  tenantId: string;
  fiscalPeriodId: string;
  journalCode: string;
  reference?: string;
  description?: string;
  status: JournalEntryStatus;
  source: JournalSource;
  transactionDate: Date;
  postingDate?: Date;
  createdBy: string;
  approvedBy?: string;
  reversalOf?: string;
  metadata?: Record<string, unknown>;
  lines: JournalLine[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  context?: Record<string, unknown>;
}

export interface JournalValidationResult {
  isBalanced: boolean;
  issues: ValidationIssue[];
}

