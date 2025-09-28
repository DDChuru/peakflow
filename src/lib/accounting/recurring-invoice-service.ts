import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SLAService } from './sla-service';
import { PostingService } from './posting-service';
import {
  ServiceAgreement,
  SLALineItem,
  SLAProcessingResult,
  SLAProcessingOptions,
  InvoiceGenerationRequest,
  ProrationCalculation
} from '@/types/accounting/sla';
import {
  JournalEntry,
  JournalEntryLine
} from '@/types/accounting/journal';

/**
 * Invoice data structure for generation
 */
interface InvoiceData {
  id: string;
  companyId: string;
  customerId: string;
  customerName?: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

  // Financial
  subtotal: number;
  taxAmount: number;
  totalAmount: number;

  // Line items
  lineItems: InvoiceLineItem[];

  // SLA reference
  slaId?: string;
  contractNumber?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;

  // Metadata
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  glAccountId: string;
  taxRate?: number;
  taxAmount?: number;

  // SLA line item reference
  slaLineItemId?: string;

  // Proration information
  isProrated?: boolean;
  prorationDetails?: ProrationCalculation;
}

export class RecurringInvoiceService {
  private slaService: SLAService;
  private postingService: PostingService;

  constructor(companyId: string) {
    this.slaService = new SLAService();
    this.postingService = new PostingService({ tenantId: companyId });
  }

  /**
   * Main function to process all recurring invoices for a company
   */
  async processRecurringInvoices(options: SLAProcessingOptions): Promise<SLAProcessingResult[]> {
    try {
      const { companyId, dryRun = false, processUpToDate, userId } = options;

      // Get all SLAs due for billing
      const dueSLAs = await this.slaService.getDueSLAs(
        companyId,
        processUpToDate ? new Date(processUpToDate) : undefined
      );

      const results: SLAProcessingResult[] = [];

      for (const sla of dueSLAs) {
        try {
          const result = await this.processSingleSLA(sla, options);
          results.push(result);
        } catch (error) {
          console.error(`Error processing SLA ${sla.id}:`, error);
          results.push({
            success: false,
            slaId: sla.id,
            processedDate: new Date(),
            totalAmount: 0,
            lineItemsProcessed: 0,
            errors: [error instanceof Error ? error.message : String(error)]
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing recurring invoices:', error);
      throw new Error(`Failed to process recurring invoices: ${error}`);
    }
  }

  /**
   * Process a single SLA for invoice generation
   */
  async processSingleSLA(
    sla: ServiceAgreement,
    options: SLAProcessingOptions
  ): Promise<SLAProcessingResult> {
    const { dryRun = false, generateInvoices = true, updateNextBillingDate = true } = options;

    try {
      // Calculate billing period
      const billingPeriod = this.calculateBillingPeriod(sla);

      // Get active line items for this billing period
      const activeLineItems = this.getActiveLineItems(sla.lineItems, billingPeriod.start, billingPeriod.end);

      if (activeLineItems.length === 0) {
        return {
          success: true,
          slaId: sla.id,
          processedDate: new Date(),
          totalAmount: 0,
          lineItemsProcessed: 0,
          warnings: ['No active line items for billing period']
        };
      }

      // Calculate total amount
      const totalAmount = activeLineItems.reduce((sum, item) => sum + item.amount, 0);

      // If dry run, return preview without creating invoice
      if (dryRun) {
        return {
          success: true,
          slaId: sla.id,
          processedDate: new Date(),
          totalAmount,
          lineItemsProcessed: activeLineItems.length,
          nextBillingDate: this.slaService.calculateNextBillingDate(
            new Date(sla.nextBillingDate),
            sla.billingFrequency,
            sla.dayOfMonth
          ).toISOString().split('T')[0]
        };
      }

      let invoiceId: string | undefined;
      let invoiceNumber: string | undefined;

      // Generate invoice if requested
      if (generateInvoices) {
        const invoiceRequest: InvoiceGenerationRequest = {
          slaId: sla.id,
          companyId: sla.companyId,
          customerId: sla.customerId,
          billingDate: new Date().toISOString().split('T')[0],
          periodStart: billingPeriod.start,
          periodEnd: billingPeriod.end,
          lineItems: activeLineItems,
          totalAmount,
          taxAmount: this.calculateTaxAmount(activeLineItems, sla.taxRate),
          currency: sla.currency,
          dueDate: this.calculateDueDate(new Date(), sla.paymentTerms),
          reference: `${sla.contractNumber} - ${billingPeriod.start} to ${billingPeriod.end}`,
          metadata: {
            slaId: sla.id,
            contractNumber: sla.contractNumber,
            billingFrequency: sla.billingFrequency
          }
        };

        const invoice = await this.generateInvoiceFromSLA(invoiceRequest, options.userId);
        invoiceId = invoice.id;
        invoiceNumber = invoice.invoiceNumber;

        // Create journal entry for revenue recognition
        await this.createRevenueJournalEntry(invoice, sla, options.userId);
      }

      // Update next billing date if requested
      if (updateNextBillingDate) {
        await this.slaService.updateNextBillingDate(
          sla.companyId,
          sla.id,
          new Date(sla.nextBillingDate)
        );
      }

      return {
        success: true,
        slaId: sla.id,
        processedDate: new Date(),
        invoiceId,
        invoiceNumber,
        totalAmount,
        lineItemsProcessed: activeLineItems.length,
        nextBillingDate: updateNextBillingDate
          ? this.slaService.calculateNextBillingDate(
              new Date(sla.nextBillingDate),
              sla.billingFrequency,
              sla.dayOfMonth
            ).toISOString().split('T')[0]
          : undefined
      };

    } catch (error) {
      console.error(`Error processing SLA ${sla.id}:`, error);
      return {
        success: false,
        slaId: sla.id,
        processedDate: new Date(),
        totalAmount: 0,
        lineItemsProcessed: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  /**
   * Generate invoice from SLA
   */
  async generateInvoiceFromSLA(
    request: InvoiceGenerationRequest,
    userId: string
  ): Promise<InvoiceData> {
    try {
      const invoiceCollection = collection(db, `companies/${request.companyId}/invoices`);
      const invoiceRef = doc(invoiceCollection);

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(request.companyId);

      // Calculate due date
      const dueDate = request.dueDate;

      // Convert SLA line items to invoice line items
      const invoiceLineItems: InvoiceLineItem[] = request.lineItems.map((slaItem, index) => {
        const taxRate = slaItem.taxRate || 0;
        const taxAmount = slaItem.amount * (taxRate / 100);

        return {
          id: `${invoiceRef.id}-line-${index + 1}`,
          description: slaItem.description,
          quantity: slaItem.quantity,
          unitPrice: slaItem.unitPrice,
          amount: slaItem.amount,
          glAccountId: slaItem.glAccountId,
          taxRate,
          taxAmount,
          slaLineItemId: slaItem.id,
          isProrated: false // TODO: Implement proration logic
        };
      });

      const subtotal = invoiceLineItems.reduce((sum, item) => sum + item.amount, 0);
      const totalTax = invoiceLineItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
      const totalAmount = subtotal + totalTax;

      const invoice: InvoiceData = {
        id: invoiceRef.id,
        companyId: request.companyId,
        customerId: request.customerId,
        invoiceNumber,
        invoiceDate: request.billingDate,
        dueDate,
        currency: request.currency,
        status: 'draft',
        subtotal,
        taxAmount: totalTax,
        totalAmount,
        lineItems: invoiceLineItems,
        slaId: request.slaId,
        contractNumber: request.reference?.split(' - ')[0],
        billingPeriodStart: request.periodStart,
        billingPeriodEnd: request.periodEnd,
        notes: request.notes,
        metadata: request.metadata,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      };

      // Save invoice to Firestore
      await runTransaction(db, async (transaction) => {
        transaction.set(invoiceRef, {
          ...invoice,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });

      return invoice;
    } catch (error) {
      console.error('Error generating invoice from SLA:', error);
      throw new Error(`Failed to generate invoice: ${error}`);
    }
  }

  /**
   * Calculate billing period based on SLA frequency
   */
  private calculateBillingPeriod(sla: ServiceAgreement): { start: string; end: string } {
    const billingDate = new Date(sla.nextBillingDate);
    let periodStart: Date;
    let periodEnd: Date;

    switch (sla.billingFrequency) {
      case 'monthly':
        periodStart = new Date(billingDate.getFullYear(), billingDate.getMonth(), 1);
        periodEnd = new Date(billingDate.getFullYear(), billingDate.getMonth() + 1, 0);
        break;

      case 'quarterly':
        const quarterMonth = Math.floor(billingDate.getMonth() / 3) * 3;
        periodStart = new Date(billingDate.getFullYear(), quarterMonth, 1);
        periodEnd = new Date(billingDate.getFullYear(), quarterMonth + 3, 0);
        break;

      case 'annual':
        periodStart = new Date(billingDate.getFullYear(), 0, 1);
        periodEnd = new Date(billingDate.getFullYear(), 11, 31);
        break;

      default:
        // For custom frequency, use the billing date as the period
        periodStart = new Date(billingDate);
        periodEnd = new Date(billingDate);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(0); // Last day of the month
        break;
    }

    return {
      start: periodStart.toISOString().split('T')[0],
      end: periodEnd.toISOString().split('T')[0]
    };
  }

  /**
   * Get active line items for the billing period
   */
  private getActiveLineItems(
    lineItems: SLALineItem[],
    periodStart: string,
    periodEnd: string
  ): SLALineItem[] {
    return lineItems.filter(item => {
      if (item.status !== 'active') return false;

      // Check if item is effective during this period
      const itemStart = new Date(item.effectiveFrom);
      const itemEnd = item.effectiveTo ? new Date(item.effectiveTo) : null;
      const periodStartDate = new Date(periodStart);
      const periodEndDate = new Date(periodEnd);

      // Item must start before or during the period
      if (itemStart > periodEndDate) return false;

      // Item must not end before the period (if it has an end date)
      if (itemEnd && itemEnd < periodStartDate) return false;

      return true;
    });
  }

  /**
   * Calculate tax amount for line items
   */
  private calculateTaxAmount(lineItems: SLALineItem[], defaultTaxRate?: number): number {
    return lineItems.reduce((sum, item) => {
      const taxRate = item.taxRate || defaultTaxRate || 0;
      return sum + (item.amount * (taxRate / 100));
    }, 0);
  }

  /**
   * Calculate due date from billing date and payment terms
   */
  private calculateDueDate(billingDate: Date, paymentTerms: number): string {
    const dueDate = new Date(billingDate);
    dueDate.setDate(dueDate.getDate() + paymentTerms);
    return dueDate.toISOString().split('T')[0];
  }

  /**
   * Generate sequential invoice number
   */
  private async generateInvoiceNumber(companyId: string): Promise<string> {
    // This is a simplified implementation
    // In a production system, you'd want to maintain a counter in Firestore
    const timestamp = Date.now().toString().slice(-6);
    const prefix = 'INV';
    return `${prefix}-${timestamp}`;
  }

  /**
   * Create journal entry for revenue recognition
   */
  private async createRevenueJournalEntry(
    invoice: InvoiceData,
    sla: ServiceAgreement,
    userId: string
  ): Promise<void> {
    try {
      // Group line items by GL account
      const accountGroups = invoice.lineItems.reduce((acc, item) => {
        if (!acc[item.glAccountId]) {
          acc[item.glAccountId] = 0;
        }
        acc[item.glAccountId] += item.amount;
        return acc;
      }, {} as Record<string, number>);

      // Create journal entry lines
      const journalLines: JournalEntryLine[] = [];

      // Debit: Accounts Receivable
      journalLines.push({
        id: `dr-ar-${Date.now()}`,
        accountId: 'accounts-receivable', // TODO: Get from chart of accounts
        accountCode: '1200',
        description: `Sales Invoice ${invoice.invoiceNumber}`,
        debit: invoice.totalAmount,
        credit: 0,
        currency: invoice.currency
      });

      // Credit: Revenue accounts
      Object.entries(accountGroups).forEach(([accountId, amount], index) => {
        journalLines.push({
          id: `cr-rev-${index}-${Date.now()}`,
          accountId,
          accountCode: '', // Will be populated by posting service
          description: `Sales Invoice ${invoice.invoiceNumber}`,
          debit: 0,
          credit: amount,
          currency: invoice.currency
        });
      });

      // Credit: Tax payable (if applicable)
      if (invoice.taxAmount > 0) {
        journalLines.push({
          id: `cr-tax-${Date.now()}`,
          accountId: 'tax-payable', // TODO: Get from chart of accounts
          accountCode: '2200',
          description: `Sales Tax - Invoice ${invoice.invoiceNumber}`,
          debit: 0,
          credit: invoice.taxAmount,
          currency: invoice.currency
        });
      }

      const journalEntry: JournalEntry = {
        id: `je-${invoice.id}`,
        description: `Sales Invoice ${invoice.invoiceNumber} - ${sla.contractName}`,
        reference: invoice.invoiceNumber,
        transactionDate: new Date(invoice.invoiceDate),
        postingDate: new Date(),
        fiscalPeriodId: this.getCurrentFiscalPeriodId(), // TODO: Implement fiscal period lookup
        source: 'recurring_billing',
        status: 'draft',
        lines: journalLines,
        metadata: {
          invoiceId: invoice.id,
          slaId: sla.id,
          contractNumber: sla.contractNumber
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      };

      // Post the journal entry
      await this.postingService.post(journalEntry);

    } catch (error) {
      console.error('Error creating revenue journal entry:', error);
      // Don't throw error as invoice was already created successfully
      console.warn(`Journal entry creation failed for invoice ${invoice.id}, but invoice was created`);
    }
  }

  /**
   * Get current fiscal period ID (placeholder implementation)
   */
  private getCurrentFiscalPeriodId(): string {
    // TODO: Implement actual fiscal period lookup
    const currentYear = new Date().getFullYear();
    return `fp-${currentYear}`;
  }

  /**
   * Calculate proration for mid-period changes
   */
  calculateProration(
    lineItem: SLALineItem,
    periodStart: string,
    periodEnd: string,
    effectiveDate: string
  ): ProrationCalculation {
    const periodStartDate = new Date(periodStart);
    const periodEndDate = new Date(periodEnd);
    const effectiveDateTime = new Date(effectiveDate);

    const totalDays = Math.ceil(
      (periodEndDate.getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const daysUsed = Math.ceil(
      (periodEndDate.getTime() - effectiveDateTime.getTime()) / (1000 * 60 * 60 * 24)
    );

    const prorationFactor = daysUsed / totalDays;
    const proratedAmount = lineItem.amount * prorationFactor;

    return {
      originalAmount: lineItem.amount,
      proratedAmount,
      daysUsed,
      totalDays,
      prorationFactor,
      startDate: effectiveDate,
      endDate: periodEnd,
      description: `Prorated from ${effectiveDate} to ${periodEnd} (${daysUsed}/${totalDays} days)`
    };
  }
}