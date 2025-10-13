/**
 * PendingPaymentService
 * Phase 2: Pending Payment System
 *
 * Manages unallocated customer/supplier payments from bank transactions
 * Handles payment allocation to invoices/bills and credit note creation
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  WhereFilterOp,
  Query,
  DocumentData,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  PendingPayment,
  PaymentAllocation,
  PendingPaymentFilter,
  CreatePendingPaymentOptions,
  AllocatePaymentOptions,
  AllocationResult,
  CreateCreditNoteOptions,
  PendingPaymentSummary,
  PaymentStatus,
  PaymentEntityType,
} from '@/types/ai/pending-payment';
import { DebtorService } from '@/lib/firebase/debtor-service';
import { CreditorService } from '@/lib/firebase/creditor-service';
import { InvoiceService } from '@/lib/accounting/invoice-service';

/**
 * Service for managing pending payments
 */
export class PendingPaymentService {
  private debtorService: DebtorService;
  private creditorService: CreditorService;
  private invoiceService: InvoiceService;

  constructor() {
    this.debtorService = new DebtorService();
    this.creditorService = new CreditorService();
    this.invoiceService = new InvoiceService();
  }

  // ============================================================================
  // CREATE Operations
  // ============================================================================

  /**
   * Create a new pending payment
   *
   * @param options - Payment creation options
   * @returns Created pending payment
   */
  async createPendingPayment(
    options: CreatePendingPaymentOptions
  ): Promise<PendingPayment> {
    console.log(`[PendingPaymentService] Creating pending payment for ${options.entityType}: ${options.entityName}`);

    const now = Timestamp.now();

    const pendingPayment: Omit<PendingPayment, 'id'> = {
      companyId: options.companyId,
      createdBy: options.createdBy,
      entityType: options.entityType,
      entityId: options.entityId,
      entityName: options.entityName,
      matchConfidence: options.matchConfidence,
      matchedField: options.matchedField,
      matchMethod: options.matchMethod,
      amount: options.amount,
      currency: 'ZAR',
      transactionDate: Timestamp.fromDate(options.transactionDate),
      description: options.description,
      bankReference: options.bankReference,
      bankAccountId: options.bankAccountId,
      status: 'pending',
      allocatedAmount: 0,
      remainingAmount: options.amount,
      allocations: [],
      suggestedDocumentId: options.suggestedDocumentId,
      suggestedDocumentNumber: options.suggestedDocumentNumber,
      suggestedDocumentConfidence: options.suggestedDocumentConfidence,
      suggestedDocumentReasons: options.suggestedDocumentReasons,
      notes: options.notes,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    try {
      const collectionRef = collection(
        db,
        `companies/${options.companyId}/pendingPayments`
      );
      const docRef = await addDoc(collectionRef, pendingPayment);

      console.log(`[PendingPaymentService] Created pending payment: ${docRef.id}`);
      console.log(`  Entity: ${options.entityName} (${options.entityType})`);
      console.log(`  Amount: R${options.amount.toFixed(2)}`);
      console.log(`  Match Confidence: ${options.matchConfidence}%`);

      if (options.suggestedDocumentNumber) {
        console.log(`  Suggested Document: ${options.suggestedDocumentNumber} (${options.suggestedDocumentConfidence}% confidence)`);
      }

      return {
        id: docRef.id,
        ...pendingPayment,
      };
    } catch (error) {
      console.error('[PendingPaymentService] Error creating pending payment:', error);
      throw new Error('Failed to create pending payment');
    }
  }

  // ============================================================================
  // READ Operations
  // ============================================================================

  /**
   * Get a pending payment by ID
   *
   * @param companyId - Company ID
   * @param paymentId - Pending payment ID
   * @returns Pending payment or null
   */
  async getPendingPayment(
    companyId: string,
    paymentId: string
  ): Promise<PendingPayment | null> {
    try {
      const docRef = doc(
        db,
        `companies/${companyId}/pendingPayments/${paymentId}`
      );
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as PendingPayment;
    } catch (error) {
      console.error('[PendingPaymentService] Error getting pending payment:', error);
      return null;
    }
  }

  /**
   * Get all pending payments for a company with optional filters
   *
   * @param companyId - Company ID
   * @param filters - Optional filters
   * @returns Array of pending payments
   */
  async getPendingPayments(
    companyId: string,
    filters: PendingPaymentFilter = {}
  ): Promise<PendingPayment[]> {
    console.log(`[PendingPaymentService] Getting pending payments for company: ${companyId}`);

    try {
      let q: Query<DocumentData> = collection(
        db,
        `companies/${companyId}/pendingPayments`
      );

      // Apply filters
      const constraints: any[] = [];

      // Filter by entity type
      if (filters.entityType) {
        constraints.push(where('entityType', '==', filters.entityType));
      }

      // Filter by entity ID
      if (filters.entityId) {
        constraints.push(where('entityId', '==', filters.entityId));
      }

      // Filter by status
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          constraints.push(where('status', 'in', filters.status));
        } else {
          constraints.push(where('status', '==', filters.status));
        }
      }

      // Filter by date range
      if (filters.dateFrom) {
        constraints.push(
          where('transactionDate', '>=', Timestamp.fromDate(filters.dateFrom))
        );
      }

      if (filters.dateTo) {
        constraints.push(
          where('transactionDate', '<=', Timestamp.fromDate(filters.dateTo))
        );
      }

      // Filter by bank account
      if (filters.bankAccountId) {
        constraints.push(where('bankAccountId', '==', filters.bankAccountId));
      }

      // Exclude deleted by default
      if (!filters.includeDeleted) {
        constraints.push(where('isDeleted', '==', false));
      }

      // Build query
      if (constraints.length > 0) {
        q = query(q, ...constraints, orderBy('transactionDate', 'desc'));
      } else {
        q = query(q, orderBy('transactionDate', 'desc'));
      }

      const querySnapshot = await getDocs(q);

      const payments: PendingPayment[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as PendingPayment[];

      // Apply amount filters (client-side)
      let filteredPayments = payments;

      if (filters.minAmount !== undefined) {
        filteredPayments = filteredPayments.filter(
          p => p.amount >= filters.minAmount!
        );
      }

      if (filters.maxAmount !== undefined) {
        filteredPayments = filteredPayments.filter(
          p => p.amount <= filters.maxAmount!
        );
      }

      console.log(`[PendingPaymentService] Found ${filteredPayments.length} pending payments`);

      return filteredPayments;
    } catch (error) {
      console.error('[PendingPaymentService] Error getting pending payments:', error);
      return [];
    }
  }

  /**
   * Get pending payments for a specific entity (customer or supplier)
   *
   * @param companyId - Company ID
   * @param entityType - Entity type ('debtor' or 'creditor')
   * @param entityId - Entity ID
   * @returns Array of pending payments
   */
  async getPendingPaymentsByEntity(
    companyId: string,
    entityType: PaymentEntityType,
    entityId: string
  ): Promise<PendingPayment[]> {
    return this.getPendingPayments(companyId, {
      entityType,
      entityId,
      status: ['pending', 'partially-allocated'],
    });
  }

  /**
   * Get summary statistics for pending payments
   *
   * @param companyId - Company ID
   * @param filters - Optional filters
   * @returns Summary statistics
   */
  async getPendingPaymentSummary(
    companyId: string,
    filters: PendingPaymentFilter = {}
  ): Promise<PendingPaymentSummary> {
    const payments = await this.getPendingPayments(companyId, filters);

    const summary: PendingPaymentSummary = {
      totalCount: payments.length,
      totalPendingAmount: 0,
      totalPartiallyAllocatedAmount: 0,
      totalFullyAllocatedAmount: 0,
      totalCreditNotesAmount: 0,
      countByEntityType: {
        debtor: 0,
        creditor: 0,
      },
      amountByEntityType: {
        debtor: 0,
        creditor: 0,
      },
    };

    for (const payment of payments) {
      // Count by status
      switch (payment.status) {
        case 'pending':
          summary.totalPendingAmount += payment.remainingAmount;
          break;
        case 'partially-allocated':
          summary.totalPartiallyAllocatedAmount += payment.remainingAmount;
          break;
        case 'fully-allocated':
          summary.totalFullyAllocatedAmount += payment.amount;
          break;
        case 'credit-note':
          summary.totalCreditNotesAmount += payment.amount;
          break;
      }

      // Count by entity type
      summary.countByEntityType[payment.entityType]++;
      summary.amountByEntityType[payment.entityType] += payment.amount;

      // Track oldest/newest
      const paymentDate = payment.transactionDate.toDate();
      if (!summary.oldestPaymentDate || paymentDate < summary.oldestPaymentDate) {
        summary.oldestPaymentDate = paymentDate;
      }
      if (!summary.newestPaymentDate || paymentDate > summary.newestPaymentDate) {
        summary.newestPaymentDate = paymentDate;
      }
    }

    return summary;
  }

  // ============================================================================
  // UPDATE Operations - Payment Allocation
  // ============================================================================

  /**
   * Allocate payment to an invoice or bill
   *
   * @param options - Allocation options
   * @returns Allocation result
   */
  async allocatePayment(
    options: AllocatePaymentOptions
  ): Promise<AllocationResult> {
    console.log(`[PendingPaymentService] Allocating payment: ${options.pendingPaymentId}`);
    console.log(`  Document: ${options.documentNumber}`);
    console.log(`  Amount: R${options.allocatedAmount.toFixed(2)}`);

    try {
      // Get pending payment
      const payment = await this.getPendingPayment(
        options.pendingPaymentId.split('/')[1], // Extract companyId
        options.pendingPaymentId
      );

      if (!payment) {
        return {
          success: false,
          error: 'Pending payment not found',
        };
      }

      // Validate allocation amount
      if (options.allocatedAmount > payment.remainingAmount) {
        return {
          success: false,
          error: `Allocation amount (R${options.allocatedAmount.toFixed(2)}) exceeds remaining amount (R${payment.remainingAmount.toFixed(2)})`,
        };
      }

      if (options.allocatedAmount <= 0) {
        return {
          success: false,
          error: 'Allocation amount must be greater than zero',
        };
      }

      // Create allocation record
      const allocation: PaymentAllocation = {
        documentId: options.documentId,
        documentNumber: options.documentNumber,
        allocatedAmount: options.allocatedAmount,
        allocationDate: Timestamp.now(),
        allocatedBy: options.allocatedBy,
        notes: options.notes,
      };

      // Calculate new amounts
      const newAllocatedAmount = payment.allocatedAmount + options.allocatedAmount;
      const newRemainingAmount = payment.amount - newAllocatedAmount;

      // Determine new status
      let newStatus: PaymentStatus;
      if (newRemainingAmount === 0) {
        newStatus = 'fully-allocated';
      } else if (newAllocatedAmount > 0) {
        newStatus = 'partially-allocated';
      } else {
        newStatus = 'pending';
      }

      // Update pending payment using batch
      const batch = writeBatch(db);

      const paymentRef = doc(
        db,
        `companies/${payment.companyId}/pendingPayments/${payment.id}`
      );

      batch.update(paymentRef, {
        allocations: [...payment.allocations, allocation],
        allocatedAmount: newAllocatedAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
        updatedAt: Timestamp.now(),
        updatedBy: options.allocatedBy,
      });

      // Update invoice/bill amountDue
      // TODO: Implement invoice/bill update logic when bills module exists
      // For now, we'll just update the invoice if it's a debtor payment
      if (payment.entityType === 'debtor') {
        const invoiceRef = doc(
          db,
          `companies/${payment.companyId}/invoices/${options.documentId}`
        );

        // We need to get the invoice first to calculate new amountDue
        const invoiceSnap = await getDoc(invoiceRef);
        if (invoiceSnap.exists()) {
          const invoice = invoiceSnap.data();
          const currentAmountDue = invoice.amountDue || invoice.total || 0;
          const newAmountDue = currentAmountDue - options.allocatedAmount;

          // Update invoice status
          let invoiceStatus = invoice.status;
          if (newAmountDue <= 0) {
            invoiceStatus = 'paid';
          } else if (newAmountDue < invoice.total) {
            invoiceStatus = 'partially-paid';
          }

          batch.update(invoiceRef, {
            amountDue: Math.max(0, newAmountDue),
            status: invoiceStatus,
            updatedAt: Timestamp.now(),
          });
        }
      }

      // Commit batch
      await batch.commit();

      console.log(`[PendingPaymentService] Payment allocated successfully`);
      console.log(`  New Status: ${newStatus}`);
      console.log(`  Remaining: R${newRemainingAmount.toFixed(2)}`);

      // Get updated payment
      const updatedPayment = await this.getPendingPayment(
        payment.companyId,
        payment.id
      );

      return {
        success: true,
        pendingPayment: updatedPayment || undefined,
        newStatus,
        remainingAmount: newRemainingAmount,
      };
    } catch (error) {
      console.error('[PendingPaymentService] Error allocating payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Allocate payment to multiple invoices/bills at once
   *
   * @param companyId - Company ID
   * @param paymentId - Pending payment ID
   * @param allocations - Array of allocation options
   * @param userId - User making allocations
   * @returns Allocation result
   */
  async allocatePaymentMultiple(
    companyId: string,
    paymentId: string,
    allocations: Array<{
      documentId: string;
      documentNumber: string;
      allocatedAmount: number;
      notes?: string;
    }>,
    userId: string
  ): Promise<AllocationResult> {
    console.log(`[PendingPaymentService] Allocating payment to ${allocations.length} documents`);

    // Validate total allocation amount
    const payment = await this.getPendingPayment(companyId, paymentId);
    if (!payment) {
      return {
        success: false,
        error: 'Pending payment not found',
      };
    }

    const totalAllocation = allocations.reduce(
      (sum, a) => sum + a.allocatedAmount,
      0
    );

    if (totalAllocation > payment.remainingAmount) {
      return {
        success: false,
        error: `Total allocation (R${totalAllocation.toFixed(2)}) exceeds remaining amount (R${payment.remainingAmount.toFixed(2)})`,
      };
    }

    // Apply allocations sequentially
    let result: AllocationResult = { success: true };

    for (const allocation of allocations) {
      result = await this.allocatePayment({
        pendingPaymentId: paymentId,
        documentId: allocation.documentId,
        documentNumber: allocation.documentNumber,
        allocatedAmount: allocation.allocatedAmount,
        allocatedBy: userId,
        notes: allocation.notes,
      });

      if (!result.success) {
        console.error(`[PendingPaymentService] Failed to allocate to ${allocation.documentNumber}`);
        break;
      }
    }

    return result;
  }

  // ============================================================================
  // UPDATE Operations - Credit Note Conversion
  // ============================================================================

  /**
   * Convert over-payment to credit note
   *
   * @param options - Credit note creation options
   * @returns Updated pending payment
   */
  async convertToCreditNote(
    options: CreateCreditNoteOptions
  ): Promise<PendingPayment | null> {
    console.log(`[PendingPaymentService] Converting to credit note: ${options.pendingPaymentId}`);

    try {
      // Get pending payment
      const companyId = options.pendingPaymentId.split('/')[1]; // Extract companyId
      const payment = await this.getPendingPayment(companyId, options.pendingPaymentId);

      if (!payment) {
        console.error('[PendingPaymentService] Pending payment not found');
        return null;
      }

      if (payment.remainingAmount <= 0) {
        console.error('[PendingPaymentService] No remaining amount to convert');
        return null;
      }

      // TODO: Create actual credit note when credit notes module exists
      // For now, just mark as credit-note status

      const creditNoteNumber = `CN-${Date.now()}`; // Temporary numbering
      const creditNoteDate = Timestamp.now();

      const paymentRef = doc(
        db,
        `companies/${payment.companyId}/pendingPayments/${payment.id}`
      );

      await updateDoc(paymentRef, {
        status: 'credit-note',
        creditNoteNumber,
        creditNoteDate,
        updatedAt: Timestamp.now(),
        updatedBy: options.createdBy,
        notes: options.reason
          ? `${payment.notes || ''}\nConverted to credit note: ${options.reason}`.trim()
          : payment.notes,
      });

      console.log(`[PendingPaymentService] Converted to credit note: ${creditNoteNumber}`);

      return this.getPendingPayment(payment.companyId, payment.id);
    } catch (error) {
      console.error('[PendingPaymentService] Error converting to credit note:', error);
      return null;
    }
  }

  // ============================================================================
  // DELETE Operations
  // ============================================================================

  /**
   * Soft delete a pending payment
   *
   * @param companyId - Company ID
   * @param paymentId - Pending payment ID
   * @param userId - User performing deletion
   * @returns Success flag
   */
  async deletePendingPayment(
    companyId: string,
    paymentId: string,
    userId: string
  ): Promise<boolean> {
    console.log(`[PendingPaymentService] Soft deleting pending payment: ${paymentId}`);

    try {
      const paymentRef = doc(
        db,
        `companies/${companyId}/pendingPayments/${paymentId}`
      );

      await updateDoc(paymentRef, {
        isDeleted: true,
        updatedAt: Timestamp.now(),
        updatedBy: userId,
      });

      console.log('[PendingPaymentService] Pending payment deleted');
      return true;
    } catch (error) {
      console.error('[PendingPaymentService] Error deleting pending payment:', error);
      return false;
    }
  }

  /**
   * Permanently delete a pending payment (admin only)
   *
   * @param companyId - Company ID
   * @param paymentId - Pending payment ID
   * @returns Success flag
   */
  async permanentlyDeletePendingPayment(
    companyId: string,
    paymentId: string
  ): Promise<boolean> {
    console.log(`[PendingPaymentService] Permanently deleting pending payment: ${paymentId}`);

    try {
      const paymentRef = doc(
        db,
        `companies/${companyId}/pendingPayments/${paymentId}`
      );

      await deleteDoc(paymentRef);

      console.log('[PendingPaymentService] Pending payment permanently deleted');
      return true;
    } catch (error) {
      console.error('[PendingPaymentService] Error permanently deleting:', error);
      return false;
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Check if payment can be allocated
   *
   * @param payment - Pending payment
   * @returns True if payment can be allocated
   */
  canAllocate(payment: PendingPayment): boolean {
    return (
      !payment.isDeleted &&
      payment.remainingAmount > 0 &&
      ['pending', 'partially-allocated'].includes(payment.status)
    );
  }

  /**
   * Check if payment can be converted to credit note
   *
   * @param payment - Pending payment
   * @returns True if payment can be converted
   */
  canConvertToCreditNote(payment: PendingPayment): boolean {
    return (
      !payment.isDeleted &&
      payment.remainingAmount > 0 &&
      payment.entityType === 'debtor' && // Only for customer over-payments
      ['pending', 'partially-allocated'].includes(payment.status)
    );
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let pendingPaymentServiceInstance: PendingPaymentService | null = null;

export function getPendingPaymentService(): PendingPaymentService {
  if (!pendingPaymentServiceInstance) {
    pendingPaymentServiceInstance = new PendingPaymentService();
  }
  return pendingPaymentServiceInstance;
}

// Default export
export const pendingPaymentService = getPendingPaymentService();
