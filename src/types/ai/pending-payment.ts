/**
 * Pending Payment Types
 * Phase 2: Pending Payment System
 *
 * Handles unallocated customer/supplier payments from bank transactions
 * that have been matched to entities but not yet allocated to specific invoices/bills
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// Core Pending Payment Types
// ============================================================================

/**
 * Payment entity type - determines if this is a customer payment or supplier payment
 */
export type PaymentEntityType = 'debtor' | 'creditor';

/**
 * Payment allocation status
 */
export type PaymentStatus =
  | 'pending'              // No allocations made yet
  | 'partially-allocated'  // Some amount allocated, remainder pending
  | 'fully-allocated'      // Entire amount allocated to invoices/bills
  | 'credit-note';         // Over-payment converted to credit note

/**
 * Single allocation of payment to an invoice or bill
 */
export interface PaymentAllocation {
  /** Invoice ID (for debtor payments) or Bill ID (for creditor payments) */
  documentId: string;

  /** Invoice number or Bill number for display */
  documentNumber: string;

  /** Amount allocated to this document */
  allocatedAmount: number;

  /** Date when allocation was made */
  allocationDate: Timestamp;

  /** User who made the allocation */
  allocatedBy: string;

  /** Optional notes about this allocation */
  notes?: string;
}

/**
 * Pending Payment Record
 * Represents a bank transaction payment that has been matched to a customer or supplier
 * but not yet allocated to specific invoices or bills
 */
export interface PendingPayment {
  /** Unique identifier */
  id: string;

  /** Company ID (multi-tenant isolation) */
  companyId: string;

  /** User ID who created this pending payment */
  createdBy: string;

  // ============================================================================
  // Entity Information
  // ============================================================================

  /** Type of entity - customer (debtor) or supplier (creditor) */
  entityType: PaymentEntityType;

  /** ID of the matched customer or supplier */
  entityId: string;

  /** Name of the matched customer or supplier (denormalized for quick display) */
  entityName: string;

  /** Confidence score from entity matching (0-100) */
  matchConfidence: number;

  /** Field that was matched ('name' | 'tradingName' | 'email') */
  matchedField?: string;

  /** Method used for matching ('exact' | 'fuzzy' | 'partial') */
  matchMethod?: string;

  // ============================================================================
  // Payment Information
  // ============================================================================

  /** Payment amount (positive for receipts, negative for payments) */
  amount: number;

  /** Currency code (default: ZAR) */
  currency: string;

  /** Date of the bank transaction */
  transactionDate: Timestamp;

  /** Bank transaction description (original) */
  description: string;

  /** Bank transaction reference (if available) */
  bankReference?: string;

  /** Bank account ID where payment was received/made */
  bankAccountId?: string;

  // ============================================================================
  // Allocation Tracking
  // ============================================================================

  /** Current status of payment allocation */
  status: PaymentStatus;

  /** Total amount allocated so far */
  allocatedAmount: number;

  /** Remaining unallocated amount */
  remainingAmount: number;

  /** Array of allocations to invoices/bills */
  allocations: PaymentAllocation[];

  // ============================================================================
  // Suggested Invoice/Bill
  // ============================================================================

  /** Suggested invoice/bill ID (from entity matching) */
  suggestedDocumentId?: string;

  /** Suggested invoice/bill number */
  suggestedDocumentNumber?: string;

  /** Confidence of suggested document match (0-100) */
  suggestedDocumentConfidence?: number;

  /** Reasons for suggestion (e.g., "Exact amount match", "Recent invoice") */
  suggestedDocumentReasons?: string[];

  // ============================================================================
  // Credit Note Conversion
  // ============================================================================

  /** If status is 'credit-note', ID of the created credit note */
  creditNoteId?: string;

  /** Credit note number */
  creditNoteNumber?: string;

  /** Date when converted to credit note */
  creditNoteDate?: Timestamp;

  // ============================================================================
  // Metadata
  // ============================================================================

  /** Created timestamp */
  createdAt: Timestamp;

  /** Last updated timestamp */
  updatedAt: Timestamp;

  /** Last user who updated this record */
  updatedBy?: string;

  /** Flag for soft deletion */
  isDeleted?: boolean;

  /** Optional notes or comments */
  notes?: string;
}

// ============================================================================
// Query Filters and Options
// ============================================================================

/**
 * Filter options for querying pending payments
 */
export interface PendingPaymentFilter {
  /** Filter by entity type */
  entityType?: PaymentEntityType;

  /** Filter by specific entity (customer or supplier) */
  entityId?: string;

  /** Filter by status */
  status?: PaymentStatus | PaymentStatus[];

  /** Filter by date range (from) */
  dateFrom?: Date;

  /** Filter by date range (to) */
  dateTo?: Date;

  /** Filter by minimum amount */
  minAmount?: number;

  /** Filter by maximum amount */
  maxAmount?: number;

  /** Filter by bank account */
  bankAccountId?: string;

  /** Include deleted records */
  includeDeleted?: boolean;
}

/**
 * Options for creating a pending payment
 */
export interface CreatePendingPaymentOptions {
  /** Company ID */
  companyId: string;

  /** User ID creating the payment */
  createdBy: string;

  /** Entity type */
  entityType: PaymentEntityType;

  /** Entity ID */
  entityId: string;

  /** Entity name */
  entityName: string;

  /** Match confidence */
  matchConfidence: number;

  /** Matched field */
  matchedField?: string;

  /** Match method */
  matchMethod?: string;

  /** Payment amount */
  amount: number;

  /** Transaction date */
  transactionDate: Date;

  /** Transaction description */
  description: string;

  /** Bank reference */
  bankReference?: string;

  /** Bank account ID */
  bankAccountId?: string;

  /** Suggested document ID */
  suggestedDocumentId?: string;

  /** Suggested document number */
  suggestedDocumentNumber?: string;

  /** Suggested document confidence */
  suggestedDocumentConfidence?: number;

  /** Suggested document reasons */
  suggestedDocumentReasons?: string[];

  /** Optional notes */
  notes?: string;
}

/**
 * Options for allocating payment to invoice/bill
 */
export interface AllocatePaymentOptions {
  /** Pending payment ID */
  pendingPaymentId: string;

  /** Invoice ID or Bill ID */
  documentId: string;

  /** Invoice number or Bill number */
  documentNumber: string;

  /** Amount to allocate */
  allocatedAmount: number;

  /** User making the allocation */
  allocatedBy: string;

  /** Optional notes */
  notes?: string;
}

/**
 * Result of payment allocation
 */
export interface AllocationResult {
  /** Success flag */
  success: boolean;

  /** Updated pending payment */
  pendingPayment?: PendingPayment;

  /** Updated invoice or bill */
  document?: any;

  /** Error message if failed */
  error?: string;

  /** New status after allocation */
  newStatus?: PaymentStatus;

  /** Remaining unallocated amount */
  remainingAmount?: number;
}

/**
 * Options for converting over-payment to credit note
 */
export interface CreateCreditNoteOptions {
  /** Pending payment ID */
  pendingPaymentId: string;

  /** User creating the credit note */
  createdBy: string;

  /** Credit note amount (usually remaining unallocated amount) */
  amount: number;

  /** Optional reason/notes */
  reason?: string;
}

// ============================================================================
// Summary Statistics
// ============================================================================

/**
 * Summary statistics for pending payments
 */
export interface PendingPaymentSummary {
  /** Total number of pending payments */
  totalCount: number;

  /** Total pending amount */
  totalPendingAmount: number;

  /** Total partially allocated amount */
  totalPartiallyAllocatedAmount: number;

  /** Total fully allocated amount */
  totalFullyAllocatedAmount: number;

  /** Total credit notes amount */
  totalCreditNotesAmount: number;

  /** Count by entity type */
  countByEntityType: {
    debtor: number;
    creditor: number;
  };

  /** Amount by entity type */
  amountByEntityType: {
    debtor: number;
    creditor: number;
  };

  /** Oldest pending payment date */
  oldestPaymentDate?: Date;

  /** Newest pending payment date */
  newestPaymentDate?: Date;
}
