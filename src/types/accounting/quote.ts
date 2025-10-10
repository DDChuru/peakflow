export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  glAccountId: string; // Revenue account for eventual invoice
  accountCode?: string;
  itemCode?: string;
  notes?: string;
}

export interface Quote {
  id: string;
  companyId: string;
  quoteNumber: string;

  // Customer Info
  customerId: string;
  customerName: string;
  customerAddress?: string;
  customerTaxId?: string;
  customerEmail?: string;
  customerPhone?: string;

  // Quote Details
  quoteDate: string; // ISO date string
  validUntil: string; // ISO date string
  status: QuoteStatus;

  // Source tracking
  sourceType?: 'inquiry' | 'rfq' | 'sales_opportunity';
  sourceDocumentId?: string;

  // Financial
  subtotal: number;
  taxRate?: number; // Document-level tax rate percentage
  taxAmount: number;
  totalAmount: number;
  currency: string;
  exchangeRate?: number;

  // Content
  lineItems: QuoteLineItem[];

  // Conversion tracking
  convertedToInvoiceId?: string;
  convertedToSalesOrderId?: string;
  conversionDate?: string;

  // Additional fields
  notes?: string;
  termsAndConditions?: string;
  validityPeriod: number; // Days

  // Approval workflow
  requiresApproval?: boolean;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;

  // Version control
  version: number;
  parentQuoteId?: string; // For revisions
  isLatestVersion: boolean;

  // Metadata
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  modifiedBy?: string;
}

export interface QuoteCreateRequest {
  // Customer
  customerId: string;

  // Dates
  quoteDate: string;
  validityPeriod: number; // Days - validUntil will be calculated

  // Source tracking
  sourceType?: 'inquiry' | 'rfq' | 'sales_opportunity';
  sourceDocumentId?: string;

  // Financial
  currency: string;
  exchangeRate?: number;
  taxRate?: number; // Document-level tax rate percentage

  // Content
  lineItems: Omit<QuoteLineItem, 'id' | 'amount'>[];

  // Optional
  notes?: string;
  termsAndConditions?: string;
  requiresApproval?: boolean;

  // Auto-calculate fields
  // subtotal, taxAmount, totalAmount will be calculated
  // quoteNumber will be auto-generated
}

export interface QuoteRevisionRequest {
  quoteId: string;
  changes: {
    lineItems?: Omit<QuoteLineItem, 'id' | 'amount'>[];
    taxRate?: number;
    validityPeriod?: number;
    notes?: string;
    termsAndConditions?: string;
  };
  revisionReason: string;
}

export interface QuoteApprovalRequest {
  quoteId: string;
  action: 'approve' | 'reject';
  reason?: string;
  notes?: string;
}

export interface QuoteConversionRequest {
  quoteId: string;
  convertTo: 'invoice' | 'sales_order';
  conversionOptions?: {
    invoiceDate?: string; // For invoice conversion
    paymentTerms?: number; // For invoice conversion
    deliveryDate?: string; // For sales order conversion
    deliveryAddress?: string; // For sales order conversion
  };
}

export interface QuoteSummary {
  totalQuotes: number;
  draftQuotes: number;
  sentQuotes: number;
  acceptedQuotes: number;
  convertedQuotes: number;
  expiredQuotes: number;
  totalValue: number;
  acceptanceRate: number; // Percentage
  averageQuoteValue: number;
  conversionRate: number; // Percentage
}

export interface QuoteFilters {
  status?: QuoteStatus[];
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
  requiresApproval?: boolean;
  searchTerm?: string;
}