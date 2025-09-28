export type SalesOrderStatus = 'draft' | 'confirmed' | 'in_progress' | 'shipped' | 'delivered' | 'invoiced' | 'cancelled';

export interface SalesOrderLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
  taxAmount?: number;
  glAccountId: string; // Revenue account
  accountCode?: string;
  itemCode?: string;

  // Fulfillment tracking
  quantityShipped: number;
  quantityInvoiced: number;
  quantityRemaining: number;

  // Source tracking
  quoteLineId?: string;

  notes?: string;
}

export interface SalesOrder {
  id: string;
  companyId: string;
  salesOrderNumber: string;

  // Customer Info
  customerId: string;
  customerName: string;
  customerAddress?: string;
  customerTaxId?: string;
  customerEmail?: string;
  customerPhone?: string;

  // Order Details
  orderDate: string; // ISO date string
  requestedDeliveryDate?: string;
  confirmedDeliveryDate?: string;
  status: SalesOrderStatus;

  // Source tracking
  sourceQuoteId?: string;
  sourceQuoteNumber?: string;
  customerPONumber?: string;

  // Financial
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  exchangeRate?: number;

  // Content
  lineItems: SalesOrderLineItem[];

  // Fulfillment tracking
  totalQuantityOrdered: number;
  totalQuantityShipped: number;
  totalQuantityInvoiced: number;
  isFullyShipped: boolean;
  isFullyInvoiced: boolean;

  // Delivery information
  deliveryAddress?: string;
  deliveryInstructions?: string;
  shippingMethod?: string;

  // Payment terms
  paymentTerms: number; // Days
  paymentMethod?: string;

  // Invoice tracking
  invoiceIds: string[]; // Can have multiple partial invoices

  // Additional fields
  notes?: string;
  termsAndConditions?: string;

  // Metadata
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  modifiedBy?: string;
}

export interface SalesOrderCreateRequest {
  // Customer
  customerId: string;

  // Dates
  orderDate: string;
  requestedDeliveryDate?: string;
  paymentTerms: number;

  // Source tracking
  sourceQuoteId?: string;
  customerPONumber?: string;

  // Financial
  currency: string;
  exchangeRate?: number;

  // Content
  lineItems: Omit<SalesOrderLineItem, 'id' | 'amount' | 'taxAmount' | 'quantityShipped' | 'quantityInvoiced' | 'quantityRemaining'>[];

  // Delivery
  deliveryAddress?: string;
  deliveryInstructions?: string;
  shippingMethod?: string;

  // Optional
  notes?: string;
  termsAndConditions?: string;

  // Auto-calculate fields
  // subtotal, taxAmount, totalAmount will be calculated
  // salesOrderNumber will be auto-generated
}

export interface SalesOrderShipmentRequest {
  salesOrderId: string;
  lineItems: {
    lineItemId: string;
    quantityToShip: number;
  }[];
  shipmentDate: string;
  trackingNumber?: string;
  carrier?: string;
  shippingCost?: number;
  notes?: string;
}

export interface SalesOrderInvoiceRequest {
  salesOrderId: string;
  lineItems: {
    lineItemId: string;
    quantityToInvoice: number;
  }[];
  invoiceDate: string;
  notes?: string;
}

export interface SalesOrderSummary {
  totalOrders: number;
  draftOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  invoicedOrders: number;
  totalValue: number;
  averageOrderValue: number;
  fulfillmentRate: number; // Percentage
}

export interface SalesOrderFilters {
  status?: SalesOrderStatus[];
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: string;
  searchTerm?: string;
}