/**
 * Payment Types
 * Phase 2: Accounts Payable
 */

export type PaymentStatus =
  | 'draft'            // Being created/edited
  | 'pending_approval' // Submitted for approval
  | 'approved'         // Approved for processing
  | 'processing'       // Being processed (check printing, EFT file generation)
  | 'processed'        // Processed and sent
  | 'posted'           // Posted to General Ledger
  | 'cleared'          // Cleared through bank (reconciled)
  | 'void'             // Voided
  | 'cancelled';       // Cancelled

export type PaymentMethod =
  | 'check'            // Paper check
  | 'eft'              // Electronic Funds Transfer
  | 'wire'             // Wire transfer
  | 'cash'             // Cash payment
  | 'credit_card'      // Credit card
  | 'debit_card';      // Debit card

export interface PaymentAllocation {
  billId: string;
  billNumber: string;
  billAmount: number;      // Total bill amount
  amountAllocated: number; // Amount allocated from this payment
  remainingAmount: number; // Bill amount remaining after this allocation
}

export interface Payment {
  id: string;
  companyId: string;

  // Payment Details
  paymentNumber: string; // Auto-generated: PAY-2025-0001
  vendorId: string;
  vendorName: string;

  // Status
  status: PaymentStatus;

  // Dates
  paymentDate: Date;
  processedDate?: Date;
  clearedDate?: Date; // When reconciled with bank

  // Financial
  amount: number;
  currency: string;

  // Payment Method
  paymentMethod: PaymentMethod;
  checkNumber?: string;
  referenceNumber?: string; // EFT reference, wire confirmation, etc.

  // Bank Account
  bankAccountId: string;
  bankAccountName?: string;
  bankAccountNumber?: string;

  // Bill Allocations
  billAllocations: PaymentAllocation[];

  // Notes
  notes?: string;
  internalNotes?: string;
  paymentDescription?: string; // Description for bank/vendor

  // Simple Approval (no DOA)
  submittedForApprovalAt?: Date;
  submittedForApprovalBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Processing
  processedBy?: string;
  processedAt?: Date;

  // GL Posting
  glPosted: boolean;
  glPostingDate?: Date;
  glPostedBy?: string;
  journalEntryId?: string;

  // Void Handling
  voidedAt?: Date;
  voidedBy?: string;
  voidReason?: string;
  voidJournalEntryId?: string; // Reversal journal entry

  // Reconciliation
  reconciledAt?: Date;
  reconciledBy?: string;
  bankStatementId?: string;

  // Audit Trail
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

export interface PaymentFilters {
  vendorId?: string;
  status?: PaymentStatus[];
  paymentMethod?: PaymentMethod[];
  bankAccountId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string; // Search payment number, check number, reference number, vendor name
  unreconciled?: boolean; // Show only unreconciled payments
}

export interface PaymentSummary {
  totalPayments: number;
  draftCount: number;
  pendingApprovalCount: number;
  approvedCount: number;
  processedCount: number;
  postedCount: number;
  voidCount: number;
  totalValue: number;
  totalProcessed: number;
  totalVoid: number;
  unreconciledCount: number;
  unreconciledAmount: number;
}

export interface CreatePaymentInput {
  vendorId: string;
  paymentDate: Date;
  amount: number;
  paymentMethod: PaymentMethod;
  bankAccountId: string;
  billAllocations: Omit<PaymentAllocation, 'billNumber' | 'billAmount' | 'remainingAmount'>[];
  checkNumber?: string;
  referenceNumber?: string;
  notes?: string;
  internalNotes?: string;
  paymentDescription?: string;
  currency?: string;
}

export interface UpdatePaymentInput {
  vendorId?: string;
  paymentDate?: Date;
  amount?: number;
  paymentMethod?: PaymentMethod;
  bankAccountId?: string;
  billAllocations?: Omit<PaymentAllocation, 'billNumber' | 'billAmount' | 'remainingAmount'>[];
  checkNumber?: string;
  referenceNumber?: string;
  notes?: string;
  internalNotes?: string;
  paymentDescription?: string;
  status?: PaymentStatus;
}

export interface VoidPaymentInput {
  paymentId: string;
  voidReason: string;
  voidDate?: Date;
}

export interface PaymentRun {
  id: string;
  companyId: string;

  // Run Details
  runNumber: string; // Auto-generated: PAYRUN-2025-0001
  runDate: Date;
  status: 'draft' | 'processing' | 'completed' | 'failed';

  // Payments
  paymentIds: string[];
  paymentCount: number;

  // Financial
  totalAmount: number;
  currency: string;

  // Bank Account
  bankAccountId: string;
  bankAccountName?: string;

  // Processing
  processedBy?: string;
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;

  // Audit Trail
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentRunInput {
  runDate: Date;
  bankAccountId: string;
  paymentIds: string[];
}
