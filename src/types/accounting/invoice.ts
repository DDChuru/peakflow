export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled';
export type InvoiceSource = 'manual' | 'quote' | 'sales_order' | 'sla' | 'import';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  glAccountId: string; // Revenue account
  accountCode?: string; // Account code for reference
  itemCode?: string;
  // Additional fields for SLA integration
  slaLineId?: string;
  itemCategory?: string;
}

export interface InvoiceTaxLine {
  id: string;
  taxName: string;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  glAccountId: string; // Tax payable account
}

export interface Invoice {
  id: string;
  companyId: string;
  invoiceNumber: string;

  // Customer Info
  customerId: string;
  customerName: string;
  customerAddress?: string;
  customerTaxId?: string;
  customerEmail?: string;
  customerPhone?: string;

  // Invoice Details
  invoiceDate: string; // ISO date string
  dueDate: string; // ISO date string
  paymentTerms: number; // Days
  status: InvoiceStatus;

  // Source tracking
  source: InvoiceSource;
  sourceDocumentId?: string; // Quote/SO/SLA ID
  sourceDocumentNumber?: string; // Quote/SO/SLA number
  purchaseOrderNumber?: string;

  // Financial
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  exchangeRate?: number; // For multi-currency

  // Line items and taxes
  lineItems: InvoiceLineItem[];
  taxLines?: InvoiceTaxLine[];

  // GL Posting
  journalEntryId?: string;
  postedDate?: string; // ISO date string
  fiscalPeriodId?: string;

  // Payment tracking
  paymentHistory?: InvoicePayment[];

  // Additional fields
  notes?: string;
  termsAndConditions?: string;
  footerText?: string;

  // Metadata
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  modifiedBy?: string;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  paymentDate: string; // ISO date string
  amount: number;
  paymentMethod: 'cash' | 'check' | 'bank_transfer' | 'card' | 'other';
  reference?: string;
  notes?: string;
  bankStatementLineId?: string; // For reconciliation
  journalEntryId?: string; // GL posting reference
  createdAt: Date;
  createdBy: string;
}

export interface InvoiceCreateRequest {
  // Customer
  customerId: string;

  // Dates
  invoiceDate: string;
  paymentTerms: number; // Days - dueDate will be calculated

  // Source tracking
  source: InvoiceSource;
  sourceDocumentId?: string;
  purchaseOrderNumber?: string;

  // Financial
  currency: string;
  exchangeRate?: number;

  // Content
  lineItems: Omit<InvoiceLineItem, 'id' | 'amount' | 'taxAmount'>[];

  // Optional
  notes?: string;
  termsAndConditions?: string;

  // Auto-calculate fields
  // subtotal, taxAmount, totalAmount will be calculated
  // invoiceNumber will be auto-generated
  // amountDue will equal totalAmount initially
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  overdueAmount: number;
  draftInvoices: number;
  sentInvoices: number;
  overdueInvoices: number;
  averageDaysToPayment: number;
}

// For reporting and analytics
export interface InvoiceAging {
  current: number; // 0-30 days
  days31to60: number;
  days61to90: number;
  days91to120: number;
  over120Days: number;
  totalOutstanding: number;
}

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  source?: InvoiceSource[];
  searchTerm?: string; // Search in invoice number, customer name, etc.
}

// For bulk operations
export interface InvoiceBulkAction {
  action: 'mark_sent' | 'mark_paid' | 'send_email' | 'export_pdf' | 'delete';
  invoiceIds: string[];
  metadata?: Record<string, any>;
}

export interface InvoiceBulkResult {
  success: number;
  failed: number;
  errors: string[];
  results?: Record<string, any>[];
}