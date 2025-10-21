/**
 * Staging Ledger Types
 *
 * Types for the staging area where bank imports are posted before
 * migrating to production ledger. Allows preview, verification, and export.
 */

import { JournalEntry, JournalLine } from './journal';
import { GeneralLedgerEntry } from './general-ledger';

// Staging-specific status types
export type StagingStatus = 'staged' | 'posted' | 'exported' | 'archived' | 'deleted';

export type ExportFormat = 'csv' | 'excel';
export type ExportSystem = 'pastel' | 'sage' | 'generic';

/**
 * Staging Journal Entry
 * Same as JournalEntry but lives in staging_journal_entries collection
 */
export interface StagingJournalEntry extends Omit<JournalEntry, 'status'> {
  // Source tracking
  bankImportSessionId: string;

  // Staging-specific status
  status: StagingStatus;

  // Staging timestamps
  stagedAt: Date;
  postedAt?: Date | null;
  exportedAt?: Date | null;
  archivedAt?: Date | null;

  // Link to production after posting
  productionJournalId?: string | null;
}

/**
 * Staging General Ledger Entry
 * Same as GeneralLedgerEntry but lives in staging_general_ledger collection
 */
export interface StagingGeneralLedgerEntry extends Omit<GeneralLedgerEntry, 'status'> {
  // Source tracking
  bankImportSessionId: string;

  // Staging-specific status
  status: StagingStatus;

  // Staging timestamps
  stagedAt: Date;
  postedAt?: Date | null;
  exportedAt?: Date | null;
  archivedAt?: Date | null;

  // Link to production after posting
  productionGLId?: string | null;
}

/**
 * Balance Verification Result
 */
export interface BalanceVerification {
  totalDebits: number;
  totalCredits: number;
  difference: number;
  isBalanced: boolean;
  accountSummary: AccountBalance[];
  verifiedAt: Date;
  errors: string[];
  warnings: string[];
}

/**
 * Account Balance Summary
 */
export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  debits: number;
  credits: number;
  balance: number;
  entryCount: number;
}

/**
 * Staging Summary (stored in bankImportSession)
 */
export interface StagingSummary {
  journalEntryCount: number;
  glEntryCount: number;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  stagedAt: Date;
  balance: BalanceVerification;
}

/**
 * Production Posting Summary (stored in bankImportSession)
 */
export interface ProductionSummary {
  journalEntryIds: string[];
  glEntryIds: string[];
  postedAt: Date;
  postedBy: string;
}

/**
 * Export Record
 */
export interface ExportRecord {
  format: ExportFormat;
  system: ExportSystem;
  exportedAt: Date;
  filename: string;
  downloadUrl?: string;
  fileSize?: number;
}

/**
 * Enhanced Bank Import Session (with staging support)
 */
export interface EnhancedBankImportSession {
  // Existing session fields
  id: string;
  companyId: string;
  bankAccountId: string;
  bankStatementId?: string;

  // Enhanced status
  status: 'draft' | 'mapping' | 'reviewing' | 'staged' | 'posted' | 'exported' | 'archived' | 'cancelled';

  transactionCount: number;
  mappedCount: number;
  postedCount?: number;

  // NEW: Staging data
  staging?: StagingSummary | null;

  // NEW: Production posting data
  production?: ProductionSummary | null;

  // NEW: Export tracking
  exports?: ExportRecord[];

  // NEW: Archive tracking
  archived?: boolean;
  archivedAt?: Date | null;
  archivedBy?: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;

  metadata?: Record<string, unknown>;
}

/**
 * Result from staging operation
 */
export interface StagingResult {
  success: boolean;
  journalCount: number;
  glCount: number;
  balance: BalanceVerification;
  stagingJournalIds?: string[];
  stagingGLIds?: string[];
}

/**
 * Result from production posting operation
 */
export interface ProductionResult {
  success: boolean;
  journalCount: number;
  glCount: number;
  productionJournalIds: string[];
  productionGLIds: string[];
  postedAt: Date;
}

/**
 * Result from export operation
 */
export interface ExportResult {
  success: boolean;
  file: Blob;
  filename: string;
  format: ExportFormat;
  system: ExportSystem;
  recordCount: number;
}

/**
 * Options for report generation (dual-mode)
 */
export interface ReportOptions {
  dataSource?: 'production' | 'staging';
  sessionId?: string;  // For staging: view specific import
  startDate?: Date;
  endDate?: Date;
  fiscalPeriodId?: string;
  includeArchived?: boolean;
}

/**
 * Staging validation result
 */
export interface StagingValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  canPost: boolean;
  canExport: boolean;
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  entryId?: string;
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  entryId?: string;
}

/**
 * Staging cleanup configuration
 */
export interface StagingCleanupConfig {
  retentionDays: number;  // Keep for X days after fiscal year end
  autoArchive: boolean;
  autoDelete: boolean;
}
