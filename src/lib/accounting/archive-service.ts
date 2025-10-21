import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  Timestamp,
  deleteDoc,
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface ArchivedSession {
  id: string;
  companyId: string;
  bankAccountId: string;
  bankAccountCode?: string;
  importDate: Date;
  archivedAt: Date;
  archivedBy: string;
  status: 'archived';
  metadata?: {
    fileName?: string;
    statementId?: string;
    totalTransactions?: number;
    processedTransactions?: number;
    originalSessionId?: string;
  };
  production?: {
    journalEntryIds: string[];
    glEntryIds: string[];
    postedAt: Date;
    postedBy: string;
  };
}

export interface ArchivedJournalEntry {
  id: string;
  tenantId: string;
  bankImportSessionId: string;
  fiscalPeriodId: string;
  journalCode: string;
  reference: string;
  description: string;
  status: 'archived';
  source: string;
  transactionDate: string;
  postingDate: Date;
  archivedAt: Date;
  createdBy: string;
  metadata?: any;
  lines: any[];
  productionJournalId?: string;
}

export interface ArchivedGLEntry {
  id: string;
  tenantId: string;
  bankImportSessionId: string;
  journalEntryId: string;
  journalLineId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  balance: number;
  currency: string;
  transactionDate: string;
  postingDate: Date;
  archivedAt: Date;
  fiscalPeriodId: string;
  source: string;
  description: string;
  reference: string;
  metadata?: any;
  productionGLId?: string;
}

/**
 * Archive Service
 * Handles moving posted staging sessions to archive collections
 */
export class ArchiveService {
  constructor(private companyId: string) {}

  /**
   * Archive a posted session and all its entries
   * This removes them from staging and moves them to archive collections
   */
  async archivePostedSession(
    sessionId: string,
    archivedBy: string
  ): Promise<{
    success: boolean;
    archivedJournalCount: number;
    archivedGLCount: number;
    errors?: string[];
  }> {
    const result = {
      success: false,
      archivedJournalCount: 0,
      archivedGLCount: 0,
      errors: [] as string[]
    };

    try {
      // Step 1: Get the session
      const sessionRef = doc(db, 'companies', this.companyId, 'bankImportSessions', sessionId);
      const sessionDoc = await getDocs(
        query(
          collection(db, 'companies', this.companyId, 'bankImportSessions'),
          where('__name__', '==', sessionId)
        )
      );

      if (sessionDoc.empty) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const sessionData = sessionDoc.docs[0].data();

      // Verify session is posted
      if (sessionData.status !== 'posted') {
        throw new Error(`Session ${sessionId} has not been posted yet (status: ${sessionData.status})`);
      }

      // Step 2: Get staging journal entries
      const stagingJournalsQuery = query(
        collection(db, 'staging_journal_entries'),
        where('bankImportSessionId', '==', sessionId),
        where('status', '==', 'posted')
      );
      const stagingJournalsSnapshot = await getDocs(stagingJournalsQuery);

      // Step 3: Get staging GL entries
      const stagingGLsQuery = query(
        collection(db, 'staging_general_ledger'),
        where('bankImportSessionId', '==', sessionId),
        where('status', '==', 'posted')
      );
      const stagingGLsSnapshot = await getDocs(stagingGLsQuery);

      // Step 4: Create archive records
      const batch = writeBatch(db);
      const archivedAt = Timestamp.now();

      // Archive session
      const archivedSession = {
        ...sessionData,
        id: sessionId,
        status: 'archived',
        archivedAt,
        archivedBy,
        metadata: {
          ...sessionData.metadata,
          originalSessionId: sessionId
        }
      };

      const archivedSessionRef = doc(
        collection(db, 'companies', this.companyId, 'archivedBankImportSessions'),
        sessionId
      );
      batch.set(archivedSessionRef, archivedSession);

      // Archive journal entries
      for (const stagingDoc of stagingJournalsSnapshot.docs) {
        const stagingData = stagingDoc.data();

        const archivedJournal = {
          ...stagingData,
          status: 'archived',
          archivedAt
        };

        const archivedJournalRef = doc(
          collection(db, 'archived_journal_entries'),
          stagingDoc.id
        );
        batch.set(archivedJournalRef, archivedJournal);

        // Delete from staging
        batch.delete(stagingDoc.ref);
        result.archivedJournalCount++;
      }

      // Archive GL entries
      for (const stagingDoc of stagingGLsSnapshot.docs) {
        const stagingData = stagingDoc.data();

        const archivedGL = {
          ...stagingData,
          status: 'archived',
          archivedAt
        };

        const archivedGLRef = doc(
          collection(db, 'archived_general_ledger'),
          stagingDoc.id
        );
        batch.set(archivedGLRef, archivedGL);

        // Delete from staging
        batch.delete(stagingDoc.ref);
        result.archivedGLCount++;
      }

      // Delete original session from staging
      batch.delete(sessionRef);

      // Commit all changes
      await batch.commit();

      result.success = true;
      console.log(
        `[ArchiveService] Archived session ${sessionId}: ${result.archivedJournalCount} journals, ${result.archivedGLCount} GL entries`
      );

      return result;
    } catch (error) {
      console.error('[ArchiveService] Archive failed:', error);
      result.errors?.push(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Get archived sessions for a company
   */
  async getArchivedSessions(limit: number = 50): Promise<ArchivedSession[]> {
    try {
      const archivedQuery = query(
        collection(db, 'companies', this.companyId, 'archivedBankImportSessions'),
        orderBy('archivedAt', 'desc'),
        firestoreLimit(limit)
      );

      const snapshot = await getDocs(archivedQuery);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          companyId: data.companyId,
          bankAccountId: data.bankAccountId,
          bankAccountCode: data.bankAccountCode,
          importDate: data.importDate?.toDate() || new Date(),
          archivedAt: data.archivedAt?.toDate() || new Date(),
          archivedBy: data.archivedBy || 'unknown',
          status: 'archived',
          metadata: data.metadata,
          production: data.production
            ? {
                ...data.production,
                postedAt: data.production.postedAt?.toDate() || new Date()
              }
            : undefined
        } as ArchivedSession;
      });
    } catch (error) {
      console.error('[ArchiveService] Failed to get archived sessions:', error);
      return [];
    }
  }

  /**
   * Get archived journal entries for a session
   */
  async getArchivedJournalEntries(sessionId: string): Promise<ArchivedJournalEntry[]> {
    try {
      const journalsQuery = query(
        collection(db, 'archived_journal_entries'),
        where('bankImportSessionId', '==', sessionId)
      );

      const snapshot = await getDocs(journalsQuery);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          postingDate: data.postingDate?.toDate() || new Date(),
          archivedAt: data.archivedAt?.toDate() || new Date()
        } as ArchivedJournalEntry;
      });
    } catch (error) {
      console.error('[ArchiveService] Failed to get archived journal entries:', error);
      return [];
    }
  }

  /**
   * Get archived GL entries for a session
   */
  async getArchivedGLEntries(sessionId: string): Promise<ArchivedGLEntry[]> {
    try {
      const glQuery = query(
        collection(db, 'archived_general_ledger'),
        where('bankImportSessionId', '==', sessionId),
        orderBy('transactionDate', 'asc')
      );

      const snapshot = await getDocs(glQuery);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          postingDate: data.postingDate?.toDate() || new Date(),
          archivedAt: data.archivedAt?.toDate() || new Date()
        } as ArchivedGLEntry;
      });
    } catch (error) {
      console.error('[ArchiveService] Failed to get archived GL entries:', error);
      return [];
    }
  }
}
