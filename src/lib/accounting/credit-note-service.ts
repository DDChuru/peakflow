/**
 * Credit Note Service
 *
 * Comprehensive service for managing sales and purchase credit notes
 * with allocation, GL posting, and integration with AR/AP systems.
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
  writeBatch,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  SalesCreditNote,
  PurchaseCreditNote,
  CreditNote,
  CreditNoteLineItem,
  CreditNoteAllocation,
  CreateSalesCreditNoteRequest,
  CreatePurchaseCreditNoteRequest,
  AllocateCreditNoteRequest,
  MultiDocumentAllocationRequest,
  CreditNoteServiceResult,
  CreditAllocationResult,
  CreditNoteQueryFilters,
  CreditNoteSummary,
  CreateCreditNoteFromOverPaymentRequest,
  OverPaymentCreditNoteResult,
} from '@/types/accounting/credit-note';
import { InvoicePostingService } from './invoice-posting-service';
import { DebtorService } from '@/lib/firebase/debtor-service';
import { CreditorService } from '@/lib/firebase/creditor-service';
import { InvoiceService } from './invoice-service';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate credit note number
 */
function generateCreditNoteNumber(type: 'sales' | 'purchase'): string {
  const prefix = type === 'sales' ? 'CN' : 'PCN';
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate line item amounts
 */
function calculateLineItemAmounts(
  quantity: number,
  unitPrice: number,
  taxRate: number
): { amount: number; taxAmount: number; totalAmount: number } {
  const amount = quantity * unitPrice;
  const taxAmount = (amount * taxRate) / 100;
  const totalAmount = amount + taxAmount;

  return {
    amount: Number(amount.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
  };
}

// ============================================================================
// CREDIT NOTE SERVICE CLASS
// ============================================================================

export class CreditNoteService {
  private postingService: InvoicePostingService;
  private debtorService: DebtorService;
  private creditorService: CreditorService;
  private invoiceService: InvoiceService;

  constructor(
    private companyId: string,
    private userId: string,
    private fiscalPeriodId: string
  ) {
    this.postingService = new InvoicePostingService(companyId, fiscalPeriodId, userId);
    this.debtorService = new DebtorService(companyId);
    this.creditorService = new CreditorService(companyId);
    this.invoiceService = new InvoiceService(companyId);
  }

  // ==========================================================================
  // SALES CREDIT NOTE OPERATIONS
  // ==========================================================================

  /**
   * Create sales credit note (to customer)
   */
  async createSalesCreditNote(
    request: CreateSalesCreditNoteRequest
  ): Promise<CreditNoteServiceResult> {
    try {
      console.log('🔴 [CreditNoteService] Creating sales credit note', {
        customerId: request.customerId,
      });

      // Get customer
      const customer = await this.debtorService.getDebtor(request.customerId);
      if (!customer) {
        return {
          success: false,
          message: 'Customer not found',
          error: 'CUSTOMER_NOT_FOUND',
        };
      }

      // Calculate line items
      const lineItems: CreditNoteLineItem[] = request.lineItems.map((item) => {
        const amounts = calculateLineItemAmounts(
          item.quantity,
          item.unitPrice,
          request.taxRate
        );

        return {
          id: generateId(),
          ...item,
          taxRate: request.taxRate,
          ...amounts,
        };
      });

      // Calculate totals
      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
      const totalAmount = lineItems.reduce((sum, item) => sum + item.totalAmount, 0);

      // Create credit note
      const creditNote: SalesCreditNote = {
        id: generateId(),
        companyId: this.companyId,
        type: 'sales',
        creditNoteNumber: generateCreditNoteNumber('sales'),
        creditNoteDate: request.creditNoteDate,
        status: 'draft',
        reason: request.reason,
        reasonDescription: request.reasonDescription,
        customerId: request.customerId,
        customerName: customer.name,
        customerEmail: customer.email,
        customerAddress: customer.address,
        originalInvoiceId: request.originalInvoiceId,
        lineItems,
        subtotal,
        taxRate: request.taxRate,
        taxAmount,
        totalAmount,
        allocationStatus: 'unallocated',
        amountAllocated: 0,
        amountUnallocated: totalAmount,
        allocations: [],
        glPosted: false,
        createdBy: this.userId,
        createdAt: new Date(),
        notes: request.notes,
        internalNotes: request.internalNotes,
        firestoreCreatedAt: Timestamp.now(),
        firestoreUpdatedAt: Timestamp.now(),
      };

      // If created from an invoice, link it
      if (request.originalInvoiceId) {
        const invoiceDoc = await getDoc(
          doc(db, 'companies', this.companyId, 'invoices', request.originalInvoiceId)
        );
        if (invoiceDoc.exists()) {
          const invoice = invoiceDoc.data();
          creditNote.originalInvoiceNumber = invoice.invoiceNumber;
          creditNote.originalInvoiceDate = (invoice.invoiceDate as Timestamp).toDate();
        }
      }

      // Save to Firestore
      const creditNoteRef = doc(
        db,
        'companies',
        this.companyId,
        'creditNotes',
        creditNote.id
      );

      await writeBatch(db)
        .set(creditNoteRef, {
          ...creditNote,
          creditNoteDate: Timestamp.fromDate(creditNote.creditNoteDate),
          createdAt: Timestamp.fromDate(creditNote.createdAt),
          originalInvoiceDate: creditNote.originalInvoiceDate
            ? Timestamp.fromDate(creditNote.originalInvoiceDate)
            : null,
        })
        .commit();

      console.log('✅ [CreditNoteService] Sales credit note created', {
        creditNoteId: creditNote.id,
        creditNoteNumber: creditNote.creditNoteNumber,
      });

      return {
        success: true,
        message: `Credit note ${creditNote.creditNoteNumber} created successfully`,
        creditNoteId: creditNote.id,
        creditNote,
      };
    } catch (error: any) {
      console.error('❌ [CreditNoteService] Error creating sales credit note:', error);
      return {
        success: false,
        message: 'Failed to create credit note',
        error: error.message,
      };
    }
  }

  /**
   * Create purchase credit note (from supplier)
   */
  async createPurchaseCreditNote(
    request: CreatePurchaseCreditNoteRequest
  ): Promise<CreditNoteServiceResult> {
    try {
      console.log('🟣 [CreditNoteService] Creating purchase credit note', {
        supplierId: request.supplierId,
      });

      // Get supplier
      const supplier = await this.creditorService.getCreditor(request.supplierId);
      if (!supplier) {
        return {
          success: false,
          message: 'Supplier not found',
          error: 'SUPPLIER_NOT_FOUND',
        };
      }

      // Calculate line items
      const lineItems: CreditNoteLineItem[] = request.lineItems.map((item) => {
        const amounts = calculateLineItemAmounts(
          item.quantity,
          item.unitPrice,
          request.taxRate
        );

        return {
          id: generateId(),
          ...item,
          taxRate: request.taxRate,
          ...amounts,
        };
      });

      // Calculate totals
      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
      const totalAmount = lineItems.reduce((sum, item) => sum + item.totalAmount, 0);

      // Create credit note
      const creditNote: PurchaseCreditNote = {
        id: generateId(),
        companyId: this.companyId,
        type: 'purchase',
        creditNoteNumber: generateCreditNoteNumber('purchase'),
        supplierCreditNoteRef: request.supplierCreditNoteRef,
        creditNoteDate: request.creditNoteDate,
        receivedDate: request.receivedDate,
        status: 'draft',
        reason: request.reason,
        reasonDescription: request.reasonDescription,
        supplierId: request.supplierId,
        supplierName: supplier.name,
        supplierEmail: supplier.email,
        supplierAddress: supplier.address,
        originalBillId: request.originalBillId,
        lineItems,
        subtotal,
        taxRate: request.taxRate,
        taxAmount,
        totalAmount,
        allocationStatus: 'unallocated',
        amountAllocated: 0,
        amountUnallocated: totalAmount,
        allocations: [],
        glPosted: false,
        createdBy: this.userId,
        createdAt: new Date(),
        notes: request.notes,
        internalNotes: request.internalNotes,
        firestoreCreatedAt: Timestamp.now(),
        firestoreUpdatedAt: Timestamp.now(),
      };

      // Save to Firestore
      const creditNoteRef = doc(
        db,
        'companies',
        this.companyId,
        'creditNotes',
        creditNote.id
      );

      await writeBatch(db)
        .set(creditNoteRef, {
          ...creditNote,
          creditNoteDate: Timestamp.fromDate(creditNote.creditNoteDate),
          receivedDate: Timestamp.fromDate(creditNote.receivedDate),
          createdAt: Timestamp.fromDate(creditNote.createdAt),
        })
        .commit();

      console.log('✅ [CreditNoteService] Purchase credit note created', {
        creditNoteId: creditNote.id,
        creditNoteNumber: creditNote.creditNoteNumber,
      });

      return {
        success: true,
        message: `Credit note ${creditNote.creditNoteNumber} created successfully`,
        creditNoteId: creditNote.id,
        creditNote,
      };
    } catch (error: any) {
      console.error('❌ [CreditNoteService] Error creating purchase credit note:', error);
      return {
        success: false,
        message: 'Failed to create credit note',
        error: error.message,
      };
    }
  }

  // ==========================================================================
  // CREDIT NOTE ALLOCATION
  // ==========================================================================

  /**
   * Allocate credit note to invoice/bill
   */
  async allocateCreditNote(
    request: AllocateCreditNoteRequest
  ): Promise<CreditAllocationResult> {
    try {
      console.log('💰 [CreditNoteService] Allocating credit note', {
        creditNoteId: request.creditNoteId,
        documentId: request.documentId,
        amount: request.amountToAllocate,
      });

      return await runTransaction(db, async (transaction) => {
        // Get credit note
        const creditNoteRef = doc(
          db,
          'companies',
          this.companyId,
          'creditNotes',
          request.creditNoteId
        );
        const creditNoteDoc = await transaction.get(creditNoteRef);

        if (!creditNoteDoc.exists()) {
          throw new Error('Credit note not found');
        }

        const creditNote = creditNoteDoc.data() as CreditNote;

        // Validate allocation amount
        if (request.amountToAllocate > creditNote.amountUnallocated) {
          throw new Error(
            `Cannot allocate ${request.amountToAllocate}. Only ${creditNote.amountUnallocated} available.`
          );
        }

        // Get document (invoice or bill)
        const documentRef = doc(
          db,
          'companies',
          this.companyId,
          request.documentType === 'invoice' ? 'invoices' : 'bills',
          request.documentId
        );
        const documentDoc = await transaction.get(documentRef);

        if (!documentDoc.exists()) {
          throw new Error(`${request.documentType} not found`);
        }

        const document = documentDoc.data();

        // Create allocation record
        const allocation: CreditNoteAllocation = {
          id: generateId(),
          creditNoteId: request.creditNoteId,
          creditNoteNumber: creditNote.creditNoteNumber,
          documentType: request.documentType,
          documentId: request.documentId,
          documentNumber:
            request.documentType === 'invoice'
              ? document.invoiceNumber
              : document.billNumber,
          amountAllocated: request.amountToAllocate,
          allocationDate: new Date(),
          allocatedBy: this.userId,
          notes: request.notes,
          createdAt: Timestamp.now(),
        };

        // Update credit note
        const newAmountAllocated = creditNote.amountAllocated + request.amountToAllocate;
        const newAmountUnallocated = creditNote.totalAmount - newAmountAllocated;
        const newAllocationStatus =
          newAmountUnallocated === 0
            ? 'fully-allocated'
            : newAmountAllocated > 0
            ? 'partially-allocated'
            : 'unallocated';

        transaction.update(creditNoteRef, {
          amountAllocated: newAmountAllocated,
          amountUnallocated: newAmountUnallocated,
          allocationStatus: newAllocationStatus,
          allocations: [...creditNote.allocations, allocation],
          firestoreUpdatedAt: Timestamp.now(),
        });

        // Update invoice/bill amount due
        const newAmountDue = document.amountDue - request.amountToAllocate;
        const newStatus = newAmountDue === 0 ? 'paid' : document.status;

        transaction.update(documentRef, {
          amountDue: newAmountDue,
          status: newStatus,
          updatedAt: Timestamp.now(),
        });

        console.log('✅ [CreditNoteService] Credit note allocated', {
          allocationId: allocation.id,
          remainingUnallocated: newAmountUnallocated,
        });

        return {
          success: true,
          message: `Credit note allocated successfully`,
          allocationId: allocation.id,
          allocation,
          remainingUnallocated: newAmountUnallocated,
        };
      });
    } catch (error: any) {
      console.error('❌ [CreditNoteService] Error allocating credit note:', error);
      return {
        success: false,
        message: 'Failed to allocate credit note',
        remainingUnallocated: 0,
        error: error.message,
      };
    }
  }

  /**
   * Allocate credit note across multiple documents
   */
  async allocateCreditNoteMulti(
    request: MultiDocumentAllocationRequest
  ): Promise<CreditAllocationResult[]> {
    const results: CreditAllocationResult[] = [];

    for (const allocation of request.allocations) {
      const result = await this.allocateCreditNote({
        creditNoteId: request.creditNoteId,
        documentType: allocation.documentType,
        documentId: allocation.documentId,
        amountToAllocate: allocation.amountToAllocate,
        notes: request.notes,
      });

      results.push(result);

      // Stop if any allocation fails
      if (!result.success) {
        break;
      }
    }

    return results;
  }

  // ==========================================================================
  // APPROVAL WORKFLOW
  // ==========================================================================

  /**
   * Approve credit note and post to GL
   */
  async approveCreditNote(creditNoteId: string): Promise<CreditNoteServiceResult> {
    try {
      console.log('✅ [CreditNoteService] Approving credit note', { creditNoteId });

      // Get credit note
      const creditNoteRef = doc(
        db,
        'companies',
        this.companyId,
        'creditNotes',
        creditNoteId
      );
      const creditNoteDoc = await getDoc(creditNoteRef);

      if (!creditNoteDoc.exists()) {
        return {
          success: false,
          message: 'Credit note not found',
          error: 'NOT_FOUND',
        };
      }

      const creditNote = creditNoteDoc.data() as CreditNote;

      // Post to GL
      const journalEntryId = await this.postCreditNoteToGL(creditNote);

      // Update credit note status
      await writeBatch(db)
        .update(creditNoteRef, {
          status: 'approved',
          glPosted: true,
          glPostingDate: Timestamp.now(),
          journalEntryId,
          approvedBy: this.userId,
          approvedAt: Timestamp.now(),
          firestoreUpdatedAt: Timestamp.now(),
        })
        .commit();

      console.log('✅ [CreditNoteService] Credit note approved and posted to GL', {
        creditNoteId,
        journalEntryId,
      });

      return {
        success: true,
        message: 'Credit note approved and posted to GL',
        creditNoteId,
        journalEntryId,
      };
    } catch (error: any) {
      console.error('❌ [CreditNoteService] Error approving credit note:', error);
      return {
        success: false,
        message: 'Failed to approve credit note',
        error: error.message,
      };
    }
  }

  /**
   * Post credit note to General Ledger
   */
  private async postCreditNoteToGL(creditNote: CreditNote): Promise<string> {
    // Sales credit note: DR Revenue/AR, CR AR/Cash
    // Purchase credit note: DR AP, CR Expense

    const journalEntryId = generateId();
    const journalEntryRef = doc(
      db,
      'companies',
      this.companyId,
      'journalEntries',
      journalEntryId
    );

    if (creditNote.type === 'sales') {
      // Sales credit note reduces AR and Revenue
      const salesCreditNote = creditNote as SalesCreditNote;

      await writeBatch(db)
        .set(journalEntryRef, {
          id: journalEntryId,
          companyId: this.companyId,
          fiscalPeriodId: this.fiscalPeriodId,
          entryDate: Timestamp.fromDate(salesCreditNote.creditNoteDate),
          description: `Sales Credit Note ${salesCreditNote.creditNoteNumber} - ${salesCreditNote.customerName}`,
          reference: salesCreditNote.creditNoteNumber,
          documentType: 'credit-note',
          documentId: salesCreditNote.id,
          lineItems: [
            {
              accountId: salesCreditNote.revenueAccountId || 'revenue-account-id',
              debit: salesCreditNote.subtotal,
              credit: 0,
              description: `Reverse revenue for CN ${salesCreditNote.creditNoteNumber}`,
            },
            {
              accountId: 'tax-payable-account-id',
              debit: salesCreditNote.taxAmount,
              credit: 0,
              description: `Reverse tax for CN ${salesCreditNote.creditNoteNumber}`,
            },
            {
              accountId: salesCreditNote.arAccountId || 'ar-account-id',
              debit: 0,
              credit: salesCreditNote.totalAmount,
              description: `Credit AR for CN ${salesCreditNote.creditNoteNumber}`,
            },
          ],
          totalDebit: salesCreditNote.totalAmount,
          totalCredit: salesCreditNote.totalAmount,
          status: 'posted',
          createdBy: this.userId,
          createdAt: Timestamp.now(),
          postedAt: Timestamp.now(),
        })
        .commit();
    } else {
      // Purchase credit note reduces AP and Expenses
      const purchaseCreditNote = creditNote as PurchaseCreditNote;

      await writeBatch(db)
        .set(journalEntryRef, {
          id: journalEntryId,
          companyId: this.companyId,
          fiscalPeriodId: this.fiscalPeriodId,
          entryDate: Timestamp.fromDate(purchaseCreditNote.creditNoteDate),
          description: `Purchase Credit Note ${purchaseCreditNote.creditNoteNumber} - ${purchaseCreditNote.supplierName}`,
          reference: purchaseCreditNote.creditNoteNumber,
          documentType: 'credit-note',
          documentId: purchaseCreditNote.id,
          lineItems: [
            {
              accountId: purchaseCreditNote.apAccountId || 'ap-account-id',
              debit: purchaseCreditNote.totalAmount,
              credit: 0,
              description: `Debit AP for PCN ${purchaseCreditNote.creditNoteNumber}`,
            },
            {
              accountId: purchaseCreditNote.expenseAccountId || 'expense-account-id',
              debit: 0,
              credit: purchaseCreditNote.subtotal,
              description: `Credit expense for PCN ${purchaseCreditNote.creditNoteNumber}`,
            },
            {
              accountId: 'tax-receivable-account-id',
              debit: 0,
              credit: purchaseCreditNote.taxAmount,
              description: `Credit tax for PCN ${purchaseCreditNote.creditNoteNumber}`,
            },
          ],
          totalDebit: purchaseCreditNote.totalAmount,
          totalCredit: purchaseCreditNote.totalAmount,
          status: 'posted',
          createdBy: this.userId,
          createdAt: Timestamp.now(),
          postedAt: Timestamp.now(),
        })
        .commit();
    }

    return journalEntryId;
  }

  // ==========================================================================
  // OVERPAYMENT CREDIT NOTE (Phase 6 Integration)
  // ==========================================================================

  /**
   * Create credit note from over-payment
   */
  async createCreditNoteFromOverPayment(
    request: CreateCreditNoteFromOverPaymentRequest
  ): Promise<OverPaymentCreditNoteResult> {
    try {
      console.log('💳 [CreditNoteService] Creating credit note from over-payment', {
        customerId: request.customerId,
        excessAmount: request.excessAmount,
      });

      // Create sales credit note
      const creditNoteResult = await this.createSalesCreditNote({
        customerId: request.customerId,
        creditNoteDate: request.paymentDate,
        reason: 'overpayment',
        reasonDescription: `Over-payment on invoice ${request.invoiceId}`,
        originalInvoiceId: request.invoiceId,
        lineItems: [
          {
            description: `Over-payment credit - Payment ${request.paymentReference}`,
            quantity: 1,
            unitPrice: request.excessAmount,
            notes: `Excess amount from payment of ${request.paymentAmount} on invoice amount ${request.invoiceAmount}`,
          },
        ],
        taxRate: 0, // No tax on over-payment credit
        notes: `Automatically created from over-payment on ${request.paymentDate.toLocaleDateString()}`,
      });

      if (!creditNoteResult.success) {
        return {
          ...creditNoteResult,
          autoAllocatedToInvoice: false,
          invoiceFullyPaid: false,
          creditNoteCreated: false,
          creditBalance: 0,
        };
      }

      // Approve the credit note automatically
      await this.approveCreditNote(creditNoteResult.creditNoteId!);

      console.log('✅ [CreditNoteService] Over-payment credit note created', {
        creditNoteId: creditNoteResult.creditNoteId,
      });

      return {
        ...creditNoteResult,
        autoAllocatedToInvoice: false, // Not allocated, kept as customer credit
        invoiceFullyPaid: true, // Invoice was paid in full
        creditNoteCreated: true,
        creditBalance: request.excessAmount,
      };
    } catch (error: any) {
      console.error(
        '❌ [CreditNoteService] Error creating over-payment credit note:',
        error
      );
      return {
        success: false,
        message: 'Failed to create over-payment credit note',
        error: error.message,
        autoAllocatedToInvoice: false,
        invoiceFullyPaid: false,
        creditNoteCreated: false,
        creditBalance: 0,
      };
    }
  }

  // ==========================================================================
  // QUERY OPERATIONS
  // ==========================================================================

  /**
   * Get credit note by ID
   */
  async getCreditNote(creditNoteId: string): Promise<CreditNote | null> {
    const creditNoteDoc = await getDoc(
      doc(db, 'companies', this.companyId, 'creditNotes', creditNoteId)
    );

    if (!creditNoteDoc.exists()) {
      return null;
    }

    return creditNoteDoc.data() as CreditNote;
  }

  /**
   * Get all credit notes with filters
   */
  async getCreditNotes(filters: CreditNoteQueryFilters = {}): Promise<CreditNote[]> {
    let q = collection(db, 'companies', this.companyId, 'creditNotes');
    let queryRef = query(q);

    if (filters.type) {
      queryRef = query(queryRef, where('type', '==', filters.type));
    }

    if (filters.status) {
      queryRef = query(queryRef, where('status', '==', filters.status));
    }

    if (filters.allocationStatus) {
      queryRef = query(queryRef, where('allocationStatus', '==', filters.allocationStatus));
    }

    if (filters.customerId) {
      queryRef = query(queryRef, where('customerId', '==', filters.customerId));
    }

    if (filters.supplierId) {
      queryRef = query(queryRef, where('supplierId', '==', filters.supplierId));
    }

    queryRef = query(queryRef, orderBy('creditNoteDate', 'desc'));

    const docs = await getDocs(queryRef);
    return docs.docs.map((doc) => doc.data() as CreditNote);
  }
}

// ============================================================================
// SERVICE FACTORY
// ============================================================================

/**
 * Create credit note service instance
 */
export function createCreditNoteService(
  companyId: string,
  userId: string,
  fiscalPeriodId: string
): CreditNoteService {
  return new CreditNoteService(companyId, userId, fiscalPeriodId);
}
