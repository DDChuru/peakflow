/**
 * Vendor Bill Posting Service
 * Phase 2: Accounts Payable - GL Integration
 *
 * Handles posting vendor bills and payments to the General Ledger
 */

import {
  doc,
  updateDoc,
  serverTimestamp,
  runTransaction,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PostingService } from './posting-service';
import { CreditorService } from '@/lib/firebase/creditor-service';
import { ChartOfAccountsService } from './chart-of-accounts-service';
import type { VendorBill } from '@/types/accounting/vendor-bill';
import type { Payment } from '@/types/accounting/payment';
import type { JournalEntry, JournalLine } from '@/types/accounting/journal';

interface VendorBillPostingOptions {
  tenantId: string;
  fiscalPeriodId: string;
  autoPost?: boolean; // Whether to immediately post to GL
  defaultAPAccountId: string; // Accounts Payable account (2100)
  defaultTaxReceivableAccountId?: string; // Input Tax/VAT Receivable account
}

export class VendorBillPostingService {
  private postingService: PostingService;
  private creditorService: CreditorService;
  private chartService: ChartOfAccountsService;

  constructor(private readonly options: VendorBillPostingOptions) {
    this.postingService = new PostingService({
      tenantId: options.tenantId,
      allowBackdatedPosting: true,
    });
    this.creditorService = new CreditorService();
    this.chartService = new ChartOfAccountsService();
  }

  /**
   * Post vendor bill to General Ledger
   * Creates journal entry with:
   * - Debit: Expense accounts (from line items)
   * - Debit: Tax Receivable (if applicable)
   * - Credit: Accounts Payable (vendor balance)
   */
  async postBillToGL(bill: VendorBill, userId: string): Promise<string> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Create journal entry for the bill
        const journalEntry = await this.createBillJournalEntry(bill, userId);

        // Post to general ledger
        const postingResult = await this.postingService.post(journalEntry);

        // Update creditor balance (bill increases amount owed)
        await this.creditorService.updateCreditorBalance(
          bill.companyId,
          bill.vendorId,
          bill.totalAmount,
          false // This is a bill, not a payment
        );

        // Update bill with journal entry reference
        const billRef = doc(
          db,
          `companies/${bill.companyId}/vendorBills`,
          bill.id
        );
        transaction.update(billRef, {
          journalEntryId: postingResult.journalEntryId,
          glPosted: true,
          glPostingDate: Timestamp.fromDate(new Date()),
          glPostedBy: userId,
          fiscalPeriodId: this.options.fiscalPeriodId,
          status: 'posted',
          updatedAt: Timestamp.fromDate(new Date()),
          updatedBy: userId,
        });

        console.log('✅ [VendorBillPostingService] Posted bill to GL:', bill.billNumber);

        return postingResult.journalEntryId;
      });
    } catch (error: any) {
      console.error('❌ [VendorBillPostingService] Error posting bill:', error);
      throw new Error(`Failed to post bill to GL: ${error.message}`);
    }
  }

  /**
   * Post vendor payment to General Ledger
   * Creates journal entry with:
   * - Debit: Accounts Payable (reduces vendor balance)
   * - Credit: Cash/Bank account
   */
  async postPaymentToGL(payment: Payment, userId: string): Promise<string> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Create journal entry for the payment
        const journalEntry = await this.createPaymentJournalEntry(payment, userId);

        // Post to general ledger
        const postingResult = await this.postingService.post(journalEntry);

        // Update creditor balance (payment reduces amount owed)
        await this.creditorService.updateCreditorBalance(
          payment.companyId,
          payment.vendorId,
          payment.amount,
          true // This is a payment
        );

        // Update payment with journal entry reference
        const paymentRef = doc(
          db,
          `companies/${payment.companyId}/vendorPayments`,
          payment.id
        );
        transaction.update(paymentRef, {
          journalEntryId: postingResult.journalEntryId,
          glPosted: true,
          glPostingDate: Timestamp.fromDate(new Date()),
          glPostedBy: userId,
          fiscalPeriodId: this.options.fiscalPeriodId,
          status: 'posted',
          updatedAt: Timestamp.fromDate(new Date()),
          updatedBy: userId,
        });

        console.log('✅ [VendorBillPostingService] Posted payment to GL:', payment.paymentNumber);

        return postingResult.journalEntryId;
      });
    } catch (error: any) {
      console.error('❌ [VendorBillPostingService] Error posting payment:', error);
      throw new Error(`Failed to post payment to GL: ${error.message}`);
    }
  }

  /**
   * Void vendor payment (creates reversal journal entry)
   * Creates journal entry with:
   * - Debit: Cash/Bank account (reverses payment)
   * - Credit: Accounts Payable (restores vendor balance)
   */
  async voidPaymentToGL(payment: Payment, voidReason: string, userId: string): Promise<string> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Create reversal journal entry
        const journalEntry = await this.createPaymentReversalJournalEntry(
          payment,
          voidReason,
          userId
        );

        // Post reversal to general ledger
        const postingResult = await this.postingService.post(journalEntry);

        // Restore creditor balance (void reverses the payment)
        await this.creditorService.updateCreditorBalance(
          payment.companyId,
          payment.vendorId,
          payment.amount,
          false // Void reverses payment, so it's like a bill
        );

        // Update payment as voided
        const paymentRef = doc(
          db,
          `companies/${payment.companyId}/vendorPayments`,
          payment.id
        );
        transaction.update(paymentRef, {
          voidJournalEntryId: postingResult.journalEntryId,
          status: 'void',
          voidedAt: Timestamp.fromDate(new Date()),
          voidedBy: userId,
          voidReason: voidReason,
          updatedAt: Timestamp.fromDate(new Date()),
          updatedBy: userId,
        });

        console.log('✅ [VendorBillPostingService] Voided payment:', payment.paymentNumber);

        return postingResult.journalEntryId;
      });
    } catch (error: any) {
      console.error('❌ [VendorBillPostingService] Error voiding payment:', error);
      throw new Error(`Failed to void payment: ${error.message}`);
    }
  }

  /**
   * Create journal entry for vendor bill
   */
  private async createBillJournalEntry(bill: VendorBill, userId: string): Promise<JournalEntry> {
    const lines: JournalLine[] = [];

    // Fetch account names from chart of accounts
    const accountCodes = [
      ...bill.lineItems.map((item) => item.glAccountCode),
      this.options.defaultAPAccountId,
    ];
    const accountsMap = await this.chartService.getAccountsByCodesBatch(
      this.options.tenantId,
      accountCodes
    );

    // Debit expense accounts (from line items)
    for (const item of bill.lineItems) {
      const account = accountsMap.get(item.glAccountCode);
      lines.push({
        accountCode: item.glAccountCode,
        accountName: account?.name || item.glAccountName || '',
        debit: item.amount,
        credit: 0,
        description: `${bill.vendorName} - ${item.description}`,
        dimensions: {
          vendorId: bill.vendorId,
          vendorBillId: bill.id,
        },
      });

      // Debit tax receivable if applicable
      if (item.taxAmount && item.taxAmount > 0 && this.options.defaultTaxReceivableAccountId) {
        const taxAccount = accountsMap.get(this.options.defaultTaxReceivableAccountId);
        lines.push({
          accountCode: this.options.defaultTaxReceivableAccountId,
          accountName: taxAccount?.name || 'Input Tax',
          debit: item.taxAmount,
          credit: 0,
          description: `Input VAT - ${bill.vendorName}`,
          dimensions: {
            vendorId: bill.vendorId,
            vendorBillId: bill.id,
          },
        });
      }
    }

    // Credit accounts payable
    const apAccount = accountsMap.get(this.options.defaultAPAccountId);
    lines.push({
      accountCode: this.options.defaultAPAccountId,
      accountName: apAccount?.name || 'Accounts Payable',
      debit: 0,
      credit: bill.totalAmount,
      description: `Bill ${bill.billNumber} - ${bill.vendorName}`,
      dimensions: {
        vendorId: bill.vendorId,
        vendorBillId: bill.id,
      },
    });

    const journalEntry: JournalEntry = {
      tenantId: this.options.tenantId,
      fiscalPeriodId: this.options.fiscalPeriodId,
      entryDate: bill.billDate,
      source: 'AP_BILL',
      sourceId: bill.id,
      description: `Vendor Bill ${bill.billNumber} - ${bill.vendorName}`,
      reference: bill.vendorBillNumber,
      lines,
      status: 'posted',
      createdBy: userId,
      createdAt: new Date(),
      totalDebit: bill.totalAmount,
      totalCredit: bill.totalAmount,
    };

    return journalEntry;
  }

  /**
   * Create journal entry for vendor payment
   */
  private async createPaymentJournalEntry(
    payment: Payment,
    userId: string
  ): Promise<JournalEntry> {
    const lines: JournalLine[] = [];

    // Fetch account names
    const accountCodes = [
      this.options.defaultAPAccountId,
      payment.bankAccountId,
    ];
    const accountsMap = await this.chartService.getAccountsByCodesBatch(
      this.options.tenantId,
      accountCodes
    );

    // Debit accounts payable (reduces vendor balance)
    const apAccount = accountsMap.get(this.options.defaultAPAccountId);
    lines.push({
      accountCode: this.options.defaultAPAccountId,
      accountName: apAccount?.name || 'Accounts Payable',
      debit: payment.amount,
      credit: 0,
      description: `Payment ${payment.paymentNumber} - ${payment.vendorName}`,
      dimensions: {
        vendorId: payment.vendorId,
        paymentId: payment.id,
      },
    });

    // Credit bank/cash account
    const bankAccount = accountsMap.get(payment.bankAccountId);
    lines.push({
      accountCode: payment.bankAccountId,
      accountName: bankAccount?.name || payment.bankAccountName || 'Bank Account',
      debit: 0,
      credit: payment.amount,
      description: `${payment.paymentMethod.toUpperCase()} Payment to ${payment.vendorName}${
        payment.checkNumber ? ` - Check #${payment.checkNumber}` : ''
      }${payment.referenceNumber ? ` - Ref: ${payment.referenceNumber}` : ''}`,
      dimensions: {
        vendorId: payment.vendorId,
        paymentId: payment.id,
      },
    });

    const journalEntry: JournalEntry = {
      tenantId: this.options.tenantId,
      fiscalPeriodId: this.options.fiscalPeriodId,
      entryDate: payment.paymentDate,
      source: 'AP_PAYMENT',
      sourceId: payment.id,
      description: `Vendor Payment ${payment.paymentNumber} - ${payment.vendorName}`,
      reference: payment.checkNumber || payment.referenceNumber || '',
      lines,
      status: 'posted',
      createdBy: userId,
      createdAt: new Date(),
      totalDebit: payment.amount,
      totalCredit: payment.amount,
    };

    return journalEntry;
  }

  /**
   * Create reversal journal entry for voided payment
   */
  private async createPaymentReversalJournalEntry(
    payment: Payment,
    voidReason: string,
    userId: string
  ): Promise<JournalEntry> {
    const lines: JournalLine[] = [];

    // Fetch account names
    const accountCodes = [
      this.options.defaultAPAccountId,
      payment.bankAccountId,
    ];
    const accountsMap = await this.chartService.getAccountsByCodesBatch(
      this.options.tenantId,
      accountCodes
    );

    // Debit bank/cash account (reverses payment)
    const bankAccount = accountsMap.get(payment.bankAccountId);
    lines.push({
      accountCode: payment.bankAccountId,
      accountName: bankAccount?.name || payment.bankAccountName || 'Bank Account',
      debit: payment.amount,
      credit: 0,
      description: `VOID - ${payment.paymentMethod.toUpperCase()} Payment ${payment.paymentNumber} - ${voidReason}`,
      dimensions: {
        vendorId: payment.vendorId,
        paymentId: payment.id,
      },
    });

    // Credit accounts payable (restores vendor balance)
    const apAccount = accountsMap.get(this.options.defaultAPAccountId);
    lines.push({
      accountCode: this.options.defaultAPAccountId,
      accountName: apAccount?.name || 'Accounts Payable',
      debit: 0,
      credit: payment.amount,
      description: `VOID - Payment ${payment.paymentNumber} to ${payment.vendorName} - ${voidReason}`,
      dimensions: {
        vendorId: payment.vendorId,
        paymentId: payment.id,
      },
    });

    const journalEntry: JournalEntry = {
      tenantId: this.options.tenantId,
      fiscalPeriodId: this.options.fiscalPeriodId,
      entryDate: new Date(),
      source: 'AP_PAYMENT_VOID',
      sourceId: payment.id,
      description: `VOID Vendor Payment ${payment.paymentNumber} - ${voidReason}`,
      reference: `VOID-${payment.paymentNumber}`,
      lines,
      status: 'posted',
      createdBy: userId,
      createdAt: new Date(),
      totalDebit: payment.amount,
      totalCredit: payment.amount,
    };

    return journalEntry;
  }
}

/**
 * Factory function to create VendorBillPostingService instance
 */
export function createVendorBillPostingService(
  options: VendorBillPostingOptions
): VendorBillPostingService {
  return new VendorBillPostingService(options);
}
