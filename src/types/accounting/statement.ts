/**
 * Customer & Supplier Statement Type Definitions
 *
 * Comprehensive type system for generating professional statements
 * with aged analysis, transaction history, and multi-format output.
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// CORE STATEMENT TYPES
// ============================================================================

/**
 * Statement entity type
 */
export type StatementEntityType = 'customer' | 'supplier';

/**
 * Statement status
 */
export type StatementStatus =
  | 'draft'       // Generated but not finalized
  | 'finalized'   // Locked and ready to send
  | 'sent'        // Sent to customer/supplier
  | 'viewed'      // Recipient opened the statement
  | 'archived';   // Older statement, superseded

/**
 * Statement delivery method
 */
export type StatementDeliveryMethod = 'email' | 'download' | 'print';

/**
 * Statement output format
 */
export type StatementOutputFormat = 'pdf' | 'html' | 'csv';

// ============================================================================
// STATEMENT TRANSACTION TYPES
// ============================================================================

/**
 * Types of transactions that appear on statements
 */
export type StatementTransactionType =
  | 'invoice'
  | 'credit-note'
  | 'payment'
  | 'credit-allocation'  // When credit note allocated to invoice
  | 'adjustment'
  | 'opening-balance';

/**
 * Individual transaction on a statement
 */
export interface StatementTransaction {
  id: string;
  date: Date;
  type: StatementTransactionType;
  reference: string;      // Invoice #, payment #, etc.
  description: string;
  debit?: number;         // Increases balance (invoices)
  credit?: number;        // Decreases balance (payments, credits)
  runningBalance: number; // Balance after this transaction
  dueDate?: Date;         // For invoices
  ageBucket?: AgeBucket;  // Current aging classification
  relatedDocumentId?: string; // Link to invoice/payment/credit note
}

// ============================================================================
// AGED ANALYSIS TYPES
// ============================================================================

/**
 * Age buckets for receivables/payables
 */
export type AgeBucket = 'current' | '30-days' | '60-days' | '90-days' | '120-plus';

/**
 * Aged analysis breakdown
 */
export interface AgedAnalysis {
  current: number;        // 0-30 days
  thirtyDays: number;     // 31-60 days
  sixtyDays: number;      // 61-90 days
  ninetyDays: number;     // 91-120 days
  oneTwentyPlus: number;  // 121+ days
  total: number;
}

/**
 * Detailed aged analysis item (individual invoice/bill)
 */
export interface AgedAnalysisItem {
  documentId: string;
  documentNumber: string;
  documentDate: Date;
  dueDate: Date;
  originalAmount: number;
  outstandingAmount: number;
  daysOutstanding: number;
  ageBucket: AgeBucket;
}

// ============================================================================
// STATEMENT SUMMARY TYPES
// ============================================================================

/**
 * Statement summary statistics
 */
export interface StatementSummary {
  openingBalance: number;
  totalInvoices: number;
  totalPayments: number;
  totalCredits: number;
  totalAdjustments: number;
  closingBalance: number;

  // Counts
  invoiceCount: number;
  paymentCount: number;
  creditNoteCount: number;

  // Period info
  periodStart: Date;
  periodEnd: Date;
  statementDate: Date;
}

// ============================================================================
// MAIN STATEMENT INTERFACE
// ============================================================================

/**
 * Customer Statement
 */
export interface CustomerStatement {
  id: string;
  companyId: string;

  // Entity information
  entityType: 'customer';
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  customerPhone?: string;
  accountNumber?: string;

  // Statement period
  statementDate: Date;
  periodStart: Date;
  periodEnd: Date;

  // Financial data
  openingBalance: number;
  closingBalance: number;
  transactions: StatementTransaction[];
  agedAnalysis: AgedAnalysis;
  agedDetails: AgedAnalysisItem[];
  summary: StatementSummary;

  // Metadata
  status: StatementStatus;
  generatedAt: Date;
  generatedBy: string;
  finalizedAt?: Date;
  finalizedBy?: string;
  sentAt?: Date;
  sentBy?: string;
  deliveryMethod?: StatementDeliveryMethod;

  // Firestore timestamps
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Supplier Statement (same structure, different entity)
 */
export interface SupplierStatement {
  id: string;
  companyId: string;

  // Entity information
  entityType: 'supplier';
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  supplierAddress?: string;
  supplierPhone?: string;
  accountNumber?: string;

  // Statement period
  statementDate: Date;
  periodStart: Date;
  periodEnd: Date;

  // Financial data
  openingBalance: number;
  closingBalance: number;
  transactions: StatementTransaction[];
  agedAnalysis: AgedAnalysis;
  agedDetails: AgedAnalysisItem[];
  summary: StatementSummary;

  // Metadata
  status: StatementStatus;
  generatedAt: Date;
  generatedBy: string;
  finalizedAt?: Date;
  finalizedBy?: string;
  sentAt?: Date;
  sentBy?: string;
  deliveryMethod?: StatementDeliveryMethod;

  // Firestore timestamps
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Union type for statements
 */
export type Statement = CustomerStatement | SupplierStatement;

// ============================================================================
// STATEMENT GENERATION OPTIONS
// ============================================================================

/**
 * Options for statement generation
 */
export interface StatementGenerationOptions {
  includeOpeningBalance?: boolean;
  includeZeroBalanceItems?: boolean;
  groupByType?: boolean;
  sortOrder?: 'date-asc' | 'date-desc' | 'amount-desc';
  includeAgedAnalysis?: boolean;
  includeDetailedAging?: boolean;
  outputFormat?: StatementOutputFormat;

  // Branding
  includeLogo?: boolean;
  includePaymentDetails?: boolean;
  includeTermsAndConditions?: boolean;
  customMessage?: string;
}

/**
 * Statement generation request
 */
export interface StatementGenerationRequest {
  entityType: StatementEntityType;
  entityId: string;
  periodStart: Date;
  periodEnd: Date;
  options?: StatementGenerationOptions;
}

// ============================================================================
// STATEMENT DELIVERY TYPES
// ============================================================================

/**
 * Email delivery configuration
 */
export interface StatementEmailConfig {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  includeAgedAnalysisSummary?: boolean;
  replyTo?: string;
}

/**
 * Batch statement generation
 */
export interface BatchStatementRequest {
  entityType: StatementEntityType;
  entityIds: string[];  // All customers or all suppliers
  periodStart: Date;
  periodEnd: Date;
  options?: StatementGenerationOptions;
  emailConfig?: StatementEmailConfig;
  autoSend?: boolean;
}

/**
 * Batch statement result
 */
export interface BatchStatementResult {
  totalRequested: number;
  successful: number;
  failed: number;
  statementIds: string[];
  errors: Array<{
    entityId: string;
    entityName: string;
    error: string;
  }>;
}

// ============================================================================
// STATEMENT RECONCILIATION TYPES
// ============================================================================

/**
 * Supplier statement import (for reconciliation)
 */
export interface SupplierStatementImport {
  id: string;
  companyId: string;
  supplierId: string;
  supplierName: string;

  // Import details
  uploadedAt: Date;
  uploadedBy: string;
  fileName: string;
  fileUrl?: string;

  // Statement details
  statementDate: Date;
  periodStart: Date;
  periodEnd: Date;

  // Their balance vs ours
  supplierReportedBalance: number;
  ourRecordedBalance: number;
  balanceDifference: number;

  // Transactions
  theirTransactions: StatementTransaction[];
  matchedTransactions: ReconciliationMatch[];
  unmatchedTheirTransactions: StatementTransaction[];
  unmatchedOurTransactions: StatementTransaction[];

  // Status
  reconciliationStatus: 'pending' | 'partial' | 'complete' | 'disputed';
  notes?: string;

  // Firestore timestamps
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Reconciliation match
 */
export interface ReconciliationMatch {
  id: string;
  theirTransactionId: string;
  ourTransactionId: string;
  matchType: 'exact' | 'fuzzy' | 'manual';
  confidence: number;  // 0-100
  amountDifference: number;
  dateDifference: number; // Days
  matchedAt: Date;
  matchedBy?: string;
}

// ============================================================================
// STATEMENT SERVICE TYPES
// ============================================================================

/**
 * Statement service result
 */
export interface StatementServiceResult {
  success: boolean;
  message: string;
  statementId?: string;
  statement?: Statement;
  pdfUrl?: string;
  error?: string;
}

/**
 * Statement query filters
 */
export interface StatementQueryFilters {
  entityType?: StatementEntityType;
  entityId?: string;
  status?: StatementStatus;
  dateFrom?: Date;
  dateTo?: Date;
  minBalance?: number;
}

/**
 * Statement statistics
 */
export interface StatementStatistics {
  totalStatements: number;
  statementsByStatus: Record<StatementStatus, number>;
  statementsByMonth: Array<{
    month: string;
    count: number;
    totalAmount: number;
  }>;
  averageBalance: number;
  totalOutstanding: number;
}
