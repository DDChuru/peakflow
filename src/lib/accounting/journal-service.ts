import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { JournalEntry } from '@/types/accounting/journal';
import type { LedgerEntry } from '@/types/accounting/general-ledger';

export class JournalService {
  /**
   * Get all journal entries for a company
   */
  async getJournalEntries(tenantId: string): Promise<JournalEntry[]> {
    const journalRef = collection(db, 'journal_entries');
    const q = query(
      journalRef,
      where('tenantId', '==', tenantId),
      orderBy('transactionDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.convertTimestamps(doc.data() as any));
  }

  /**
   * Get a specific journal entry by ID
   */
  async getJournalEntry(journalEntryId: string): Promise<JournalEntry | null> {
    const journalRef = doc(db, 'journal_entries', journalEntryId);
    const snapshot = await getDoc(journalRef);

    if (!snapshot.exists()) return null;

    return this.convertTimestamps(snapshot.data() as any);
  }

  /**
   * Get ledger entries for a specific journal entry
   */
  async getLedgerEntriesForJournal(journalEntryId: string, tenantId?: string): Promise<LedgerEntry[]> {
    const ledgerRef = collection(db, 'general_ledger');

    // If we have tenantId, add it to the query to satisfy security rules
    const constraints = tenantId
      ? [
          where('tenantId', '==', tenantId),
          where('journalEntryId', '==', journalEntryId)
        ]
      : [where('journalEntryId', '==', journalEntryId)];

    const q = query(ledgerRef, ...constraints);

    const snapshot = await getDocs(q);

    // Sort by accountCode in memory since we can't use orderBy with multiple where clauses
    const entries = snapshot.docs.map(doc => this.convertLedgerTimestamps(doc.data() as any));
    return entries.sort((a, b) => (a.accountCode || '').localeCompare(b.accountCode || ''));
  }

  /**
   * Get journal entries by fiscal period
   */
  async getJournalEntriesByPeriod(
    tenantId: string,
    fiscalPeriodId: string
  ): Promise<JournalEntry[]> {
    const journalRef = collection(db, 'journal_entries');
    const q = query(
      journalRef,
      where('tenantId', '==', tenantId),
      where('fiscalPeriodId', '==', fiscalPeriodId),
      orderBy('transactionDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.convertTimestamps(doc.data() as any));
  }

  /**
   * Get journal entries by source (e.g., 'accounts_receivable', 'accounts_payable')
   */
  async getJournalEntriesBySource(
    tenantId: string,
    source: string
  ): Promise<JournalEntry[]> {
    const journalRef = collection(db, 'journal_entries');
    const q = query(
      journalRef,
      where('tenantId', '==', tenantId),
      where('source', '==', source),
      orderBy('transactionDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.convertTimestamps(doc.data() as any));
  }

  /**
   * Get journal entries with full ledger details
   */
  async getJournalEntriesWithDetails(tenantId: string): Promise<Array<JournalEntry & { ledgerEntries: LedgerEntry[] }>> {
    const journalEntries = await this.getJournalEntries(tenantId);

    // Fetch ledger entries for each journal entry
    const entriesWithDetails = await Promise.all(
      journalEntries.map(async (journal) => {
        const ledgerEntries = await this.getLedgerEntriesForJournal(journal.id, tenantId);
        return {
          ...journal,
          ledgerEntries
        };
      })
    );

    return entriesWithDetails;
  }

  /**
   * Convert Firestore Timestamps to Date objects for JournalEntry
   */
  private convertTimestamps(data: any): JournalEntry {
    return {
      ...data,
      transactionDate: data.transactionDate?.toDate?.() || data.transactionDate,
      postingDate: data.postingDate?.toDate?.() || data.postingDate,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt
    };
  }

  /**
   * Convert Firestore Timestamps to Date objects for LedgerEntry
   */
  private convertLedgerTimestamps(data: any): LedgerEntry {
    return {
      ...data,
      transactionDate: data.transactionDate?.toDate?.() || data.transactionDate,
      postingDate: data.postingDate?.toDate?.() || data.postingDate,
      createdAt: data.createdAt?.toDate?.() || data.createdAt
    };
  }
}

// Export singleton instance
export const journalService = new JournalService();
