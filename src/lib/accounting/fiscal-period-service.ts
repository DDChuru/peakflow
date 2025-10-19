import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FiscalPeriod, FiscalPeriodStatus } from '@/types/accounting/fiscal-period';

export class FiscalPeriodService {
  /**
   * Get all fiscal periods for a company
   */
  async getPeriods(tenantId: string): Promise<FiscalPeriod[]> {
    const periodsRef = collection(db, 'fiscal_periods');
    const q = query(
      periodsRef,
      where('tenantId', '==', tenantId),
      orderBy('startDate', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.convertTimestamps(doc.data() as any));
  }

  /**
   * Get a specific fiscal period by ID
   */
  async getPeriod(periodId: string): Promise<FiscalPeriod | null> {
    const periodRef = doc(db, 'fiscal_periods', periodId);
    const snapshot = await getDoc(periodRef);

    if (!snapshot.exists()) return null;

    return this.convertTimestamps(snapshot.data() as any);
  }

  /**
   * Get fiscal period for a specific date
   */
  async getPeriodForDate(tenantId: string, date: Date): Promise<FiscalPeriod | null> {
    const periodsRef = collection(db, 'fiscal_periods');
    const q = query(
      periodsRef,
      where('tenantId', '==', tenantId),
      where('startDate', '<=', Timestamp.fromDate(date)),
      where('endDate', '>=', Timestamp.fromDate(date))
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    return this.convertTimestamps(snapshot.docs[0].data() as any);
  }

  /**
   * Create a new fiscal period
   */
  async createPeriod(period: Omit<FiscalPeriod, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const periodId = this.generatePeriodId(period.startDate);
    const periodRef = doc(db, 'fiscal_periods', periodId);

    // Check if period already exists
    const existing = await getDoc(periodRef);
    if (existing.exists()) {
      throw new Error(`Fiscal period ${periodId} already exists`);
    }

    const now = new Date();
    await setDoc(periodRef, {
      id: periodId,
      ...period,
      startDate: Timestamp.fromDate(period.startDate),
      endDate: Timestamp.fromDate(period.endDate),
      lockedAt: period.lockedAt ? Timestamp.fromDate(period.lockedAt) : null,
      closedAt: period.closedAt ? Timestamp.fromDate(period.closedAt) : null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    });

    return periodId;
  }

  /**
   * Auto-generate fiscal periods for a year
   * Based on fiscal year start month (1 = January, 7 = July, etc.)
   */
  async createPeriodsForYear(
    tenantId: string,
    year: number,
    fiscalYearStartMonth: number = 1
  ): Promise<string[]> {
    const periods: string[] = [];

    // Calculate fiscal year end
    const fiscalYearEnd = year + 1;

    for (let i = 0; i < 12; i++) {
      const monthOffset = (fiscalYearStartMonth - 1 + i) % 12;
      const yearOffset = Math.floor((fiscalYearStartMonth - 1 + i) / 12);

      const month = monthOffset + 1; // 1-12
      const periodYear = year + yearOffset;

      const startDate = new Date(periodYear, monthOffset, 1);
      const endDate = new Date(periodYear, monthOffset + 1, 0); // Last day of month

      const periodName = `${startDate.toLocaleString('en-US', { month: 'long' })} ${periodYear}`;

      try {
        const periodId = await this.createPeriod({
          tenantId,
          name: periodName,
          startDate,
          endDate,
          status: 'open'
        });
        periods.push(periodId);
      } catch (error: any) {
        // Skip if period already exists
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    return periods;
  }

  /**
   * Close a fiscal period (prevents new postings)
   */
  async closePeriod(periodId: string, userId: string): Promise<void> {
    const periodRef = doc(db, 'fiscal_periods', periodId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(periodRef);

      if (!snapshot.exists()) {
        throw new Error('Fiscal period not found');
      }

      const period = snapshot.data() as any;

      if (period.status === 'locked') {
        throw new Error('Cannot close a locked period');
      }

      transaction.update(periodRef, {
        status: 'closed',
        closedBy: userId,
        closedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
  }

  /**
   * Reopen a closed fiscal period
   */
  async reopenPeriod(periodId: string, userId: string): Promise<void> {
    const periodRef = doc(db, 'fiscal_periods', periodId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(periodRef);

      if (!snapshot.exists()) {
        throw new Error('Fiscal period not found');
      }

      const period = snapshot.data() as any;

      if (period.status === 'locked') {
        throw new Error('Cannot reopen a locked period');
      }

      transaction.update(periodRef, {
        status: 'open',
        closedBy: null,
        closedAt: null,
        updatedAt: serverTimestamp()
      });
    });
  }

  /**
   * Lock a fiscal period (completely immutable)
   */
  async lockPeriod(periodId: string, userId: string): Promise<void> {
    const periodRef = doc(db, 'fiscal_periods', periodId);

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(periodRef);

      if (!snapshot.exists()) {
        throw new Error('Fiscal period not found');
      }

      const period = snapshot.data() as any;

      if (period.status !== 'closed') {
        throw new Error('Can only lock a closed period');
      }

      transaction.update(periodRef, {
        status: 'locked',
        lockedBy: userId,
        lockedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });
  }

  /**
   * Unlock a locked fiscal period (admin only, with audit trail)
   */
  async unlockPeriod(periodId: string): Promise<void> {
    const periodRef = doc(db, 'fiscal_periods', periodId);

    await updateDoc(periodRef, {
      status: 'closed', // Unlock to closed, not open
      lockedBy: null,
      lockedAt: null,
      updatedAt: serverTimestamp()
    });
  }

  /**
   * Delete a fiscal period (only if no transactions posted)
   */
  async deletePeriod(periodId: string): Promise<void> {
    const periodRef = doc(db, 'fiscal_periods', periodId);

    // Check if period has any ledger entries
    const ledgerRef = collection(db, 'ledgerEntries');
    const q = query(ledgerRef, where('fiscalPeriodId', '==', periodId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      throw new Error('Cannot delete period with existing transactions');
    }

    await runTransaction(db, async (transaction) => {
      transaction.delete(periodRef);
    });
  }

  /**
   * Get current open period for a company
   */
  async getCurrentOpenPeriod(tenantId: string): Promise<FiscalPeriod | null> {
    const today = new Date();
    const period = await this.getPeriodForDate(tenantId, today);

    if (period && period.status === 'open') {
      return period;
    }

    return null;
  }

  /**
   * Generate period ID from date (e.g., "2025-01")
   */
  private generatePeriodId(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Convert Firestore Timestamps to Date objects
   */
  private convertTimestamps(data: any): FiscalPeriod {
    return {
      ...data,
      startDate: data.startDate?.toDate() || data.startDate,
      endDate: data.endDate?.toDate() || data.endDate,
      lockedAt: data.lockedAt?.toDate() || data.lockedAt,
      closedAt: data.closedAt?.toDate() || data.closedAt,
      createdAt: data.createdAt?.toDate() || data.createdAt,
      updatedAt: data.updatedAt?.toDate() || data.updatedAt
    };
  }
}

// Export singleton instance
export const fiscalPeriodService = new FiscalPeriodService();
