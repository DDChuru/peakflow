/**
 * Vendor Payment Service
 * Phase 2: Accounts Payable
 *
 * Handles CRUD operations for vendor payments with simple approval workflow
 * and bill allocation tracking
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
  limit as firestoreLimit,
  Timestamp,
  DocumentData,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  Payment,
  PaymentStatus,
  PaymentFilters,
  PaymentSummary,
  CreatePaymentInput,
  UpdatePaymentInput,
  VoidPaymentInput,
  PaymentAllocation,
} from '@/types/accounting/payment';
import type { VendorBill } from '@/types/accounting/vendor-bill';

export class VendorPaymentService {
  private companyId: string;
  private userId: string;

  constructor(companyId: string, userId: string) {
    this.companyId = companyId;
    this.userId = userId;
  }

  /**
   * Generate next payment number for the company
   */
  private async generatePaymentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const paymentsRef = collection(db, 'companies', this.companyId, 'vendorPayments');
    const q = query(
      paymentsRef,
      where('paymentNumber', '>=', `PAY-${year}-`),
      where('paymentNumber', '<', `PAY-${year + 1}-`),
      orderBy('paymentNumber', 'desc'),
      firestoreLimit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return `PAY-${year}-0001`;
    }

    const lastPayment = snapshot.docs[0].data();
    const lastNumber = parseInt(lastPayment.paymentNumber.split('-')[2]);
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');

    return `PAY-${year}-${nextNumber}`;
  }

  /**
   * Get bill details for allocation
   */
  private async getBill(billId: string): Promise<VendorBill | null> {
    try {
      const docRef = doc(db, 'companies', this.companyId, 'vendorBills', billId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        billDate: (data.billDate as Timestamp).toDate(),
        dueDate: (data.dueDate as Timestamp).toDate(),
        createdAt: (data.createdAt as Timestamp).toDate(),
        updatedAt: (data.updatedAt as Timestamp).toDate(),
      } as VendorBill;
    } catch (error: any) {
      console.error('❌ [VendorPaymentService] Error getting bill:', error);
      throw new Error(`Failed to get bill: ${error.message}`);
    }
  }

  /**
   * Populate bill allocation details
   */
  private async populateBillAllocations(
    allocations: Omit<PaymentAllocation, 'billNumber' | 'billAmount' | 'remainingAmount'>[]
  ): Promise<PaymentAllocation[]> {
    const fullAllocations: PaymentAllocation[] = [];

    for (const allocation of allocations) {
      const bill = await this.getBill(allocation.billId);
      if (!bill) {
        throw new Error(`Bill ${allocation.billId} not found`);
      }

      fullAllocations.push({
        ...allocation,
        billNumber: bill.billNumber,
        billAmount: bill.totalAmount,
        remainingAmount: bill.amountDue - allocation.amountAllocated,
      });
    }

    return fullAllocations;
  }

  /**
   * Create a new vendor payment
   */
  async createPayment(input: CreatePaymentInput): Promise<Payment> {
    try {
      const paymentNumber = await this.generatePaymentNumber();

      // Populate bill allocation details
      const billAllocations = await this.populateBillAllocations(input.billAllocations);

      // Validate total allocation matches payment amount
      const totalAllocated = billAllocations.reduce(
        (sum, alloc) => sum + alloc.amountAllocated,
        0
      );
      if (Math.abs(totalAllocated - input.amount) > 0.01) {
        throw new Error(
          `Total allocations (${totalAllocated}) must equal payment amount (${input.amount})`
        );
      }

      const now = new Date();
      const paymentData: Omit<Payment, 'id'> = {
        companyId: this.companyId,
        paymentNumber,
        vendorId: input.vendorId,
        vendorName: '', // Will be populated from vendor service
        status: 'draft',
        paymentDate: input.paymentDate,
        amount: input.amount,
        currency: input.currency || 'USD',
        paymentMethod: input.paymentMethod,
        checkNumber: input.checkNumber,
        referenceNumber: input.referenceNumber,
        bankAccountId: input.bankAccountId,
        billAllocations,
        notes: input.notes,
        internalNotes: input.internalNotes,
        paymentDescription: input.paymentDescription,
        glPosted: false,
        createdBy: this.userId,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(
        collection(db, 'companies', this.companyId, 'vendorPayments'),
        {
          ...paymentData,
          paymentDate: Timestamp.fromDate(paymentData.paymentDate),
          createdAt: Timestamp.fromDate(paymentData.createdAt),
          updatedAt: Timestamp.fromDate(paymentData.updatedAt),
        }
      );

      console.log('✅ [VendorPaymentService] Created payment:', paymentNumber);

      return {
        ...paymentData,
        id: docRef.id,
      };
    } catch (error: any) {
      console.error('❌ [VendorPaymentService] Error creating payment:', error);
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment | null> {
    try {
      const docRef = doc(db, 'companies', this.companyId, 'vendorPayments', paymentId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.convertFirestoreToPayment(docSnap.id, docSnap.data());
    } catch (error: any) {
      console.error('❌ [VendorPaymentService] Error getting payment:', error);
      throw new Error(`Failed to get payment: ${error.message}`);
    }
  }

  /**
   * Get all payments with optional filters
   */
  async getPayments(filters?: PaymentFilters): Promise<Payment[]> {
    try {
      const paymentsRef = collection(db, 'companies', this.companyId, 'vendorPayments');
      let constraints: any[] = [orderBy('createdAt', 'desc')];

      if (filters) {
        if (filters.vendorId) {
          constraints.push(where('vendorId', '==', filters.vendorId));
        }
        if (filters.status && filters.status.length > 0) {
          constraints.push(where('status', 'in', filters.status));
        }
        if (filters.paymentMethod && filters.paymentMethod.length > 0) {
          constraints.push(where('paymentMethod', 'in', filters.paymentMethod));
        }
        if (filters.bankAccountId) {
          constraints.push(where('bankAccountId', '==', filters.bankAccountId));
        }
        if (filters.dateFrom) {
          constraints.push(
            where('paymentDate', '>=', Timestamp.fromDate(filters.dateFrom))
          );
        }
        if (filters.dateTo) {
          constraints.push(
            where('paymentDate', '<=', Timestamp.fromDate(filters.dateTo))
          );
        }
      }

      const q = query(paymentsRef, ...constraints);
      const snapshot = await getDocs(q);

      const payments = snapshot.docs.map((doc) =>
        this.convertFirestoreToPayment(doc.id, doc.data())
      );

      // Client-side filtering for fields that can't be indexed
      let filteredPayments = payments;

      if (filters?.minAmount) {
        filteredPayments = filteredPayments.filter(
          (payment) => payment.amount >= filters.minAmount!
        );
      }
      if (filters?.maxAmount) {
        filteredPayments = filteredPayments.filter(
          (payment) => payment.amount <= filters.maxAmount!
        );
      }
      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filteredPayments = filteredPayments.filter(
          (payment) =>
            payment.paymentNumber.toLowerCase().includes(term) ||
            payment.vendorName.toLowerCase().includes(term) ||
            payment.checkNumber?.toLowerCase().includes(term) ||
            payment.referenceNumber?.toLowerCase().includes(term)
        );
      }
      if (filters?.unreconciled) {
        filteredPayments = filteredPayments.filter(
          (payment) => !payment.reconciledAt && payment.status === 'processed'
        );
      }

      return filteredPayments;
    } catch (error: any) {
      console.error('❌ [VendorPaymentService] Error getting payments:', error);
      throw new Error(`Failed to get payments: ${error.message}`);
    }
  }

  /**
   * Update payment
   */
  async updatePayment(paymentId: string, input: UpdatePaymentInput): Promise<void> {
    try {
      // Check if payment can be edited
      const payment = await this.getPayment(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status === 'processed' || payment.status === 'posted') {
        throw new Error('Processed or posted payments cannot be edited. Use void instead.');
      }

      const updateData: any = {
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: this.userId,
      };

      if (input.vendorId !== undefined) updateData.vendorId = input.vendorId;
      if (input.paymentDate !== undefined)
        updateData.paymentDate = Timestamp.fromDate(input.paymentDate);
      if (input.amount !== undefined) updateData.amount = input.amount;
      if (input.paymentMethod !== undefined)
        updateData.paymentMethod = input.paymentMethod;
      if (input.bankAccountId !== undefined)
        updateData.bankAccountId = input.bankAccountId;
      if (input.checkNumber !== undefined) updateData.checkNumber = input.checkNumber;
      if (input.referenceNumber !== undefined)
        updateData.referenceNumber = input.referenceNumber;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.internalNotes !== undefined)
        updateData.internalNotes = input.internalNotes;
      if (input.paymentDescription !== undefined)
        updateData.paymentDescription = input.paymentDescription;
      if (input.status !== undefined) updateData.status = input.status;

      if (input.billAllocations) {
        const billAllocations = await this.populateBillAllocations(
          input.billAllocations
        );
        const totalAllocated = billAllocations.reduce(
          (sum, alloc) => sum + alloc.amountAllocated,
          0
        );
        const amount = input.amount !== undefined ? input.amount : payment.amount;
        if (Math.abs(totalAllocated - amount) > 0.01) {
          throw new Error(
            `Total allocations (${totalAllocated}) must equal payment amount (${amount})`
          );
        }
        updateData.billAllocations = billAllocations;
      }

      const docRef = doc(db, 'companies', this.companyId, 'vendorPayments', paymentId);
      await updateDoc(docRef, updateData);

      console.log('✅ [VendorPaymentService] Updated payment:', paymentId);
    } catch (error: any) {
      console.error('❌ [VendorPaymentService] Error updating payment:', error);
      throw new Error(`Failed to update payment: ${error.message}`);
    }
  }

  /**
   * Submit payment for approval
   */
  async submitForApproval(paymentId: string): Promise<void> {
    try {
      const docRef = doc(db, 'companies', this.companyId, 'vendorPayments', paymentId);
      await updateDoc(docRef, {
        status: 'pending_approval',
        submittedForApprovalAt: Timestamp.fromDate(new Date()),
        submittedForApprovalBy: this.userId,
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: this.userId,
      });

      console.log('✅ [VendorPaymentService] Submitted payment for approval:', paymentId);
    } catch (error: any) {
      console.error('❌ [VendorPaymentService] Error submitting payment:', error);
      throw new Error(`Failed to submit payment for approval: ${error.message}`);
    }
  }

  /**
   * Approve payment
   */
  async approvePayment(paymentId: string): Promise<void> {
    try {
      const docRef = doc(db, 'companies', this.companyId, 'vendorPayments', paymentId);
      await updateDoc(docRef, {
        status: 'approved',
        approvedBy: this.userId,
        approvedAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: this.userId,
      });

      console.log('✅ [VendorPaymentService] Approved payment:', paymentId);
    } catch (error: any) {
      console.error('❌ [VendorPaymentService] Error approving payment:', error);
      throw new Error(`Failed to approve payment: ${error.message}`);
    }
  }

  /**
   * Reject payment
   */
  async rejectPayment(paymentId: string, reason: string): Promise<void> {
    try {
      const docRef = doc(db, 'companies', this.companyId, 'vendorPayments', paymentId);
      await updateDoc(docRef, {
        status: 'draft',
        rejectedBy: this.userId,
        rejectedAt: Timestamp.fromDate(new Date()),
        rejectionReason: reason,
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: this.userId,
      });

      console.log('✅ [VendorPaymentService] Rejected payment:', paymentId);
    } catch (error: any) {
      console.error('❌ [VendorPaymentService] Error rejecting payment:', error);
      throw new Error(`Failed to reject payment: ${error.message}`);
    }
  }

  /**
   * Process payment (mark as processed)
   */
  async processPayment(paymentId: string): Promise<void> {
    try {
      const payment = await this.getPayment(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'approved') {
        throw new Error('Only approved payments can be processed');
      }

      const batch = writeBatch(db);
      const now = new Date();

      // Update payment status
      const paymentRef = doc(db, 'companies', this.companyId, 'vendorPayments', paymentId);
      batch.update(paymentRef, {
        status: 'processed',
        processedBy: this.userId,
        processedAt: Timestamp.fromDate(now),
        processedDate: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
        updatedBy: this.userId,
      });

      // Update linked bills
      for (const allocation of payment.billAllocations) {
        const billRef = doc(
          db,
          'companies',
          this.companyId,
          'vendorBills',
          allocation.billId
        );
        const billSnap = await getDoc(billRef);

        if (billSnap.exists()) {
          const billData = billSnap.data();
          const currentAmountPaid = billData.amountPaid || 0;
          const newAmountPaid = currentAmountPaid + allocation.amountAllocated;
          const newAmountDue = billData.totalAmount - newAmountPaid;
          const currentPaymentIds = billData.paymentIds || [];

          // Determine new bill status
          let newStatus = billData.status;
          if (newAmountDue <= 0.01) {
            newStatus = 'paid';
          } else if (newAmountPaid > 0) {
            newStatus = 'partially_paid';
          }

          batch.update(billRef, {
            amountPaid: newAmountPaid,
            amountDue: newAmountDue,
            status: newStatus,
            paymentIds: [...currentPaymentIds, paymentId],
            updatedAt: Timestamp.fromDate(now),
            updatedBy: this.userId,
          });
        }
      }

      await batch.commit();

      console.log('✅ [VendorPaymentService] Processed payment:', paymentId);
    } catch (error: any) {
      console.error('❌ [VendorPaymentService] Error processing payment:', error);
      throw new Error(`Failed to process payment: ${error.message}`);
    }
  }

  /**
   * Void a processed payment
   */
  async voidPayment(input: VoidPaymentInput): Promise<void> {
    try {
      const payment = await this.getPayment(input.paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'processed' && payment.status !== 'posted') {
        throw new Error('Only processed or posted payments can be voided');
      }

      const batch = writeBatch(db);
      const voidDate = input.voidDate || new Date();

      // Update payment status
      const paymentRef = doc(
        db,
        'companies',
        this.companyId,
        'vendorPayments',
        input.paymentId
      );
      batch.update(paymentRef, {
        status: 'void',
        voidedAt: Timestamp.fromDate(voidDate),
        voidedBy: this.userId,
        voidReason: input.voidReason,
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: this.userId,
      });

      // Reverse bill allocations
      for (const allocation of payment.billAllocations) {
        const billRef = doc(
          db,
          'companies',
          this.companyId,
          'vendorBills',
          allocation.billId
        );
        const billSnap = await getDoc(billRef);

        if (billSnap.exists()) {
          const billData = billSnap.data();
          const currentAmountPaid = billData.amountPaid || 0;
          const newAmountPaid = Math.max(0, currentAmountPaid - allocation.amountAllocated);
          const newAmountDue = billData.totalAmount - newAmountPaid;
          const currentPaymentIds = (billData.paymentIds || []) as string[];

          // Remove this payment ID from the bill
          const updatedPaymentIds = currentPaymentIds.filter(
            (id) => id !== input.paymentId
          );

          // Determine new bill status
          let newStatus = billData.status;
          if (newAmountDue > 0.01 && newAmountPaid > 0) {
            newStatus = 'partially_paid';
          } else if (newAmountDue > 0.01) {
            newStatus = billData.glPosted ? 'posted' : 'approved';
          }

          batch.update(billRef, {
            amountPaid: newAmountPaid,
            amountDue: newAmountDue,
            status: newStatus,
            paymentIds: updatedPaymentIds,
            updatedAt: Timestamp.fromDate(new Date()),
            updatedBy: this.userId,
          });
        }
      }

      await batch.commit();

      console.log('✅ [VendorPaymentService] Voided payment:', input.paymentId);
    } catch (error: any) {
      console.error('❌ [VendorPaymentService] Error voiding payment:', error);
      throw new Error(`Failed to void payment: ${error.message}`);
    }
  }

  /**
   * Delete payment (draft only)
   */
  async deletePayment(paymentId: string): Promise<void> {
    try {
      const payment = await this.getPayment(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'draft') {
        throw new Error('Only draft payments can be deleted');
      }

      const docRef = doc(db, 'companies', this.companyId, 'vendorPayments', paymentId);
      await deleteDoc(docRef);

      console.log('✅ [VendorPaymentService] Deleted payment:', paymentId);
    } catch (error: any) {
      console.error('❌ [VendorPaymentService] Error deleting payment:', error);
      throw new Error(`Failed to delete payment: ${error.message}`);
    }
  }

  /**
   * Get payment summary statistics
   */
  async getPaymentSummary(): Promise<PaymentSummary> {
    try {
      const payments = await this.getPayments();

      const summary: PaymentSummary = {
        totalPayments: payments.length,
        draftCount: payments.filter((p) => p.status === 'draft').length,
        pendingApprovalCount: payments.filter((p) => p.status === 'pending_approval')
          .length,
        approvedCount: payments.filter((p) => p.status === 'approved').length,
        processedCount: payments.filter((p) => p.status === 'processed').length,
        postedCount: payments.filter((p) => p.status === 'posted').length,
        voidCount: payments.filter((p) => p.status === 'void').length,
        totalValue: payments
          .filter((p) => p.status !== 'void' && p.status !== 'cancelled')
          .reduce((sum, p) => sum + p.amount, 0),
        totalProcessed: payments
          .filter((p) => p.status === 'processed' || p.status === 'posted')
          .reduce((sum, p) => sum + p.amount, 0),
        totalVoid: payments
          .filter((p) => p.status === 'void')
          .reduce((sum, p) => sum + p.amount, 0),
        unreconciledCount: payments.filter(
          (p) => p.status === 'processed' && !p.reconciledAt
        ).length,
        unreconciledAmount: payments
          .filter((p) => p.status === 'processed' && !p.reconciledAt)
          .reduce((sum, p) => sum + p.amount, 0),
      };

      return summary;
    } catch (error: any) {
      console.error('❌ [VendorPaymentService] Error getting summary:', error);
      throw new Error(`Failed to get payment summary: ${error.message}`);
    }
  }

  /**
   * Allocate payment to bills
   */
  async allocatePaymentToBills(
    paymentId: string,
    allocations: PaymentAllocation[]
  ): Promise<void> {
    try {
      const payment = await this.getPayment(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status === 'processed' || payment.status === 'posted') {
        throw new Error('Cannot modify allocations for processed or posted payments');
      }

      // Validate total allocation
      const totalAllocated = allocations.reduce(
        (sum, alloc) => sum + alloc.amountAllocated,
        0
      );
      if (Math.abs(totalAllocated - payment.amount) > 0.01) {
        throw new Error(
          `Total allocations (${totalAllocated}) must equal payment amount (${payment.amount})`
        );
      }

      const docRef = doc(db, 'companies', this.companyId, 'vendorPayments', paymentId);
      await updateDoc(docRef, {
        billAllocations: allocations,
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: this.userId,
      });

      console.log('✅ [VendorPaymentService] Updated payment allocations:', paymentId);
    } catch (error: any) {
      console.error('❌ [VendorPaymentService] Error allocating payment:', error);
      throw new Error(`Failed to allocate payment to bills: ${error.message}`);
    }
  }

  /**
   * Convert Firestore document to Payment type
   */
  private convertFirestoreToPayment(id: string, data: DocumentData): Payment {
    return {
      id,
      companyId: data.companyId,
      paymentNumber: data.paymentNumber,
      vendorId: data.vendorId,
      vendorName: data.vendorName || '',
      status: data.status,
      paymentDate: (data.paymentDate as Timestamp).toDate(),
      processedDate: data.processedDate
        ? (data.processedDate as Timestamp).toDate()
        : undefined,
      clearedDate: data.clearedDate
        ? (data.clearedDate as Timestamp).toDate()
        : undefined,
      amount: data.amount,
      currency: data.currency,
      paymentMethod: data.paymentMethod,
      checkNumber: data.checkNumber,
      referenceNumber: data.referenceNumber,
      bankAccountId: data.bankAccountId,
      bankAccountName: data.bankAccountName,
      bankAccountNumber: data.bankAccountNumber,
      billAllocations: data.billAllocations || [],
      notes: data.notes,
      internalNotes: data.internalNotes,
      paymentDescription: data.paymentDescription,
      submittedForApprovalAt: data.submittedForApprovalAt
        ? (data.submittedForApprovalAt as Timestamp).toDate()
        : undefined,
      submittedForApprovalBy: data.submittedForApprovalBy,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt
        ? (data.approvedAt as Timestamp).toDate()
        : undefined,
      rejectedBy: data.rejectedBy,
      rejectedAt: data.rejectedAt
        ? (data.rejectedAt as Timestamp).toDate()
        : undefined,
      rejectionReason: data.rejectionReason,
      processedBy: data.processedBy,
      processedAt: data.processedAt
        ? (data.processedAt as Timestamp).toDate()
        : undefined,
      glPosted: data.glPosted || false,
      glPostingDate: data.glPostingDate
        ? (data.glPostingDate as Timestamp).toDate()
        : undefined,
      glPostedBy: data.glPostedBy,
      journalEntryId: data.journalEntryId,
      voidedAt: data.voidedAt ? (data.voidedAt as Timestamp).toDate() : undefined,
      voidedBy: data.voidedBy,
      voidReason: data.voidReason,
      voidJournalEntryId: data.voidJournalEntryId,
      reconciledAt: data.reconciledAt
        ? (data.reconciledAt as Timestamp).toDate()
        : undefined,
      reconciledBy: data.reconciledBy,
      bankStatementId: data.bankStatementId,
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
      updatedBy: data.updatedBy,
    };
  }
}

/**
 * Factory function to create VendorPaymentService instance
 */
export function createVendorPaymentService(
  companyId: string,
  userId: string
): VendorPaymentService {
  return new VendorPaymentService(companyId, userId);
}
