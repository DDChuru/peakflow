import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
  DocumentData,
  QueryConstraint,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  ServiceAgreement,
  SLALineItem,
  SLALineItemHistory,
  SLASummary,
  SLAFilters,
  SLAValidationResult,
  ValidationError,
  ValidationWarning,
  SLAProcessingResult,
  BillingFrequency,
  SLAStatus
} from '@/types/accounting/sla';

export class SLAService {
  /**
   * Get collection path for company-scoped SLAs
   */
  private getCollectionPath(companyId: string): string {
    return `companies/${companyId}/serviceAgreements`;
  }

  /**
   * Get history collection path for SLA line item changes
   */
  private getHistoryCollectionPath(companyId: string, slaId: string): string {
    return `companies/${companyId}/serviceAgreements/${slaId}/history`;
  }

  /**
   * Create a new service agreement
   */
  async createSLA(
    companyId: string,
    sla: Omit<ServiceAgreement, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>,
    userId: string
  ): Promise<ServiceAgreement> {
    try {
      // Validate SLA before creation
      const validation = await this.validateSLA({ ...sla, companyId } as ServiceAgreement);
      if (!validation.isValid) {
        throw new Error(`SLA validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const slaRef = doc(collection(db, this.getCollectionPath(companyId)));

      // Calculate total contract value from line items
      const totalValue = sla.lineItems.reduce((sum, item) => sum + item.amount, 0);

      const newSLA: ServiceAgreement = {
        ...sla,
        id: slaRef.id,
        companyId,
        contractValue: totalValue,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      };

      // Generate line item IDs and ensure they have required fields
      newSLA.lineItems = sla.lineItems.map((item, index) => ({
        ...item,
        id: `${slaRef.id}-line-${index + 1}`,
        amount: item.quantity * item.unitPrice,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      await setDoc(slaRef, {
        ...newSLA,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create history records for initial line items
      await this.createLineItemHistory(companyId, newSLA.id, newSLA.lineItems, 'created', userId);

      return newSLA;
    } catch (error) {
      console.error('Error creating SLA:', error);
      throw new Error(`Failed to create SLA: ${error}`);
    }
  }

  /**
   * Get all SLAs for a company with optional filtering
   */
  async getSLAs(companyId: string, filters?: SLAFilters): Promise<ServiceAgreement[]> {
    try {
      const constraints: QueryConstraint[] = [];

      // Apply filters
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          constraints.push(where('status', 'in', filters.status));
        } else {
          constraints.push(where('status', '==', filters.status));
        }
      }

      if (filters?.customerId) {
        constraints.push(where('customerId', '==', filters.customerId));
      }

      if (filters?.billingFrequency) {
        constraints.push(where('billingFrequency', '==', filters.billingFrequency));
      }

      if (filters?.autoGenerateOnly) {
        constraints.push(where('autoGenerateInvoices', '==', true));
      }

      // Default ordering
      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(
        collection(db, this.getCollectionPath(companyId)),
        ...constraints
      );

      const querySnapshot = await getDocs(q);
      const slas: ServiceAgreement[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const sla = this.convertFirestoreToSLA(doc.id, data);

        // Client-side filtering for complex criteria
        if (this.applySLAFilters(sla, filters)) {
          slas.push(sla);
        }
      });

      return slas;
    } catch (error) {
      console.error('Error fetching SLAs:', error);
      throw new Error(`Failed to fetch SLAs: ${error}`);
    }
  }

  /**
   * Get a single SLA by ID
   */
  async getSLA(companyId: string, slaId: string): Promise<ServiceAgreement | null> {
    try {
      const slaRef = doc(db, this.getCollectionPath(companyId), slaId);
      const slaDoc = await getDoc(slaRef);

      if (!slaDoc.exists()) {
        return null;
      }

      return this.convertFirestoreToSLA(slaDoc.id, slaDoc.data());
    } catch (error) {
      console.error('Error fetching SLA:', error);
      throw new Error(`Failed to fetch SLA: ${error}`);
    }
  }

  /**
   * Update an existing SLA
   */
  async updateSLA(
    companyId: string,
    slaId: string,
    updates: Partial<Omit<ServiceAgreement, 'id' | 'companyId' | 'createdAt'>>,
    userId: string
  ): Promise<void> {
    try {
      const slaRef = doc(db, this.getCollectionPath(companyId), slaId);

      // Verify SLA exists
      const slaDoc = await getDoc(slaRef);
      if (!slaDoc.exists()) {
        throw new Error('SLA not found');
      }

      // If updating line items, handle history tracking
      if (updates.lineItems) {
        const existingSLA = this.convertFirestoreToSLA(slaId, slaDoc.data());
        await this.updateLineItemsWithHistory(companyId, slaId, existingSLA.lineItems, updates.lineItems, userId);
      }

      // Recalculate contract value if line items changed
      if (updates.lineItems) {
        updates.contractValue = updates.lineItems.reduce((sum, item) => sum + item.amount, 0);
      }

      await updateDoc(slaRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating SLA:', error);
      throw new Error(`Failed to update SLA: ${error}`);
    }
  }

  /**
   * Delete (deactivate) an SLA
   */
  async deleteSLA(companyId: string, slaId: string, userId: string): Promise<void> {
    try {
      await this.updateSLA(companyId, slaId, { status: 'cancelled' }, userId);
    } catch (error) {
      console.error('Error deleting SLA:', error);
      throw new Error(`Failed to delete SLA: ${error}`);
    }
  }

  /**
   * Get SLAs due for billing
   */
  async getDueSLAs(companyId: string, asOfDate?: Date): Promise<ServiceAgreement[]> {
    try {
      const cutoffDate = asOfDate || new Date();
      const cutoffDateString = cutoffDate.toISOString().split('T')[0];

      const activeSLAs = await this.getSLAs(companyId, {
        status: 'active',
        autoGenerateOnly: true
      });

      return activeSLAs.filter(sla =>
        sla.nextBillingDate <= cutoffDateString &&
        new Date(sla.endDate) >= cutoffDate
      );
    } catch (error) {
      console.error('Error fetching due SLAs:', error);
      throw new Error(`Failed to fetch due SLAs: ${error}`);
    }
  }

  /**
   * Calculate next billing date based on frequency
   */
  calculateNextBillingDate(
    currentDate: Date,
    frequency: BillingFrequency,
    dayOfMonth?: number
  ): Date {
    const nextDate = new Date(currentDate);

    switch (frequency) {
      case 'monthly':
        if (dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31) {
          nextDate.setMonth(nextDate.getMonth() + 1);
          nextDate.setDate(Math.min(dayOfMonth, this.getDaysInMonth(nextDate)));
        } else {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;

      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;

      case 'annual':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;

      case 'custom':
        // For custom frequency, caller should handle separately
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }

    return nextDate;
  }

  /**
   * Update next billing date for an SLA
   */
  async updateNextBillingDate(
    companyId: string,
    slaId: string,
    billingDate: Date
  ): Promise<void> {
    try {
      const sla = await this.getSLA(companyId, slaId);
      if (!sla) {
        throw new Error('SLA not found');
      }

      const nextBillingDate = this.calculateNextBillingDate(
        billingDate,
        sla.billingFrequency,
        sla.dayOfMonth
      );

      await updateDoc(doc(db, this.getCollectionPath(companyId), slaId), {
        lastBillingDate: billingDate.toISOString().split('T')[0],
        nextBillingDate: nextBillingDate.toISOString().split('T')[0],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating next billing date:', error);
      throw new Error(`Failed to update next billing date: ${error}`);
    }
  }

  /**
   * Get SLA summary statistics
   */
  async getSLASummary(companyId: string): Promise<SLASummary> {
    try {
      const allSLAs = await this.getSLAs(companyId);
      const activeSLAs = allSLAs.filter(sla => sla.status === 'active');

      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
      const sevenDaysFromNow = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));

      const expiringSoon = activeSLAs.filter(sla =>
        new Date(sla.endDate) <= thirtyDaysFromNow && new Date(sla.endDate) >= today
      );

      const nextBillingCount = activeSLAs.filter(sla =>
        new Date(sla.nextBillingDate) <= sevenDaysFromNow && sla.autoGenerateInvoices
      );

      // Calculate monthly recurring revenue
      const monthlyRevenue = activeSLAs.reduce((sum, sla) => {
        let monthlyAmount = 0;
        switch (sla.billingFrequency) {
          case 'monthly':
            monthlyAmount = sla.contractValue;
            break;
          case 'quarterly':
            monthlyAmount = sla.contractValue / 3;
            break;
          case 'annual':
            monthlyAmount = sla.contractValue / 12;
            break;
          default:
            monthlyAmount = sla.contractValue / 12; // Default to annual
        }
        return sum + monthlyAmount;
      }, 0);

      // Group by customer for top customers
      const customerGroups = activeSLAs.reduce((acc, sla) => {
        if (!acc[sla.customerId]) {
          acc[sla.customerId] = {
            customerId: sla.customerId,
            customerName: sla.customerName || 'Unknown',
            totalValue: 0,
            activeSLAs: 0
          };
        }
        acc[sla.customerId].totalValue += sla.contractValue;
        acc[sla.customerId].activeSLAs += 1;
        return acc;
      }, {} as Record<string, any>);

      const topCustomers = Object.values(customerGroups)
        .sort((a: any, b: any) => b.totalValue - a.totalValue)
        .slice(0, 5);

      return {
        totalSLAs: allSLAs.length,
        activeSLAs: activeSLAs.length,
        expiringSoon: expiringSoon.length,
        totalAnnualValue: activeSLAs.reduce((sum, sla) => {
          // Convert all to annual value
          let annualValue = sla.contractValue;
          switch (sla.billingFrequency) {
            case 'monthly':
              annualValue = sla.contractValue * 12;
              break;
            case 'quarterly':
              annualValue = sla.contractValue * 4;
              break;
          }
          return sum + annualValue;
        }, 0),
        monthlyRecurringRevenue: monthlyRevenue,
        overdueInvoices: 0, // TODO: Calculate from invoice service
        nextBillingCount: nextBillingCount.length,
        topCustomers
      };
    } catch (error) {
      console.error('Error generating SLA summary:', error);
      throw new Error(`Failed to generate SLA summary: ${error}`);
    }
  }

  /**
   * Validate SLA data
   */
  private async validateSLA(sla: ServiceAgreement): Promise<SLAValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Required field validation
    if (!sla.contractNumber) {
      errors.push({
        field: 'contractNumber',
        code: 'REQUIRED',
        message: 'Contract number is required'
      });
    }

    if (!sla.contractName) {
      errors.push({
        field: 'contractName',
        code: 'REQUIRED',
        message: 'Contract name is required'
      });
    }

    // Date validation
    const startDate = new Date(sla.startDate);
    const endDate = new Date(sla.endDate);

    if (endDate <= startDate) {
      errors.push({
        field: 'endDate',
        code: 'INVALID_DATE_RANGE',
        message: 'End date must be after start date'
      });
    }

    // Line items validation
    if (!sla.lineItems || sla.lineItems.length === 0) {
      errors.push({
        field: 'lineItems',
        code: 'NO_LINE_ITEMS',
        message: 'At least one line item is required'
      });
    } else {
      sla.lineItems.forEach((item, index) => {
        if (!item.description) {
          errors.push({
            field: `lineItems[${index}].description`,
            code: 'REQUIRED',
            message: `Line item ${index + 1}: Description is required`
          });
        }

        if (item.quantity <= 0) {
          errors.push({
            field: `lineItems[${index}].quantity`,
            code: 'INVALID_QUANTITY',
            message: `Line item ${index + 1}: Quantity must be greater than 0`
          });
        }

        if (item.unitPrice < 0) {
          errors.push({
            field: `lineItems[${index}].unitPrice`,
            code: 'INVALID_PRICE',
            message: `Line item ${index + 1}: Unit price cannot be negative`
          });
        }

        if (!item.glAccountId) {
          errors.push({
            field: `lineItems[${index}].glAccountId`,
            code: 'REQUIRED',
            message: `Line item ${index + 1}: GL Account is required`
          });
        }
      });
    }

    // Business logic validation
    if (sla.autoGenerateInvoices && !sla.nextBillingDate) {
      warnings.push({
        field: 'nextBillingDate',
        code: 'MISSING_BILLING_DATE',
        message: 'Next billing date should be set for automatic invoice generation'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Apply client-side filters
   */
  private applySLAFilters(sla: ServiceAgreement, filters?: SLAFilters): boolean {
    if (!filters) return true;

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      const searchableText = [
        sla.contractNumber,
        sla.contractName,
        sla.customerName,
        sla.description
      ].join(' ').toLowerCase();

      if (!searchableText.includes(term)) {
        return false;
      }
    }

    if (filters.dueDateFrom && sla.nextBillingDate < filters.dueDateFrom) {
      return false;
    }

    if (filters.dueDateTo && sla.nextBillingDate > filters.dueDateTo) {
      return false;
    }

    if (filters.valueMin && sla.contractValue < filters.valueMin) {
      return false;
    }

    if (filters.valueMax && sla.contractValue > filters.valueMax) {
      return false;
    }

    if (filters.tags && filters.tags.length > 0) {
      if (!sla.tags || !filters.tags.some(tag => sla.tags!.includes(tag))) {
        return false;
      }
    }

    if (filters.department && sla.department !== filters.department) {
      return false;
    }

    return true;
  }

  /**
   * Convert Firestore document to SLA object
   */
  private convertFirestoreToSLA(id: string, data: DocumentData): ServiceAgreement {
    return {
      id,
      companyId: data.companyId,
      customerId: data.customerId,
      customerName: data.customerName,
      contractNumber: data.contractNumber,
      contractName: data.contractName,
      startDate: data.startDate,
      endDate: data.endDate,
      billingFrequency: data.billingFrequency,
      nextBillingDate: data.nextBillingDate,
      lastBillingDate: data.lastBillingDate,
      status: data.status,
      autoGenerateInvoices: data.autoGenerateInvoices || false,
      dayOfMonth: data.dayOfMonth,
      advanceDays: data.advanceDays,
      contractValue: data.contractValue || 0,
      currency: data.currency || 'USD',
      paymentTerms: data.paymentTerms || 30,
      taxRate: data.taxRate,
      lineItems: (data.lineItems || []).map((item: any) => ({
        ...item,
        createdAt: item.createdAt?.toDate() || new Date(),
        updatedAt: item.updatedAt?.toDate() || new Date()
      })),
      metadata: data.metadata,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy,
      description: data.description,
      department: data.department,
      projectCode: data.projectCode,
      tags: data.tags
    };
  }

  /**
   * Update line items with history tracking
   */
  private async updateLineItemsWithHistory(
    companyId: string,
    slaId: string,
    existingItems: SLALineItem[],
    newItems: SLALineItem[],
    userId: string
  ): Promise<void> {
    const batch = writeBatch(db);
    const historyCollection = collection(db, this.getHistoryCollectionPath(companyId, slaId));

    // Track changes for each item
    for (const newItem of newItems) {
      const existingItem = existingItems.find(item => item.id === newItem.id);

      if (!existingItem) {
        // New item added
        const historyDoc = doc(historyCollection);
        batch.set(historyDoc, {
          id: historyDoc.id,
          slaId,
          lineItemId: newItem.id,
          action: 'created',
          changes: newItem,
          effectiveDate: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp(),
          createdBy: userId
        });
      } else {
        // Check for modifications
        const changes: Partial<SLALineItem> = {};
        let hasChanges = false;

        if (existingItem.description !== newItem.description) {
          changes.description = newItem.description;
          hasChanges = true;
        }
        if (existingItem.quantity !== newItem.quantity) {
          changes.quantity = newItem.quantity;
          hasChanges = true;
        }
        if (existingItem.unitPrice !== newItem.unitPrice) {
          changes.unitPrice = newItem.unitPrice;
          hasChanges = true;
        }
        if (existingItem.glAccountId !== newItem.glAccountId) {
          changes.glAccountId = newItem.glAccountId;
          hasChanges = true;
        }

        if (hasChanges) {
          const historyDoc = doc(historyCollection);
          batch.set(historyDoc, {
            id: historyDoc.id,
            slaId,
            lineItemId: newItem.id,
            action: 'modified',
            changes,
            previousValues: {
              description: existingItem.description,
              quantity: existingItem.quantity,
              unitPrice: existingItem.unitPrice,
              glAccountId: existingItem.glAccountId
            },
            effectiveDate: new Date().toISOString().split('T')[0],
            createdAt: serverTimestamp(),
            createdBy: userId
          });
        }
      }
    }

    // Check for removed items
    for (const existingItem of existingItems) {
      if (!newItems.find(item => item.id === existingItem.id)) {
        const historyDoc = doc(historyCollection);
        batch.set(historyDoc, {
          id: historyDoc.id,
          slaId,
          lineItemId: existingItem.id,
          action: 'removed',
          previousValues: existingItem,
          effectiveDate: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp(),
          createdBy: userId
        });
      }
    }

    await batch.commit();
  }

  /**
   * Create history records for line items
   */
  private async createLineItemHistory(
    companyId: string,
    slaId: string,
    lineItems: SLALineItem[],
    action: 'created' | 'modified' | 'removed',
    userId: string
  ): Promise<void> {
    const batch = writeBatch(db);
    const historyCollection = collection(db, this.getHistoryCollectionPath(companyId, slaId));

    for (const item of lineItems) {
      const historyDoc = doc(historyCollection);
      batch.set(historyDoc, {
        id: historyDoc.id,
        slaId,
        lineItemId: item.id,
        action,
        changes: item,
        effectiveDate: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        createdBy: userId
      });
    }

    await batch.commit();
  }

  /**
   * Get days in month helper
   */
  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }
}