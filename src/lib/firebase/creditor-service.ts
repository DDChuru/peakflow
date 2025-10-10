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
  DocumentData,
  QueryConstraint,
  Timestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from './config';
import { Creditor, CreditorSummary, FinancialContact, ContactPerson } from '@/types/financial';

// Browser-compatible UUID generation
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export class CreditorService {
  private getCollectionPath(companyId: string): string {
    // Company-Scoped Collection (CSC) pattern
    return `companies/${companyId}/creditors`;
  }

  // Create a new creditor
  async createCreditor(
    companyId: string,
    creditor: Omit<Creditor, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>,
    userId: string
  ): Promise<Creditor> {
    try {
      const creditorsRef = collection(db, this.getCollectionPath(companyId));
      const creditorRef = doc(creditorsRef);

      const newCreditor: Creditor = {
        ...creditor,
        id: creditorRef.id,
        companyId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId || creditor.createdBy
      };

      await setDoc(creditorRef, {
        ...newCreditor,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return newCreditor;
    } catch (error) {
      console.error('Error creating creditor:', error);
      throw new Error(`Failed to create creditor: ${error}`);
    }
  }

  // Get all creditors for a company
  async getCreditors(companyId: string, filters?: {
    status?: 'active' | 'inactive';
    category?: string;
    searchTerm?: string;
  }): Promise<Creditor[]> {
    try {
      const constraints: QueryConstraint[] = [];

      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters?.category) {
        constraints.push(where('category', '==', filters.category));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(
        collection(db, this.getCollectionPath(companyId)),
        ...constraints
      );

      const querySnapshot = await getDocs(q);
      const creditors: Creditor[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const creditor = this.convertFirestoreToCreditor(doc.id, data);

        // Client-side filtering for search term
        if (filters?.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          if (
            creditor.name.toLowerCase().includes(term) ||
            creditor.email?.toLowerCase().includes(term) ||
            creditor.phone?.includes(term) ||
            creditor.accountNumber?.includes(term)
          ) {
            creditors.push(creditor);
          }
        } else {
          creditors.push(creditor);
        }
      });

      return creditors;
    } catch (error) {
      console.error('Error fetching creditors:', error);
      throw new Error(`Failed to fetch creditors: ${error}`);
    }
  }

  // Get a single creditor
  async getCreditor(companyId: string, creditorId: string): Promise<Creditor | null> {
    try {
      const creditorRef = doc(db, this.getCollectionPath(companyId), creditorId);
      const creditorDoc = await getDoc(creditorRef);

      if (!creditorDoc.exists()) {
        return null;
      }

      return this.convertFirestoreToCreditor(creditorDoc.id, creditorDoc.data());
    } catch (error) {
      console.error('Error fetching creditor:', error);
      throw new Error(`Failed to fetch creditor: ${error}`);
    }
  }

  // Update a creditor
  async updateCreditor(
    companyId: string,
    creditorId: string,
    updates: Partial<Omit<Creditor, 'id' | 'companyId' | 'createdAt'>>
  ): Promise<void> {
    try {
      const creditorRef = doc(db, this.getCollectionPath(companyId), creditorId);

      // Verify creditor exists and belongs to company
      const creditorDoc = await getDoc(creditorRef);
      if (!creditorDoc.exists()) {
        throw new Error('Creditor not found');
      }

      await updateDoc(creditorRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating creditor:', error);
      throw new Error(`Failed to update creditor: ${error}`);
    }
  }

  // Delete a creditor (soft delete)
  async deleteCreditor(companyId: string, creditorId: string): Promise<void> {
    try {
      await this.updateCreditor(companyId, creditorId, {
        status: 'inactive'
      });
    } catch (error) {
      console.error('Error deleting creditor:', error);
      throw new Error(`Failed to delete creditor: ${error}`);
    }
  }

  // Hard delete a creditor (permanent)
  async permanentlyDeleteCreditor(companyId: string, creditorId: string): Promise<void> {
    try {
      const creditorRef = doc(db, this.getCollectionPath(companyId), creditorId);
      await deleteDoc(creditorRef);
    } catch (error) {
      console.error('Error permanently deleting creditor:', error);
      throw new Error(`Failed to permanently delete creditor: ${error}`);
    }
  }

  // Update creditor balance
  async updateCreditorBalance(
    companyId: string,
    creditorId: string,
    amountChange: number,
    isPayment: boolean = false
  ): Promise<void> {
    try {
      const creditor = await this.getCreditor(companyId, creditorId);
      if (!creditor) {
        throw new Error('Creditor not found');
      }

      const newBalance = isPayment
        ? creditor.currentBalance - amountChange
        : creditor.currentBalance + amountChange;

      await this.updateCreditor(companyId, creditorId, {
        currentBalance: newBalance
      });
    } catch (error) {
      console.error('Error updating creditor balance:', error);
      throw new Error(`Failed to update creditor balance: ${error}`);
    }
  }

  // Get creditors summary for dashboard
  async getCreditorsSummary(companyId: string): Promise<CreditorSummary> {
    try {
      const creditors = await this.getCreditors(companyId);

      const summary: CreditorSummary = {
        totalCreditors: creditors.length,
        activeCreditors: creditors.filter(c => c.status === 'active').length,
        totalPayable: creditors.reduce((sum, c) => sum + c.currentBalance, 0),
        overduePayments: this.calculateOverduePayments(creditors),
        averagePaymentDays: this.calculateAveragePaymentDays(creditors)
      };

      return summary;
    } catch (error) {
      console.error('Error getting creditors summary:', error);
      throw new Error(`Failed to get creditors summary: ${error}`);
    }
  }

  // Get creditors by category
  async getCreditorsByCategory(companyId: string, category: string): Promise<Creditor[]> {
    try {
      return await this.getCreditors(companyId, { category });
    } catch (error) {
      console.error('Error getting creditors by category:', error);
      throw new Error(`Failed to get creditors by category: ${error}`);
    }
  }

  // Helper method to convert Firestore document to Creditor type
  private convertFirestoreToCreditor(id: string, data: DocumentData): Creditor {
    return {
      id,
      companyId: data.companyId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      taxId: data.taxId,
      accountNumber: data.accountNumber,
      bankDetails: data.bankDetails,
      paymentTerms: data.paymentTerms || 30,
      currentBalance: data.currentBalance || 0,
      status: data.status || 'active',
      category: data.category,
      notes: data.notes,
      metadata: data.metadata,
      primaryContact: data.primaryContact,
      financialContacts: data.financialContacts || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy
    };
  }

  // Calculate overdue payments
  private calculateOverduePayments(creditors: Creditor[]): number {
    // This would typically check transactions and due dates
    // For now, counting creditors with positive balance over their payment terms
    return creditors.filter(c => {
      if (c.currentBalance <= 0) return false;

      const daysSinceUpdate = Math.floor(
        (new Date().getTime() - c.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      return daysSinceUpdate > c.paymentTerms;
    }).reduce((sum, c) => sum + c.currentBalance, 0);
  }

  // Calculate average payment days
  private calculateAveragePaymentDays(creditors: Creditor[]): number {
    if (creditors.length === 0) return 0;

    const totalDays = creditors.reduce((sum, c) => sum + c.paymentTerms, 0);
    return Math.round(totalDays / creditors.length);
  }

  // Batch import creditors
  async batchImportCreditors(
    companyId: string,
    creditors: Omit<Creditor, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>[],
    userId: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const creditor of creditors) {
      try {
        await this.createCreditor(companyId, creditor, userId);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to import ${creditor.name}: ${error}`);
      }
    }

    return results;
  }

  // Get creditor categories
  async getCategories(companyId: string): Promise<string[]> {
    try {
      const creditors = await this.getCreditors(companyId);
      const categories = new Set<string>();

      creditors.forEach(c => {
        if (c.category) {
          categories.add(c.category);
        }
      });

      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error getting creditor categories:', error);
      throw new Error(`Failed to get creditor categories: ${error}`);
    }
  }

  /**
   * Add a financial contact to a creditor
   */
  async addFinancialContact(
    companyId: string,
    creditorId: string,
    contact: {
      name: string;
      email: string;
      phone?: string;
      position: string;
      isPrimary?: boolean;
    }
  ): Promise<FinancialContact> {
    try {
      const newContact: FinancialContact = {
        id: generateUUID(),
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        position: contact.position,
        isActive: true,
        isPrimary: contact.isPrimary || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const creditorRef = doc(db, this.getCollectionPath(companyId), creditorId);
      await updateDoc(creditorRef, {
        financialContacts: arrayUnion(newContact),
        updatedAt: serverTimestamp(),
      });

      console.log(`[CreditorService] Added financial contact to creditor: ${creditorId}`);
      return newContact;
    } catch (error) {
      console.error('Error adding financial contact:', error);
      throw new Error(`Failed to add financial contact: ${error}`);
    }
  }

  /**
   * Update a financial contact
   */
  async updateFinancialContact(
    companyId: string,
    creditorId: string,
    contactId: string,
    updates: Partial<Omit<FinancialContact, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      const creditor = await this.getCreditor(companyId, creditorId);
      if (!creditor?.financialContacts) {
        throw new Error('No financial contacts found');
      }

      const updatedContacts = creditor.financialContacts.map(contact => {
        if (contact.id === contactId) {
          return {
            ...contact,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        return contact;
      });

      const creditorRef = doc(db, this.getCollectionPath(companyId), creditorId);
      await updateDoc(creditorRef, {
        financialContacts: updatedContacts,
        updatedAt: serverTimestamp(),
      });

      console.log(`[CreditorService] Updated financial contact: ${contactId}`);
    } catch (error) {
      console.error('Error updating financial contact:', error);
      throw new Error(`Failed to update financial contact: ${error}`);
    }
  }

  /**
   * Remove a financial contact
   */
  async removeFinancialContact(
    companyId: string,
    creditorId: string,
    contactId: string
  ): Promise<void> {
    try {
      const creditor = await this.getCreditor(companyId, creditorId);
      if (!creditor?.financialContacts) {
        return;
      }

      const contactToRemove = creditor.financialContacts.find(c => c.id === contactId);
      if (!contactToRemove) {
        return;
      }

      const creditorRef = doc(db, this.getCollectionPath(companyId), creditorId);
      await updateDoc(creditorRef, {
        financialContacts: arrayRemove(contactToRemove),
        updatedAt: serverTimestamp(),
      });

      console.log(`[CreditorService] Removed financial contact: ${contactId}`);
    } catch (error) {
      console.error('Error removing financial contact:', error);
      throw new Error(`Failed to remove financial contact: ${error}`);
    }
  }

  /**
   * Get all active financial contact emails (for mailing list)
   */
  async getFinancialContactEmails(
    companyId: string,
    creditorId: string
  ): Promise<string[]> {
    try {
      const creditor = await this.getCreditor(companyId, creditorId);

      if (!creditor?.financialContacts) {
        return [];
      }

      return creditor.financialContacts
        .filter(contact => contact.isActive && contact.email)
        .map(contact => contact.email);
    } catch (error) {
      console.error('Error getting financial contact emails:', error);
      throw new Error(`Failed to get financial contact emails: ${error}`);
    }
  }

  /**
   * Update primary contact information
   */
  async updatePrimaryContact(
    companyId: string,
    creditorId: string,
    contact: ContactPerson
  ): Promise<void> {
    try {
      const creditorRef = doc(db, this.getCollectionPath(companyId), creditorId);
      await updateDoc(creditorRef, {
        primaryContact: contact,
        updatedAt: serverTimestamp(),
      });

      console.log(`[CreditorService] Updated primary contact for creditor: ${creditorId}`);
    } catch (error) {
      console.error('Error updating primary contact:', error);
      throw new Error(`Failed to update primary contact: ${error}`);
    }
  }

  /**
   * Get primary contact for a creditor
   */
  async getPrimaryContact(
    companyId: string,
    creditorId: string
  ): Promise<ContactPerson | null> {
    try {
      const creditor = await this.getCreditor(companyId, creditorId);
      return creditor?.primaryContact || null;
    } catch (error) {
      console.error('Error getting primary contact:', error);
      throw new Error(`Failed to get primary contact: ${error}`);
    }
  }

  /**
   * Get all financial contacts for a creditor
   */
  async getFinancialContacts(
    companyId: string,
    creditorId: string
  ): Promise<FinancialContact[]> {
    try {
      const creditor = await this.getCreditor(companyId, creditorId);
      return creditor?.financialContacts || [];
    } catch (error) {
      console.error('Error getting financial contacts:', error);
      throw new Error(`Failed to get financial contacts: ${error}`);
    }
  }
}