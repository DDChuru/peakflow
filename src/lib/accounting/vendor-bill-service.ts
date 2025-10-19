/**
 * Vendor Bill Service
 * Phase 2: Accounts Payable
 *
 * Handles CRUD operations for vendor bills/invoices with simple approval workflow
 * and 3-way matching capabilities
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  VendorBill,
  VendorBillLine,
  VendorBillStatus,
  VendorBillFilters,
  VendorBillSummary,
  CreateVendorBillInput,
  UpdateVendorBillInput,
  Match3WayResult,
} from '@/types/accounting/vendor-bill';

export class VendorBillService {
  private companyId: string;
  private userId: string;

  constructor(companyId: string, userId: string) {
    this.companyId = companyId;
    this.userId = userId;
  }

  /**
   * Generate next bill number for the company
   * Format: BILL-2025-0001
   */
  private async generateBillNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const billsRef = collection(db, 'companies', this.companyId, 'vendorBills');
    const q = query(
      billsRef,
      where('billNumber', '>=', `BILL-${year}-`),
      where('billNumber', '<', `BILL-${year + 1}-`),
      orderBy('billNumber', 'desc'),
      firestoreLimit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return `BILL-${year}-0001`;
    }

    const lastBill = snapshot.docs[0].data();
    const lastNumber = parseInt(lastBill.billNumber.split('-')[2]);
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');

    return `BILL-${year}-${nextNumber}`;
  }

  /**
   * Calculate bill totals from line items
   */
  private calculateTotals(lineItems: Omit<VendorBillLine, 'id'>[]): {
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
  } {
    let subtotal = 0;
    let taxAmount = 0;

    lineItems.forEach((item) => {
      subtotal += item.amount;
      taxAmount += item.taxAmount || 0;
    });

    return {
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
    };
  }

  /**
   * Create a new vendor bill
   */
  async createVendorBill(input: CreateVendorBillInput): Promise<VendorBill> {
    try {
      const billNumber = await this.generateBillNumber();
      const totals = this.calculateTotals(input.lineItems);

      // Add IDs to line items
      const lineItems: VendorBillLine[] = input.lineItems.map((item, index) => ({
        ...item,
        id: `line-${index + 1}`,
      }));

      const now = new Date();
      const billData: Omit<VendorBill, 'id'> = {
        companyId: this.companyId,
        billNumber,
        vendorBillNumber: input.vendorBillNumber,
        vendorId: input.vendorId,
        vendorName: '', // Will be populated from vendor service
        status: 'draft',
        billDate: input.billDate,
        dueDate: input.dueDate,
        receivedDate: input.receivedDate,
        ...totals,
        currency: input.currency || 'USD',
        amountPaid: 0,
        amountDue: totals.totalAmount,
        lineItems,
        poId: input.poId,
        matched: false,
        glPosted: false,
        notes: input.notes,
        internalNotes: input.internalNotes,
        createdBy: this.userId,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(
        collection(db, 'companies', this.companyId, 'vendorBills'),
        {
          ...billData,
          billDate: Timestamp.fromDate(billData.billDate),
          dueDate: Timestamp.fromDate(billData.dueDate),
          receivedDate: billData.receivedDate
            ? Timestamp.fromDate(billData.receivedDate)
            : null,
          createdAt: Timestamp.fromDate(billData.createdAt),
          updatedAt: Timestamp.fromDate(billData.updatedAt),
        }
      );

      console.log('✅ [VendorBillService] Created vendor bill:', billNumber);

      return {
        ...billData,
        id: docRef.id,
      };
    } catch (error: any) {
      console.error('❌ [VendorBillService] Error creating vendor bill:', error);
      throw new Error(`Failed to create vendor bill: ${error.message}`);
    }
  }

  /**
   * Get vendor bill by ID
   */
  async getVendorBill(billId: string): Promise<VendorBill | null> {
    try {
      const docRef = doc(db, 'companies', this.companyId, 'vendorBills', billId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.convertFirestoreToBill(docSnap.id, docSnap.data());
    } catch (error: any) {
      console.error('❌ [VendorBillService] Error getting vendor bill:', error);
      throw new Error(`Failed to get vendor bill: ${error.message}`);
    }
  }

  /**
   * Get all vendor bills with optional filters
   */
  async getVendorBills(filters?: VendorBillFilters): Promise<VendorBill[]> {
    try {
      const billsRef = collection(db, 'companies', this.companyId, 'vendorBills');
      let constraints: any[] = [orderBy('createdAt', 'desc')];

      if (filters) {
        if (filters.vendorId) {
          constraints.push(where('vendorId', '==', filters.vendorId));
        }
        if (filters.status && filters.status.length > 0) {
          constraints.push(where('status', 'in', filters.status));
        }
        if (filters.dateFrom) {
          constraints.push(
            where('billDate', '>=', Timestamp.fromDate(filters.dateFrom))
          );
        }
        if (filters.dateTo) {
          constraints.push(
            where('billDate', '<=', Timestamp.fromDate(filters.dateTo))
          );
        }
        if (filters.poId) {
          constraints.push(where('poId', '==', filters.poId));
        }
      }

      const q = query(billsRef, ...constraints);
      const snapshot = await getDocs(q);

      const bills = snapshot.docs.map((doc) =>
        this.convertFirestoreToBill(doc.id, doc.data())
      );

      // Client-side filtering for fields that can't be indexed
      let filteredBills = bills;

      if (filters?.minAmount) {
        filteredBills = filteredBills.filter(
          (bill) => bill.totalAmount >= filters.minAmount!
        );
      }
      if (filters?.maxAmount) {
        filteredBills = filteredBills.filter(
          (bill) => bill.totalAmount <= filters.maxAmount!
        );
      }
      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filteredBills = filteredBills.filter(
          (bill) =>
            bill.billNumber.toLowerCase().includes(term) ||
            bill.vendorBillNumber.toLowerCase().includes(term) ||
            bill.vendorName.toLowerCase().includes(term)
        );
      }
      if (filters?.overdue) {
        const today = new Date();
        filteredBills = filteredBills.filter(
          (bill) =>
            bill.dueDate < today &&
            bill.status !== 'paid' &&
            bill.status !== 'cancelled'
        );
      }
      if (filters?.unpaid) {
        filteredBills = filteredBills.filter(
          (bill) =>
            bill.status !== 'paid' && bill.status !== 'cancelled' && bill.amountDue > 0
        );
      }
      if (filters?.dueDateFrom) {
        filteredBills = filteredBills.filter(
          (bill) => bill.dueDate >= filters.dueDateFrom!
        );
      }
      if (filters?.dueDateTo) {
        filteredBills = filteredBills.filter(
          (bill) => bill.dueDate <= filters.dueDateTo!
        );
      }

      return filteredBills;
    } catch (error: any) {
      console.error('❌ [VendorBillService] Error getting vendor bills:', error);
      throw new Error(`Failed to get vendor bills: ${error.message}`);
    }
  }

  /**
   * Update vendor bill
   */
  async updateVendorBill(
    billId: string,
    input: UpdateVendorBillInput
  ): Promise<void> {
    try {
      // Check if bill is posted (immutable unless super_admin)
      const existingBill = await this.getVendorBill(billId);
      if (!existingBill) {
        throw new Error('Vendor bill not found');
      }

      if (existingBill.status === 'posted') {
        // Note: In production, you would check if user has super_admin role here
        console.warn('⚠️ [VendorBillService] Attempting to update posted bill');
      }

      const updateData: any = {
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: this.userId,
      };

      if (input.vendorBillNumber !== undefined)
        updateData.vendorBillNumber = input.vendorBillNumber;
      if (input.vendorId !== undefined) updateData.vendorId = input.vendorId;
      if (input.billDate !== undefined)
        updateData.billDate = Timestamp.fromDate(input.billDate);
      if (input.dueDate !== undefined)
        updateData.dueDate = Timestamp.fromDate(input.dueDate);
      if (input.receivedDate !== undefined)
        updateData.receivedDate = input.receivedDate
          ? Timestamp.fromDate(input.receivedDate)
          : null;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.internalNotes !== undefined)
        updateData.internalNotes = input.internalNotes;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.poId !== undefined) updateData.poId = input.poId;

      if (input.lineItems) {
        const lineItems: VendorBillLine[] = input.lineItems.map((item, index) => ({
          ...item,
          id: `line-${index + 1}`,
        }));

        const totals = this.calculateTotals(input.lineItems);
        updateData.lineItems = lineItems;
        updateData.subtotal = totals.subtotal;
        updateData.taxAmount = totals.taxAmount;
        updateData.totalAmount = totals.totalAmount;

        // Recalculate amount due
        const amountPaid = existingBill.amountPaid || 0;
        updateData.amountDue = totals.totalAmount - amountPaid;
      }

      const docRef = doc(db, 'companies', this.companyId, 'vendorBills', billId);
      await updateDoc(docRef, updateData);

      console.log('✅ [VendorBillService] Updated vendor bill:', billId);
    } catch (error: any) {
      console.error('❌ [VendorBillService] Error updating vendor bill:', error);
      throw new Error(`Failed to update vendor bill: ${error.message}`);
    }
  }

  /**
   * Submit bill for approval
   */
  async submitForApproval(billId: string): Promise<void> {
    try {
      const docRef = doc(db, 'companies', this.companyId, 'vendorBills', billId);
      await updateDoc(docRef, {
        status: 'pending_approval',
        submittedForApprovalAt: Timestamp.fromDate(new Date()),
        submittedForApprovalBy: this.userId,
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: this.userId,
      });

      console.log('✅ [VendorBillService] Submitted bill for approval:', billId);
    } catch (error: any) {
      console.error('❌ [VendorBillService] Error submitting bill:', error);
      throw new Error(`Failed to submit vendor bill for approval: ${error.message}`);
    }
  }

  /**
   * Approve vendor bill
   */
  async approveBill(billId: string): Promise<void> {
    try {
      const docRef = doc(db, 'companies', this.companyId, 'vendorBills', billId);
      await updateDoc(docRef, {
        status: 'approved',
        approvedBy: this.userId,
        approvedAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: this.userId,
      });

      console.log('✅ [VendorBillService] Approved bill:', billId);
    } catch (error: any) {
      console.error('❌ [VendorBillService] Error approving bill:', error);
      throw new Error(`Failed to approve vendor bill: ${error.message}`);
    }
  }

  /**
   * Reject vendor bill
   */
  async rejectBill(billId: string, reason: string): Promise<void> {
    try {
      const docRef = doc(db, 'companies', this.companyId, 'vendorBills', billId);
      await updateDoc(docRef, {
        status: 'draft',
        rejectedBy: this.userId,
        rejectedAt: Timestamp.fromDate(new Date()),
        rejectionReason: reason,
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: this.userId,
      });

      console.log('✅ [VendorBillService] Rejected bill:', billId);
    } catch (error: any) {
      console.error('❌ [VendorBillService] Error rejecting bill:', error);
      throw new Error(`Failed to reject vendor bill: ${error.message}`);
    }
  }

  /**
   * Delete vendor bill (draft only)
   */
  async deleteBill(billId: string): Promise<void> {
    try {
      const bill = await this.getVendorBill(billId);
      if (!bill) {
        throw new Error('Vendor bill not found');
      }

      if (bill.status !== 'draft') {
        throw new Error('Only draft vendor bills can be deleted');
      }

      const docRef = doc(db, 'companies', this.companyId, 'vendorBills', billId);
      await deleteDoc(docRef);

      console.log('✅ [VendorBillService] Deleted bill:', billId);
    } catch (error: any) {
      console.error('❌ [VendorBillService] Error deleting bill:', error);
      throw new Error(`Failed to delete vendor bill: ${error.message}`);
    }
  }

  /**
   * Get vendor bill summary statistics
   */
  async getVendorBillSummary(): Promise<VendorBillSummary> {
    try {
      const bills = await this.getVendorBills();
      const today = new Date();

      const overdueBills = bills.filter(
        (bill) =>
          bill.dueDate < today &&
          bill.status !== 'paid' &&
          bill.status !== 'cancelled'
      );

      const summary: VendorBillSummary = {
        totalBills: bills.length,
        draftCount: bills.filter((b) => b.status === 'draft').length,
        pendingApprovalCount: bills.filter((b) => b.status === 'pending_approval')
          .length,
        approvedCount: bills.filter((b) => b.status === 'approved').length,
        postedCount: bills.filter((b) => b.status === 'posted').length,
        paidCount: bills.filter((b) => b.status === 'paid').length,
        cancelledCount: bills.filter((b) => b.status === 'cancelled').length,
        totalValue: bills.reduce((sum, b) => sum + b.totalAmount, 0),
        totalPaid: bills.reduce((sum, b) => sum + b.amountPaid, 0),
        totalDue: bills.reduce((sum, b) => sum + b.amountDue, 0),
        overdueCount: overdueBills.length,
        overdueAmount: overdueBills.reduce((sum, b) => sum + b.amountDue, 0),
      };

      return summary;
    } catch (error: any) {
      console.error('❌ [VendorBillService] Error getting summary:', error);
      throw new Error(`Failed to get vendor bill summary: ${error.message}`);
    }
  }

  /**
   * Match bill to purchase order (basic 3-way matching)
   * Compares bill line items against PO line items
   */
  async matchBillToPO(billId: string, poId: string): Promise<Match3WayResult> {
    try {
      const bill = await this.getVendorBill(billId);
      if (!bill) {
        throw new Error('Vendor bill not found');
      }

      // Get PO data (would call PurchaseOrderService in real implementation)
      const poDocRef = doc(db, 'companies', this.companyId, 'purchaseOrders', poId);
      const poSnap = await getDoc(poDocRef);

      if (!poSnap.exists()) {
        throw new Error('Purchase order not found');
      }

      const poData = poSnap.data();
      const poLineItems = poData.lineItems || [];

      const discrepancies: Match3WayResult['discrepancies'] = [];
      let matched = true;
      let requiresApproval = false;

      // Check each bill line against PO lines
      for (const billLine of bill.lineItems) {
        const poLine = poLineItems.find(
          (pl: any) => pl.id === billLine.poLineId || pl.description === billLine.description
        );

        if (!poLine) {
          discrepancies.push({
            type: 'missing_po_line',
            description: `Bill line "${billLine.description}" not found in PO`,
            billLineId: billLine.id,
          });
          matched = false;
          requiresApproval = true;
          continue;
        }

        // Check price variance (tolerance: 5%)
        const priceTolerance = 0.05;
        const priceVariance = Math.abs(billLine.unitPrice - poLine.unitPrice);
        const priceVariancePercent = priceVariance / poLine.unitPrice;

        if (priceVariancePercent > priceTolerance) {
          discrepancies.push({
            type: 'price_variance',
            description: `Price variance on "${billLine.description}": Bill ${billLine.unitPrice} vs PO ${poLine.unitPrice}`,
            billLineId: billLine.id,
            poLineId: poLine.id,
            variance: priceVariance,
          });
          matched = false;
          requiresApproval = true;
        }

        // Check quantity variance (tolerance: 5%)
        const quantityTolerance = 0.05;
        const quantityVariance = Math.abs(billLine.quantity - poLine.quantity);
        const quantityVariancePercent = quantityVariance / poLine.quantity;

        if (quantityVariancePercent > quantityTolerance) {
          discrepancies.push({
            type: 'quantity_variance',
            description: `Quantity variance on "${billLine.description}": Bill ${billLine.quantity} vs PO ${poLine.quantity}`,
            billLineId: billLine.id,
            poLineId: poLine.id,
            variance: quantityVariance,
          });
          matched = false;
          requiresApproval = true;
        }
      }

      // Check for PO lines not in bill
      for (const poLine of poLineItems) {
        const billLine = bill.lineItems.find(
          (bl) => bl.poLineId === poLine.id || bl.description === poLine.description
        );

        if (!billLine) {
          discrepancies.push({
            type: 'missing_bill_line',
            description: `PO line "${poLine.description}" not found in bill`,
            poLineId: poLine.id,
          });
          matched = false;
        }
      }

      // Update bill with match results
      const docRef = doc(db, 'companies', this.companyId, 'vendorBills', billId);
      await updateDoc(docRef, {
        matched,
        matchedAt: Timestamp.fromDate(new Date()),
        matchedBy: this.userId,
        poId,
        poNumber: poData.poNumber,
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: this.userId,
      });

      console.log('✅ [VendorBillService] 3-way match completed:', {
        billId,
        poId,
        matched,
        discrepancies: discrepancies.length,
      });

      return {
        matched,
        discrepancies,
        requiresApproval,
      };
    } catch (error: any) {
      console.error('❌ [VendorBillService] Error matching bill to PO:', error);
      throw new Error(`Failed to match bill to PO: ${error.message}`);
    }
  }

  /**
   * Update payment allocation (called from payment service)
   */
  async updatePaymentAllocation(
    billId: string,
    paymentId: string,
    paymentAmount: number
  ): Promise<void> {
    try {
      const bill = await this.getVendorBill(billId);
      if (!bill) {
        throw new Error('Vendor bill not found');
      }

      const newAmountPaid = bill.amountPaid + paymentAmount;
      const newAmountDue = bill.totalAmount - newAmountPaid;
      const paymentIds = bill.paymentIds || [];

      // Determine new status
      let newStatus: VendorBillStatus = bill.status;
      if (newAmountDue <= 0) {
        newStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newStatus = 'partially_paid';
      }

      const docRef = doc(db, 'companies', this.companyId, 'vendorBills', billId);
      await updateDoc(docRef, {
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus,
        paymentIds: [...paymentIds, paymentId],
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: this.userId,
      });

      console.log('✅ [VendorBillService] Updated payment allocation:', {
        billId,
        paymentId,
        paymentAmount,
        newStatus,
      });
    } catch (error: any) {
      console.error('❌ [VendorBillService] Error updating payment allocation:', error);
      throw new Error(`Failed to update payment allocation: ${error.message}`);
    }
  }

  /**
   * Convert Firestore document to VendorBill type
   */
  private convertFirestoreToBill(id: string, data: DocumentData): VendorBill {
    return {
      id,
      companyId: data.companyId,
      billNumber: data.billNumber,
      vendorBillNumber: data.vendorBillNumber,
      vendorId: data.vendorId,
      vendorName: data.vendorName || '',
      status: data.status,
      billDate: (data.billDate as Timestamp).toDate(),
      dueDate: (data.dueDate as Timestamp).toDate(),
      receivedDate: data.receivedDate
        ? (data.receivedDate as Timestamp).toDate()
        : undefined,
      subtotal: data.subtotal,
      taxAmount: data.taxAmount,
      totalAmount: data.totalAmount,
      currency: data.currency,
      amountPaid: data.amountPaid || 0,
      amountDue: data.amountDue,
      lineItems: data.lineItems || [],
      poId: data.poId,
      poNumber: data.poNumber,
      matched: data.matched || false,
      matchedAt: data.matchedAt
        ? (data.matchedAt as Timestamp).toDate()
        : undefined,
      matchedBy: data.matchedBy,
      notes: data.notes,
      internalNotes: data.internalNotes,
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
      glPosted: data.glPosted || false,
      glPostingDate: data.glPostingDate
        ? (data.glPostingDate as Timestamp).toDate()
        : undefined,
      glPostedBy: data.glPostedBy,
      journalEntryId: data.journalEntryId,
      paymentIds: data.paymentIds || [],
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
      updatedBy: data.updatedBy,
    };
  }
}

/**
 * Factory function to create VendorBillService instance
 */
export function createVendorBillService(
  companyId: string,
  userId: string
): VendorBillService {
  return new VendorBillService(companyId, userId);
}
