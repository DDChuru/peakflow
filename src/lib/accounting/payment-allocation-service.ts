/**
 * Payment Allocation Service
 *
 * Handles complex payment scenarios for Phase 5 of AI Agent:
 * - Multi-invoice payment allocation (split one payment across multiple invoices)
 * - Partial payment allocation (payment covers part of an invoice)
 * - Over-payment handling (create credit notes for excess amounts)
 *
 * Integrates with:
 * - InvoicePostingService for GL posting
 * - DebtorService for customer balance updates
 * - PendingPaymentService for payment tracking
 */

import {
  doc,
  updateDoc,
  serverTimestamp,
  runTransaction,
  arrayUnion
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { InvoicePostingService } from './invoice-posting-service';
import { DebtorService } from '@/lib/firebase/debtor-service';
import { InvoiceService } from '@/lib/accounting/invoice-service';
import { Invoice, InvoicePayment, InvoiceStatus } from '@/types/accounting/invoice';
import { BankTransaction } from '@/types/bank-statement';

export interface PaymentAllocationOptions {
  companyId: string;
  userId: string;
  fiscalPeriodId: string;
  arAccountId: string; // Accounts Receivable GL account
  bankAccountId: string; // Bank account for payment
  taxPayableAccountId?: string;
}

export interface MultiInvoiceAllocation {
  invoiceId: string;
  invoiceNumber: string;
  amount: number; // Amount to allocate to this invoice
}

export interface PartialPaymentAllocation {
  invoiceId: string;
  amount: number; // Amount being paid (less than invoice total)
  remainingAmount: number; // Amount still due after this payment
}

export interface AllocationResult {
  success: boolean;
  message: string;
  invoicesUpdated: string[];
  journalEntryIds: string[];
  creditNoteId?: string;
  error?: string;
}

export class PaymentAllocationService {
  private invoicePostingService: InvoicePostingService;
  private debtorService: DebtorService;
  private invoiceService: InvoiceService;

  constructor(private readonly options: PaymentAllocationOptions) {
    this.invoicePostingService = new InvoicePostingService({
      tenantId: options.companyId,
      fiscalPeriodId: options.fiscalPeriodId,
      autoPost: true,
      defaultARAccountId: options.arAccountId,
      defaultTaxPayableAccountId: options.taxPayableAccountId
    });
    this.debtorService = new DebtorService();
    this.invoiceService = new InvoiceService();
  }

  /**
   * Allocate one payment across multiple invoices
   *
   * Example: R7500 payment covers INV-001 (R3500) + INV-002 (R4000)
   *
   * @param transaction - Bank transaction
   * @param allocations - Array of invoice allocations
   * @returns AllocationResult with success status and updated invoices
   */
  async allocateMultiInvoicePayment(
    transaction: BankTransaction,
    allocations: MultiInvoiceAllocation[]
  ): Promise<AllocationResult> {
    try {
      const invoicesUpdated: string[] = [];
      const journalEntryIds: string[] = [];

      // Validate total allocation matches transaction amount
      const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      const transactionAmount = transaction.credit || 0;

      if (Math.abs(totalAllocated - transactionAmount) > 0.01) {
        return {
          success: false,
          message: `Allocation total (R${totalAllocated.toFixed(2)}) doesn't match payment amount (R${transactionAmount.toFixed(2)})`,
          invoicesUpdated: [],
          journalEntryIds: [],
          error: 'ALLOCATION_MISMATCH'
        };
      }

      // Process each invoice allocation in a transaction
      await runTransaction(db, async (txn) => {
        for (const allocation of allocations) {
          // Get invoice
          const invoice = await this.invoiceService.getInvoice(
            this.options.companyId,
            allocation.invoiceId
          );

          if (!invoice) {
            throw new Error(`Invoice ${allocation.invoiceNumber} not found`);
          }

          // Create payment record
          const payment: InvoicePayment = {
            id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            invoiceId: invoice.id,
            paymentDate: transaction.date,
            amount: allocation.amount,
            paymentMethod: 'bank_transfer',
            reference: transaction.reference || transaction.description,
            notes: `Multi-invoice payment allocation (${allocations.length} invoices total)`,
            bankStatementLineId: transaction.id,
            createdAt: new Date(),
            createdBy: this.options.userId
          };

          // Post payment to GL
          const journalEntryId = await this.invoicePostingService.postPaymentToGL(
            invoice,
            payment,
            this.options.bankAccountId
          );

          payment.journalEntryId = journalEntryId;
          journalEntryIds.push(journalEntryId);

          // Update invoice with payment
          const newAmountPaid = (invoice.amountPaid || 0) + allocation.amount;
          const newAmountDue = invoice.totalAmount - newAmountPaid;
          const newStatus: InvoiceStatus = newAmountDue <= 0.01 ? 'paid' : 'partial';

          const invoiceRef = doc(db, `companies/${this.options.companyId}/invoices`, invoice.id);
          txn.update(invoiceRef, {
            amountPaid: newAmountPaid,
            amountDue: newAmountDue,
            status: newStatus,
            paymentHistory: arrayUnion(payment),
            updatedAt: serverTimestamp(),
            modifiedBy: this.options.userId
          });

          invoicesUpdated.push(invoice.invoiceNumber);
        }
      });

      return {
        success: true,
        message: `✅ Payment of R${transactionAmount.toFixed(2)} allocated across ${allocations.length} invoices`,
        invoicesUpdated,
        journalEntryIds
      };

    } catch (error: any) {
      console.error('[PaymentAllocationService] Multi-invoice allocation error:', error);
      return {
        success: false,
        message: `Failed to allocate payment: ${error.message}`,
        invoicesUpdated: [],
        journalEntryIds: [],
        error: error.message
      };
    }
  }

  /**
   * Allocate partial payment to an invoice
   *
   * Example: R5000 payment on R10000 invoice (50% paid, R5000 remaining)
   *
   * @param transaction - Bank transaction
   * @param allocation - Partial payment allocation details
   * @returns AllocationResult with success status
   */
  async allocatePartialPayment(
    transaction: BankTransaction,
    allocation: PartialPaymentAllocation
  ): Promise<AllocationResult> {
    try {
      const journalEntryIds: string[] = [];

      // Get invoice
      const invoice = await this.invoiceService.getInvoice(
        this.options.companyId,
        allocation.invoiceId
      );

      if (!invoice) {
        return {
          success: false,
          message: `Invoice not found`,
          invoicesUpdated: [],
          journalEntryIds: [],
          error: 'INVOICE_NOT_FOUND'
        };
      }

      // Validate payment amount
      const transactionAmount = transaction.credit || 0;
      if (Math.abs(allocation.amount - transactionAmount) > 0.01) {
        return {
          success: false,
          message: `Payment amount (R${transactionAmount.toFixed(2)}) doesn't match allocation (R${allocation.amount.toFixed(2)})`,
          invoicesUpdated: [],
          journalEntryIds: [],
          error: 'AMOUNT_MISMATCH'
        };
      }

      // Validate partial payment (must be less than invoice total)
      if (allocation.amount >= invoice.amountDue) {
        return {
          success: false,
          message: `Payment amount (R${allocation.amount.toFixed(2)}) is not less than amount due (R${invoice.amountDue.toFixed(2)}). Use full payment instead.`,
          invoicesUpdated: [],
          journalEntryIds: [],
          error: 'NOT_PARTIAL_PAYMENT'
        };
      }

      // Process partial payment in a transaction
      await runTransaction(db, async (txn) => {
        // Create payment record
        const percentage = (allocation.amount / invoice.totalAmount) * 100;
        const payment: InvoicePayment = {
          id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          invoiceId: invoice.id,
          paymentDate: transaction.date,
          amount: allocation.amount,
          paymentMethod: 'bank_transfer',
          reference: transaction.reference || transaction.description,
          notes: `Partial payment (${percentage.toFixed(1)}% of invoice). Remaining: R${allocation.remainingAmount.toFixed(2)}`,
          bankStatementLineId: transaction.id,
          createdAt: new Date(),
          createdBy: this.options.userId
        };

        // Post payment to GL
        const journalEntryId = await this.invoicePostingService.postPaymentToGL(
          invoice,
          payment,
          this.options.bankAccountId
        );

        payment.journalEntryId = journalEntryId;
        journalEntryIds.push(journalEntryId);

        // Update invoice with partial payment
        const newAmountPaid = (invoice.amountPaid || 0) + allocation.amount;
        const newAmountDue = invoice.totalAmount - newAmountPaid;

        const invoiceRef = doc(db, `companies/${this.options.companyId}/invoices`, invoice.id);
        txn.update(invoiceRef, {
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: 'partial' as InvoiceStatus,
          paymentHistory: arrayUnion(payment),
          updatedAt: serverTimestamp(),
          modifiedBy: this.options.userId
        });
      });

      const percentage = (allocation.amount / invoice.totalAmount) * 100;

      return {
        success: true,
        message: `✅ Partial payment of R${allocation.amount.toFixed(2)} (${percentage.toFixed(1)}%) applied to ${invoice.invoiceNumber}. Remaining: R${allocation.remainingAmount.toFixed(2)}`,
        invoicesUpdated: [invoice.invoiceNumber],
        journalEntryIds
      };

    } catch (error: any) {
      console.error('[PaymentAllocationService] Partial payment allocation error:', error);
      return {
        success: false,
        message: `Failed to allocate partial payment: ${error.message}`,
        invoicesUpdated: [],
        journalEntryIds: [],
        error: error.message
      };
    }
  }

  /**
   * Handle over-payment by creating a credit note for the excess
   *
   * Example: R10500 payment on R10000 invoice → R500 credit note created
   *
   * @param transaction - Bank transaction
   * @param invoiceId - Invoice being overpaid
   * @param excessAmount - Amount over the invoice total
   * @returns AllocationResult with credit note ID
   */
  async handleOverPayment(
    transaction: BankTransaction,
    invoiceId: string,
    excessAmount: number
  ): Promise<AllocationResult> {
    try {
      // Phase 7 Integration: Create credit note for over-payment
      const { createCreditNoteService } = await import('./credit-note-service');

      const invoice = await this.invoiceService.getInvoice(
        this.options.companyId,
        invoiceId
      );

      if (!invoice) {
        return {
          success: false,
          message: `Invoice not found`,
          invoicesUpdated: [],
          journalEntryIds: [],
          error: 'INVOICE_NOT_FOUND'
        };
      }

      const transactionAmount = transaction.credit || 0;
      const invoiceAmount = invoice.amountDue;

      // Apply full invoice payment + create credit note for excess
      const journalEntryIds: string[] = [];

      await runTransaction(db, async (txn) => {
        // Create payment record for invoice amount
        const payment: InvoicePayment = {
          id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          invoiceId: invoice.id,
          paymentDate: transaction.date,
          amount: invoiceAmount,
          paymentMethod: 'bank_transfer',
          reference: transaction.reference || transaction.description,
          notes: `Over-payment: R${excessAmount.toFixed(2)} excess converted to credit note`,
          bankStatementLineId: transaction.id,
          createdAt: new Date(),
          createdBy: this.options.userId
        };

        // Post payment to GL
        const journalEntryId = await this.invoicePostingService.postPaymentToGL(
          invoice,
          payment,
          this.options.bankAccountId
        );

        payment.journalEntryId = journalEntryId;
        journalEntryIds.push(journalEntryId);

        // Update invoice to paid status
        const invoiceRef = doc(db, `companies/${this.options.companyId}/invoices`, invoice.id);
        txn.update(invoiceRef, {
          amountPaid: invoice.totalAmount,
          amountDue: 0,
          status: 'paid' as InvoiceStatus,
          paymentHistory: arrayUnion(payment),
          updatedAt: serverTimestamp(),
          modifiedBy: this.options.userId
        });
      });

      // Phase 7: Create credit note for over-payment
      const creditNoteService = createCreditNoteService(
        this.options.companyId,
        this.options.userId,
        this.options.fiscalPeriodId
      );

      const creditNoteResult = await creditNoteService.createCreditNoteFromOverPayment({
        customerId: invoice.debtorId,
        transactionId: transaction.id,
        invoiceId: invoice.id,
        invoiceAmount: invoice.totalAmount,
        paymentAmount: transactionAmount,
        excessAmount,
        paymentDate: transaction.date,
        paymentReference: transaction.reference || transaction.description,
        notes: `Automatically created from over-payment on ${invoice.invoiceNumber}`,
      });

      let creditNoteId: string | undefined;
      if (creditNoteResult.success && creditNoteResult.creditNoteId) {
        creditNoteId = creditNoteResult.creditNoteId;
        console.log(`✅ Credit note ${creditNoteId} created for R${excessAmount.toFixed(2)} over-payment`);
      }

      return {
        success: true,
        message: `✅ Invoice ${invoice.invoiceNumber} paid in full. Credit note created for R${excessAmount.toFixed(2)} excess (customer credit balance)`,
        invoicesUpdated: [invoice.invoiceNumber],
        journalEntryIds,
        creditNoteId
      };

    } catch (error: any) {
      console.error('[PaymentAllocationService] Over-payment handling error:', error);
      return {
        success: false,
        message: `Failed to handle over-payment: ${error.message}`,
        invoicesUpdated: [],
        journalEntryIds: [],
        error: error.message
      };
    }
  }

  /**
   * Full payment allocation (simple case - one payment, one invoice, exact match)
   *
   * @param transaction - Bank transaction
   * @param invoiceId - Invoice to pay
   * @returns AllocationResult
   */
  async allocateFullPayment(
    transaction: BankTransaction,
    invoiceId: string
  ): Promise<AllocationResult> {
    try {
      const invoice = await this.invoiceService.getInvoice(
        this.options.companyId,
        invoiceId
      );

      if (!invoice) {
        return {
          success: false,
          message: `Invoice not found`,
          invoicesUpdated: [],
          journalEntryIds: [],
          error: 'INVOICE_NOT_FOUND'
        };
      }

      const transactionAmount = transaction.credit || 0;
      const journalEntryIds: string[] = [];

      await runTransaction(db, async (txn) => {
        // Create payment record
        const payment: InvoicePayment = {
          id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          invoiceId: invoice.id,
          paymentDate: transaction.date,
          amount: transactionAmount,
          paymentMethod: 'bank_transfer',
          reference: transaction.reference || transaction.description,
          bankStatementLineId: transaction.id,
          createdAt: new Date(),
          createdBy: this.options.userId
        };

        // Post payment to GL
        const journalEntryId = await this.invoicePostingService.postPaymentToGL(
          invoice,
          payment,
          this.options.bankAccountId
        );

        payment.journalEntryId = journalEntryId;
        journalEntryIds.push(journalEntryId);

        // Update invoice to paid
        const invoiceRef = doc(db, `companies/${this.options.companyId}/invoices`, invoice.id);
        txn.update(invoiceRef, {
          amountPaid: invoice.totalAmount,
          amountDue: 0,
          status: 'paid' as InvoiceStatus,
          paymentHistory: arrayUnion(payment),
          updatedAt: serverTimestamp(),
          modifiedBy: this.options.userId
        });
      });

      return {
        success: true,
        message: `✅ Invoice ${invoice.invoiceNumber} paid in full (R${transactionAmount.toFixed(2)})`,
        invoicesUpdated: [invoice.invoiceNumber],
        journalEntryIds
      };

    } catch (error: any) {
      console.error('[PaymentAllocationService] Full payment allocation error:', error);
      return {
        success: false,
        message: `Failed to allocate payment: ${error.message}`,
        invoicesUpdated: [],
        journalEntryIds: [],
        error: error.message
      };
    }
  }
}

/**
 * Singleton factory for PaymentAllocationService
 */
export function createPaymentAllocationService(
  options: PaymentAllocationOptions
): PaymentAllocationService {
  return new PaymentAllocationService(options);
}
