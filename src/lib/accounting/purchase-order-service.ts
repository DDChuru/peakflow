/**
 * Purchase Order Service
 * Phase 2: Accounts Payable
 *
 * Handles CRUD operations for purchase orders with simple approval workflow
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
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderStatus,
  PurchaseOrderFilters,
  PurchaseOrderSummary,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
} from '@/types/accounting/purchase-order';

export class PurchaseOrderService {
  private companyId: string;
  private userId: string;

  constructor(companyId: string, userId: string) {
    this.companyId = companyId;
    this.userId = userId;
  }

  /**
   * Generate next PO number for the company
   */
  private async generatePONumber(): Promise<string> {
    const year = new Date().getFullYear();
    const posRef = collection(db, 'companies', this.companyId, 'purchaseOrders');
    const q = query(
      posRef,
      where('poNumber', '>=', `PO-${year}-`),
      where('poNumber', '<', `PO-${year + 1}-`),
      orderBy('poNumber', 'desc'),
      firestoreLimit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return `PO-${year}-0001`;
    }

    const lastPO = snapshot.docs[0].data();
    const lastNumber = parseInt(lastPO.poNumber.split('-')[2]);
    const nextNumber = (lastNumber + 1).toString().padStart(4, '0');

    return `PO-${year}-${nextNumber}`;
  }

  /**
   * Calculate PO totals from line items
   */
  private calculateTotals(lineItems: Omit<PurchaseOrderLine, 'id'>[]): {
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
   * Create a new purchase order
   */
  async createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    try {
      const poNumber = await this.generatePONumber();
      const totals = this.calculateTotals(input.lineItems);

      // Add IDs to line items
      const lineItems: PurchaseOrderLine[] = input.lineItems.map((item, index) => ({
        ...item,
        id: `line-${index + 1}`,
        quantityReceived: 0,
        quantityInvoiced: 0,
      }));

      const now = new Date();
      const poData: Omit<PurchaseOrder, 'id'> = {
        companyId: this.companyId,
        poNumber,
        vendorId: input.vendorId,
        vendorName: '', // Will be populated from vendor service
        status: 'draft',
        orderDate: input.orderDate,
        expectedDeliveryDate: input.expectedDeliveryDate,
        ...totals,
        currency: input.currency || 'USD',
        lineItems,
        deliveryAddress: input.deliveryAddress,
        deliveryContact: input.deliveryContact,
        deliveryPhone: input.deliveryPhone,
        notes: input.notes,
        internalNotes: input.internalNotes,
        termsAndConditions: input.termsAndConditions,
        createdBy: this.userId,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await addDoc(
        collection(db, 'companies', this.companyId, 'purchaseOrders'),
        {
          ...poData,
          orderDate: Timestamp.fromDate(poData.orderDate),
          expectedDeliveryDate: poData.expectedDeliveryDate
            ? Timestamp.fromDate(poData.expectedDeliveryDate)
            : null,
          createdAt: Timestamp.fromDate(poData.createdAt),
          updatedAt: Timestamp.fromDate(poData.updatedAt),
        }
      );

      console.log('✅ [PurchaseOrderService] Created PO:', poNumber);

      return {
        ...poData,
        id: docRef.id,
      };
    } catch (error: any) {
      console.error('❌ [PurchaseOrderService] Error creating PO:', error);
      throw new Error(`Failed to create purchase order: ${error.message}`);
    }
  }

  /**
   * Get purchase order by ID
   */
  async getPurchaseOrder(poId: string): Promise<PurchaseOrder | null> {
    try {
      const docRef = doc(db, 'companies', this.companyId, 'purchaseOrders', poId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.convertFirestoreToPO(docSnap.id, docSnap.data());
    } catch (error: any) {
      console.error('❌ [PurchaseOrderService] Error getting PO:', error);
      throw new Error(`Failed to get purchase order: ${error.message}`);
    }
  }

  /**
   * Get all purchase orders with optional filters
   */
  async getPurchaseOrders(filters?: PurchaseOrderFilters): Promise<PurchaseOrder[]> {
    try {
      const posRef = collection(db, 'companies', this.companyId, 'purchaseOrders');
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
            where('orderDate', '>=', Timestamp.fromDate(filters.dateFrom))
          );
        }
        if (filters.dateTo) {
          constraints.push(
            where('orderDate', '<=', Timestamp.fromDate(filters.dateTo))
          );
        }
      }

      const q = query(posRef, ...constraints);
      const snapshot = await getDocs(q);

      const pos = snapshot.docs.map((doc) =>
        this.convertFirestoreToPO(doc.id, doc.data())
      );

      // Client-side filtering for fields that can't be indexed
      let filteredPOs = pos;

      if (filters?.minAmount) {
        filteredPOs = filteredPOs.filter((po) => po.totalAmount >= filters.minAmount!);
      }
      if (filters?.maxAmount) {
        filteredPOs = filteredPOs.filter((po) => po.totalAmount <= filters.maxAmount!);
      }
      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filteredPOs = filteredPOs.filter(
          (po) =>
            po.poNumber.toLowerCase().includes(term) ||
            po.vendorName.toLowerCase().includes(term)
        );
      }

      return filteredPOs;
    } catch (error: any) {
      console.error('❌ [PurchaseOrderService] Error getting POs:', error);
      throw new Error(`Failed to get purchase orders: ${error.message}`);
    }
  }

  /**
   * Update purchase order
   */
  async updatePurchaseOrder(
    poId: string,
    input: UpdatePurchaseOrderInput
  ): Promise<void> {
    try {
      const updateData: any = {
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: this.userId,
      };

      if (input.vendorId !== undefined) updateData.vendorId = input.vendorId;
      if (input.orderDate !== undefined)
        updateData.orderDate = Timestamp.fromDate(input.orderDate);
      if (input.expectedDeliveryDate !== undefined)
        updateData.expectedDeliveryDate = input.expectedDeliveryDate
          ? Timestamp.fromDate(input.expectedDeliveryDate)
          : null;
      if (input.deliveryAddress !== undefined)
        updateData.deliveryAddress = input.deliveryAddress;
      if (input.deliveryContact !== undefined)
        updateData.deliveryContact = input.deliveryContact;
      if (input.deliveryPhone !== undefined)
        updateData.deliveryPhone = input.deliveryPhone;
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.internalNotes !== undefined)
        updateData.internalNotes = input.internalNotes;
      if (input.termsAndConditions !== undefined)
        updateData.termsAndConditions = input.termsAndConditions;
      if (input.status !== undefined) updateData.status = input.status;

      if (input.lineItems) {
        const lineItems: PurchaseOrderLine[] = input.lineItems.map((item, index) => ({
          ...item,
          id: `line-${index + 1}`,
          quantityReceived: 0,
          quantityInvoiced: 0,
        }));

        const totals = this.calculateTotals(input.lineItems);
        updateData.lineItems = lineItems;
        updateData.subtotal = totals.subtotal;
        updateData.taxAmount = totals.taxAmount;
        updateData.totalAmount = totals.totalAmount;
      }

      const docRef = doc(db, 'companies', this.companyId, 'purchaseOrders', poId);
      await updateDoc(docRef, updateData);

      console.log('✅ [PurchaseOrderService] Updated PO:', poId);
    } catch (error: any) {
      console.error('❌ [PurchaseOrderService] Error updating PO:', error);
      throw new Error(`Failed to update purchase order: ${error.message}`);
    }
  }

  /**
   * Submit PO for approval
   */
  async submitForApproval(poId: string): Promise<void> {
    try {
      const docRef = doc(db, 'companies', this.companyId, 'purchaseOrders', poId);
      await updateDoc(docRef, {
        status: 'pending_approval',
        submittedForApprovalAt: Timestamp.fromDate(new Date()),
        submittedForApprovalBy: this.userId,
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: this.userId,
      });

      console.log('✅ [PurchaseOrderService] Submitted PO for approval:', poId);
    } catch (error: any) {
      console.error('❌ [PurchaseOrderService] Error submitting PO:', error);
      throw new Error(`Failed to submit purchase order for approval: ${error.message}`);
    }
  }

  /**
   * Approve purchase order
   */
  async approvePurchaseOrder(poId: string): Promise<void> {
    try {
      const docRef = doc(db, 'companies', this.companyId, 'purchaseOrders', poId);
      await updateDoc(docRef, {
        status: 'approved',
        approvedBy: this.userId,
        approvedAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: this.userId,
      });

      console.log('✅ [PurchaseOrderService] Approved PO:', poId);
    } catch (error: any) {
      console.error('❌ [PurchaseOrderService] Error approving PO:', error);
      throw new Error(`Failed to approve purchase order: ${error.message}`);
    }
  }

  /**
   * Reject purchase order
   */
  async rejectPurchaseOrder(poId: string, reason: string): Promise<void> {
    try {
      const docRef = doc(db, 'companies', this.companyId, 'purchaseOrders', poId);
      await updateDoc(docRef, {
        status: 'draft',
        rejectedBy: this.userId,
        rejectedAt: Timestamp.fromDate(new Date()),
        rejectionReason: reason,
        updatedAt: Timestamp.fromDate(new Date()),
        updatedBy: this.userId,
      });

      console.log('✅ [PurchaseOrderService] Rejected PO:', poId);
    } catch (error: any) {
      console.error('❌ [PurchaseOrderService] Error rejecting PO:', error);
      throw new Error(`Failed to reject purchase order: ${error.message}`);
    }
  }

  /**
   * Delete purchase order (draft only)
   */
  async deletePurchaseOrder(poId: string): Promise<void> {
    try {
      const po = await this.getPurchaseOrder(poId);
      if (!po) {
        throw new Error('Purchase order not found');
      }

      if (po.status !== 'draft') {
        throw new Error('Only draft purchase orders can be deleted');
      }

      const docRef = doc(db, 'companies', this.companyId, 'purchaseOrders', poId);
      await deleteDoc(docRef);

      console.log('✅ [PurchaseOrderService] Deleted PO:', poId);
    } catch (error: any) {
      console.error('❌ [PurchaseOrderService] Error deleting PO:', error);
      throw new Error(`Failed to delete purchase order: ${error.message}`);
    }
  }

  /**
   * Get PO summary statistics
   */
  async getPurchaseOrderSummary(): Promise<PurchaseOrderSummary> {
    try {
      const pos = await this.getPurchaseOrders();

      const summary: PurchaseOrderSummary = {
        totalPOs: pos.length,
        draftCount: pos.filter((p) => p.status === 'draft').length,
        pendingApprovalCount: pos.filter((p) => p.status === 'pending_approval')
          .length,
        approvedCount: pos.filter((p) => p.status === 'approved').length,
        openCount: pos.filter(
          (p) =>
            p.status === 'approved' || p.status === 'sent' || p.status === 'received'
        ).length,
        closedCount: pos.filter((p) => p.status === 'closed').length,
        cancelledCount: pos.filter((p) => p.status === 'cancelled').length,
        totalValue: pos.reduce((sum, p) => sum + p.totalAmount, 0),
        outstandingValue: pos
          .filter((p) => p.status !== 'closed' && p.status !== 'cancelled')
          .reduce((sum, p) => sum + p.totalAmount, 0),
      };

      return summary;
    } catch (error: any) {
      console.error('❌ [PurchaseOrderService] Error getting summary:', error);
      throw new Error(`Failed to get purchase order summary: ${error.message}`);
    }
  }

  /**
   * Convert Firestore document to PurchaseOrder type
   */
  private convertFirestoreToPO(id: string, data: DocumentData): PurchaseOrder {
    return {
      id,
      companyId: data.companyId,
      poNumber: data.poNumber,
      vendorId: data.vendorId,
      vendorName: data.vendorName || '',
      vendorEmail: data.vendorEmail,
      status: data.status,
      orderDate: (data.orderDate as Timestamp).toDate(),
      expectedDeliveryDate: data.expectedDeliveryDate
        ? (data.expectedDeliveryDate as Timestamp).toDate()
        : undefined,
      deliveryDate: data.deliveryDate
        ? (data.deliveryDate as Timestamp).toDate()
        : undefined,
      subtotal: data.subtotal,
      taxAmount: data.taxAmount,
      totalAmount: data.totalAmount,
      currency: data.currency,
      lineItems: data.lineItems || [],
      deliveryAddress: data.deliveryAddress,
      deliveryContact: data.deliveryContact,
      deliveryPhone: data.deliveryPhone,
      notes: data.notes,
      internalNotes: data.internalNotes,
      termsAndConditions: data.termsAndConditions,
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
      sentToVendorAt: data.sentToVendorAt
        ? (data.sentToVendorAt as Timestamp).toDate()
        : undefined,
      sentToVendorBy: data.sentToVendorBy,
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
      updatedBy: data.updatedBy,
    };
  }
}

/**
 * Factory function to create PurchaseOrderService instance
 */
export function createPurchaseOrderService(
  companyId: string,
  userId: string
): PurchaseOrderService {
  return new PurchaseOrderService(companyId, userId);
}
