/**
 * AP/AR Reports Service
 * Phase 3: Reporting & Analytics
 *
 * Comprehensive service for generating Accounts Payable and Accounts Receivable
 * aging reports, including aged analysis, summary reports, and detailed breakdowns
 * by customer/vendor.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Aging bucket amounts
 */
export interface AgingBucket {
  current: number;        // 0 days or not yet due
  days1to30: number;      // 1-30 days overdue
  days31to60: number;     // 31-60 days overdue
  days61to90: number;     // 61-90 days overdue
  days90Plus: number;     // 90+ days overdue
  total: number;
}

/**
 * Type for aging bucket classification
 */
export type AgingBucketType = 'current' | '1-30' | '31-60' | '61-90' | '90+';

/**
 * Individual receivable line item
 */
export interface AgedReceivableLine {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate: Date;
  originalAmount: number;
  amountPaid: number;
  balance: number;
  daysOutstanding: number;
  agingBucket: AgingBucketType;
}

/**
 * Aged receivables grouped by customer
 */
export interface AgedReceivablesByCustomer {
  customerId: string;
  customerName: string;
  invoices: AgedReceivableLine[];
  agingBuckets: AgingBucket;
}

/**
 * Complete aged receivables report
 */
export interface AgedReceivablesReport {
  asOfDate: Date;
  customers: AgedReceivablesByCustomer[];
  totals: AgingBucket;
  totalCustomers: number;
  totalInvoices: number;
}

/**
 * Individual payable line item
 */
export interface AgedPayableLine {
  billId: string;
  billNumber: string;
  vendorBillNumber: string;
  billDate: Date;
  dueDate: Date;
  originalAmount: number;
  amountPaid: number;
  balance: number;
  daysOutstanding: number;
  agingBucket: AgingBucketType;
}

/**
 * Aged payables grouped by vendor
 */
export interface AgedPayablesByVendor {
  vendorId: string;
  vendorName: string;
  bills: AgedPayableLine[];
  agingBuckets: AgingBucket;
}

/**
 * Complete aged payables report
 */
export interface AgedPayablesReport {
  asOfDate: Date;
  vendors: AgedPayablesByVendor[];
  totals: AgingBucket;
  totalVendors: number;
  totalBills: number;
}

/**
 * AR summary for a single customer
 */
export interface ARSummary {
  customerId: string;
  customerName: string;
  totalOutstanding: number;
  invoiceCount: number;
  oldestInvoiceDate?: Date;
  averageDaysOutstanding: number;
}

/**
 * AP summary for a single vendor
 */
export interface APSummary {
  vendorId: string;
  vendorName: string;
  totalOutstanding: number;
  billCount: number;
  oldestBillDate?: Date;
  averageDaysOutstanding: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate days outstanding from due date to as-of date
 */
function calculateDaysOutstanding(dueDate: Date, asOfDate: Date): number {
  const diffTime = asOfDate.getTime() - dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays); // Don't go negative for not-yet-due invoices
}

/**
 * Determine aging bucket based on days outstanding
 * - current: 0 days (not yet due)
 * - 1-30: 1-30 days overdue
 * - 31-60: 31-60 days overdue
 * - 61-90: 61-90 days overdue
 * - 90+: 90+ days overdue
 */
function getAgingBucket(daysOutstanding: number): AgingBucketType {
  if (daysOutstanding === 0) return 'current';
  if (daysOutstanding <= 30) return '1-30';
  if (daysOutstanding <= 60) return '31-60';
  if (daysOutstanding <= 90) return '61-90';
  return '90+';
}

/**
 * Create empty aging bucket
 */
function createEmptyAgingBucket(): AgingBucket {
  return {
    current: 0,
    days1to30: 0,
    days31to60: 0,
    days61to90: 0,
    days90Plus: 0,
    total: 0,
  };
}

/**
 * Add amount to appropriate bucket
 */
function addToAgingBucket(bucket: AgingBucket, amount: number, agingType: AgingBucketType): void {
  switch (agingType) {
    case 'current':
      bucket.current += amount;
      break;
    case '1-30':
      bucket.days1to30 += amount;
      break;
    case '31-60':
      bucket.days31to60 += amount;
      break;
    case '61-90':
      bucket.days61to90 += amount;
      break;
    case '90+':
      bucket.days90Plus += amount;
      break;
  }
  bucket.total += amount;
}

/**
 * Convert Firestore Timestamp to Date
 */
function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value.toDate && typeof value.toDate === 'function') {
    return value.toDate();
  }
  return new Date(value);
}

// ============================================================================
// AP/AR REPORTS SERVICE CLASS
// ============================================================================

export class APARReportsService {
  constructor(
    private companyId: string,
    private userId: string
  ) {}

  // ==========================================================================
  // AGED RECEIVABLES REPORT (AR AGING)
  // ==========================================================================

  /**
   * Generate aged receivables report
   * Shows outstanding invoices grouped by customer with aging analysis
   */
  async generateAgedReceivables(asOfDate?: Date): Promise<AgedReceivablesReport> {
    try {
      const reportDate = asOfDate || new Date();

      console.log('📊 [APARReportsService] Generating aged receivables report', {
        companyId: this.companyId,
        asOfDate: reportDate,
      });

      // Get all unpaid and partially paid invoices
      const invoicesRef = collection(db, 'companies', this.companyId, 'invoices');
      const invoicesQuery = query(
        invoicesRef,
        where('status', 'in', ['sent', 'partial', 'overdue'])
      );

      const invoicesSnapshot = await getDocs(invoicesQuery);

      // Group by customer
      const customerMap = new Map<string, AgedReceivablesByCustomer>();

      invoicesSnapshot.forEach((doc) => {
        const invoice = doc.data();
        const invoiceId = doc.id;

        // Calculate outstanding balance
        const originalAmount = invoice.totalAmount || 0;
        const amountPaid = invoice.amountPaid || 0;
        const balance = originalAmount - amountPaid;

        // Skip if fully paid (shouldn't happen with the query, but safety check)
        if (balance <= 0) return;

        // Get customer info
        const customerId = invoice.customerId || invoice.debtorId || 'unknown';
        const customerName = invoice.customerName || 'Unknown Customer';

        // Calculate aging
        const invoiceDate = toDate(invoice.invoiceDate);
        const dueDate = toDate(invoice.dueDate);
        const daysOutstanding = calculateDaysOutstanding(dueDate, reportDate);
        const agingBucket = getAgingBucket(daysOutstanding);

        // Create receivable line
        const receivableLine: AgedReceivableLine = {
          invoiceId,
          invoiceNumber: invoice.invoiceNumber || 'N/A',
          invoiceDate,
          dueDate,
          originalAmount,
          amountPaid,
          balance,
          daysOutstanding,
          agingBucket,
        };

        // Add to customer group
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            customerId,
            customerName,
            invoices: [],
            agingBuckets: createEmptyAgingBucket(),
          });
        }

        const customerGroup = customerMap.get(customerId)!;
        customerGroup.invoices.push(receivableLine);
        addToAgingBucket(customerGroup.agingBuckets, balance, agingBucket);
      });

      // Convert map to array and sort by total outstanding (descending)
      const customers = Array.from(customerMap.values()).sort(
        (a, b) => b.agingBuckets.total - a.agingBuckets.total
      );

      // Sort invoices within each customer by days outstanding (descending)
      customers.forEach((customer) => {
        customer.invoices.sort((a, b) => b.daysOutstanding - a.daysOutstanding);
      });

      // Calculate totals
      const totals = createEmptyAgingBucket();
      let totalInvoices = 0;

      customers.forEach((customer) => {
        totals.current += customer.agingBuckets.current;
        totals.days1to30 += customer.agingBuckets.days1to30;
        totals.days31to60 += customer.agingBuckets.days31to60;
        totals.days61to90 += customer.agingBuckets.days61to90;
        totals.days90Plus += customer.agingBuckets.days90Plus;
        totals.total += customer.agingBuckets.total;
        totalInvoices += customer.invoices.length;
      });

      const report: AgedReceivablesReport = {
        asOfDate: reportDate,
        customers,
        totals,
        totalCustomers: customers.length,
        totalInvoices,
      };

      console.log('✅ [APARReportsService] Aged receivables report generated', {
        totalCustomers: report.totalCustomers,
        totalInvoices: report.totalInvoices,
        totalOutstanding: report.totals.total,
      });

      return report;
    } catch (error: any) {
      console.error('❌ [APARReportsService] Error generating aged receivables:', error);
      throw new Error(`Failed to generate aged receivables report: ${error.message}`);
    }
  }

  // ==========================================================================
  // AGED PAYABLES REPORT (AP AGING)
  // ==========================================================================

  /**
   * Generate aged payables report
   * Shows outstanding bills grouped by vendor with aging analysis
   */
  async generateAgedPayables(asOfDate?: Date): Promise<AgedPayablesReport> {
    try {
      const reportDate = asOfDate || new Date();

      console.log('📊 [APARReportsService] Generating aged payables report', {
        companyId: this.companyId,
        asOfDate: reportDate,
      });

      // Get all unpaid and partially paid vendor bills
      const billsRef = collection(db, 'companies', this.companyId, 'vendorBills');
      const billsQuery = query(
        billsRef,
        where('status', 'in', ['approved', 'posted', 'partially_paid'])
      );

      let billsSnapshot;
      try {
        billsSnapshot = await getDocs(billsQuery);
      } catch (permError: any) {
        // If collection doesn't exist (no bills created yet), return empty report
        console.log('ℹ️ [APARReportsService] No vendor bills found or collection does not exist');
        return {
          asOfDate: reportDate,
          vendors: [],
          totals: { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, days90Plus: 0, total: 0 },
          totalVendors: 0,
          totalBills: 0,
        };
      }

      // Group by vendor
      const vendorMap = new Map<string, AgedPayablesByVendor>();

      billsSnapshot.forEach((doc) => {
        const bill = doc.data();
        const billId = doc.id;

        // Calculate outstanding balance
        const originalAmount = bill.totalAmount || 0;
        const amountPaid = bill.amountPaid || 0;
        const balance = originalAmount - amountPaid;

        // Skip if fully paid
        if (balance <= 0) return;

        // Get vendor info
        const vendorId = bill.vendorId || bill.creditorId || 'unknown';
        const vendorName = bill.vendorName || 'Unknown Vendor';

        // Calculate aging
        const billDate = toDate(bill.billDate);
        const dueDate = toDate(bill.dueDate);
        const daysOutstanding = calculateDaysOutstanding(dueDate, reportDate);
        const agingBucket = getAgingBucket(daysOutstanding);

        // Create payable line
        const payableLine: AgedPayableLine = {
          billId,
          billNumber: bill.billNumber || 'N/A',
          vendorBillNumber: bill.vendorBillNumber || 'N/A',
          billDate,
          dueDate,
          originalAmount,
          amountPaid,
          balance,
          daysOutstanding,
          agingBucket,
        };

        // Add to vendor group
        if (!vendorMap.has(vendorId)) {
          vendorMap.set(vendorId, {
            vendorId,
            vendorName,
            bills: [],
            agingBuckets: createEmptyAgingBucket(),
          });
        }

        const vendorGroup = vendorMap.get(vendorId)!;
        vendorGroup.bills.push(payableLine);
        addToAgingBucket(vendorGroup.agingBuckets, balance, agingBucket);
      });

      // Convert map to array and sort by total outstanding (descending)
      const vendors = Array.from(vendorMap.values()).sort(
        (a, b) => b.agingBuckets.total - a.agingBuckets.total
      );

      // Sort bills within each vendor by days outstanding (descending)
      vendors.forEach((vendor) => {
        vendor.bills.sort((a, b) => b.daysOutstanding - a.daysOutstanding);
      });

      // Calculate totals
      const totals = createEmptyAgingBucket();
      let totalBills = 0;

      vendors.forEach((vendor) => {
        totals.current += vendor.agingBuckets.current;
        totals.days1to30 += vendor.agingBuckets.days1to30;
        totals.days31to60 += vendor.agingBuckets.days31to60;
        totals.days61to90 += vendor.agingBuckets.days61to90;
        totals.days90Plus += vendor.agingBuckets.days90Plus;
        totals.total += vendor.agingBuckets.total;
        totalBills += vendor.bills.length;
      });

      const report: AgedPayablesReport = {
        asOfDate: reportDate,
        vendors,
        totals,
        totalVendors: vendors.length,
        totalBills,
      };

      console.log('✅ [APARReportsService] Aged payables report generated', {
        totalVendors: report.totalVendors,
        totalBills: report.totalBills,
        totalOutstanding: report.totals.total,
      });

      return report;
    } catch (error: any) {
      console.error('❌ [APARReportsService] Error generating aged payables:', error);
      throw new Error(`Failed to generate aged payables report: ${error.message}`);
    }
  }

  // ==========================================================================
  // AR SUMMARY BY CUSTOMER
  // ==========================================================================

  /**
   * Get AR summary statistics by customer
   * Returns high-level overview of outstanding receivables per customer
   */
  async getARSummaryByCustomer(): Promise<ARSummary[]> {
    try {
      console.log('📊 [APARReportsService] Generating AR summary by customer');

      // Get all unpaid and partially paid invoices
      const invoicesRef = collection(db, 'companies', this.companyId, 'invoices');
      const invoicesQuery = query(
        invoicesRef,
        where('status', 'in', ['sent', 'partial', 'overdue'])
      );

      const invoicesSnapshot = await getDocs(invoicesQuery);

      // Group by customer
      const customerMap = new Map<string, {
        customerId: string;
        customerName: string;
        invoices: Array<{
          balance: number;
          invoiceDate: Date;
          dueDate: Date;
        }>;
      }>();

      invoicesSnapshot.forEach((doc) => {
        const invoice = doc.data();

        const originalAmount = invoice.totalAmount || 0;
        const amountPaid = invoice.amountPaid || 0;
        const balance = originalAmount - amountPaid;

        if (balance <= 0) return;

        const customerId = invoice.customerId || invoice.debtorId || 'unknown';
        const customerName = invoice.customerName || 'Unknown Customer';

        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            customerId,
            customerName,
            invoices: [],
          });
        }

        customerMap.get(customerId)!.invoices.push({
          balance,
          invoiceDate: toDate(invoice.invoiceDate),
          dueDate: toDate(invoice.dueDate),
        });
      });

      // Calculate summaries
      const today = new Date();
      const summaries: ARSummary[] = [];

      customerMap.forEach((customer) => {
        const totalOutstanding = customer.invoices.reduce((sum, inv) => sum + inv.balance, 0);
        const invoiceCount = customer.invoices.length;

        // Find oldest invoice
        const sortedByDate = [...customer.invoices].sort(
          (a, b) => a.invoiceDate.getTime() - b.invoiceDate.getTime()
        );
        const oldestInvoiceDate = sortedByDate.length > 0 ? sortedByDate[0].invoiceDate : undefined;

        // Calculate average days outstanding
        const totalDaysOutstanding = customer.invoices.reduce((sum, inv) => {
          const days = calculateDaysOutstanding(inv.dueDate, today);
          return sum + days;
        }, 0);
        const averageDaysOutstanding = invoiceCount > 0
          ? Math.round(totalDaysOutstanding / invoiceCount)
          : 0;

        summaries.push({
          customerId: customer.customerId,
          customerName: customer.customerName,
          totalOutstanding,
          invoiceCount,
          oldestInvoiceDate,
          averageDaysOutstanding,
        });
      });

      // Sort by total outstanding (descending)
      summaries.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

      console.log('✅ [APARReportsService] AR summary generated', {
        totalCustomers: summaries.length,
      });

      return summaries;
    } catch (error: any) {
      console.error('❌ [APARReportsService] Error generating AR summary:', error);
      throw new Error(`Failed to generate AR summary: ${error.message}`);
    }
  }

  // ==========================================================================
  // AP SUMMARY BY VENDOR
  // ==========================================================================

  /**
   * Get AP summary statistics by vendor
   * Returns high-level overview of outstanding payables per vendor
   */
  async getAPSummaryByVendor(): Promise<APSummary[]> {
    try {
      console.log('📊 [APARReportsService] Generating AP summary by vendor');

      // Get all unpaid and partially paid bills
      const billsRef = collection(db, 'companies', this.companyId, 'vendorBills');
      const billsQuery = query(
        billsRef,
        where('status', 'in', ['approved', 'posted', 'partially_paid'])
      );

      let billsSnapshot;
      try {
        billsSnapshot = await getDocs(billsQuery);
      } catch (permError: any) {
        // If collection doesn't exist or no permissions (no bills created yet), return empty
        console.log('ℹ️ [APARReportsService] No vendor bills found or collection does not exist');
        return [];
      }

      // Group by vendor
      const vendorMap = new Map<string, {
        vendorId: string;
        vendorName: string;
        bills: Array<{
          balance: number;
          billDate: Date;
          dueDate: Date;
        }>;
      }>();

      billsSnapshot.forEach((doc) => {
        const bill = doc.data();

        const originalAmount = bill.totalAmount || 0;
        const amountPaid = bill.amountPaid || 0;
        const balance = originalAmount - amountPaid;

        if (balance <= 0) return;

        const vendorId = bill.vendorId || bill.creditorId || 'unknown';
        const vendorName = bill.vendorName || 'Unknown Vendor';

        if (!vendorMap.has(vendorId)) {
          vendorMap.set(vendorId, {
            vendorId,
            vendorName,
            bills: [],
          });
        }

        vendorMap.get(vendorId)!.bills.push({
          balance,
          billDate: toDate(bill.billDate),
          dueDate: toDate(bill.dueDate),
        });
      });

      // Calculate summaries
      const today = new Date();
      const summaries: APSummary[] = [];

      vendorMap.forEach((vendor) => {
        const totalOutstanding = vendor.bills.reduce((sum, bill) => sum + bill.balance, 0);
        const billCount = vendor.bills.length;

        // Find oldest bill
        const sortedByDate = [...vendor.bills].sort(
          (a, b) => a.billDate.getTime() - b.billDate.getTime()
        );
        const oldestBillDate = sortedByDate.length > 0 ? sortedByDate[0].billDate : undefined;

        // Calculate average days outstanding
        const totalDaysOutstanding = vendor.bills.reduce((sum, bill) => {
          const days = calculateDaysOutstanding(bill.dueDate, today);
          return sum + days;
        }, 0);
        const averageDaysOutstanding = billCount > 0
          ? Math.round(totalDaysOutstanding / billCount)
          : 0;

        summaries.push({
          vendorId: vendor.vendorId,
          vendorName: vendor.vendorName,
          totalOutstanding,
          billCount,
          oldestBillDate,
          averageDaysOutstanding,
        });
      });

      // Sort by total outstanding (descending)
      summaries.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

      console.log('✅ [APARReportsService] AP summary generated', {
        totalVendors: summaries.length,
      });

      return summaries;
    } catch (error: any) {
      console.error('❌ [APARReportsService] Error generating AP summary:', error);
      throw new Error(`Failed to generate AP summary: ${error.message}`);
    }
  }
}

// ============================================================================
// SERVICE FACTORY
// ============================================================================

/**
 * Create AP/AR Reports Service instance
 */
export function createAPARReportsService(
  companyId: string,
  userId: string
): APARReportsService {
  return new APARReportsService(companyId, userId);
}
