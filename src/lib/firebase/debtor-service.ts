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
import { Debtor, DebtorSummary, FinancialContact, ContactPerson } from '@/types/financial';

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

export class DebtorService {
  private getCollectionPath(companyId: string): string {
    // Company-Scoped Collection (CSC) pattern
    return `companies/${companyId}/debtors`;
  }

  // Create a new debtor
  async createDebtor(
    companyId: string,
    debtor: Omit<Debtor, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>,
    userId: string
  ): Promise<Debtor> {
    try {
      const debtorsRef = collection(db, this.getCollectionPath(companyId));
      const debtorRef = doc(debtorsRef);

      const newDebtor: Debtor = {
        ...debtor,
        id: debtorRef.id,
        companyId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId || debtor.createdBy
      };

      await setDoc(debtorRef, {
        ...newDebtor,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return newDebtor;
    } catch (error) {
      console.error('Error creating debtor:', error);
      throw new Error(`Failed to create debtor: ${error}`);
    }
  }

  // Get all debtors for a company
  async getDebtors(companyId: string, filters?: {
    status?: 'active' | 'inactive' | 'blocked';
    hasOverdue?: boolean;
    searchTerm?: string;
  }): Promise<Debtor[]> {
    try {
      const constraints: QueryConstraint[] = [];

      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters?.hasOverdue) {
        constraints.push(where('overdueAmount', '>', 0));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(
        collection(db, this.getCollectionPath(companyId)),
        ...constraints
      );

      const querySnapshot = await getDocs(q);
      const debtors: Debtor[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const debtor = this.convertFirestoreToDebtor(doc.id, data);

        // Client-side filtering for search term
        if (filters?.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          if (
            debtor.name.toLowerCase().includes(term) ||
            debtor.email?.toLowerCase().includes(term) ||
            debtor.phone?.includes(term)
          ) {
            debtors.push(debtor);
          }
        } else {
          debtors.push(debtor);
        }
      });

      return debtors;
    } catch (error) {
      console.error('Error fetching debtors:', error);
      throw new Error(`Failed to fetch debtors: ${error}`);
    }
  }

  // Get a single debtor
  async getDebtor(companyId: string, debtorId: string): Promise<Debtor | null> {
    try {
      const debtorRef = doc(db, this.getCollectionPath(companyId), debtorId);
      const debtorDoc = await getDoc(debtorRef);

      if (!debtorDoc.exists()) {
        return null;
      }

      return this.convertFirestoreToDebtor(debtorDoc.id, debtorDoc.data());
    } catch (error) {
      console.error('Error fetching debtor:', error);
      throw new Error(`Failed to fetch debtor: ${error}`);
    }
  }

  // Update a debtor
  async updateDebtor(
    companyId: string,
    debtorId: string,
    updates: Partial<Omit<Debtor, 'id' | 'companyId' | 'createdAt'>>
  ): Promise<void> {
    try {
      const debtorRef = doc(db, this.getCollectionPath(companyId), debtorId);

      // Verify debtor exists and belongs to company
      const debtorDoc = await getDoc(debtorRef);
      if (!debtorDoc.exists()) {
        throw new Error('Debtor not found');
      }

      await updateDoc(debtorRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating debtor:', error);
      throw new Error(`Failed to update debtor: ${error}`);
    }
  }

  // Delete a debtor (soft delete)
  async deleteDebtor(companyId: string, debtorId: string): Promise<void> {
    try {
      await this.updateDebtor(companyId, debtorId, {
        status: 'inactive'
      });
    } catch (error) {
      console.error('Error deleting debtor:', error);
      throw new Error(`Failed to delete debtor: ${error}`);
    }
  }

  // Hard delete a debtor (permanent)
  async permanentlyDeleteDebtor(companyId: string, debtorId: string): Promise<void> {
    try {
      const debtorRef = doc(db, this.getCollectionPath(companyId), debtorId);
      await deleteDoc(debtorRef);
    } catch (error) {
      console.error('Error permanently deleting debtor:', error);
      throw new Error(`Failed to permanently delete debtor: ${error}`);
    }
  }

  // Update debtor balance
  async updateDebtorBalance(
    companyId: string,
    debtorId: string,
    amountChange: number,
    isPayment: boolean = false
  ): Promise<void> {
    try {
      const debtor = await this.getDebtor(companyId, debtorId);
      if (!debtor) {
        throw new Error('Debtor not found');
      }

      const newBalance = isPayment
        ? debtor.currentBalance - amountChange
        : debtor.currentBalance + amountChange;

      await this.updateDebtor(companyId, debtorId, {
        currentBalance: newBalance,
        overdueAmount: newBalance > 0 ? this.calculateOverdue(debtor) : 0
      });
    } catch (error) {
      console.error('Error updating debtor balance:', error);
      throw new Error(`Failed to update debtor balance: ${error}`);
    }
  }

  // Get debtors summary for dashboard
  async getDebtorsSummary(companyId: string): Promise<DebtorSummary> {
    try {
      const debtors = await this.getDebtors(companyId);

      const summary: DebtorSummary = {
        totalDebtors: debtors.length,
        activeDebtors: debtors.filter(d => d.status === 'active').length,
        totalOutstanding: debtors.reduce((sum, d) => sum + d.currentBalance, 0),
        overdueAmount: debtors.reduce((sum, d) => sum + d.overdueAmount, 0),
        averageDaysOutstanding: this.calculateAverageDaysOutstanding(debtors)
      };

      return summary;
    } catch (error) {
      console.error('Error getting debtors summary:', error);
      throw new Error(`Failed to get debtors summary: ${error}`);
    }
  }

  // Helper method to convert Firestore document to Debtor type
  private convertFirestoreToDebtor(id: string, data: DocumentData): Debtor {
    return {
      id,
      companyId: data.companyId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      taxId: data.taxId,
      creditLimit: data.creditLimit || 0,
      currentBalance: data.currentBalance || 0,
      overdueAmount: data.overdueAmount || 0,
      paymentTerms: data.paymentTerms || 30,
      status: data.status || 'active',
      notes: data.notes,
      metadata: data.metadata,
      primaryContact: data.primaryContact,
      financialContacts: data.financialContacts || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy
    };
  }

  // Calculate overdue amount based on transactions
  private calculateOverdue(debtor: Debtor): number {
    // This would typically check transactions and due dates
    // For now, returning a simple calculation
    return debtor.currentBalance > 0 ? debtor.currentBalance * 0.1 : 0;
  }

  // Calculate average days outstanding
  private calculateAverageDaysOutstanding(debtors: Debtor[]): number {
    if (debtors.length === 0) return 0;

    const totalDays = debtors.reduce((sum, d) => {
      if (d.currentBalance > 0) {
        // Calculate days since last transaction
        const daysSinceUpdate = Math.floor(
          (new Date().getTime() - d.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + daysSinceUpdate;
      }
      return sum;
    }, 0);

    const debtorsWithBalance = debtors.filter(d => d.currentBalance > 0).length;
    return debtorsWithBalance > 0 ? Math.round(totalDays / debtorsWithBalance) : 0;
  }

  // Batch import debtors
  async batchImportDebtors(
    companyId: string,
    debtors: Omit<Debtor, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>[],
    userId: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const debtor of debtors) {
      try {
        await this.createDebtor(companyId, debtor, userId);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to import ${debtor.name}: ${error}`);
      }
    }

    return results;
  }

  /**
   * Add a financial contact to a debtor
   */
  async addFinancialContact(
    companyId: string,
    debtorId: string,
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

      const debtorRef = doc(db, this.getCollectionPath(companyId), debtorId);
      await updateDoc(debtorRef, {
        financialContacts: arrayUnion(newContact),
        updatedAt: serverTimestamp(),
      });

      console.log(`[DebtorService] Added financial contact to debtor: ${debtorId}`);
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
    debtorId: string,
    contactId: string,
    updates: Partial<Omit<FinancialContact, 'id' | 'createdAt'>>
  ): Promise<void> {
    try {
      const debtor = await this.getDebtor(companyId, debtorId);
      if (!debtor?.financialContacts) {
        throw new Error('No financial contacts found');
      }

      const updatedContacts = debtor.financialContacts.map(contact => {
        if (contact.id === contactId) {
          return {
            ...contact,
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
        return contact;
      });

      const debtorRef = doc(db, this.getCollectionPath(companyId), debtorId);
      await updateDoc(debtorRef, {
        financialContacts: updatedContacts,
        updatedAt: serverTimestamp(),
      });

      console.log(`[DebtorService] Updated financial contact: ${contactId}`);
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
    debtorId: string,
    contactId: string
  ): Promise<void> {
    try {
      const debtor = await this.getDebtor(companyId, debtorId);
      if (!debtor?.financialContacts) {
        return;
      }

      const contactToRemove = debtor.financialContacts.find(c => c.id === contactId);
      if (!contactToRemove) {
        return;
      }

      const debtorRef = doc(db, this.getCollectionPath(companyId), debtorId);
      await updateDoc(debtorRef, {
        financialContacts: arrayRemove(contactToRemove),
        updatedAt: serverTimestamp(),
      });

      console.log(`[DebtorService] Removed financial contact: ${contactId}`);
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
    debtorId: string
  ): Promise<string[]> {
    try {
      const debtor = await this.getDebtor(companyId, debtorId);

      if (!debtor?.financialContacts) {
        return [];
      }

      return debtor.financialContacts
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
    debtorId: string,
    contact: ContactPerson
  ): Promise<void> {
    try {
      const debtorRef = doc(db, this.getCollectionPath(companyId), debtorId);
      await updateDoc(debtorRef, {
        primaryContact: contact,
        updatedAt: serverTimestamp(),
      });

      console.log(`[DebtorService] Updated primary contact for debtor: ${debtorId}`);
    } catch (error) {
      console.error('Error updating primary contact:', error);
      throw new Error(`Failed to update primary contact: ${error}`);
    }
  }

  /**
   * Get primary contact for a debtor
   */
  async getPrimaryContact(
    companyId: string,
    debtorId: string
  ): Promise<ContactPerson | null> {
    try {
      const debtor = await this.getDebtor(companyId, debtorId);
      return debtor?.primaryContact || null;
    } catch (error) {
      console.error('Error getting primary contact:', error);
      throw new Error(`Failed to get primary contact: ${error}`);
    }
  }

  /**
   * Get all financial contacts for a debtor
   */
  async getFinancialContacts(
    companyId: string,
    debtorId: string
  ): Promise<FinancialContact[]> {
    try {
      const debtor = await this.getDebtor(companyId, debtorId);
      return debtor?.financialContacts || [];
    } catch (error) {
      console.error('Error getting financial contacts:', error);
      throw new Error(`Failed to get financial contacts: ${error}`);
    }
  }
}