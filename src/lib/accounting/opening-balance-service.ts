import { collection, doc, writeBatch, Timestamp, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { JournalEntry, JournalLine } from '@/types/accounting/journal';
import { AccountType } from '@/types/accounting/chart-of-accounts';

export interface OpeningBalanceInput {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  amount: number; // Always positive - we determine debit/credit based on account type and sign
}

export interface OpeningBalanceResult {
  success: boolean;
  journalEntryId?: string;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  errors?: string[];
}

export class OpeningBalanceService {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Calculate if an amount should be a debit or credit based on account type
   */
  private getDebitCredit(accountType: AccountType, amount: number): { debit: number; credit: number } {
    // Assets and Expenses: Positive = Debit, Negative = Credit
    // Liabilities, Equity, Revenue: Positive = Credit, Negative = Debit

    const isDebitNormal = accountType === 'asset' || accountType === 'expense';

    if (amount >= 0) {
      return isDebitNormal
        ? { debit: amount, credit: 0 }
        : { debit: 0, credit: amount };
    } else {
      return isDebitNormal
        ? { debit: 0, credit: Math.abs(amount) }
        : { debit: Math.abs(amount), credit: 0 };
    }
  }

  /**
   * Validate opening balance inputs
   */
  private validate(balances: OpeningBalanceInput[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (balances.length === 0) {
      errors.push('At least one account balance is required');
    }

    // Check for duplicate accounts
    const accountIds = balances.map(b => b.accountId);
    const duplicates = accountIds.filter((id, index) => accountIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate accounts found: ${duplicates.join(', ')}`);
    }

    // Check for invalid amounts
    balances.forEach(balance => {
      if (isNaN(balance.amount)) {
        errors.push(`Invalid amount for account ${balance.accountCode}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate balancing entry for retained earnings
   */
  private calculateBalancingEntry(
    lines: JournalLine[],
    retainedEarningsAccount: { id: string; code: string; name: string },
    currency: string
  ): JournalLine {
    const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);
    const difference = totalDebits - totalCredits;

    // If debits > credits, we need a credit to balance
    // If credits > debits, we need a debit to balance
    const balancingLine: JournalLine = {
      id: `line_${Date.now()}_balancing`,
      accountId: retainedEarningsAccount.id,
      accountCode: retainedEarningsAccount.code,
      accountName: retainedEarningsAccount.name,
      description: 'Balancing entry for opening balances',
      debit: difference < 0 ? Math.abs(difference) : 0,
      credit: difference > 0 ? difference : 0,
      currency
    };

    return balancingLine;
  }

  /**
   * Post opening balances to the ledger
   */
  async postOpeningBalances(
    fiscalPeriodId: string,
    effectiveDate: Date,
    balances: OpeningBalanceInput[],
    retainedEarningsAccountId: string,
    createdBy: string,
    currency: string = 'ZAR'
  ): Promise<OpeningBalanceResult> {
    try {
      console.log('[OpeningBalanceService] Posting opening balances...');
      console.log(`  Tenant: ${this.tenantId}`);
      console.log(`  Fiscal Period: ${fiscalPeriodId}`);
      console.log(`  Effective Date: ${effectiveDate.toISOString()}`);
      console.log(`  Balances: ${balances.length} accounts`);

      // Validate inputs
      const validation = this.validate(balances);
      if (!validation.valid) {
        return {
          success: false,
          totalDebits: 0,
          totalCredits: 0,
          isBalanced: false,
          errors: validation.errors
        };
      }

      // Check if opening balance already exists for this fiscal period
      const existingQuery = query(
        collection(db, 'journal_entries'),
        where('tenantId', '==', this.tenantId),
        where('fiscalPeriodId', '==', fiscalPeriodId),
        where('source', '==', 'opening_balance')
      );

      const existingSnapshot = await getDocs(existingQuery);
      if (!existingSnapshot.empty) {
        return {
          success: false,
          totalDebits: 0,
          totalCredits: 0,
          isBalanced: false,
          errors: ['Opening balance already exists for this fiscal period. Please delete the existing entry first.']
        };
      }

      // Get retained earnings account details
      const retainedEarningsRef = doc(db, 'accounting_accounts', retainedEarningsAccountId);
      const retainedEarningsSnap = await getDoc(retainedEarningsRef);

      if (!retainedEarningsSnap.exists()) {
        return {
          success: false,
          totalDebits: 0,
          totalCredits: 0,
          isBalanced: false,
          errors: ['Retained earnings account not found']
        };
      }

      const retainedEarningsData = retainedEarningsSnap.data();

      // Create journal lines from balances
      const journalLines: JournalLine[] = balances.map((balance, index) => {
        const { debit, credit } = this.getDebitCredit(balance.accountType, balance.amount);

        return {
          id: `line_${Date.now()}_${index}`,
          accountId: balance.accountId,
          accountCode: balance.accountCode,
          accountName: balance.accountName,
          description: `Opening balance - ${balance.accountName}`,
          debit,
          credit,
          currency
        };
      });

      // Add balancing entry for retained earnings
      const balancingLine = this.calculateBalancingEntry(
        journalLines,
        {
          id: retainedEarningsAccountId,
          code: retainedEarningsData.code,
          name: retainedEarningsData.name
        },
        currency
      );

      journalLines.push(balancingLine);

      // Calculate totals
      const totalDebits = journalLines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredits = journalLines.reduce((sum, line) => sum + line.credit, 0);
      const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

      if (!isBalanced) {
        return {
          success: false,
          totalDebits,
          totalCredits,
          isBalanced: false,
          errors: [`Entry not balanced: Debits R${totalDebits.toFixed(2)} != Credits R${totalCredits.toFixed(2)}`]
        };
      }

      // Create journal entry
      const journalEntryId = `opening_balance_${this.tenantId}_${Date.now()}`;
      const journalEntry: Omit<JournalEntry, 'id'> = {
        tenantId: this.tenantId,
        fiscalPeriodId,
        journalCode: 'OB',
        reference: `OB-${fiscalPeriodId}`,
        description: `Opening balances as of ${effectiveDate.toISOString().split('T')[0]}`,
        status: 'posted',
        source: 'opening_balance',
        transactionDate: effectiveDate,
        postingDate: effectiveDate,
        createdBy,
        lines: journalLines,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Post to Firestore using batch write
      const batch = writeBatch(db);

      // 1. Create journal entry
      const journalRef = doc(db, 'journal_entries', journalEntryId);
      batch.set(journalRef, {
        ...journalEntry,
        transactionDate: Timestamp.fromDate(effectiveDate),
        postingDate: Timestamp.fromDate(effectiveDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // 2. Create GL entries
      journalLines.forEach((line, index) => {
        const glEntryId = `${journalEntryId}_gl_${index}`;
        batch.set(doc(db, 'general_ledger', glEntryId), {
          id: glEntryId,
          tenantId: this.tenantId,
          fiscalPeriodId,
          journalEntryId,
          accountId: line.accountId,
          accountCode: line.accountCode,
          accountName: line.accountName,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
          currency: line.currency,
          transactionDate: Timestamp.fromDate(effectiveDate),
          postingDate: Timestamp.fromDate(effectiveDate),
          source: 'opening_balance',
          reference: `OB-${fiscalPeriodId}`,
          createdAt: Timestamp.now()
        });
      });

      // Commit batch
      await batch.commit();

      console.log('[OpeningBalanceService] Opening balances posted successfully');
      console.log(`  Journal Entry ID: ${journalEntryId}`);
      console.log(`  Total Debits: R${totalDebits.toFixed(2)}`);
      console.log(`  Total Credits: R${totalCredits.toFixed(2)}`);
      console.log(`  GL Entries: ${journalLines.length}`);

      return {
        success: true,
        journalEntryId,
        totalDebits,
        totalCredits,
        isBalanced: true
      };

    } catch (error) {
      console.error('[OpeningBalanceService] Error posting opening balances:', error);
      return {
        success: false,
        totalDebits: 0,
        totalCredits: 0,
        isBalanced: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      };
    }
  }

  /**
   * Get existing opening balance entry if it exists
   */
  async getExistingOpeningBalance(fiscalPeriodId: string): Promise<JournalEntry | null> {
    try {
      const existingQuery = query(
        collection(db, 'journal_entries'),
        where('tenantId', '==', this.tenantId),
        where('fiscalPeriodId', '==', fiscalPeriodId),
        where('source', '==', 'opening_balance')
      );

      const snapshot = await getDocs(existingQuery);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        ...data,
        id: doc.id,
        transactionDate: data.transactionDate?.toDate() || new Date(),
        postingDate: data.postingDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as JournalEntry;

    } catch (error) {
      console.error('[OpeningBalanceService] Error getting existing opening balance:', error);
      return null;
    }
  }
}
