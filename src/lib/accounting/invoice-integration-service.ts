import { invoiceService } from './invoice-service';
import { createInvoicePostingService } from './invoice-posting-service';
import { quoteService } from './quote-service';
import { salesOrderService } from './sales-order-service';
import { DebtorService } from '@/lib/firebase/debtor-service';
import {
  Invoice,
  InvoiceCreateRequest,
  InvoicePayment
} from '@/types/accounting/invoice';

/**
 * Integration service that coordinates invoice creation with automatic GL posting
 * This service ensures that all invoice operations are properly posted to the general ledger
 */
export class InvoiceIntegrationService {
  private debtorService: DebtorService;

  constructor() {
    this.debtorService = new DebtorService();
  }

  /**
   * Create a direct invoice with automatic GL posting
   */
  async createDirectInvoiceWithPosting(
    companyId: string,
    invoiceData: InvoiceCreateRequest,
    userId: string,
    postingOptions?: {
      fiscalPeriodId?: string;
      defaultARAccountId?: string;
      defaultTaxPayableAccountId?: string;
      autoPost?: boolean;
    }
  ): Promise<{
    invoice: Invoice;
    journalEntryId?: string;
  }> {
    try {
      // Create the invoice
      const invoice = await invoiceService.createDirectInvoice(companyId, invoiceData, userId);

      // Set up posting service
      const postingService = await createInvoicePostingService(companyId, {
        fiscalPeriodId: postingOptions?.fiscalPeriodId || 'current',
        defaultARAccountId: postingOptions?.defaultARAccountId || 'ar-default',
        defaultTaxPayableAccountId: postingOptions?.defaultTaxPayableAccountId,
        autoPost: postingOptions?.autoPost !== false
      });

      // Post to GL if auto-posting is enabled
      let journalEntryId: string | undefined;
      if (postingOptions?.autoPost !== false) {
        journalEntryId = await postingService.postInvoiceToGL(invoice);
      }

      return {
        invoice: {
          ...invoice,
          journalEntryId,
          postedDate: journalEntryId ? new Date().toISOString() : undefined
        },
        journalEntryId
      };
    } catch (error) {
      console.error('Error creating direct invoice with posting:', error);
      throw new Error(`Failed to create direct invoice with posting: ${error}`);
    }
  }

  /**
   * Create invoice from quote with automatic GL posting
   */
  async createInvoiceFromQuoteWithPosting(
    companyId: string,
    quoteId: string,
    invoiceOptions: {
      invoiceDate: string;
      paymentTerms?: number;
      notes?: string;
    },
    userId: string,
    postingOptions?: {
      fiscalPeriodId?: string;
      defaultARAccountId?: string;
      defaultTaxPayableAccountId?: string;
      autoPost?: boolean;
    }
  ): Promise<{
    invoice: Invoice;
    journalEntryId?: string;
  }> {
    try {
      // Create invoice from quote
      const invoice = await invoiceService.createFromQuote(
        companyId,
        quoteId,
        invoiceOptions,
        userId
      );

      // Set up posting service
      const postingService = await createInvoicePostingService(companyId, {
        fiscalPeriodId: postingOptions?.fiscalPeriodId || 'current',
        defaultARAccountId: postingOptions?.defaultARAccountId || 'ar-default',
        defaultTaxPayableAccountId: postingOptions?.defaultTaxPayableAccountId,
        autoPost: postingOptions?.autoPost !== false
      });

      // Post to GL if auto-posting is enabled
      let journalEntryId: string | undefined;
      if (postingOptions?.autoPost !== false) {
        journalEntryId = await postingService.postInvoiceToGL(invoice);
      }

      return {
        invoice: {
          ...invoice,
          journalEntryId,
          postedDate: journalEntryId ? new Date().toISOString() : undefined
        },
        journalEntryId
      };
    } catch (error) {
      console.error('Error creating invoice from quote with posting:', error);
      throw new Error(`Failed to create invoice from quote with posting: ${error}`);
    }
  }

  /**
   * Create invoice from sales order with automatic GL posting
   */
  async createInvoiceFromSalesOrderWithPosting(
    companyId: string,
    salesOrderId: string,
    invoiceOptions: {
      invoiceDate: string;
      lineItems: Array<{
        lineItemId: string;
        quantityToInvoice: number;
      }>;
      notes?: string;
    },
    userId: string,
    postingOptions?: {
      fiscalPeriodId?: string;
      defaultARAccountId?: string;
      defaultTaxPayableAccountId?: string;
      autoPost?: boolean;
    }
  ): Promise<{
    invoice: Invoice;
    journalEntryId?: string;
  }> {
    try {
      // Create invoice from sales order
      const invoice = await invoiceService.createFromSalesOrder(
        companyId,
        salesOrderId,
        invoiceOptions,
        userId
      );

      // Set up posting service
      const postingService = await createInvoicePostingService(companyId, {
        fiscalPeriodId: postingOptions?.fiscalPeriodId || 'current',
        defaultARAccountId: postingOptions?.defaultARAccountId || 'ar-default',
        defaultTaxPayableAccountId: postingOptions?.defaultTaxPayableAccountId,
        autoPost: postingOptions?.autoPost !== false
      });

      // Post to GL if auto-posting is enabled
      let journalEntryId: string | undefined;
      if (postingOptions?.autoPost !== false) {
        journalEntryId = await postingService.postInvoiceToGL(invoice);
      }

      return {
        invoice: {
          ...invoice,
          journalEntryId,
          postedDate: journalEntryId ? new Date().toISOString() : undefined
        },
        journalEntryId
      };
    } catch (error) {
      console.error('Error creating invoice from sales order with posting:', error);
      throw new Error(`Failed to create invoice from sales order with posting: ${error}`);
    }
  }

  /**
   * Record payment with automatic GL posting
   */
  async recordPaymentWithPosting(
    companyId: string,
    invoiceId: string,
    payment: Omit<InvoicePayment, 'id' | 'invoiceId' | 'createdAt'>,
    bankAccountId: string,
    userId: string,
    postingOptions?: {
      fiscalPeriodId?: string;
      defaultARAccountId?: string;
      autoPost?: boolean;
    }
  ): Promise<{
    paymentJournalEntryId?: string;
  }> {
    try {
      // Record the payment
      await invoiceService.recordPayment(companyId, invoiceId, payment, userId);

      // Get the updated invoice
      const invoice = await invoiceService.getInvoice(companyId, invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found after payment recording');
      }

      // Set up posting service
      const postingService = await createInvoicePostingService(companyId, {
        fiscalPeriodId: postingOptions?.fiscalPeriodId || 'current',
        defaultARAccountId: postingOptions?.defaultARAccountId || 'ar-default',
        autoPost: postingOptions?.autoPost !== false
      });

      // Post payment to GL if auto-posting is enabled
      let paymentJournalEntryId: string | undefined;
      if (postingOptions?.autoPost !== false) {
        const paymentWithId: InvoicePayment = {
          ...payment,
          id: `payment-${Date.now()}`,
          invoiceId,
          createdAt: new Date(),
          createdBy: userId
        };

        paymentJournalEntryId = await postingService.postPaymentToGL(
          invoice,
          paymentWithId,
          bankAccountId
        );
      }

      return {
        paymentJournalEntryId
      };
    } catch (error) {
      console.error('Error recording payment with posting:', error);
      throw new Error(`Failed to record payment with posting: ${error}`);
    }
  }

  /**
   * Batch process invoices with automatic GL posting
   */
  async batchProcessInvoicesWithPosting(
    companyId: string,
    invoiceRequests: InvoiceCreateRequest[],
    userId: string,
    postingOptions?: {
      fiscalPeriodId?: string;
      defaultARAccountId?: string;
      defaultTaxPayableAccountId?: string;
      autoPost?: boolean;
    }
  ): Promise<{
    success: number;
    failed: number;
    results: Array<{
      success: boolean;
      invoice?: Invoice;
      journalEntryId?: string;
      error?: string;
    }>;
  }> {
    const results = {
      success: 0,
      failed: 0,
      results: [] as Array<{
        success: boolean;
        invoice?: Invoice;
        journalEntryId?: string;
        error?: string;
      }>
    };

    for (const invoiceRequest of invoiceRequests) {
      try {
        const result = await this.createDirectInvoiceWithPosting(
          companyId,
          invoiceRequest,
          userId,
          postingOptions
        );

        results.success++;
        results.results.push({
          success: true,
          invoice: result.invoice,
          journalEntryId: result.journalEntryId
        });
      } catch (error) {
        results.failed++;
        results.results.push({
          success: false,
          error: String(error)
        });
      }
    }

    return results;
  }

  /**
   * Get comprehensive invoice status including GL posting information
   */
  async getInvoiceStatusWithPosting(
    companyId: string,
    invoiceId: string
  ): Promise<{
    invoice: Invoice | null;
    postingStatus: {
      isPosted: boolean;
      journalEntryId?: string;
      postedDate?: string;
      canReverse: boolean;
    };
    paymentStatus: {
      totalPayments: number;
      lastPaymentDate?: string;
      paymentHistory: InvoicePayment[];
    };
  }> {
    try {
      const invoice = await invoiceService.getInvoice(companyId, invoiceId);
      if (!invoice) {
        return {
          invoice: null,
          postingStatus: {
            isPosted: false,
            canReverse: false
          },
          paymentStatus: {
            totalPayments: 0,
            paymentHistory: []
          }
        };
      }

      // Set up posting service to get posting status
      const postingService = await createInvoicePostingService(companyId);
      const postingStatus = await postingService.getPostingStatus(invoice);

      const paymentHistory = invoice.paymentHistory || [];
      const paymentStatus = {
        totalPayments: paymentHistory.length,
        lastPaymentDate: paymentHistory.length > 0
          ? paymentHistory[paymentHistory.length - 1].paymentDate
          : undefined,
        paymentHistory
      };

      return {
        invoice,
        postingStatus,
        paymentStatus
      };
    } catch (error) {
      console.error('Error getting invoice status with posting:', error);
      throw new Error(`Failed to get invoice status with posting: ${error}`);
    }
  }

  /**
   * Convert quote to invoice (used by QuoteToInvoiceModal)
   */
  async convertQuoteToInvoice(
    companyId: string,
    quoteId: string,
    invoiceData: InvoiceCreateRequest
  ): Promise<{
    invoice: Invoice;
    journalEntryId?: string;
  }> {
    try {
      // Create the invoice from the quote data
      const invoice = await invoiceService.createDirectInvoice(companyId, invoiceData, invoiceData.createdBy || 'system');

      // Update quote status to converted
      await quoteService.updateQuoteStatus(companyId, quoteId, 'converted', invoiceData.createdBy || 'system');

      // Set up posting service for GL posting
      const postingService = await createInvoicePostingService(companyId, {
        fiscalPeriodId: 'current',
        defaultARAccountId: 'ar-default',
        autoPost: true
      });

      // Post to GL
      let journalEntryId: string | undefined;
      try {
        journalEntryId = await postingService.postInvoiceToGL(invoice);
      } catch (postingError) {
        console.warn('GL posting failed, but invoice created successfully:', postingError);
      }

      return {
        invoice: {
          ...invoice,
          journalEntryId,
          postedDate: journalEntryId ? new Date().toISOString() : undefined
        },
        journalEntryId
      };
    } catch (error) {
      console.error('Error converting quote to invoice:', error);
      throw new Error(`Failed to convert quote to invoice: ${error}`);
    }
  }

  /**
   * Complete quote-to-invoice workflow
   * Quote → [Sales Order] → Invoice → GL Posting
   */
  async completeQuoteToInvoiceWorkflow(
    companyId: string,
    quoteId: string,
    workflow: {
      createSalesOrder?: boolean;
      salesOrderOptions?: {
        orderDate: string;
        requestedDeliveryDate?: string;
        deliveryAddress?: string;
        deliveryInstructions?: string;
        shippingMethod?: string;
        notes?: string;
      };
      invoiceOptions: {
        invoiceDate: string;
        paymentTerms?: number;
        notes?: string;
      };
    },
    userId: string,
    postingOptions?: {
      fiscalPeriodId?: string;
      defaultARAccountId?: string;
      defaultTaxPayableAccountId?: string;
      autoPost?: boolean;
    }
  ): Promise<{
    quote: any; // Quote from quote service
    salesOrder?: any; // Sales order if created
    invoice: Invoice;
    journalEntryId?: string;
  }> {
    try {
      // Get the quote
      const quote = await quoteService.getQuote(companyId, quoteId);
      if (!quote) {
        throw new Error('Quote not found');
      }

      let salesOrder: any;

      // Create sales order if requested
      if (workflow.createSalesOrder && workflow.salesOrderOptions) {
        salesOrder = await salesOrderService.createFromQuote(
          companyId,
          quoteId,
          workflow.salesOrderOptions,
          userId
        );
      }

      // Create invoice
      const invoiceResult = await this.createInvoiceFromQuoteWithPosting(
        companyId,
        quoteId,
        workflow.invoiceOptions,
        userId,
        postingOptions
      );

      return {
        quote,
        salesOrder,
        invoice: invoiceResult.invoice,
        journalEntryId: invoiceResult.journalEntryId
      };
    } catch (error) {
      console.error('Error completing quote-to-invoice workflow:', error);
      throw new Error(`Failed to complete quote-to-invoice workflow: ${error}`);
    }
  }
}

// Export singleton instance
export const invoiceIntegrationService = new InvoiceIntegrationService();