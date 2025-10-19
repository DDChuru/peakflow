/**
 * Purchase Order Types
 * Phase 2: Accounts Payable
 */

export type PurchaseOrderStatus =
  | 'draft'           // Being created/edited
  | 'pending_approval' // Submitted for approval
  | 'approved'        // Approved, ready to send to vendor
  | 'sent'            // Sent to vendor
  | 'received'        // Goods/services received
  | 'closed'          // Fully invoiced and closed
  | 'cancelled';      // Cancelled

export interface PurchaseOrderLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  glAccountCode?: string;
  glAccountName?: string;
  taxAmount?: number;
  taxRate?: number;

  // For tracking receipts
  quantityReceived?: number;
  quantityInvoiced?: number;
}

export interface PurchaseOrder {
  id: string;
  companyId: string;

  // PO Details
  poNumber: string; // Auto-generated: PO-2025-0001
  vendorId: string;
  vendorName: string;
  vendorEmail?: string;

  // Status
  status: PurchaseOrderStatus;

  // Dates
  orderDate: Date;
  expectedDeliveryDate?: Date;
  deliveryDate?: Date; // Actual delivery date

  // Financial
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;

  // Line Items
  lineItems: PurchaseOrderLine[];

  // Delivery Info
  deliveryAddress?: string;
  deliveryContact?: string;
  deliveryPhone?: string;

  // Notes
  notes?: string;
  internalNotes?: string; // Not shown to vendor
  termsAndConditions?: string;

  // Simple Approval (no DOA)
  submittedForApprovalAt?: Date;
  submittedForApprovalBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;

  // Tracking
  sentToVendorAt?: Date;
  sentToVendorBy?: string;

  // Audit Trail
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy?: string;
}

export interface PurchaseOrderFilters {
  vendorId?: string;
  status?: PurchaseOrderStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string; // Search PO number, vendor name
}

export interface PurchaseOrderSummary {
  totalPOs: number;
  draftCount: number;
  pendingApprovalCount: number;
  approvedCount: number;
  openCount: number; // approved + sent + received
  closedCount: number;
  cancelledCount: number;
  totalValue: number;
  outstandingValue: number; // Not yet fully invoiced
}

export interface CreatePurchaseOrderInput {
  vendorId: string;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  lineItems: Omit<PurchaseOrderLine, 'id'>[];
  deliveryAddress?: string;
  deliveryContact?: string;
  deliveryPhone?: string;
  notes?: string;
  internalNotes?: string;
  termsAndConditions?: string;
  currency?: string;
}

export interface UpdatePurchaseOrderInput {
  vendorId?: string;
  orderDate?: Date;
  expectedDeliveryDate?: Date;
  lineItems?: Omit<PurchaseOrderLine, 'id'>[];
  deliveryAddress?: string;
  deliveryContact?: string;
  deliveryPhone?: string;
  notes?: string;
  internalNotes?: string;
  termsAndConditions?: string;
  status?: PurchaseOrderStatus;
}
