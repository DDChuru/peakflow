import type { BankTransaction } from '@/types/bank-statement';
import type { LedgerEntry } from '@/types/accounting/general-ledger';

export type ReconciliationStatus = 'draft' | 'in_progress' | 'completed' | 'archived';

export type ReconciliationMatchStatus = 'suggested' | 'confirmed' | 'rejected';

export type ReconciliationSource = 'bank' | 'ledger';

export interface ReconciliationSession {
  id: string;
  companyId: string;
  bankAccountId: string;
  bankAccountName?: string;
  currency: string;
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  openingBalance: number;
  closingBalance: number;
  status: ReconciliationStatus;
  autoMatchRatio: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface ReconciliationTransaction {
  id: string;
  source: ReconciliationSource;
  statementId?: string; // bank statements
  ledgerEntryId?: string; // ledger journal line
  transactionDate: string; // ISO date
  postedDate?: string; // ISO date for ledger postings
  description: string;
  reference?: string;
  amount: number; // positive = inflow, negative = outflow
  balanceAfter?: number;
  currency: string;
  category?: string;
  metadata?: Record<string, unknown>;
  status?: 'unmatched' | 'matched' | 'excluded';
}

export interface ReconciliationMatch {
  id: string;
  sessionId: string;
  companyId: string;
  bankTransactionId: string;
  ledgerTransactionId: string;
  amount: number;
  matchDate: string; // ISO date
  status: ReconciliationMatchStatus;
  confidence: number; // 0-1
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface ReconciliationAdjustment {
  id: string;
  sessionId: string;
  companyId: string;
  description: string;
  amount: number;
  adjustmentType: 'fee' | 'interest' | 'timing' | 'other';
  ledgerAccountId: string;
  ledgerAccountCode?: string;
  createdBy: string;
  createdAt: Date;
  postedJournalId?: string;
  reversalJournalId?: string;
  reversalReason?: string;
  reversedAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface AutoMatchCandidate {
  bankTransactionId: string;
  ledgerTransactionId: string;
  amountDifference: number;
  dateDifferenceInDays: number;
  confidence: number;
  ruleApplied: string;
  bankTransaction?: BankTransaction;
  ledgerEntry?: LedgerEntry;
}

export interface ReconciliationSummary {
  sessionId: string;
  companyId: string;
  bankTransactions: number;
  ledgerTransactions: number;
  matched: number;
  unmatchedBank: number;
  unmatchedLedger: number;
  adjustments: number;
  endingBalanceDifference: number;
}

export interface AdjustmentJournalEntry {
  journalEntryId: string;
  adjustmentId: string;
  sessionId: string;
  amount: number;
  description: string;
  adjustmentType: 'fee' | 'interest' | 'timing' | 'other';
  createdAt: Date;
  ledgerEntries: LedgerEntry[];
  isReversal?: boolean;
  originalJournalId?: string;
}

export interface CreateAdjustmentJournalInput {
  sessionId: string;
  adjustmentId: string;
  bankAccountId: string;
  bankAccountCode: string;
  expenseAccountId: string;
  expenseAccountCode: string;
  description: string;
  amount: number;
  adjustmentType: 'fee' | 'interest' | 'timing' | 'other';
  transactionDate: Date;
  fiscalPeriodId: string;
  currency: string;
  createdBy: string;
  reference?: string;
}

export interface ReversalJournalInput {
  originalJournalId: string;
  reason: string;
  reversalDate: Date;
  createdBy: string;
}
