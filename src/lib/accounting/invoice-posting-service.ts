import {
  doc,
  updateDoc,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PostingService } from './posting-service';
import { DebtorService } from '@/lib/firebase/debtor-service';
import { ChartOfAccountsService } from './chart-of-accounts-service';
import { Invoice, InvoicePayment } from '@/types/accounting/invoice';
import {
  JournalEntry,
  JournalLine,
  JournalSource
} from '@/types/accounting/journal';

interface InvoicePostingOptions {
  tenantId: string;
  fiscalPeriodId: string;
  autoPost?: boolean; // Whether to immediately post to GL
  defaultARAccountId: string; // Accounts Receivable account
  defaultTaxPayableAccountId?: string; // Sales Tax Payable account
}

export class InvoicePostingService {
  private postingService: PostingService;
  private debtorService: DebtorService;
  private chartService: ChartOfAccountsService;

  constructor(private readonly options: InvoicePostingOptions) {
    this.postingService = new PostingService({
      tenantId: options.tenantId,
      allowBackdatedPosting: true
    });
    this.debtorService = new DebtorService();
    this.chartService = new ChartOfAccountsService();
  }

  /**
   * Post invoice to General Ledger
   * Creates journal entry with:
   * - Debit: Accounts Receivable (customer balance)
   * - Credit: Revenue accounts (from line items)
   * - Credit: Tax Payable accounts (if applicable)
   */
  async postInvoiceToGL(invoice: Invoice): Promise<string> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Create journal entry for the invoice
        const journalEntry = await this.createInvoiceJournalEntry(invoice);

        // Post to general ledger
        const postingResult = await this.postingService.post(journalEntry);

        // Update debtor balance
        await this.debtorService.updateDebtorBalance(
          invoice.companyId,
          invoice.customerId,
          invoice.totalAmount,
          false // This is a sale, not a payment
        );

        // Update invoice with journal entry reference
        const invoiceRef = doc(db, `companies/${invoice.companyId}/invoices`, invoice.id);
        transaction.update(invoiceRef, {
          journalEntryId: postingResult.journalEntryId,
          postedDate: serverTimestamp(),
          fiscalPeriodId: this.options.fiscalPeriodId,
          updatedAt: serverTimestamp()
        });

        return postingResult.journalEntryId;
      });
    } catch (error) {
      console.error('Error posting invoice to GL:', error);
      throw new Error(`Failed to post invoice to GL: ${error}`);
    }
  }

  /**
   * Post payment to General Ledger
   * Creates journal entry with:
   * - Debit: Cash/Bank account
   * - Credit: Accounts Receivable
   */
  async postPaymentToGL(
    invoice: Invoice,
    payment: InvoicePayment,
    bankAccountId: string
  ): Promise<string> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Create journal entry for the payment
        const journalEntry = await this.createPaymentJournalEntry(invoice, payment, bankAccountId);

        // Post to general ledger
        const postingResult = await this.postingService.post(journalEntry);

        // Update debtor balance (payment reduces balance)
        await this.debtorService.updateDebtorBalance(
          invoice.companyId,
          invoice.customerId,
          payment.amount,
          true // This is a payment
        );

        // Update payment record with journal entry reference
        const invoiceRef = doc(db, `companies/${invoice.companyId}/invoices`, invoice.id);
        const updatedPaymentHistory = invoice.paymentHistory?.map(p =>
          p.id === payment.id ? { ...p, journalEntryId: postingResult.journalEntryId } : p
        ) || [];

        transaction.update(invoiceRef, {
          paymentHistory: updatedPaymentHistory,
          updatedAt: serverTimestamp()
        });

        return postingResult.journalEntryId;
      });
    } catch (error) {
      console.error('Error posting payment to GL:', error);
      throw new Error(`Failed to post payment to GL: ${error}`);
    }
  }

  /**
   * Reverse an invoice (create credit note)
   * Creates reversing journal entry
   */
  async reverseInvoice(invoice: Invoice, reason: string): Promise<string> {
    try {
      if (!invoice.journalEntryId) {
        throw new Error('Invoice has not been posted to GL yet');
      }

      // Create reversing journal entry
      const originalEntry = await this.createInvoiceJournalEntry(invoice);
      const reversingEntry: JournalEntry = {
        ...originalEntry,
        id: `reversal-${Date.now()}`,
        reference: `Reversal of ${invoice.invoiceNumber}`,
        description: `Credit note for invoice ${invoice.invoiceNumber} - ${reason}`,
        reversalOf: invoice.journalEntryId,
        lines: originalEntry.lines.map(line => ({
          ...line,
          id: `rev-${line.id}`,
          // Reverse debits and credits
          debit: line.credit,
          credit: line.debit
        }))
      };

      // Post the reversing entry
      const postingResult = await this.postingService.post(reversingEntry);

      // Update debtor balance (reverse the original charge)
      await this.debtorService.updateDebtorBalance(
        invoice.companyId,
        invoice.customerId,
        invoice.totalAmount,
        true // This reverses the charge
      );

      return postingResult.journalEntryId;
    } catch (error) {
      console.error('Error reversing invoice:', error);
      throw new Error(`Failed to reverse invoice: ${error}`);
    }
  }

  /**
   * Create journal entry for invoice
   * DR: Accounts Receivable
   * CR: Revenue accounts (by line item)
   * CR: Tax Payable (if applicable)
   */
  private async createInvoiceJournalEntry(invoice: Invoice): Promise<JournalEntry> {
    const lines: JournalLine[] = [];

    // Collect all account IDs we need to fetch
    const accountIds = new Set<string>([this.options.defaultARAccountId]);
    invoice.lineItems.forEach(item => accountIds.add(item.glAccountId));
    if (this.options.defaultTaxPayableAccountId) {
      accountIds.add(this.options.defaultTaxPayableAccountId);
    }
    if (invoice.taxLines) {
      invoice.taxLines.forEach(taxLine => {
        if (taxLine.glAccountId) accountIds.add(taxLine.glAccountId);
      });
    }

    // Fetch all accounts at once
    const accountMap = new Map<string, { code: string; name: string }>();
    await Promise.all(
      Array.from(accountIds).map(async (accountId) => {
        const account = await this.chartService.getAccount(accountId);
        if (account) {
          accountMap.set(accountId, { code: account.code, name: account.name });
        }
      })
    );

    // Helper to get account info with fallback
    const getAccountInfo = (accountId: string, fallbackCode: string, fallbackName: string) => {
      const account = accountMap.get(accountId);
      return {
        code: account?.code || fallbackCode,
        name: account?.name || fallbackName
      };
    };

    // Create Accounts Receivable debit line
    const arAccount = getAccountInfo(this.options.defaultARAccountId, 'AR', 'Accounts Receivable');
    lines.push({
      id: 'ar-line',
      accountId: this.options.defaultARAccountId,
      accountCode: arAccount.code,
      accountName: arAccount.name,
      description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
      debit: invoice.totalAmount,
      credit: 0,
      currency: invoice.currency,
      exchangeRate: invoice.exchangeRate,
      dimensions: {
        customerId: invoice.customerId,
        invoiceId: invoice.id
      }
    });

    // Create revenue credit lines for each line item
    for (let index = 0; index < invoice.lineItems.length; index++) {
      const lineItem = invoice.lineItems[index];
      const revenueAccount = getAccountInfo(lineItem.glAccountId, lineItem.accountCode || 'REV', 'Revenue');
      lines.push({
        id: `revenue-line-${index + 1}`,
        accountId: lineItem.glAccountId,
        accountCode: revenueAccount.code,
        accountName: revenueAccount.name,
        description: lineItem.description,
        debit: 0,
        credit: lineItem.amount,
        currency: invoice.currency,
        exchangeRate: invoice.exchangeRate,
        dimensions: {
          customerId: invoice.customerId,
          invoiceId: invoice.id,
          lineItemId: lineItem.id
        }
      });
    }

    // Create tax payable credit lines if there are taxes
    if (invoice.taxAmount > 0 && this.options.defaultTaxPayableAccountId) {
      // Use taxLines if available, otherwise create single tax line
      if (invoice.taxLines && invoice.taxLines.length > 0) {
        for (let index = 0; index < invoice.taxLines.length; index++) {
          const taxLine = invoice.taxLines[index];
          const taxAccountId = taxLine.glAccountId || this.options.defaultTaxPayableAccountId;
          const taxAccount = getAccountInfo(taxAccountId, 'TAX', 'Sales Tax Payable');
          lines.push({
            id: `tax-line-${index + 1}`,
            accountId: taxAccountId,
            accountCode: taxAccount.code,
            accountName: taxAccount.name,
            description: `${taxLine.taxName} ${taxLine.taxRate}% - Invoice ${invoice.invoiceNumber}`,
            debit: 0,
            credit: taxLine.taxAmount,
            currency: invoice.currency,
            exchangeRate: invoice.exchangeRate,
            dimensions: {
              customerId: invoice.customerId,
              invoiceId: invoice.id
            }
          });
        }
      } else {
        // Fallback: single tax line with document-level tax
        const taxAccount = getAccountInfo(this.options.defaultTaxPayableAccountId, 'TAX', 'Sales Tax Payable');
        lines.push({
          id: 'tax-line-1',
          accountId: this.options.defaultTaxPayableAccountId,
          accountCode: taxAccount.code,
          accountName: taxAccount.name,
          description: `Sales Tax ${invoice.taxRate}% - Invoice ${invoice.invoiceNumber}`,
          debit: 0,
          credit: invoice.taxAmount,
          currency: invoice.currency,
          exchangeRate: invoice.exchangeRate,
          dimensions: {
            customerId: invoice.customerId,
            invoiceId: invoice.id
          }
        });
      }
    }

    const journalEntry: JournalEntry = {
      id: `invoice-${invoice.id}-${Date.now()}`,
      tenantId: this.options.tenantId,
      fiscalPeriodId: this.options.fiscalPeriodId,
      journalCode: 'AR',
      reference: invoice.invoiceNumber,
      description: `Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
      status: this.options.autoPost ? 'posted' : 'draft',
      source: 'accounts_receivable',
      transactionDate: new Date(invoice.invoiceDate),
      postingDate: this.options.autoPost ? new Date() : undefined,
      createdBy: invoice.createdBy,
      metadata: {
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        source: 'invoice_posting'
      },
      lines,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return journalEntry;
  }

  /**
   * Create journal entry for payment
   * DR: Cash/Bank
   * CR: Accounts Receivable
   */
  private async createPaymentJournalEntry(
    invoice: Invoice,
    payment: InvoicePayment,
    bankAccountId: string
  ): Promise<JournalEntry> {
    const lines: JournalLine[] = [
      // Debit: Cash/Bank account
      {
        id: 'cash-line',
        accountId: bankAccountId,
        accountCode: 'CASH',
        description: `Payment for Invoice ${invoice.invoiceNumber} - ${payment.paymentMethod}`,
        debit: payment.amount,
        credit: 0,
        currency: invoice.currency,
        exchangeRate: invoice.exchangeRate
      },
      // Credit: Accounts Receivable
      {
        id: 'ar-line',
        accountId: this.options.defaultARAccountId,
        accountCode: 'AR',
        description: `Payment for Invoice ${invoice.invoiceNumber} - ${invoice.customerName}`,
        debit: 0,
        credit: payment.amount,
        currency: invoice.currency,
        exchangeRate: invoice.exchangeRate,
        dimensions: {
          customerId: invoice.customerId,
          invoiceId: invoice.id,
          paymentId: payment.id
        }
      }
    ];

    const journalEntry: JournalEntry = {
      id: `payment-${payment.id}-${Date.now()}`,
      tenantId: this.options.tenantId,
      fiscalPeriodId: this.options.fiscalPeriodId,
      journalCode: 'CR',
      reference: payment.reference || `Payment-${payment.id}`,
      description: `Payment for Invoice ${invoice.invoiceNumber} - ${payment.paymentMethod}`,
      status: this.options.autoPost ? 'posted' : 'draft',
      source: 'accounts_receivable',
      transactionDate: new Date(payment.paymentDate),
      postingDate: this.options.autoPost ? new Date() : undefined,
      createdBy: payment.createdBy,
      metadata: {
        invoiceId: invoice.id,
        paymentId: payment.id,
        customerId: invoice.customerId,
        source: 'payment_posting'
      },
      lines,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return journalEntry;
  }

  /**
   * Batch post multiple invoices
   */
  async batchPostInvoices(invoices: Invoice[]): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const invoice of invoices) {
      try {
        await this.postInvoiceToGL(invoice);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to post invoice ${invoice.invoiceNumber}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Get posting status for an invoice
   */
  async getPostingStatus(invoice: Invoice): Promise<{
    isPosted: boolean;
    journalEntryId?: string;
    postedDate?: string;
    canReverse: boolean;
  }> {
    return {
      isPosted: !!invoice.journalEntryId,
      journalEntryId: invoice.journalEntryId,
      postedDate: invoice.postedDate,
      canReverse: !!invoice.journalEntryId && invoice.status !== 'cancelled'
    };
  }
}

/**
 * Factory function to create invoice posting service with company settings
 */
export async function createInvoicePostingService(
  companyId: string,
  options: Partial<InvoicePostingOptions> = {}
): Promise<InvoicePostingService> {
  // These would typically come from company settings
  const defaultOptions: InvoicePostingOptions = {
    tenantId: companyId,
    fiscalPeriodId: 'current', // This should be determined by date
    autoPost: true,
    defaultARAccountId: 'ar-default', // Should come from chart of accounts
    defaultTaxPayableAccountId: 'tax-payable-default',
    ...options
  };

  return new InvoicePostingService(defaultOptions);
}
