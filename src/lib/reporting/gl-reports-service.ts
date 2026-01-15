/**
 * General Ledger Reports Service
 * Phase 3: Reporting & Analytics
 *
 * Comprehensive service for generating General Ledger reports:
 * - Trial Balance: Verify debits = credits at a specific date
 * - General Ledger by Account: Show all transactions for a specific account
 * - Journal Entries Report: Show all journal entries posted in a period
 *
 * These reports are foundational for financial analysis, audit trails,
 * and verification of accounting data integrity.
 */

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { LedgerEntry } from '@/types/accounting/general-ledger';
import type { JournalEntry } from '@/types/accounting/journal';
import type { AccountRecord, AccountType } from '@/types/accounting/chart-of-accounts';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Trial Balance Line Item
 */
export interface TrialBalanceLine {
  accountCode: string;
  accountName: string;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  debitTotal: number;
  creditTotal: number;
  balance: number; // Net balance based on account type
}

/**
 * Complete Trial Balance Report
 */
export interface TrialBalanceReport {
  companyId: string;
  asOfDate: Date;
  generatedAt: Date;
  accounts: TrialBalanceLine[];
  totalDebits: number;
  totalCredits: number;
  balanced: boolean; // true if totalDebits === totalCredits
}

/**
 * Single entry in General Ledger by Account report
 */
export interface GLAccountEntry {
  id: string;
  entryDate: Date;
  description: string;
  source: string; // AR_INVOICE, AP_BILL, JOURNAL, etc.
  reference: string; // Source document reference
  debit: number;
  credit: number;
  balance: number; // Running balance
  dimensions?: {
    customerId?: string;
    vendorId?: string;
    invoiceId?: string;
    billId?: string;
    paymentId?: string;
  };
}

/**
 * General Ledger by Account Report
 */
export interface GLAccountReport {
  companyId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  startDate?: Date;
  endDate?: Date;
  generatedAt: Date;
  openingBalance: number;
  closingBalance: number;
  entries: GLAccountEntry[];
  totalDebits: number;
  totalCredits: number;
  // Legacy aliases for UI components still using singular naming
  totalDebit?: number;
  totalCredit?: number;
}

/**
 * Journal Entry Line in report
 */
export interface JournalEntryLine {
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

/**
 * Journal Entry Detail in report
 */
export interface JournalEntryDetail {
  id: string;
  entryNumber: string;
  entryDate: Date;
  description: string;
  source: string;
  reference: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
  createdBy: string;
  createdAt: Date;
}

/**
 * Journal Entries Report
 */
export interface JournalEntriesReport {
  companyId: string;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
  entries: JournalEntryDetail[];
  totalEntries: number;
  filters?: JournalEntryFilters;
}

/**
 * Filters for journal entries report
 */
export interface JournalEntryFilters {
  source?: string; // Filter by source type
  accountCode?: string; // Filter by account involvement
  searchTerm?: string; // Search in description
}

// ============================================================================
// FORMATTED GL REPORT TYPES
// ============================================================================

/**
 * Entry type classification for formatted GL report
 */
export type GLEntryType =
  | 'Opening Balance'
  | 'Journal Entry'
  | 'Bank Import'
  | 'Bank Transfer'
  | 'AR Invoice'
  | 'AR Payment'
  | 'AP Bill'
  | 'AP Payment'
  | 'Adjustment'
  | 'Accrual'
  | 'Revaluation'
  | 'Closing Balance';

/**
 * Single formatted entry in the GL report
 * Columns: Date | Entry Type | Reference | Contra Acc | Description | Debit | Credit | Cumulative
 */
export interface FormattedGLEntry {
  date: Date;
  entryType: GLEntryType;
  reference: string;
  contraAccount: string; // The offsetting account code(s)
  description: string;
  debit: number;
  credit: number;
  cumulative: number; // Running cumulative balance
  // Metadata for drill-down
  journalEntryId?: string;
  source?: string;
}

/**
 * Monthly period section with opening/closing balances
 */
export interface FormattedGLMonthlySection {
  monthKey: string; // Format: YYYY-MM
  monthLabel: string; // Format: "January 2025"
  openingBalance: number;
  entries: FormattedGLEntry[];
  closingBalance: number;
  periodDebits: number;
  periodCredits: number;
}

/**
 * Options for generating formatted GL report
 */
export interface FormattedGLReportOptions {
  startDate: Date;
  endDate: Date;
  preparedBy?: string;
  includeZeroBalanceMonths?: boolean;
}

/**
 * Complete formatted General Ledger Report
 * Matches template format with monthly grouping
 */
export interface FormattedGLReport {
  // Header information
  companyId: string;
  companyName?: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  preparedBy: string;
  generatedAt: Date;
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };

  // Monthly sections with entries
  monthlySections: FormattedGLMonthlySection[];

  // Report totals
  openingBalance: number; // Opening balance at report start
  closingBalance: number; // Closing balance at report end
  totalDebits: number;
  totalCredits: number;
  netMovement: number;
}

/**
 * Internal type for raw GL entry data from Firestore
 * Used for type safety in formatted report generation
 */
interface RawGLEntryData {
  id: string;
  tenantId: string;
  accountCode: string;
  accountName?: string;
  journalEntryId?: string;
  transactionDate: Date | { toDate(): Date };
  debit?: number;
  credit?: number;
  description?: string;
  source?: string;
  reference?: string;
  dimensions?: Record<string, string>;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert Firestore Timestamp to Date
 */
function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value.toDate && typeof value.toDate === 'function') {
    return value.toDate();
  }
  return new Date(value);
}

/**
 * Round to 2 decimal places for currency
 */
function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Check if two numbers are approximately equal (accounting tolerance)
 */
function isBalanced(value1: number, value2: number, tolerance: number = 0.01): boolean {
  return Math.abs(value1 - value2) < tolerance;
}

// ============================================================================
// GL REPORTS SERVICE CLASS
// ============================================================================

export class GLReportsService {
  constructor(
    private companyId: string,
    private userId: string
  ) {}

  // ==========================================================================
  // TRIAL BALANCE REPORT
  // ==========================================================================

  /**
   * Generate Trial Balance as of a specific date
   * Shows all account balances and verifies debits = credits
   *
   * Purpose: Verify the integrity of the general ledger
   * All debits must equal all credits for the books to be balanced
   */
  async generateTrialBalance(asOfDate: Date): Promise<TrialBalanceReport> {
    try {
      console.log('📊 [GLReportsService] Generating Trial Balance', {
        companyId: this.companyId,
        asOfDate,
      });

      // Get account balances up to the as-of date
      const balances = await this.getAccountBalances(asOfDate);

      // Get chart of accounts for account names and types
      const chartMap = await this.getChartOfAccounts();

      // Build trial balance lines
      const accounts: TrialBalanceLine[] = [];
      let totalDebits = 0;
      let totalCredits = 0;

      console.log('📋 [GLReportsService] Account codes found in GL:',
        Array.from(balances.keys()).sort()
      );

      balances.forEach((balance, accountCode) => {
        const accountInfo = chartMap.get(accountCode);
        const accountName = accountInfo?.name || `Account ${accountCode}`;
        const accountTypeLower = accountInfo?.type || this.getAccountType(accountCode);
        const accountType = accountTypeLower.toUpperCase() as 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

        // Calculate net balance based on account type
        const netBalance = this.calculateBalance(
          balance.debit || 0,
          balance.credit || 0,
          accountTypeLower
        );

        const debitTotal = round(balance.debit || 0);
        const creditTotal = round(balance.credit || 0);

        console.log(`  📊 ${accountCode} (${accountType}): Debit=${debitTotal}, Credit=${creditTotal}, Balance=${round(netBalance)}`);

        accounts.push({
          accountCode,
          accountName,
          accountType,
          debitTotal,
          creditTotal,
          balance: round(netBalance),
        });

        totalDebits += (balance.debit || 0);
        totalCredits += (balance.credit || 0);
      });

      // Sort by account code
      accounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

      // Round totals
      totalDebits = round(totalDebits);
      totalCredits = round(totalCredits);

      // Check if balanced
      const balanced = isBalanced(totalDebits, totalCredits);

      const report: TrialBalanceReport = {
        companyId: this.companyId,
        asOfDate,
        generatedAt: new Date(),
        accounts,
        totalDebits,
        totalCredits,
        balanced,
      };

      console.log('✅ [GLReportsService] Trial Balance generated', {
        accountCount: accounts.length,
        totalDebits,
        totalCredits,
        balanced,
      });

      if (!balanced) {
        console.warn('⚠️ [GLReportsService] Trial Balance is NOT BALANCED!', {
          totalDebits,
          totalCredits,
          difference: round(totalDebits - totalCredits),
        });
      }

      return report;
    } catch (error: any) {
      console.error('❌ [GLReportsService] Error generating Trial Balance:', error);
      throw new Error(`Failed to generate Trial Balance: ${error.message}`);
    }
  }

  // ==========================================================================
  // GENERAL LEDGER BY ACCOUNT
  // ==========================================================================

  /**
   * Generate General Ledger report for a specific account
   * Shows all transactions with running balance
   *
   * Purpose: Detailed transaction history for a single account
   * Includes opening balance, all transactions, and closing balance
   */
  async generateGLByAccount(
    accountCode: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<GLAccountReport> {
    try {
      console.log('📊 [GLReportsService] Generating GL by Account', {
        companyId: this.companyId,
        accountCode,
        startDate,
        endDate,
      });

      // Get account info from Chart of Accounts, or use fallback
      const chartMap = await this.getChartOfAccounts();
      const accountInfo = chartMap.get(accountCode);

      // If account not in Chart of Accounts, use fallback detection
      const accountName = accountInfo?.name || `Account ${accountCode}`;
      const accountType = accountInfo?.type || this.getAccountType(accountCode);

      // Get opening balance (before start date)
      let openingBalance = 0;
      if (startDate) {
        openingBalance = await this.getAccountBalance(accountCode, startDate);
      }

      // Get ledger entries for the account
      const entries = await this.getGLEntries(accountCode, startDate, endDate);

      // Calculate running balances
      this.calculateRunningBalance(openingBalance, entries, accountType);

      // Calculate totals with safety checks
      const totalDebits = round(entries.reduce((sum, e) => sum + (e.debit || 0), 0));
      const totalCredits = round(entries.reduce((sum, e) => sum + (e.credit || 0), 0));
      const closingBalance = entries.length > 0
        ? (entries[entries.length - 1].balance || 0)
        : openingBalance;

      const report: GLAccountReport = {
        companyId: this.companyId,
        accountCode,
        accountName,
        accountType,
        startDate,
        endDate,
        generatedAt: new Date(),
        openingBalance: round(openingBalance),
        closingBalance: round(closingBalance),
        entries,
        totalDebits,
        totalCredits,
        // Legacy aliases (UI still expects singular names)
        totalDebit: totalDebits,
        totalCredit: totalCredits,
      };

      console.log('✅ [GLReportsService] GL by Account generated', {
        accountCode,
        entryCount: entries.length,
        openingBalance,
        closingBalance,
      });

      return report;
    } catch (error: any) {
      console.error('❌ [GLReportsService] Error generating GL by Account:', error);
      throw new Error(`Failed to generate GL by Account: ${error.message}`);
    }
  }

  // ==========================================================================
  // JOURNAL ENTRIES REPORT
  // ==========================================================================

  /**
   * Generate Journal Entries report for a period
   * Shows all journal entries with validation
   *
   * Purpose: Audit trail of all accounting entries
   * Each entry must balance (debits = credits)
   */
  async generateJournalEntriesReport(
    startDate: Date,
    endDate: Date,
    filters?: JournalEntryFilters
  ): Promise<JournalEntriesReport> {
    try {
      console.log('📊 [GLReportsService] Generating Journal Entries Report', {
        companyId: this.companyId,
        startDate,
        endDate,
        filters,
      });

      // Validate date range
      if (endDate < startDate) {
        throw new Error('End date must be greater than or equal to start date');
      }

      // Get journal entries for the period
      const entries = await this.getJournalEntries(startDate, endDate, filters);

      const report: JournalEntriesReport = {
        companyId: this.companyId,
        startDate,
        endDate,
        generatedAt: new Date(),
        entries,
        totalEntries: entries.length,
        filters,
      };

      console.log('✅ [GLReportsService] Journal Entries Report generated', {
        totalEntries: entries.length,
      });

      return report;
    } catch (error: any) {
      console.error('❌ [GLReportsService] Error generating Journal Entries Report:', error);
      throw new Error(`Failed to generate Journal Entries Report: ${error.message}`);
    }
  }

  // ==========================================================================
  // HELPER METHODS - ACCOUNT BALANCES
  // ==========================================================================

  /**
   * Get account balances grouped by account code up to a specific date
   * Returns cumulative debit and credit totals
   */
  private async getAccountBalances(asOfDate: Date): Promise<Map<string, { debit: number; credit: number }>> {
    try {
      const ledgerRef = collection(db, 'general_ledger');
      const q = query(
        ledgerRef,
        where('tenantId', '==', this.companyId),
        where('transactionDate', '<=', Timestamp.fromDate(asOfDate))
      );

      const snapshot = await getDocs(q);

      // Group by account code
      const balances = new Map<string, { debit: number; credit: number }>();

      snapshot.forEach((doc) => {
        const entry = doc.data() as any;
        const accountCode = entry.accountCode;

        if (!balances.has(accountCode)) {
          balances.set(accountCode, { debit: 0, credit: 0 });
        }

        const balance = balances.get(accountCode)!;
        balance.debit += entry.debit || 0;
        balance.credit += entry.credit || 0;
      });

      console.log(`📊 [GLReportsService] Retrieved balances for ${balances.size} accounts`);

      return balances;
    } catch (error: any) {
      console.error('❌ [GLReportsService] Error getting account balances:', error);
      throw new Error(`Failed to get account balances: ${error.message}`);
    }
  }

  /**
   * Get opening balance for a specific account before a date
   */
  private async getAccountBalance(accountCode: string, beforeDate: Date): Promise<number> {
    try {
      const ledgerRef = collection(db, 'general_ledger');
      const q = query(
        ledgerRef,
        where('tenantId', '==', this.companyId),
        where('accountCode', '==', accountCode),
        where('transactionDate', '<', Timestamp.fromDate(beforeDate))
      );

      const snapshot = await getDocs(q);

      let debitTotal = 0;
      let creditTotal = 0;

      snapshot.forEach((doc) => {
        const entry = doc.data() as any;
        debitTotal += entry.debit || 0;
        creditTotal += entry.credit || 0;
      });

      // Get account type to calculate balance correctly
      const chartMap = await this.getChartOfAccounts();
      const accountInfo = chartMap.get(accountCode);
      const accountType = accountInfo?.type || this.getAccountType(accountCode);

      return this.calculateBalance(debitTotal, creditTotal, accountType);
    } catch (error: any) {
      console.error('❌ [GLReportsService] Error getting account balance:', error);
      throw new Error(`Failed to get account balance: ${error.message}`);
    }
  }

  /**
   * Get general ledger entries for a specific account
   */
  private async getGLEntries(
    accountCode: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<GLAccountEntry[]> {
    try {
      const ledgerRef = collection(db, 'general_ledger');

      // Build query
      let q = query(
        ledgerRef,
        where('tenantId', '==', this.companyId),
        where('accountCode', '==', accountCode)
      );

      // Add date filters
      if (startDate) {
        q = query(q, where('transactionDate', '>=', Timestamp.fromDate(startDate)));
      }
      if (endDate) {
        q = query(q, where('transactionDate', '<=', Timestamp.fromDate(endDate)));
      }

      const snapshot = await getDocs(q);

      // Convert to GL entries
      const entries: GLAccountEntry[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as any;

        entries.push({
          id: doc.id,
          entryDate: toDate(data.transactionDate),
          description: data.description || 'No description',
          source: data.source || 'UNKNOWN',
          reference: data.journalEntryId || '',
          debit: data.debit || 0,
          credit: data.credit || 0,
          balance: 0, // Will be calculated
          dimensions: data.dimensions || {},
        });
      });

      // Sort by date, then by id for consistency
      entries.sort((a, b) => {
        const dateCompare = a.entryDate.getTime() - b.entryDate.getTime();
        return dateCompare !== 0 ? dateCompare : a.id.localeCompare(b.id);
      });

      return entries;
    } catch (error: any) {
      console.error('❌ [GLReportsService] Error getting GL entries:', error);
      throw new Error(`Failed to get GL entries: ${error.message}`);
    }
  }

  // ==========================================================================
  // HELPER METHODS - JOURNAL ENTRIES
  // ==========================================================================

  /**
   * Get journal entries for a period with filters
   */
  private async getJournalEntries(
    startDate: Date,
    endDate: Date,
    filters?: JournalEntryFilters
  ): Promise<JournalEntryDetail[]> {
    try {
      const journalRef = collection(db, 'journal_entries');

      // Build base query
      let q = query(
        journalRef,
        where('tenantId', '==', this.companyId),
        where('transactionDate', '>=', Timestamp.fromDate(startDate)),
        where('transactionDate', '<=', Timestamp.fromDate(endDate))
      );

      // Add source filter if provided
      if (filters?.source) {
        q = query(q, where('source', '==', filters.source));
      }

      const snapshot = await getDocs(q);

      console.log('📋 [GLReportsService] Journal Entries query results:', {
        totalEntries: snapshot.size,
        dateRange: `${startDate.toISOString()} to ${endDate.toISOString()}`,
        filters
      });

      // Convert to journal entry details
      const entries: JournalEntryDetail[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data() as any;

        // Apply search filter
        if (filters?.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          const description = (data.description || '').toLowerCase();
          if (!description.includes(searchLower)) {
            continue;
          }
        }

        // Get lines for this journal entry
        const lines = await this.getJournalLines(doc.id, filters?.accountCode);

        // Skip if no lines match account filter
        if (filters?.accountCode && lines.length === 0) {
          continue;
        }

        // Calculate totals
        const totalDebit = round(lines.reduce((sum, line) => sum + line.debit, 0));
        const totalCredit = round(lines.reduce((sum, line) => sum + line.credit, 0));
        const balanced = isBalanced(totalDebit, totalCredit);

        entries.push({
          id: doc.id,
          entryNumber: data.journalCode || data.reference || doc.id,
          entryDate: toDate(data.transactionDate),
          description: data.description || 'No description',
          source: data.source || 'UNKNOWN',
          reference: data.reference || '',
          lines,
          totalDebit,
          totalCredit,
          balanced,
          createdBy: data.createdBy || 'Unknown',
          createdAt: toDate(data.createdAt),
        });
      }

      // Sort by entry date, then by entry number
      entries.sort((a, b) => {
        const dateCompare = a.entryDate.getTime() - b.entryDate.getTime();
        return dateCompare !== 0 ? dateCompare : a.entryNumber.localeCompare(b.entryNumber);
      });

      return entries;
    } catch (error: any) {
      console.error('❌ [GLReportsService] Error getting journal entries:', error);
      throw new Error(`Failed to get journal entries: ${error.message}`);
    }
  }

  /**
   * Get journal lines from general ledger entries
   */
  private async getJournalLines(
    journalEntryId: string,
    accountCodeFilter?: string
  ): Promise<JournalEntryLine[]> {
    try {
      const ledgerRef = collection(db, 'general_ledger');
      const q = query(
        ledgerRef,
        where('tenantId', '==', this.companyId),
        where('journalEntryId', '==', journalEntryId)
      );

      const snapshot = await getDocs(q);

      const lines: JournalEntryLine[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data() as any;

        // Apply account code filter
        if (accountCodeFilter && data.accountCode !== accountCodeFilter) {
          return;
        }

        lines.push({
          accountCode: data.accountCode,
          accountName: data.accountName,
          description: data.description || '',
          debit: data.debit || 0,
          credit: data.credit || 0,
        });
      });

      // Sort by account code
      lines.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

      return lines;
    } catch (error: any) {
      console.error('❌ [GLReportsService] Error getting journal lines:', error);
      throw new Error(`Failed to get journal lines: ${error.message}`);
    }
  }

  // ==========================================================================
  // HELPER METHODS - CALCULATIONS
  // ==========================================================================

  /**
   * Calculate running balance for GL entries
   * Mutates entries array to add balance
   */
  private calculateRunningBalance(
    openingBalance: number,
    entries: GLAccountEntry[],
    accountType: string
  ): void {
    let runningBalance = openingBalance || 0;

    entries.forEach((entry) => {
      const debit = entry.debit || 0;
      const credit = entry.credit || 0;

      // Assets and Expenses: Debit increases, Credit decreases
      // Liabilities, Equity, Revenue: Credit increases, Debit decreases
      if (accountType === 'asset' || accountType === 'expense') {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      entry.balance = round(runningBalance);
    });
  }

  /**
   * Calculate balance based on normal balance type
   * Assets and Expenses: Debit - Credit (debit increases balance)
   * Liabilities, Equity, Revenue: Credit - Debit (credit increases balance)
   */
  private calculateBalance(debitTotal: number, creditTotal: number, accountType: AccountType): number {
    if (accountType === 'asset' || accountType === 'expense') {
      return debitTotal - creditTotal;
    } else {
      return creditTotal - debitTotal;
    }
  }

  /**
   * Get account type based on code range
   * Standard accounting code ranges:
   * 1000-1999: Assets
   * 2000-2999: Liabilities
   * 3000-3999: Equity
   * 4000-4999: Revenue
   * 5000-5999: Expenses
   *
   * Also handles fallback codes from invoice posting service:
   * REV/REVENUE -> revenue
   * AR/RECEIVABLE -> asset
   * TAX/TAX-PAYABLE -> liability
   * CASH/BANK -> asset
   * AP/PAYABLE -> liability
   * EXP/EXPENSE -> expense
   */
  private getAccountType(accountCode: string): AccountType {
    // Handle fallback codes from invoice posting service
    const upperCode = accountCode.toUpperCase();
    if (upperCode === 'REV' || upperCode === 'REVENUE') return 'revenue';
    if (upperCode === 'AR' || upperCode === 'RECEIVABLE') return 'asset';
    if (upperCode === 'TAX' || upperCode === 'TAX-PAYABLE') return 'liability';
    if (upperCode === 'CASH' || upperCode === 'BANK') return 'asset';
    if (upperCode === 'AP' || upperCode === 'PAYABLE') return 'liability';
    if (upperCode === 'EXP' || upperCode === 'EXPENSE') return 'expense';

    // Handle numeric codes based on standard accounting ranges
    const code = parseInt(accountCode);
    if (!isNaN(code)) {
      if (code >= 1000 && code < 2000) return 'asset';
      if (code >= 2000 && code < 3000) return 'liability';
      if (code >= 3000 && code < 4000) return 'equity';
      if (code >= 4000 && code < 5000) return 'revenue';
      if (code >= 5000 && code < 6000) return 'expense';  // COGS
      if (code >= 6000 && code < 7000) return 'expense';  // Operating Expenses
      if (code >= 7000 && code < 8000) return 'expense';  // Other Expenses
      if (code >= 8000 && code < 9000) return 'expense';  // Non-operating Expenses
    }

    throw new Error(`Unknown account type for code: ${accountCode}`);
  }

  /**
   * Get Chart of Accounts mapping (code -> {name, type})
   */
  private async getChartOfAccounts(): Promise<Map<string, { name: string; type: AccountType }>> {
    try {
      const accountsRef = collection(db, 'accounting_accounts');
      const q = query(
        accountsRef,
        where('tenantId', '==', this.companyId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const chartMap = new Map<string, { name: string; type: AccountType }>();

      snapshot.forEach((doc) => {
        const account = doc.data() as AccountRecord;
        chartMap.set(account.code, {
          name: account.name,
          type: account.type,
        });
      });

      return chartMap;
    } catch (error: any) {
      console.error('❌ [GLReportsService] Error getting chart of accounts:', error);
      throw new Error(`Failed to get chart of accounts: ${error.message}`);
    }
  }

  // ==========================================================================
  // FORMATTED GL REPORT (Template Format)
  // ==========================================================================

  /**
   * Generate a formatted General Ledger report matching template format
   *
   * Columns: Date | Entry Type | Reference | Contra Acc | Description | Debit | Credit | Cumulative
   *
   * Features:
   * - Transactions grouped by month with opening/closing balances
   * - Entry type classification (Journal Entry, Bank Import, AR Invoice, etc.)
   * - Contra account display showing offsetting account(s)
   * - Running cumulative balance
   * - "Prepared by" header line
   */
  async generateGLReportFormatted(
    accountCode: string,
    options: FormattedGLReportOptions
  ): Promise<FormattedGLReport> {
    try {
      console.log('📊 [GLReportsService] Generating Formatted GL Report', {
        companyId: this.companyId,
        accountCode,
        startDate: options.startDate,
        endDate: options.endDate,
      });

      // Get account info from Chart of Accounts
      const chartMap = await this.getChartOfAccounts();
      const accountInfo = chartMap.get(accountCode);
      const accountName = accountInfo?.name || `Account ${accountCode}`;
      const accountType = accountInfo?.type || this.getAccountType(accountCode);

      // Get opening balance before start date
      const openingBalance = await this.getAccountBalance(accountCode, options.startDate);

      // Get all ledger entries with associated journal data
      const rawEntries = await this.getGLEntriesWithJournalData(
        accountCode,
        options.startDate,
        options.endDate
      );

      // Group entries by month
      const monthlyMap = new Map<string, {
        entries: RawGLEntryData[];
        monthLabel: string;
      }>();

      for (const entry of rawEntries) {
        const entryDate = toDate(entry.transactionDate);
        const monthKey = this.getMonthKey(entryDate);
        const monthLabel = this.getMonthLabel(entryDate);

        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, { entries: [], monthLabel });
        }
        monthlyMap.get(monthKey)!.entries.push(entry);
      }

      // Sort months chronologically
      const sortedMonthKeys = Array.from(monthlyMap.keys()).sort();

      // Build monthly sections with formatted entries
      const monthlySections: FormattedGLMonthlySection[] = [];
      let runningBalance = openingBalance;
      let totalDebits = 0;
      let totalCredits = 0;

      for (const monthKey of sortedMonthKeys) {
        const { entries: monthEntries, monthLabel } = monthlyMap.get(monthKey)!;
        const sectionOpeningBalance = runningBalance;

        // Sort entries within month by date and then by ID for consistency
        monthEntries.sort((a, b) => {
          const dateA = toDate(a.transactionDate).getTime();
          const dateB = toDate(b.transactionDate).getTime();
          return dateA !== dateB ? dateA - dateB : (a.id || '').localeCompare(b.id || '');
        });

        // Format entries for this month
        const formattedEntries: FormattedGLEntry[] = [];
        let periodDebits = 0;
        let periodCredits = 0;

        for (const entry of monthEntries) {
          const debit = entry.debit || 0;
          const credit = entry.credit || 0;

          // Calculate cumulative balance based on account type
          if (accountType === 'asset' || accountType === 'expense') {
            runningBalance += debit - credit;
          } else {
            runningBalance += credit - debit;
          }

          // Get entry type and contra account
          const entryType = this.classifyEntryType(entry.source);
          const contraAccount = await this.getContraAccount(
            entry.journalEntryId,
            accountCode,
            chartMap
          );

          formattedEntries.push({
            date: toDate(entry.transactionDate),
            entryType,
            reference: entry.reference || entry.journalEntryId || '',
            contraAccount,
            description: entry.description || 'No description',
            debit: round(debit),
            credit: round(credit),
            cumulative: round(runningBalance),
            journalEntryId: entry.journalEntryId,
            source: entry.source,
          });

          periodDebits += debit;
          periodCredits += credit;
        }

        totalDebits += periodDebits;
        totalCredits += periodCredits;

        // Only add sections with entries (or optionally include zero-balance months)
        if (formattedEntries.length > 0 || options.includeZeroBalanceMonths) {
          monthlySections.push({
            monthKey,
            monthLabel,
            openingBalance: round(sectionOpeningBalance),
            entries: formattedEntries,
            closingBalance: round(runningBalance),
            periodDebits: round(periodDebits),
            periodCredits: round(periodCredits),
          });
        }
      }

      const report: FormattedGLReport = {
        companyId: this.companyId,
        accountCode,
        accountName,
        accountType,
        preparedBy: options.preparedBy || 'System Generated',
        generatedAt: new Date(),
        reportPeriod: {
          startDate: options.startDate,
          endDate: options.endDate,
        },
        monthlySections,
        openingBalance: round(openingBalance),
        closingBalance: round(runningBalance),
        totalDebits: round(totalDebits),
        totalCredits: round(totalCredits),
        netMovement: round(totalDebits - totalCredits),
      };

      console.log('✅ [GLReportsService] Formatted GL Report generated', {
        accountCode,
        monthCount: monthlySections.length,
        totalEntries: monthlySections.reduce((sum, s) => sum + s.entries.length, 0),
        openingBalance: report.openingBalance,
        closingBalance: report.closingBalance,
      });

      return report;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ [GLReportsService] Error generating Formatted GL Report:', error);
      throw new Error(`Failed to generate Formatted GL Report: ${errorMessage}`);
    }
  }

  // ==========================================================================
  // HELPER METHODS - FORMATTED GL REPORT
  // ==========================================================================

  /**
   * Get GL entries with associated journal data for contra account lookup
   */
  private async getGLEntriesWithJournalData(
    accountCode: string,
    startDate: Date,
    endDate: Date
  ): Promise<RawGLEntryData[]> {
    try {
      const ledgerRef = collection(db, 'general_ledger');
      const q = query(
        ledgerRef,
        where('tenantId', '==', this.companyId),
        where('accountCode', '==', accountCode),
        where('transactionDate', '>=', Timestamp.fromDate(startDate)),
        where('transactionDate', '<=', Timestamp.fromDate(endDate))
      );

      const snapshot = await getDocs(q);
      const entries: RawGLEntryData[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({
          id: doc.id,
          tenantId: data.tenantId || '',
          accountCode: data.accountCode || '',
          accountName: data.accountName,
          journalEntryId: data.journalEntryId,
          transactionDate: data.transactionDate,
          debit: data.debit,
          credit: data.credit,
          description: data.description,
          source: data.source,
          reference: data.reference,
          dimensions: data.dimensions,
        });
      });

      return entries;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ [GLReportsService] Error getting GL entries with journal data:', error);
      throw new Error(`Failed to get GL entries: ${errorMessage}`);
    }
  }

  /**
   * Classify entry type based on source
   */
  private classifyEntryType(source: string | undefined): GLEntryType {
    if (!source) return 'Journal Entry';

    const sourceUpper = source.toUpperCase();

    // Bank-related
    if (sourceUpper.includes('BANK_IMPORT') || sourceUpper === 'BANK IMPORT') {
      return 'Bank Import';
    }
    if (sourceUpper.includes('BANK_TRANSFER') || sourceUpper === 'BANK TRANSFER') {
      return 'Bank Transfer';
    }

    // AR-related
    if (sourceUpper.includes('AR_INVOICE') || sourceUpper.includes('ACCOUNTS_RECEIVABLE') ||
        sourceUpper === 'INVOICE') {
      return 'AR Invoice';
    }
    if (sourceUpper.includes('AR_PAYMENT') || sourceUpper.includes('RECEIPT')) {
      return 'AR Payment';
    }

    // AP-related
    if (sourceUpper.includes('AP_BILL') || sourceUpper.includes('ACCOUNTS_PAYABLE') ||
        sourceUpper === 'BILL') {
      return 'AP Bill';
    }
    if (sourceUpper.includes('AP_PAYMENT') || sourceUpper.includes('DISBURSEMENT')) {
      return 'AP Payment';
    }

    // Adjustments and special entries
    if (sourceUpper.includes('ADJUSTMENT')) {
      return 'Adjustment';
    }
    if (sourceUpper.includes('ACCRUAL')) {
      return 'Accrual';
    }
    if (sourceUpper.includes('REVALUATION')) {
      return 'Revaluation';
    }
    if (sourceUpper.includes('OPENING') || sourceUpper.includes('OPENING_BALANCE')) {
      return 'Opening Balance';
    }

    // Default to Journal Entry
    return 'Journal Entry';
  }

  /**
   * Get contra account(s) for a journal entry
   * Returns the account code(s) that offset the current account
   */
  private async getContraAccount(
    journalEntryId: string | undefined,
    currentAccountCode: string,
    _chartMap: Map<string, { name: string; type: AccountType }> // Reserved for future use (display account names)
  ): Promise<string> {
    if (!journalEntryId) return '-';

    try {
      const ledgerRef = collection(db, 'general_ledger');
      const q = query(
        ledgerRef,
        where('tenantId', '==', this.companyId),
        where('journalEntryId', '==', journalEntryId)
      );

      const snapshot = await getDocs(q);
      const contraAccounts: string[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const accountCode = data.accountCode as string | undefined;
        // Include accounts that are different from the current account
        if (accountCode && accountCode !== currentAccountCode) {
          contraAccounts.push(accountCode);
        }
      });

      // Remove duplicates
      const uniqueContraAccounts = Array.from(new Set(contraAccounts));

      if (uniqueContraAccounts.length === 0) {
        return '-';
      }

      // If more than 3 contra accounts, show first 2 and "..."
      if (uniqueContraAccounts.length > 3) {
        return `${uniqueContraAccounts.slice(0, 2).join(', ')} + ${uniqueContraAccounts.length - 2} more`;
      }

      return uniqueContraAccounts.join(', ');
    } catch (error) {
      console.warn('⚠️ [GLReportsService] Error getting contra account:', error);
      return '-';
    }
  }

  /**
   * Get month key in format YYYY-MM
   */
  private getMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Get month label in format "January 2025"
   */
  private getMonthLabel(date: Date): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
}

// ============================================================================
// SERVICE FACTORY
// ============================================================================

/**
 * Create GL Reports Service instance
 */
export function createGLReportsService(
  companyId: string,
  userId: string
): GLReportsService {
  return new GLReportsService(companyId, userId);
}
