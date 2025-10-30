import type { LedgerEntry } from '@/types/accounting/general-ledger';
import type { BankTransaction, BankStatement } from '@/types/bank-statement';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  where,
  limit as limitFn,
  DocumentData,
  QueryConstraint,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/config';
import {
  ReconciliationSession,
  ReconciliationStatus,
  ReconciliationMatch,
  ReconciliationMatchStatus,
  ReconciliationAdjustment,
  AutoMatchCandidate,
  AdjustmentJournalEntry,
  CreateAdjustmentJournalInput,
  ReversalJournalInput,
} from '@/types/accounting/reconciliation';
import {
  performAutoMatching,
  validateReconciliationBalance,
  type MatchingConfig,
  type AutoMatchResult,
  type BalanceValidation,
} from './reconciliation-utils';
import { PostingService } from './posting-service';
import { JournalEntry, JournalLine, JournalSource } from '@/types/accounting/journal';
import { AccountRecord } from '@/types/accounting/chart-of-accounts';

const COLLECTION_PATH = (companyId: string) => `companies/${companyId}/reconciliations`;
const MATCHES_COLLECTION = (companyId: string, sessionId: string) =>
  `${COLLECTION_PATH(companyId)}/${sessionId}/matches`;
const ADJUSTMENTS_COLLECTION = (companyId: string, sessionId: string) =>
  `${COLLECTION_PATH(companyId)}/${sessionId}/adjustments`;

export interface CreateReconciliationSessionInput
  extends Pick<
    ReconciliationSession,
    | 'bankAccountId'
    | 'bankAccountName'
    | 'currency'
    | 'periodStart'
    | 'periodEnd'
    | 'openingBalance'
    | 'closingBalance'
    | 'notes'
    | 'metadata'
  > {
  createdBy: string;
}

export type UpdateReconciliationSessionInput = Partial<
  Pick<
    ReconciliationSession,
    | 'periodStart'
    | 'periodEnd'
    | 'openingBalance'
    | 'closingBalance'
    | 'status'
    | 'notes'
    | 'autoMatchRatio'
    | 'metadata'
  >
>;

export interface RecordMatchInput
  extends Pick<
    ReconciliationMatch,
    | 'bankTransactionId'
    | 'ledgerTransactionId'
    | 'amount'
    | 'status'
    | 'confidence'
    | 'notes'
    | 'metadata'
  > {
  createdBy: string;
}

export interface RecordAdjustmentInput
  extends Pick<
    ReconciliationAdjustment,
    | 'description'
    | 'amount'
    | 'adjustmentType'
    | 'ledgerAccountId'
    | 'ledgerAccountCode'
    | 'metadata'
  > {
  createdBy: string;
}


function timestampToDate(value: undefined | null | Timestamp | Date): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  return value.toDate();
}

function toSafeDate(value: unknown): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function normalizeTransactionDate(value: unknown): string {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return new Date().toISOString().slice(0, 10);
    }
    // If already ISO-ish, trust it; otherwise try to parse
    const isoMatch = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
    if (isoMatch) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime())
      ? new Date().toISOString().slice(0, 10)
      : parsed.toISOString().slice(0, 10);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString().slice(0, 10);
  }

  const coerced = new Date(String(value));
  return Number.isNaN(coerced.getTime())
    ? new Date().toISOString().slice(0, 10)
    : coerced.toISOString().slice(0, 10);
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (value instanceof Timestamp) {
    return undefined;
  }

  const cleaned = typeof value === 'string' ? value.replace(/,/g, '').trim() : String(value);
  if (!cleaned) {
    return undefined;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function fromFirestoreSession(id: string, data: DocumentData): ReconciliationSession {
  return {
    id,
    companyId: data.companyId,
    bankAccountId: data.bankAccountId,
    bankAccountName: data.bankAccountName,
    currency: data.currency,
    periodStart: data.periodStart,
    periodEnd: data.periodEnd,
    openingBalance: Number(data.openingBalance ?? 0),
    closingBalance: Number(data.closingBalance ?? 0),
    status: (data.status as ReconciliationStatus) ?? 'draft',
    autoMatchRatio: Number(data.autoMatchRatio ?? 0),
    createdBy: data.createdBy,
    createdAt: timestampToDate(data.createdAt) ?? new Date(),
    updatedAt: timestampToDate(data.updatedAt) ?? new Date(),
    completedAt: timestampToDate(data.completedAt),
    notes: data.notes,
    metadata: data.metadata ?? {},
  };
}

function fromFirestoreMatch(
  id: string,
  sessionId: string,
  companyId: string,
  data: DocumentData
): ReconciliationMatch {
  return {
    id,
    sessionId,
    companyId,
    bankTransactionId: data.bankTransactionId,
    ledgerTransactionId: data.ledgerTransactionId,
    amount: Number(data.amount ?? 0),
    matchDate: data.matchDate,
    status: (data.status as ReconciliationMatchStatus) ?? 'suggested',
    confidence: Number(data.confidence ?? 0),
    createdBy: data.createdBy,
    createdAt: timestampToDate(data.createdAt) ?? new Date(),
    updatedAt: timestampToDate(data.updatedAt) ?? new Date(),
    notes: data.notes,
    metadata: data.metadata ?? {},
  };
}

function fromFirestoreLedgerEntry(id: string, data: DocumentData): LedgerEntry {
  return {
    id,
    tenantId: data.tenantId || data.companyId || '',
    journalEntryId: data.journalEntryId || '',
    journalLineId: data.journalLineId || '',
    // Use bankAccountId if available, fallback to accountId
    accountId: data.bankAccountId || data.accountId || '',
    accountCode: data.accountCode || '',
    debit: Number(data.debit ?? 0),
    credit: Number(data.credit ?? 0),
    cumulativeBalance: Number(data.cumulativeBalance ?? 0),
    currency: data.currency ?? 'USD',
    transactionDate: toSafeDate(data.transactionDate),
    postingDate: toSafeDate(data.postingDate ?? data.transactionDate),
    fiscalPeriodId: data.fiscalPeriodId ?? '',
    source: data.source ?? 'manual',
    metadata: { ...(data.metadata || {}), bankAccountId: data.bankAccountId },
    createdAt: timestampToDate(data.createdAt) ?? new Date(),
  } as LedgerEntry;
}

function fromFirestoreAdjustment(
  id: string,
  sessionId: string,
  companyId: string,
  data: DocumentData
): ReconciliationAdjustment {
  return {
    id,
    sessionId,
    companyId,
    description: data.description,
    amount: Number(data.amount ?? 0),
    adjustmentType: data.adjustmentType,
    ledgerAccountId: data.ledgerAccountId,
    ledgerAccountCode: data.ledgerAccountCode,
    createdBy: data.createdBy,
    createdAt: timestampToDate(data.createdAt) ?? new Date(),
    postedJournalId: data.postedJournalId,
    metadata: data.metadata ?? {},
  };
}

export class ReconciliationService {
  private postingService?: PostingService;

  constructor(companyId?: string) {
    if (companyId) {
      this.postingService = new PostingService({ tenantId: companyId });
    }
  }

  private getPostingService(companyId: string): PostingService {
    if (!this.postingService || this.postingService['options'].tenantId !== companyId) {
      this.postingService = new PostingService({ tenantId: companyId });
    }
    return this.postingService;
  }
  async listSessions(companyId: string, limit = 20): Promise<ReconciliationSession[]> {
    const q = query(
      collection(db, COLLECTION_PATH(companyId)),
      orderBy('createdAt', 'desc'),
      limitFn(limit)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => fromFirestoreSession(docSnap.id, docSnap.data()));
  }

  private async loadStatementTransactions(statementId: string): Promise<BankTransaction[]> {
    try {
      const transactionsRef = collection(db, `bank_statements/${statementId}/transactions`);
      const transactionsSnapshot = await getDocs(query(transactionsRef, orderBy('date', 'asc')));

      return transactionsSnapshot.docs.map((txDoc, index) => {
        const data = txDoc.data() as Record<string, unknown>;
        const debit = toOptionalNumber(data.debit);
        const credit = toOptionalNumber(data.credit);
        const balance = toOptionalNumber(data.balance);

        const transaction: BankTransaction = {
          id: txDoc.id || `${statementId}_${index}`,
          date: normalizeTransactionDate(data.date),
          description: typeof data.description === 'string' ? data.description : '',
          debit: debit,
          credit: credit,
          balance: typeof balance === 'number' && Number.isFinite(balance) ? balance : 0,
        };

        if (typeof data.reference === 'string' && data.reference.trim().length > 0) {
          transaction.reference = data.reference.trim();
        }
        if (typeof data.type === 'string') {
          transaction.type = data.type as BankTransaction['type'];
        }
        if (typeof data.category === 'string') {
          transaction.category = data.category;
        }

        return transaction;
      });
    } catch (error) {
      console.error('[Reconciliation] Failed to load transactions subcollection', {
        statementId,
        error,
      });
      return [];
    }
  }

  async getSession(companyId: string, sessionId: string): Promise<ReconciliationSession | null> {
    const docRef = doc(db, COLLECTION_PATH(companyId), sessionId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) {
      return null;
    }
    return fromFirestoreSession(snapshot.id, snapshot.data());
  }

  async createSession(companyId: string, input: CreateReconciliationSessionInput): Promise<ReconciliationSession> {
    const now = new Date();
    const payload = {
      companyId,
      bankAccountId: input.bankAccountId,
      bankAccountName: input.bankAccountName ?? null,
      currency: input.currency,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      openingBalance: input.openingBalance,
      closingBalance: input.closingBalance,
      status: 'draft' as ReconciliationStatus,
      autoMatchRatio: 0,
      createdBy: input.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      notes: input.notes ?? null,
      metadata: input.metadata ?? {},
    };

    const docRef = await addDoc(collection(db, COLLECTION_PATH(companyId)), payload);
    return {
      id: docRef.id,
      companyId,
      bankAccountId: input.bankAccountId,
      bankAccountName: input.bankAccountName,
      currency: input.currency,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      openingBalance: input.openingBalance,
      closingBalance: input.closingBalance,
      status: 'draft',
      autoMatchRatio: 0,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
      notes: input.notes,
      metadata: input.metadata ?? {},
    };
  }

  async updateSession(
    companyId: string,
    sessionId: string,
    updates: UpdateReconciliationSessionInput
  ): Promise<void> {
    const docRef = doc(db, COLLECTION_PATH(companyId), sessionId);
    const payload: Record<string, unknown> = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    if (updates.status === 'completed') {
      payload.completedAt = serverTimestamp();
    }

    await updateDoc(docRef, payload);
  }


  async listLedgerEntries(
    companyId: string,
    accountId: string,
    options?: { periodStart?: string; periodEnd?: string; limit?: number }
  ): Promise<LedgerEntry[]> {
    try {
      // Try to match on either bankAccountId or accountId field
      // since ledger entries might use either field
      const constraints: QueryConstraint[] = [where('accountId', '==', accountId)];
      const { periodStart, periodEnd, limit = 200 } = options ?? {};

      const toDate = (value?: string) => {
        if (!value) return null;

        // Handle ISO date format (YYYY-MM-DD)
        if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
          const parsed = new Date(value);
          return Number.isNaN(parsed.getTime()) ? null : parsed;
        }

        // Handle "DD MMM" format (e.g., "01 Sep", "20 Sep") - for backward compatibility
        if (value.match(/^\d{1,2}\s+\w{3}$/)) {
          // Add the current year for now (should be 2025 based on your data)
          const currentYear = new Date().getFullYear();
          const parsed = new Date(`${value} ${currentYear}`);
          console.log(`Parsing legacy date format "${value}" as: ${parsed}`);
          return Number.isNaN(parsed.getTime()) ? null : parsed;
        }

        // Try to parse as-is for other formats
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };

      const startDate = toDate(periodStart);
      const endDate = toDate(periodEnd);

      console.log('listLedgerEntries query params:', {
        companyId,
        bankAccountId: accountId,
        periodStart,
        periodEnd,
        parsedStartDate: startDate,
        parsedEndDate: endDate
      });

      if (startDate) {
        constraints.push(where('transactionDate', '>=', startDate));
      }
      if (endDate) {
        constraints.push(where('transactionDate', '<=', endDate));
      }

      constraints.push(orderBy('transactionDate', 'desc'));

      const snapshot = await getDocs(
        query(collection(db, `companies/${companyId}/ledgerEntries`), ...constraints, limitFn(limit))
      );

      console.log(`Query returned ${snapshot.size} ledger entries`);

      const entries = snapshot.docs.map((docSnap) => fromFirestoreLedgerEntry(docSnap.id, docSnap.data()));

      if (entries.length > 0) {
        console.log('Sample ledger entry:', {
          id: entries[0].id,
          bankAccountId: entries[0].accountId,
          transactionDate: entries[0].transactionDate,
          debit: entries[0].debit,
          credit: entries[0].credit
        });
      }

      return entries;
    } catch (error) {
      console.warn('Failed to load ledger entries for reconciliation:', error);
      return [];
    }
  }

  async recordMatch(
    companyId: string,
    sessionId: string,
    input: RecordMatchInput
  ): Promise<ReconciliationMatch> {
    const now = new Date();
    const payload = {
      bankTransactionId: input.bankTransactionId,
      ledgerTransactionId: input.ledgerTransactionId,
      amount: input.amount,
      matchDate: now.toISOString().slice(0, 10),
      status: input.status,
      confidence: input.confidence,
      createdBy: input.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      notes: input.notes ?? null,
      metadata: input.metadata ?? {},
    };

    const docRef = await addDoc(collection(db, MATCHES_COLLECTION(companyId, sessionId)), payload);
    return {
      id: docRef.id,
      sessionId,
      companyId,
      bankTransactionId: input.bankTransactionId,
      ledgerTransactionId: input.ledgerTransactionId,
      amount: input.amount,
      matchDate: payload.matchDate,
      status: input.status,
      confidence: input.confidence,
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
      notes: input.notes,
      metadata: input.metadata ?? {},
    };
  }

  async listMatches(companyId: string, sessionId: string): Promise<ReconciliationMatch[]> {
    const q = query(
      collection(db, MATCHES_COLLECTION(companyId, sessionId)),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) =>
      fromFirestoreMatch(docSnap.id, sessionId, companyId, docSnap.data())
    );
  }

  async recordAdjustment(
    companyId: string,
    sessionId: string,
    input: RecordAdjustmentInput
  ): Promise<ReconciliationAdjustment> {
    const now = new Date();
    const payload = {
      description: input.description,
      amount: input.amount,
      adjustmentType: input.adjustmentType,
      ledgerAccountId: input.ledgerAccountId,
      ledgerAccountCode: input.ledgerAccountCode ?? null,
      createdBy: input.createdBy,
      createdAt: serverTimestamp(),
      metadata: input.metadata ?? {},
    };

    const docRef = await addDoc(collection(db, ADJUSTMENTS_COLLECTION(companyId, sessionId)), payload);
    return {
      id: docRef.id,
      sessionId,
      companyId,
      description: input.description,
      amount: input.amount,
      adjustmentType: input.adjustmentType,
      ledgerAccountId: input.ledgerAccountId,
      ledgerAccountCode: input.ledgerAccountCode,
      createdBy: input.createdBy,
      createdAt: now,
      metadata: input.metadata ?? {},
    };
  }

  async listAdjustments(
    companyId: string,
    sessionId: string
  ): Promise<ReconciliationAdjustment[]> {
    const snapshot = await getDocs(collection(db, ADJUSTMENTS_COLLECTION(companyId, sessionId)));
    return snapshot.docs.map((docSnap) =>
      fromFirestoreAdjustment(docSnap.id, sessionId, companyId, docSnap.data())
    );
  }

  async updateMatchStatus(
    companyId: string,
    sessionId: string,
    matchId: string,
    status: ReconciliationMatchStatus
  ): Promise<void> {
    const docRef = doc(db, MATCHES_COLLECTION(companyId, sessionId), matchId);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  }

  async fetchAutoMatchCandidates(
    companyId: string,
    sessionId: string
  ): Promise<AutoMatchCandidate[]> {
    const snapshot = await getDocs(
      query(
        collection(db, MATCHES_COLLECTION(companyId, sessionId)),
        where('status', '==', 'suggested')
      )
    );

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        bankTransactionId: data.bankTransactionId,
        ledgerTransactionId: data.ledgerTransactionId,
        amountDifference: Number(data.amountDifference ?? 0),
        dateDifferenceInDays: Number(data.dateDifferenceInDays ?? 0),
        confidence: Number(data.confidence ?? 0),
        ruleApplied: data.ruleApplied ?? 'unknown',
      } as AutoMatchCandidate;
    });
  }

  /**
   * Get bank transactions for a specific statement
   */
  async getBankTransactions(
    companyId: string,
    statementId: string
  ): Promise<BankTransaction[]> {
    try {
      // Bank statements are stored in the root 'bank_statements' collection
      const docRef = doc(db, 'bank_statements', statementId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        console.warn('Bank statement not found:', statementId);
        // Also try under companies collection as a fallback
        const companyDocRef = doc(db, `companies/${companyId}/bankStatements`, statementId);
        const companySnapshot = await getDoc(companyDocRef);

        if (!companySnapshot.exists()) {
          console.warn('Bank statement not found in either location');
          return [];
        }

        const statement = companySnapshot.data() as BankStatement;
        const inlineTransactions = statement.transactions || [];

        const transactions = inlineTransactions.length
          ? inlineTransactions
          : await this.loadStatementTransactions(statementId);

        return transactions.map((tx, index) => {
          const stableId =
            tx.id ||
            `${statementId}_${tx.date}_${index}_${tx.description?.replace(/[^a-zA-Z0-9]/g, '_')}`;
          return { ...tx, id: stableId };
        });
      }

      const statement = snapshot.data() as BankStatement;
      const inlineTransactions = statement.transactions || [];

      const transactions = inlineTransactions.length
        ? inlineTransactions
        : await this.loadStatementTransactions(statementId);

      return transactions.map((tx, index) => {
        const stableId =
          tx.id ||
          `${statementId}_${tx.date}_${index}_${tx.description?.replace(/[^a-zA-Z0-9]/g, '_')}`;
        return { ...tx, id: stableId };
      });
    } catch (error) {
      console.error('Failed to load bank transactions:', error);
      return [];
    }
  }

  /**
   * Get bank transactions for a period
   */
  async getBankTransactionsForPeriod(
    companyId: string,
    bankAccountId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<BankTransaction[]> {
    try {
      console.log(`[BANK-TX] Fetching transactions for account: ${bankAccountId}, period: ${periodStart} to ${periodEnd}`);

      // Query ALL bank statements for the company first
      // We'll filter by account after loading since bankAccountId might not match accountNumber
      const constraints: QueryConstraint[] = [
        orderBy('summary.statementPeriod.from', 'desc'),
      ];

      const snapshot = await getDocs(
        query(collection(db, `companies/${companyId}/bankStatements`), ...constraints)
      );

      console.log(`[BANK-TX] Found ${snapshot.size} bank statements for company`);

      const transactions: BankTransaction[] = [];
      const startDate = new Date(periodStart);
      const endDate = new Date(periodEnd);

      for (const doc of snapshot.docs) {
        const statement = doc.data() as BankStatement;

        // Check if this statement belongs to the correct bank account
        // Handle both cases: bankAccountId as ID or as account number
        const statementAccountId = statement.bankAccountId || statement.accountInfo?.accountId;
        const statementAccountNumber = statement.accountInfo?.accountNumber;

        const isCorrectAccount =
          statementAccountId === bankAccountId ||
          statementAccountNumber === bankAccountId ||
          (statement.accountInfo?.accountName &&
           statement.accountInfo.accountName.toLowerCase().includes('savings') &&
           bankAccountId.includes('savings'));

        console.log(`[BANK-TX] Statement ${doc.id}: accountId=${statementAccountId}, accountNumber=${statementAccountNumber}, matches=${isCorrectAccount}`);

        if (isCorrectAccount) {
          let statementTransactions = statement.transactions || [];

          if (!statementTransactions.length) {
            statementTransactions = await this.loadStatementTransactions(doc.id);
          }

          // Filter transactions within the period and ensure stable IDs
          const filtered = statementTransactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate >= startDate && txDate <= endDate;
          }).map((tx, index) => {
            // Create stable ID using statement ID, date, and description hash
            const stableId = tx.id || `${doc.id}_${tx.date}_${index}_${tx.description?.replace(/[^a-zA-Z0-9]/g, '_')}`;
            return { ...tx, id: stableId };
          });

          console.log(`[BANK-TX] Added ${filtered.length} transactions from statement ${doc.id}`);
          transactions.push(...filtered);
        }
      }

      return transactions.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    } catch (error) {
      console.error('Failed to load bank transactions for period:', error);
      return [];
    }
  }

  /**
   * Perform auto-matching for a reconciliation session
   */
  async performAutoMatch(
    companyId: string,
    sessionId: string,
    config?: MatchingConfig
  ): Promise<AutoMatchResult & { savedCount: number }> {
    try {
      // Get session details
      const session = await this.getSession(companyId, sessionId);
      if (!session) {
        throw new Error('Reconciliation session not found');
      }

      // Get bank transactions - check if we have a statementId in the session metadata
      let bankTransactions: BankTransaction[] = [];

      if (session.metadata?.statementId) {
        console.log(`[AUTO-MATCH] Loading bank transactions from statement: ${session.metadata.statementId}`);
        const statement = await this.getBankTransactions(companyId, session.metadata.statementId as string);
        bankTransactions = statement;
      } else {
        console.log(`[AUTO-MATCH] No statementId in session metadata, trying date range query`);
        bankTransactions = await this.getBankTransactionsForPeriod(
          companyId,
          session.bankAccountId,
          session.periodStart,
          session.periodEnd
        );
      }

      console.log(`[AUTO-MATCH] Found ${bankTransactions.length} bank transactions`);
      if (bankTransactions.length > 0) {
        const { getBankTransactionAmount } = await import('./reconciliation-utils');
        console.log('[AUTO-MATCH] Sample bank transaction:', {
          id: bankTransactions[0].id,
          date: bankTransactions[0].date,
          description: bankTransactions[0].description,
          debit: bankTransactions[0].debit,
          credit: bankTransactions[0].credit,
          calculatedAmount: getBankTransactionAmount(bankTransactions[0])
        });
      }

      // Get ledger entries
      const ledgerEntries = await this.listLedgerEntries(
        companyId,
        session.bankAccountId,
        {
          periodStart: session.periodStart,
          periodEnd: session.periodEnd,
          limit: 500,
        }
      );

      console.log(`[AUTO-MATCH] Found ${ledgerEntries.length} ledger entries`);
      if (ledgerEntries.length > 0) {
        const { getLedgerEntryAmount } = await import('./reconciliation-utils');
        console.log('[AUTO-MATCH] Sample ledger entry:', {
          id: ledgerEntries[0].id,
          transactionDate: ledgerEntries[0].transactionDate,
          debit: ledgerEntries[0].debit,
          credit: ledgerEntries[0].credit,
          calculatedAmount: getLedgerEntryAmount(ledgerEntries[0])
        });
      }

      // Get existing matches to exclude
      const existingMatches = await this.listMatches(companyId, sessionId);
      const matchedBankIds = new Set(
        existingMatches.map(m => m.bankTransactionId)
      );
      const matchedLedgerIds = new Set(
        existingMatches.map(m => m.ledgerTransactionId)
      );

      // Filter out already matched transactions
      const unmatchedBankTx = bankTransactions.filter(
        tx => tx.id && !matchedBankIds.has(tx.id)
      );
      const unmatchedLedgerEntries = ledgerEntries.filter(
        le => !matchedLedgerIds.has(le.id)
      );

      console.log(`[AUTO-MATCH] Processing ${unmatchedBankTx.length} unmatched bank tx, ${unmatchedLedgerEntries.length} unmatched ledger entries`);

      // Perform auto-matching
      const matchResult = performAutoMatching(
        unmatchedBankTx,
        unmatchedLedgerEntries,
        config
      );

      console.log(`[AUTO-MATCH] Result: Found ${matchResult.matches.length} matches (${(matchResult.matchRatio * 100).toFixed(1)}% match rate)`);

      // Save suggested matches to Firestore
      const batch = writeBatch(db);
      let savedCount = 0;

      for (const match of matchResult.matches) {
        const matchDoc = doc(collection(db, MATCHES_COLLECTION(companyId, sessionId)));
        batch.set(matchDoc, {
          bankTransactionId: match.bankTransactionId,
          ledgerTransactionId: match.ledgerTransactionId,
          amount: match.bankTransaction?.credit || match.bankTransaction?.debit || 0,
          matchDate: new Date().toISOString().slice(0, 10),
          status: 'suggested' as ReconciliationMatchStatus,
          confidence: match.confidence,
          amountDifference: match.amountDifference,
          dateDifferenceInDays: match.dateDifferenceInDays,
          ruleApplied: match.ruleApplied,
          createdBy: 'system',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          metadata: {
            bankDescription: match.bankTransaction?.description,
            ledgerDescription: match.ledgerEntry?.metadata?.description,
          },
        });
        savedCount++;
      }

      await batch.commit();

      // Update session with match ratio
      await this.updateSession(companyId, sessionId, {
        autoMatchRatio: matchResult.matchRatio,
        status: 'in_progress' as ReconciliationStatus,
      });

      return {
        ...matchResult,
        savedCount,
      };
    } catch (error) {
      console.error('Failed to perform auto-matching:', error);
      throw error;
    }
  }

  /**
   * Validate reconciliation balances
   */
  async validateBalance(
    companyId: string,
    sessionId: string
  ): Promise<BalanceValidation> {
    const session = await this.getSession(companyId, sessionId);
    if (!session) {
      throw new Error('Reconciliation session not found');
    }

    const bankTransactions = await this.getBankTransactionsForPeriod(
      companyId,
      session.bankAccountId,
      session.periodStart,
      session.periodEnd
    );

    return validateReconciliationBalance(
      session.openingBalance,
      session.closingBalance,
      bankTransactions
    );
  }

  /**
   * Delete a match
   */
  async deleteMatch(
    companyId: string,
    sessionId: string,
    matchId: string
  ): Promise<void> {
    const batch = writeBatch(db);
    const matchDoc = doc(db, MATCHES_COLLECTION(companyId, sessionId), matchId);
    batch.delete(matchDoc);
    await batch.commit();
  }

  /**
   * Confirm multiple matches at once
   */
  async confirmMatches(
    companyId: string,
    sessionId: string,
    matchIds: string[]
  ): Promise<void> {
    const batch = writeBatch(db);

    for (const matchId of matchIds) {
      const matchDoc = doc(db, MATCHES_COLLECTION(companyId, sessionId), matchId);
      batch.update(matchDoc, {
        status: 'confirmed' as ReconciliationMatchStatus,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  }

  /**
   * Create and post an adjustment journal entry
   */
  async createAdjustmentJournal(
    companyId: string,
    input: CreateAdjustmentJournalInput
  ): Promise<AdjustmentJournalEntry> {
    const postingService = this.getPostingService(companyId);

    // Determine debit/credit based on adjustment type and amount
    const isDebitToBankAccount = input.amount > 0; // Positive = money into bank
    const absAmount = Math.abs(input.amount);

    const lines: JournalLine[] = [
      {
        id: `${input.adjustmentId}_bank`,
        accountId: input.bankAccountId,
        accountCode: input.bankAccountCode,
        description: input.description,
        debit: isDebitToBankAccount ? absAmount : 0,
        credit: isDebitToBankAccount ? 0 : absAmount,
        currency: input.currency,
      },
      {
        id: `${input.adjustmentId}_expense`,
        accountId: input.expenseAccountId,
        accountCode: input.expenseAccountCode,
        description: input.description,
        debit: isDebitToBankAccount ? 0 : absAmount,
        credit: isDebitToBankAccount ? absAmount : 0,
        currency: input.currency,
      },
    ];

    const journalEntry: JournalEntry = {
      id: `adj_${input.adjustmentId}_${Date.now()}`,
      tenantId: companyId,
      fiscalPeriodId: input.fiscalPeriodId,
      journalCode: 'RECONCILIATION_ADJ',
      reference: input.reference || `ADJ-${input.adjustmentId}`,
      description: `Reconciliation adjustment: ${input.description}`,
      status: 'draft',
      source: 'adjustment' as JournalSource,
      transactionDate: input.transactionDate,
      postingDate: new Date(),
      createdBy: input.createdBy,
      metadata: {
        reconciliationSessionId: input.sessionId,
        adjustmentId: input.adjustmentId,
        adjustmentType: input.adjustmentType,
        originalAmount: input.amount,
      },
      lines,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Post the journal entry
    const postingResult = await postingService.post(journalEntry);

    // Update the adjustment record with the posted journal ID
    const adjustmentDoc = doc(db, ADJUSTMENTS_COLLECTION(companyId, input.sessionId), input.adjustmentId);
    await updateDoc(adjustmentDoc, {
      postedJournalId: journalEntry.id,
      updatedAt: serverTimestamp(),
    });

    return {
      journalEntryId: journalEntry.id,
      adjustmentId: input.adjustmentId,
      sessionId: input.sessionId,
      amount: input.amount,
      description: input.description,
      adjustmentType: input.adjustmentType,
      createdAt: new Date(),
      ledgerEntries: postingResult.entries,
    };
  }

  /**
   * Create a reversal journal entry for an adjustment
   */
  async createReversalJournal(
    companyId: string,
    input: ReversalJournalInput
  ): Promise<AdjustmentJournalEntry> {
    const postingService = this.getPostingService(companyId);

    // Get the original journal entry
    const originalJournalDoc = await getDoc(doc(db, 'journal_entries', input.originalJournalId));
    if (!originalJournalDoc.exists()) {
      throw new Error('Original journal entry not found');
    }

    const originalJournal = originalJournalDoc.data() as JournalEntry;
    const originalMetadata = originalJournal.metadata || {};

    // Create reversal lines (swap debit/credit)
    const reversalLines: JournalLine[] = originalJournal.lines.map(line => ({
      ...line,
      id: `${line.id}_reversal`,
      debit: line.credit, // Swap debit and credit
      credit: line.debit,
      description: `Reversal: ${line.description || ''}`,
    }));

    const reversalJournal: JournalEntry = {
      id: `rev_${input.originalJournalId}_${Date.now()}`,
      tenantId: companyId,
      fiscalPeriodId: originalJournal.fiscalPeriodId,
      journalCode: 'RECONCILIATION_REV',
      reference: `REV-${originalJournal.reference}`,
      description: `Reversal of ${originalJournal.description} - Reason: ${input.reason}`,
      status: 'draft',
      source: 'adjustment' as JournalSource,
      transactionDate: input.reversalDate,
      postingDate: new Date(),
      createdBy: input.createdBy,
      reversalOf: input.originalJournalId,
      metadata: {
        ...originalMetadata,
        isReversal: true,
        originalJournalId: input.originalJournalId,
        reversalReason: input.reason,
      },
      lines: reversalLines,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Post the reversal journal entry
    const postingResult = await postingService.post(reversalJournal);

    // Update the original adjustment if this is a reconciliation adjustment
    if (originalMetadata.adjustmentId && originalMetadata.reconciliationSessionId) {
      const adjustmentDoc = doc(
        db,
        ADJUSTMENTS_COLLECTION(companyId, originalMetadata.reconciliationSessionId as string),
        originalMetadata.adjustmentId as string
      );

      await updateDoc(adjustmentDoc, {
        reversalJournalId: reversalJournal.id,
        reversalReason: input.reason,
        reversedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return {
      journalEntryId: reversalJournal.id,
      adjustmentId: originalMetadata.adjustmentId as string || 'unknown',
      sessionId: originalMetadata.reconciliationSessionId as string || 'unknown',
      amount: -(originalMetadata.originalAmount as number || 0),
      description: reversalJournal.description || '',
      adjustmentType: 'other',
      createdAt: new Date(),
      ledgerEntries: postingResult.entries,
      isReversal: true,
      originalJournalId: input.originalJournalId,
    };
  }

  /**
   * Validate that adjustments don't break reconciliation balance
   */
  async validateAdjustmentBalance(
    companyId: string,
    sessionId: string,
    proposedAdjustments: { amount: number }[]
  ): Promise<{ isValid: boolean; message?: string; projectedDifference: number }> {
    const session = await this.getSession(companyId, sessionId);
    if (!session) {
      throw new Error('Reconciliation session not found');
    }

    // Get current balance validation
    const currentValidation = await this.validateBalance(companyId, sessionId);

    // Get existing adjustments
    const existingAdjustments = await this.listAdjustments(companyId, sessionId);
    const existingAdjustmentTotal = existingAdjustments.reduce((sum, adj) => sum + adj.amount, 0);

    // Calculate total of proposed adjustments
    const proposedAdjustmentTotal = proposedAdjustments.reduce((sum, adj) => sum + adj.amount, 0);

    // Calculate projected difference after all adjustments
    const projectedDifference = currentValidation.difference - existingAdjustmentTotal - proposedAdjustmentTotal;

    const tolerance = 0.01; // 1 cent tolerance
    const isValid = Math.abs(projectedDifference) <= tolerance;

    return {
      isValid,
      message: isValid
        ? 'Adjustments will balance the reconciliation'
        : `Adjustments will leave a difference of ${projectedDifference.toFixed(2)}`,
      projectedDifference,
    };
  }

  /**
   * Get adjustment history for a reconciliation session
   */
  async getAdjustmentHistory(
    companyId: string,
    sessionId: string
  ): Promise<Array<ReconciliationAdjustment & { journalEntryId?: string; reversalJournalId?: string }>> {
    const adjustments = await this.listAdjustments(companyId, sessionId);

    // Add journal entry information
    return adjustments.map(adjustment => ({
      ...adjustment,
      journalEntryId: adjustment.postedJournalId,
      reversalJournalId: (adjustment as any).reversalJournalId,
    }));
  }

  /**
   * Bulk create adjustment entries with validation
   */
  async bulkCreateAdjustments(
    companyId: string,
    sessionId: string,
    adjustments: Array<Omit<CreateAdjustmentJournalInput, 'sessionId'>>,
    validateBalance = true
  ): Promise<AdjustmentJournalEntry[]> {
    // Validate balance if requested
    if (validateBalance) {
      const validation = await this.validateAdjustmentBalance(
        companyId,
        sessionId,
        adjustments.map(adj => ({ amount: adj.amount }))
      );

      if (!validation.isValid) {
        throw new Error(`Balance validation failed: ${validation.message}`);
      }
    }

    const results: AdjustmentJournalEntry[] = [];

    // Process adjustments sequentially to maintain data consistency
    for (const adjustment of adjustments) {
      const result = await this.createAdjustmentJournal(companyId, {
        ...adjustment,
        sessionId,
      });
      results.push(result);
    }

    return results;
  }
}

export const reconciliationService = new ReconciliationService();
