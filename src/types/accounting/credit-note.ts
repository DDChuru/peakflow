/**
 * Credit Note Type Definitions
 *
 * Comprehensive type system for managing sales credit notes (customer refunds/credits)
 * and purchase credit notes (supplier credits received).
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// CORE CREDIT NOTE TYPES
// ============================================================================

/**
 * Credit note type (direction)
 */
export type CreditNoteType =
  | 'sales'      // Credit note to customer (reduces AR)
  | 'purchase';  // Credit note from supplier (reduces AP)

/**
 * Credit note status
 */
export type CreditNoteStatus =
  | 'draft'           // Created but not finalized
  | 'pending-approval' // Awaiting approval
  | 'approved'        // Approved and active
  | 'allocated'       // Fully allocated to invoices/bills
  | 'partially-allocated' // Some allocation done
  | 'void';           // Cancelled/void

/**
 * Credit note reason codes
 */
export type CreditNoteReason =
  | 'goods-returned'       // Customer returned goods
  | 'damaged-goods'        // Goods damaged in transit
  | 'pricing-error'        // Invoice had wrong pricing
  | 'discount-applied'     // Post-invoice discount
  | 'service-issue'        // Service not delivered properly
  | 'duplicate-invoice'    // Invoice duplicated by error
  | 'overpayment'          // Customer overpaid
  | 'goodwill-gesture'     // Customer satisfaction
  | 'other';               // Other reason

/**
 * Credit note allocation status
 */
export type CreditAllocationStatus =
  | 'unallocated'          // Not allocated to any invoice
  | 'partially-allocated'  // Some amount allocated
  | 'fully-allocated';     // Completely allocated

// ============================================================================
// CREDIT NOTE LINE ITEM TYPES
// ============================================================================

/**
 * Credit note line item
 */
export interface CreditNoteLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;           // quantity * unitPrice
  taxRate: number;          // Tax percentage
  taxAmount: number;        // Calculated tax
  totalAmount: number;      // amount + taxAmount

  // GL Integration
  glAccountId?: string;
  glAccountCode?: string;
  glAccountName?: string;

  // Reference to original invoice line (if applicable)
  originalInvoiceLineId?: string;
  originalInvoiceId?: string;

  // Additional details
  itemCode?: string;
  notes?: string;
}

// ============================================================================
// CREDIT NOTE ALLOCATION TYPES
// ============================================================================

/**
 * Credit note allocation to invoice/bill
 */
export interface CreditNoteAllocation {
  id: string;
  creditNoteId: string;
  creditNoteNumber: string;

  // Document being credited
  documentType: 'invoice' | 'bill';
  documentId: string;
  documentNumber: string;

  // Allocation details
  amountAllocated: number;
  allocationDate: Date;
  allocatedBy: string;
  notes?: string;

  // GL posting reference
  journalEntryId?: string;

  // Firestore timestamps
  createdAt?: Timestamp;
}

// ============================================================================
// MAIN CREDIT NOTE INTERFACE
// ============================================================================

/**
 * Sales Credit Note (to customers)
 */
export interface SalesCreditNote {
  id: string;
  companyId: string;
  type: 'sales';

  // Credit note identification
  creditNoteNumber: string;
  creditNoteDate: Date;
  status: CreditNoteStatus;
  reason: CreditNoteReason;
  reasonDescription?: string;

  // Customer information
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;

  // Original invoice (if applicable)
  originalInvoiceId?: string;
  originalInvoiceNumber?: string;
  originalInvoiceDate?: Date;

  // Line items
  lineItems: CreditNoteLineItem[];

  // Financial amounts
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;

  // Allocation tracking
  allocationStatus: CreditAllocationStatus;
  amountAllocated: number;
  amountUnallocated: number;
  allocations: CreditNoteAllocation[];

  // GL Integration
  glPosted: boolean;
  glPostingDate?: Date;
  journalEntryId?: string;
  arAccountId?: string;      // Account to credit
  revenueAccountId?: string; // Account to debit

  // Approval workflow
  createdBy: string;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  voidedBy?: string;
  voidedAt?: Date;
  voidReason?: string;

  // Additional details
  notes?: string;
  internalNotes?: string;
  attachments?: string[];

  // Firestore timestamps
  firestoreCreatedAt?: Timestamp;
  firestoreUpdatedAt?: Timestamp;
}

/**
 * Purchase Credit Note (from suppliers)
 */
export interface PurchaseCreditNote {
  id: string;
  companyId: string;
  type: 'purchase';

  // Credit note identification
  creditNoteNumber: string;  // Supplier's credit note number
  supplierCreditNoteRef?: string; // Their reference
  creditNoteDate: Date;
  receivedDate: Date;
  status: CreditNoteStatus;
  reason: CreditNoteReason;
  reasonDescription?: string;

  // Supplier information
  supplierId: string;
  supplierName: string;
  supplierEmail?: string;
  supplierAddress?: string;

  // Original bill (if applicable)
  originalBillId?: string;
  originalBillNumber?: string;
  originalBillDate?: Date;

  // Line items
  lineItems: CreditNoteLineItem[];

  // Financial amounts
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;

  // Allocation tracking
  allocationStatus: CreditAllocationStatus;
  amountAllocated: number;
  amountUnallocated: number;
  allocations: CreditNoteAllocation[];

  // GL Integration
  glPosted: boolean;
  glPostingDate?: Date;
  journalEntryId?: string;
  apAccountId?: string;        // Account to debit
  expenseAccountId?: string;   // Account to credit

  // Processing
  createdBy: string;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  voidedBy?: string;
  voidedAt?: Date;
  voidReason?: string;

  // Additional details
  notes?: string;
  internalNotes?: string;
  attachments?: string[];

  // Firestore timestamps
  firestoreCreatedAt?: Timestamp;
  firestoreUpdatedAt?: Timestamp;
}

/**
 * Union type for credit notes
 */
export type CreditNote = SalesCreditNote | PurchaseCreditNote;

// ============================================================================
// CREDIT NOTE SERVICE TYPES
// ============================================================================

/**
 * Create sales credit note request
 */
export interface CreateSalesCreditNoteRequest {
  customerId: string;
  creditNoteDate: Date;
  reason: CreditNoteReason;
  reasonDescription?: string;
  originalInvoiceId?: string;
  lineItems: Omit<CreditNoteLineItem, 'id' | 'taxAmount' | 'totalAmount'>[];
  taxRate: number;
  notes?: string;
  internalNotes?: string;
}

/**
 * Create purchase credit note request
 */
export interface CreatePurchaseCreditNoteRequest {
  supplierId: string;
  supplierCreditNoteRef?: string;
  creditNoteDate: Date;
  receivedDate: Date;
  reason: CreditNoteReason;
  reasonDescription?: string;
  originalBillId?: string;
  lineItems: Omit<CreditNoteLineItem, 'id' | 'taxAmount' | 'totalAmount'>[];
  taxRate: number;
  notes?: string;
  internalNotes?: string;
}

/**
 * Allocate credit note request
 */
export interface AllocateCreditNoteRequest {
  creditNoteId: string;
  documentType: 'invoice' | 'bill';
  documentId: string;
  amountToAllocate: number;
  notes?: string;
}

/**
 * Multi-document allocation request
 */
export interface MultiDocumentAllocationRequest {
  creditNoteId: string;
  allocations: Array<{
    documentType: 'invoice' | 'bill';
    documentId: string;
    documentNumber: string;
    amountToAllocate: number;
  }>;
  notes?: string;
}

/**
 * Credit note service result
 */
export interface CreditNoteServiceResult {
  success: boolean;
  message: string;
  creditNoteId?: string;
  creditNote?: CreditNote;
  journalEntryId?: string;
  error?: string;
}

/**
 * Credit note allocation result
 */
export interface CreditAllocationResult {
  success: boolean;
  message: string;
  allocationId?: string;
  allocation?: CreditNoteAllocation;
  remainingUnallocated: number;
  journalEntryId?: string;
  error?: string;
}

/**
 * Credit note query filters
 */
export interface CreditNoteQueryFilters {
  type?: CreditNoteType;
  status?: CreditNoteStatus;
  allocationStatus?: CreditAllocationStatus;
  customerId?: string;
  supplierId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Credit note summary statistics
 */
export interface CreditNoteSummary {
  totalCreditNotes: number;
  totalAmount: number;
  totalAllocated: number;
  totalUnallocated: number;

  // By status
  byStatus: Record<CreditNoteStatus, {
    count: number;
    totalAmount: number;
  }>;

  // By reason
  byReason: Record<CreditNoteReason, {
    count: number;
    totalAmount: number;
  }>;

  // Allocation breakdown
  fullyAllocated: number;
  partiallyAllocated: number;
  unallocated: number;
}

// ============================================================================
// CREDIT NOTE FROM OVERPAYMENT (Phase 6 Integration)
// ============================================================================

/**
 * Create credit note from over-payment
 */
export interface CreateCreditNoteFromOverPaymentRequest {
  customerId: string;
  transactionId: string;      // Bank transaction that caused over-payment
  invoiceId: string;          // Invoice that was overpaid
  invoiceAmount: number;      // Original invoice amount
  paymentAmount: number;      // Total payment received
  excessAmount: number;       // Amount over invoice
  paymentDate: Date;
  paymentReference: string;
  notes?: string;
}

/**
 * Over-payment credit note result
 */
export interface OverPaymentCreditNoteResult extends CreditNoteServiceResult {
  autoAllocatedToInvoice: boolean;
  invoiceFullyPaid: boolean;
  creditNoteCreated: boolean;
  creditBalance: number;
}
