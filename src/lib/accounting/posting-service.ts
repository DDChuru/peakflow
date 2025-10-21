import { db } from '@/lib/firebase/config';
import { collection, doc, runTransaction, Timestamp } from 'firebase/firestore';
import {
  JournalEntry,
  JournalValidationResult,
  ValidationIssue,
} from '@/types/accounting/journal';
import { LedgerEntry, PostingBatchResult } from '@/types/accounting/general-ledger';
import { AccountRecord } from '@/types/accounting/chart-of-accounts';
import { FiscalPeriod } from '@/types/accounting/fiscal-period';

interface PostingServiceOptions {
  tenantId: string;
  allowBackdatedPosting?: boolean;
}

export class PostingService {
  constructor(private readonly options: PostingServiceOptions) {}

  async validate(entry: JournalEntry): Promise<JournalValidationResult> {
    const issues: ValidationIssue[] = [];

    const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      issues.push({
        code: 'UNBALANCED_ENTRY',
        severity: 'error',
        message: 'Journal entry is not balanced',
        context: { totalDebit, totalCredit },
      });
    }

    if (entry.lines.length === 0) {
      issues.push({
        code: 'NO_LINES',
        severity: 'error',
        message: 'Journal entry must contain at least one line',
      });
    }

    return {
      isBalanced: issues.every((issue) => issue.severity !== 'error'),
      issues,
    };
  }

  async post(entry: JournalEntry): Promise<PostingBatchResult> {
    const validation = await this.validate(entry);
    if (!validation.isBalanced) {
      throw new Error('Cannot post unbalanced journal entry');
    }

    return runTransaction(db, async (transaction) => {
      const ledgerCollection = collection(db, 'general_ledger');
      const fiscalPeriodDoc = doc(db, 'fiscal_periods', entry.fiscalPeriodId);

      const fiscalPeriodSnapshot = await transaction.get(fiscalPeriodDoc);
      if (fiscalPeriodSnapshot.exists()) {
        const fiscalPeriod = fiscalPeriodSnapshot.data() as FiscalPeriod;
        if (fiscalPeriod.status !== 'open') {
          throw new Error('Fiscal period is not open');
        }
      } else {
        console.warn(
          '[PostingService] Fiscal period not found, proceeding without period validation',
          entry.fiscalPeriodId
        );
      }

      const entries: LedgerEntry[] = entry.lines.map((line) => ({
        id: doc(ledgerCollection).id,
        tenantId: this.options.tenantId,
        journalEntryId: entry.id,
        journalLineId: line.id,
        accountId: line.accountId,
        accountCode: line.accountCode,
        accountName: line.accountName,  // Copy account name for display
        debit: line.debit,
        credit: line.credit,
        cumulativeBalance: 0,
        currency: line.currency,
        transactionDate: entry.transactionDate,
        postingDate: entry.postingDate ?? new Date(),
        fiscalPeriodId: entry.fiscalPeriodId,
        source: entry.source,
        ...(line.description && { description: line.description }),  // Only include if defined
        ...(entry.metadata && { metadata: entry.metadata }),  // Only include if defined
        ...(line.dimensions && { dimensions: line.dimensions }),  // Only include if defined
        createdAt: new Date(),
      }));

      entries.forEach((ledgerEntry) => {
        const ledgerDoc = doc(ledgerCollection, ledgerEntry.id);
        transaction.set(ledgerDoc, {
          ...ledgerEntry,
          transactionDate: Timestamp.fromDate(ledgerEntry.transactionDate),
          postingDate: Timestamp.fromDate(ledgerEntry.postingDate),
          createdAt: Timestamp.fromDate(ledgerEntry.createdAt),
        });
      });

      const journalDoc = doc(db, 'journal_entries', entry.id);
      transaction.set(journalDoc, {
        ...entry,
        status: 'posted',
        postingDate: Timestamp.fromDate(entry.postingDate ?? new Date()),
        createdAt: Timestamp.fromDate(entry.createdAt),
        updatedAt: Timestamp.fromDate(new Date()),
      });

      return {
        journalEntryId: entry.id,
        entries,
      };
    });
  }
}
