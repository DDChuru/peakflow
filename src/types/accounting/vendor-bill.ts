/**
 * Vendor Bill/Invoice Types
 * Phase 2: Accounts Payable
 */

export type VendorBillStatus =
  | 'draft'            // Being created/edited
  | 'pending_approval' // Submitted for approval
  | 'approved'         // Approved for payment
  | 'posted'           // Posted to General Ledger
  | 'partially_paid'   // Partially paid
  | 'paid'             // Fully paid
  | 'cancelled';       // Cancelled

export interface VendorBillLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  glAccountCode: string;
  glAccountName?: string;
  taxAmount?: number;
  taxRate?: number;

  // For 3-way matching
  poId?: string;
  poNumber?: string;
  poLineId?: string;
}

export interface VendorBill {
  id: string;
  companyId: string;

  // Bill Details
  billNumber: string; // Auto-generated: BILL-2025-0001
  vendorBillNumber: string; // Vendor's invoice number (required for matching)
  vendorId: string;
  vendorName: string;

  // Status
  status: VendorBillStatus;

  // Dates
  billDate: Date;
  dueDate: Date;
  receivedDate?: Date; // When bill was received

  // Financial
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  amountPaid: number; // Sum of allocated payments
  amountDue: number;  // totalAmount - amountPaid

  // Line Items
  lineItems: VendorBillLine[];

  // 3-Way Matching
  poId?: string;
  poNumber?: string;
  matched: boolean; // True if 3-way match completed
  matchedAt?: Date;
  matchedBy?: string;

  // Notes
  notes?: string;
  internalNotes?: string;

  // Simple Approval (no DOA)
  submittedForApprovalAt?: Date;
  submittedForApprovalBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;

  // GL Posting
  glPosted: boolean;
  glPostingDate?: Date;
  glPostedBy?: string;
  journalEntryId?: string;

  // Payment Tracking
  paymentIds?: string[]; // Payments allocated to this bill

  // Audit Trail
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

export interface VendorBillFilters {
  vendorId?: string;
  status?: VendorBillStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string; // Search bill number, vendor bill number, vendor name
  poId?: string; // Filter by linked PO
  overdue?: boolean; // Show only overdue bills
  unpaid?: boolean; // Show only unpaid bills
}

export interface VendorBillSummary {
  totalBills: number;
  draftCount: number;
  pendingApprovalCount: number;
  approvedCount: number;
  postedCount: number;
  paidCount: number;
  cancelledCount: number;
  totalValue: number;
  totalPaid: number;
  totalDue: number;
  overdueCount: number;
  overdueAmount: number;
}

export interface CreateVendorBillInput {
  vendorBillNumber: string;
  vendorId: string;
  billDate: Date;
  dueDate: Date;
  receivedDate?: Date;
  lineItems: Omit<VendorBillLine, 'id'>[];
  poId?: string; // Optional: link to PO
  notes?: string;
  internalNotes?: string;
  currency?: string;
}

export interface UpdateVendorBillInput {
  vendorBillNumber?: string;
  vendorId?: string;
  billDate?: Date;
  dueDate?: Date;
  receivedDate?: Date;
  lineItems?: Omit<VendorBillLine, 'id'>[];
  poId?: string;
  notes?: string;
  internalNotes?: string;
  status?: VendorBillStatus;
}

export interface Match3WayInput {
  billId: string;
  poId: string;
  lineMatches: {
    billLineId: string;
    poLineId: string;
    quantityMatched: number;
  }[];
}

export interface Match3WayResult {
  matched: boolean;
  discrepancies: {
    type: 'price_variance' | 'quantity_variance' | 'missing_po_line' | 'missing_bill_line';
    description: string;
    billLineId?: string;
    poLineId?: string;
    variance?: number;
  }[];
  requiresApproval: boolean; // True if variances exceed tolerance
}
