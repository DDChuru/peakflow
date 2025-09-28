/**
 * Service Level Agreement (SLA) and Contract Billing Types
 *
 * This module defines the data models for managing service agreements,
 * contract billing, and recurring invoice generation.
 */

export type BillingFrequency = 'monthly' | 'quarterly' | 'annual' | 'custom';
export type SLAStatus = 'draft' | 'active' | 'suspended' | 'expired' | 'cancelled';
export type LineItemStatus = 'active' | 'removed' | 'modified';
export type LineItemRecurrence = 'always' | 'once' | 'custom';

/**
 * Main Service Level Agreement contract
 */
export interface ServiceAgreement {
  id: string;
  companyId: string;
  customerId: string;
  customerName?: string;
  contractNumber: string;
  contractName: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  billingFrequency: BillingFrequency;
  nextBillingDate: string; // ISO date string
  lastBillingDate?: string; // ISO date string
  status: SLAStatus;

  // Billing Configuration
  autoGenerateInvoices: boolean;
  dayOfMonth?: number; // 1-31, for monthly billing
  advanceDays?: number; // Generate X days in advance

  // Financial Details
  contractValue: number;
  currency: string;
  paymentTerms: number; // Days
  taxRate?: number; // Default tax rate for all line items

  // Line Items
  lineItems: SLALineItem[];

  // Metadata and Audit
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;

  // Optional fields for enhanced functionality
  description?: string;
  department?: string;
  projectCode?: string;
  tags?: string[];
}

/**
 * Individual line item within a service agreement
 */
export interface SLALineItem {
  id: string;
  itemCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number; // quantity * unitPrice
  glAccountId: string; // Reference to chart of accounts
  glAccountCode?: string; // For display purposes
  glAccountName?: string; // For display purposes
  taxRate?: number; // Override SLA default tax rate

  // Flexibility and Lifecycle Management
  effectiveFrom: string; // ISO date string
  effectiveTo?: string; // ISO date string, null means indefinite
  status: LineItemStatus;
  recurrence: LineItemRecurrence;

  // Metadata
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  // Optional fields
  unit?: string; // e.g., 'hours', 'licenses', 'subscriptions'
  category?: string;
  notes?: string;
}

/**
 * History record for tracking changes to SLA line items
 */
export interface SLALineItemHistory {
  id: string;
  slaId: string;
  lineItemId: string;
  action: 'created' | 'modified' | 'removed' | 'reactivated';
  changes: Partial<SLALineItem>;
  previousValues?: Partial<SLALineItem>;
  effectiveDate: string; // ISO date string
  reason?: string;
  createdAt: Date;
  createdBy: string;
}

/**
 * Configuration for custom billing frequencies
 */
export interface CustomBillingConfig {
  intervalType: 'days' | 'weeks' | 'months' | 'years';
  interval: number; // e.g., every 2 months
  specificDays?: number[]; // For monthly: [1, 15] = 1st and 15th
  skipWeekends?: boolean;
  skipHolidays?: boolean;
  holidayCalendar?: string; // Reference to holiday calendar
}

/**
 * Result of SLA processing operations
 */
export interface SLAProcessingResult {
  success: boolean;
  slaId: string;
  processedDate: Date;
  invoiceId?: string;
  invoiceNumber?: string;
  totalAmount: number;
  lineItemsProcessed: number;
  errors?: string[];
  warnings?: string[];
  nextBillingDate?: string;
}

/**
 * Summary statistics for SLA dashboard
 */
export interface SLASummary {
  totalSLAs: number;
  activeSLAs: number;
  expiringSoon: number; // Expiring within 30 days
  totalAnnualValue: number;
  monthlyRecurringRevenue: number;
  overdueInvoices: number;
  nextBillingCount: number; // SLAs due for billing in next 7 days
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalValue: number;
    activeSLAs: number;
  }>;
}

/**
 * Filter options for querying SLAs
 */
export interface SLAFilters {
  status?: SLAStatus | SLAStatus[];
  customerId?: string;
  billingFrequency?: BillingFrequency;
  dueDateFrom?: string; // ISO date string
  dueDateTo?: string; // ISO date string
  valueMin?: number;
  valueMax?: number;
  searchTerm?: string;
  tags?: string[];
  department?: string;
  autoGenerateOnly?: boolean;
}

/**
 * Options for SLA processing
 */
export interface SLAProcessingOptions {
  companyId: string;
  dryRun?: boolean; // Preview without creating invoices
  processUpToDate?: string; // Process all SLAs due up to this date
  forceProcess?: boolean; // Process even if already processed
  userId: string; // User initiating the process
  generateInvoices?: boolean; // Whether to actually create invoices
  updateNextBillingDate?: boolean; // Whether to update next billing dates
  notifyCustomers?: boolean; // Whether to send notifications
}

/**
 * Validation result for SLA operations
 */
export interface SLAValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  context?: any;
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  context?: any;
}

/**
 * Invoice generation request from SLA
 */
export interface InvoiceGenerationRequest {
  slaId: string;
  companyId: string;
  customerId: string;
  billingDate: string; // ISO date string
  periodStart: string; // ISO date string
  periodEnd: string; // ISO date string
  lineItems: SLALineItem[];
  totalAmount: number;
  taxAmount?: number;
  currency: string;
  dueDate: string; // ISO date string
  reference?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

/**
 * Proration calculation for mid-period changes
 */
export interface ProrationCalculation {
  originalAmount: number;
  proratedAmount: number;
  daysUsed: number;
  totalDays: number;
  prorationFactor: number;
  startDate: string;
  endDate: string;
  description: string;
}