/**
 * Financial Statements Service
 * Phase 3: Reporting & Analytics
 *
 * Comprehensive service for generating the three core financial statements:
 * - Income Statement (Profit & Loss)
 * - Balance Sheet (Statement of Financial Position)
 * - Cash Flow Statement (Direct Method - Simplified)
 *
 * Follows standard accounting principles with multi-currency support
 * and proper account classification based on the Chart of Accounts.
 */

import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { LedgerEntry } from '@/types/accounting/general-ledger';
import { AccountRecord, AccountType } from '@/types/accounting/chart-of-accounts';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Account balance with debit/credit totals
 */
export interface AccountBalance {
  accountCode: string;
  accountName: string;
  balance: number;        // Positive = normal balance, Negative = contra balance
  debitTotal: number;
  creditTotal: number;
}

/**
 * Financial statement section with accounts and totals
 */
export interface FinancialStatementSection {
  name: string;
  accounts: AccountBalance[];
  subtotal: number;
  subsections?: FinancialStatementSection[];
}

/**
 * Income Statement (Profit & Loss)
 */
export interface IncomeStatement {
  companyId: string;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;

  revenue: FinancialStatementSection;
  costOfGoodsSold: FinancialStatementSection;
  grossProfit: number;

  operatingExpenses: FinancialStatementSection;
  operatingIncome: number;

  otherIncomeExpenses: FinancialStatementSection;
  netIncomeBeforeTax: number;

  incomeTaxExpense: number;
  netIncome: number;
}

/**
 * Balance Sheet (Statement of Financial Position)
 */
export interface BalanceSheet {
  companyId: string;
  asOfDate: Date;
  generatedAt: Date;

  assets: {
    currentAssets: FinancialStatementSection;
    nonCurrentAssets: FinancialStatementSection;
    totalAssets: number;
  };

  liabilities: {
    currentLiabilities: FinancialStatementSection;
    nonCurrentLiabilities: FinancialStatementSection;
    totalLiabilities: number;
  };

  equity: FinancialStatementSection;
  totalEquity: number;

  totalLiabilitiesAndEquity: number;
  balanced: boolean; // true if assets = liabilities + equity
}

/**
 * Cash Flow Statement (Direct Method - Simplified)
 */
export interface CashFlowStatement {
  companyId: string;
  startDate: Date;
  endDate: Date;
  generatedAt: Date;

  operatingActivities: FinancialStatementSection;
  netCashFromOperatingActivities: number;

  investingActivities: FinancialStatementSection;
  netCashFromInvestingActivities: number;

  financingActivities: FinancialStatementSection;
  netCashFromFinancingActivities: number;

  netIncreaseInCash: number;
  cashAtBeginning: number;
  cashAtEnd: number;
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
// FINANCIAL STATEMENTS SERVICE CLASS
// ============================================================================

export class FinancialStatementsService {
  constructor(
    private companyId: string,
    private userId: string
  ) {}

  // ==========================================================================
  // INCOME STATEMENT (PROFIT & LOSS)
  // ==========================================================================

  /**
   * Generate Income Statement for a specific period
   *
   * Structure:
   * - Revenue (4000-4999)
   * - Cost of Goods Sold (5000-5099 if applicable)
   * - Gross Profit
   * - Operating Expenses (5100-5899)
   * - Operating Income
   * - Other Income/Expenses (5900-5999)
   * - Net Income Before Tax
   * - Income Tax Expense
   * - Net Income
   */
  async generateIncomeStatement(startDate: Date, endDate: Date): Promise<IncomeStatement> {
    try {
      console.log('📊 [FinancialStatementsService] Generating Income Statement', {
        companyId: this.companyId,
        startDate,
        endDate,
      });

      // Validate date range
      if (endDate < startDate) {
        throw new Error('End date must be greater than or equal to start date');
      }

      // Get account balances for the period
      // Include both numeric prefixes (4000, 5000) and fallback codes (REV, EXP)
      const balances = await this.getAccountBalances(
        ['4', '5', 'REV', 'REVENUE', 'EXP', 'EXPENSE'], // Revenue and Expenses
        startDate,
        endDate
      );

      const chartOfAccounts = await this.getChartOfAccounts();

      // === REVENUE SECTION (4000-4999) ===
      const revenueAccounts = this.groupAccountsByRange(balances, '4000', '4999');
      const revenueSubsections: FinancialStatementSection[] = [
        {
          name: 'Sales Revenue',
          accounts: this.groupAccountsByRange(balances, '4000', '4099'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '4000', '4099')),
        },
        {
          name: 'Service Revenue',
          accounts: this.groupAccountsByRange(balances, '4100', '4199'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '4100', '4199')),
        },
        {
          name: 'Other Revenue',
          accounts: this.groupAccountsByRange(balances, '4200', '4999'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '4200', '4999')),
        },
      ];

      const revenue: FinancialStatementSection = {
        name: 'Revenue',
        accounts: revenueAccounts,
        subtotal: this.calculateSubtotal(revenueAccounts),
        subsections: revenueSubsections,
      };

      // === COST OF GOODS SOLD (5000-5099) ===
      const cogsAccounts = this.groupAccountsByRange(balances, '5000', '5099');
      const costOfGoodsSold: FinancialStatementSection = {
        name: 'Cost of Goods Sold',
        accounts: cogsAccounts,
        subtotal: this.calculateSubtotal(cogsAccounts),
      };

      // === GROSS PROFIT ===
      const grossProfit = round(revenue.subtotal - costOfGoodsSold.subtotal);

      // === OPERATING EXPENSES (5100-5899) ===
      const operatingExpensesAccounts = this.groupAccountsByRange(balances, '5100', '5899');
      const operatingExpensesSubsections: FinancialStatementSection[] = [
        {
          name: 'Salaries & Wages',
          accounts: this.groupAccountsByRange(balances, '5100', '5199'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '5100', '5199')),
        },
        {
          name: 'Rent',
          accounts: this.groupAccountsByRange(balances, '5200', '5299'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '5200', '5299')),
        },
        {
          name: 'Utilities',
          accounts: this.groupAccountsByRange(balances, '5300', '5399'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '5300', '5399')),
        },
        {
          name: 'Marketing',
          accounts: this.groupAccountsByRange(balances, '5400', '5499'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '5400', '5499')),
        },
        {
          name: 'Other Operating Expenses',
          accounts: this.groupAccountsByRange(balances, '5500', '5899'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '5500', '5899')),
        },
      ];

      const operatingExpenses: FinancialStatementSection = {
        name: 'Operating Expenses',
        accounts: operatingExpensesAccounts,
        subtotal: this.calculateSubtotal(operatingExpensesAccounts),
        subsections: operatingExpensesSubsections,
      };

      // === OPERATING INCOME ===
      const operatingIncome = round(grossProfit - operatingExpenses.subtotal);

      // === OTHER INCOME/EXPENSES (5900-5999) ===
      const otherIncomeExpensesAccounts = this.groupAccountsByRange(balances, '5900', '5999');
      const otherIncomeExpenses: FinancialStatementSection = {
        name: 'Other Income/Expenses',
        accounts: otherIncomeExpensesAccounts,
        subtotal: this.calculateSubtotal(otherIncomeExpensesAccounts),
      };

      // === NET INCOME BEFORE TAX ===
      const netIncomeBeforeTax = round(operatingIncome - otherIncomeExpenses.subtotal);

      // === INCOME TAX EXPENSE ===
      // Typically would be a specific account, defaulting to 0 for now
      const incomeTaxExpense = 0;

      // === NET INCOME ===
      const netIncome = round(netIncomeBeforeTax - incomeTaxExpense);

      const statement: IncomeStatement = {
        companyId: this.companyId,
        startDate,
        endDate,
        generatedAt: new Date(),
        revenue,
        costOfGoodsSold,
        grossProfit,
        operatingExpenses,
        operatingIncome,
        otherIncomeExpenses,
        netIncomeBeforeTax,
        incomeTaxExpense,
        netIncome,
      };

      console.log('✅ [FinancialStatementsService] Income Statement generated', {
        totalRevenue: revenue.subtotal,
        grossProfit,
        operatingIncome,
        netIncome,
      });

      return statement;
    } catch (error: any) {
      console.error('❌ [FinancialStatementsService] Error generating Income Statement:', error);
      throw new Error(`Failed to generate Income Statement: ${error.message}`);
    }
  }

  // ==========================================================================
  // BALANCE SHEET
  // ==========================================================================

  /**
   * Generate Balance Sheet as of a specific date
   *
   * Structure:
   * Assets (1000-1999)
   *   - Current Assets (1000-1399)
   *   - Non-Current Assets (1400-1999)
   * Liabilities (2000-2999)
   *   - Current Liabilities (2000-2399)
   *   - Non-Current Liabilities (2400-2999)
   * Equity (3000-3999)
   *   - Share Capital
   *   - Retained Earnings
   *   - Current Year Earnings
   */
  async generateBalanceSheet(asOfDate: Date): Promise<BalanceSheet> {
    try {
      console.log('📊 [FinancialStatementsService] Generating Balance Sheet', {
        companyId: this.companyId,
        asOfDate,
      });

      // Get cumulative balances up to asOfDate
      // Include both numeric prefixes and fallback codes
      const balances = await this.getAccountBalances(
        ['1', '2', '3', 'AR', 'CASH', 'BANK', 'TAX', 'AP', 'PAYABLE'], // Assets, Liabilities, Equity
        undefined,
        asOfDate
      );

      const chartOfAccounts = await this.getChartOfAccounts();

      // === ASSETS ===
      // Current Assets (1000-1399)
      const currentAssetsAccounts = this.groupAccountsByRange(balances, '1000', '1399');
      const currentAssetsSubsections: FinancialStatementSection[] = [
        {
          name: 'Cash & Bank',
          accounts: this.groupAccountsByRange(balances, '1000', '1099'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '1000', '1099')),
        },
        {
          name: 'Accounts Receivable',
          accounts: this.groupAccountsByRange(balances, '1100', '1199'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '1100', '1199')),
        },
        {
          name: 'Inventory',
          accounts: this.groupAccountsByRange(balances, '1200', '1299'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '1200', '1299')),
        },
        {
          name: 'Other Current Assets',
          accounts: this.groupAccountsByRange(balances, '1300', '1399'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '1300', '1399')),
        },
      ];

      const currentAssets: FinancialStatementSection = {
        name: 'Current Assets',
        accounts: currentAssetsAccounts,
        subtotal: this.calculateSubtotal(currentAssetsAccounts),
        subsections: currentAssetsSubsections,
      };

      // Non-Current Assets (1400-1999)
      const nonCurrentAssetsAccounts = this.groupAccountsByRange(balances, '1400', '1999');
      const nonCurrentAssetsSubsections: FinancialStatementSection[] = [
        {
          name: 'Property, Plant & Equipment',
          accounts: this.groupAccountsByRange(balances, '1400', '1499'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '1400', '1499')),
        },
        {
          name: 'Accumulated Depreciation',
          accounts: this.groupAccountsByRange(balances, '1500', '1599'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '1500', '1599')),
        },
        {
          name: 'Investments',
          accounts: this.groupAccountsByRange(balances, '1600', '1699'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '1600', '1699')),
        },
        {
          name: 'Intangible Assets',
          accounts: this.groupAccountsByRange(balances, '1700', '1799'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '1700', '1799')),
        },
        {
          name: 'Other Non-Current Assets',
          accounts: this.groupAccountsByRange(balances, '1800', '1999'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '1800', '1999')),
        },
      ];

      const nonCurrentAssets: FinancialStatementSection = {
        name: 'Non-Current Assets',
        accounts: nonCurrentAssetsAccounts,
        subtotal: this.calculateSubtotal(nonCurrentAssetsAccounts),
        subsections: nonCurrentAssetsSubsections,
      };

      const totalAssets = round(currentAssets.subtotal + nonCurrentAssets.subtotal);

      // === LIABILITIES ===
      // Current Liabilities (2000-2399)
      const currentLiabilitiesAccounts = this.groupAccountsByRange(balances, '2000', '2399');
      const currentLiabilitiesSubsections: FinancialStatementSection[] = [
        {
          name: 'Accounts Payable',
          accounts: this.groupAccountsByRange(balances, '2000', '2099'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '2000', '2099')),
        },
        {
          name: 'Short-term Debt',
          accounts: this.groupAccountsByRange(balances, '2100', '2199'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '2100', '2199')),
        },
        {
          name: 'Accrued Expenses',
          accounts: this.groupAccountsByRange(balances, '2200', '2299'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '2200', '2299')),
        },
        {
          name: 'Other Current Liabilities',
          accounts: this.groupAccountsByRange(balances, '2300', '2399'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '2300', '2399')),
        },
      ];

      const currentLiabilities: FinancialStatementSection = {
        name: 'Current Liabilities',
        accounts: currentLiabilitiesAccounts,
        subtotal: this.calculateSubtotal(currentLiabilitiesAccounts),
        subsections: currentLiabilitiesSubsections,
      };

      // Non-Current Liabilities (2400-2999)
      const nonCurrentLiabilitiesAccounts = this.groupAccountsByRange(balances, '2400', '2999');
      const nonCurrentLiabilitiesSubsections: FinancialStatementSection[] = [
        {
          name: 'Long-term Debt',
          accounts: this.groupAccountsByRange(balances, '2400', '2499'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '2400', '2499')),
        },
        {
          name: 'Other Non-Current Liabilities',
          accounts: this.groupAccountsByRange(balances, '2500', '2999'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '2500', '2999')),
        },
      ];

      const nonCurrentLiabilities: FinancialStatementSection = {
        name: 'Non-Current Liabilities',
        accounts: nonCurrentLiabilitiesAccounts,
        subtotal: this.calculateSubtotal(nonCurrentLiabilitiesAccounts),
        subsections: nonCurrentLiabilitiesSubsections,
      };

      const totalLiabilities = round(currentLiabilities.subtotal + nonCurrentLiabilities.subtotal);

      // === EQUITY (3000-3999) ===
      const equityAccounts = this.groupAccountsByRange(balances, '3000', '3999');
      const equitySubsections: FinancialStatementSection[] = [
        {
          name: 'Share Capital',
          accounts: this.groupAccountsByRange(balances, '3000', '3099'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '3000', '3099')),
        },
        {
          name: 'Retained Earnings',
          accounts: this.groupAccountsByRange(balances, '3100', '3199'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '3100', '3199')),
        },
        {
          name: 'Other Equity',
          accounts: this.groupAccountsByRange(balances, '3200', '3999'),
          subtotal: this.calculateSubtotal(this.groupAccountsByRange(balances, '3200', '3999')),
        },
      ];

      // Calculate current year earnings (P&L net income up to asOfDate)
      // For simplicity, we'll calculate it from beginning of fiscal year to asOfDate
      const fiscalYearStart = new Date(asOfDate.getFullYear(), 0, 1); // Jan 1 of current year
      const incomeStatement = await this.generateIncomeStatement(fiscalYearStart, asOfDate);
      const currentYearEarnings = incomeStatement.netIncome;

      // Add current year earnings to equity
      equitySubsections.push({
        name: 'Current Year Earnings',
        accounts: [{
          accountCode: 'CALC',
          accountName: 'Current Year Earnings',
          balance: currentYearEarnings,
          debitTotal: 0,
          creditTotal: currentYearEarnings,
        }],
        subtotal: currentYearEarnings,
      });

      const equity: FinancialStatementSection = {
        name: 'Equity',
        accounts: equityAccounts,
        subtotal: this.calculateSubtotal(equityAccounts) + currentYearEarnings,
        subsections: equitySubsections,
      };

      const totalEquity = equity.subtotal;
      const totalLiabilitiesAndEquity = round(totalLiabilities + totalEquity);

      // Validate balance
      const balanced = isBalanced(totalAssets, totalLiabilitiesAndEquity);

      const balanceSheet: BalanceSheet = {
        companyId: this.companyId,
        asOfDate,
        generatedAt: new Date(),
        assets: {
          currentAssets,
          nonCurrentAssets,
          totalAssets,
        },
        liabilities: {
          currentLiabilities,
          nonCurrentLiabilities,
          totalLiabilities,
        },
        equity,
        totalEquity,
        totalLiabilitiesAndEquity,
        balanced,
      };

      console.log('✅ [FinancialStatementsService] Balance Sheet generated', {
        totalAssets,
        totalLiabilities,
        totalEquity,
        balanced,
      });

      if (!balanced) {
        console.warn('⚠️ [FinancialStatementsService] Balance Sheet is not balanced!', {
          totalAssets,
          totalLiabilitiesAndEquity,
          difference: round(totalAssets - totalLiabilitiesAndEquity),
        });
      }

      return balanceSheet;
    } catch (error: any) {
      console.error('❌ [FinancialStatementsService] Error generating Balance Sheet:', error);
      throw new Error(`Failed to generate Balance Sheet: ${error.message}`);
    }
  }

  // ==========================================================================
  // CASH FLOW STATEMENT (SIMPLIFIED - DIRECT METHOD)
  // ==========================================================================

  /**
   * Generate Cash Flow Statement for a specific period (Simplified Direct Method)
   *
   * Structure:
   * Operating Activities
   *   - Cash received from customers
   *   - Cash paid to suppliers
   *   - Cash paid for operating expenses
   * Investing Activities
   *   - Purchase/Sale of fixed assets
   * Financing Activities
   *   - Proceeds/Repayment of loans
   *   - Dividends paid
   */
  async generateCashFlowStatement(startDate: Date, endDate: Date): Promise<CashFlowStatement> {
    try {
      console.log('📊 [FinancialStatementsService] Generating Cash Flow Statement', {
        companyId: this.companyId,
        startDate,
        endDate,
      });

      // Validate date range
      if (endDate < startDate) {
        throw new Error('End date must be greater than or equal to start date');
      }

      // Get cash account balances (1000-1099)
      // Include both numeric prefix and fallback codes
      const cashAccountBalances = await this.getAccountBalances(
        ['10', 'CASH', 'BANK'],
        startDate,
        endDate
      );

      // Get all ledger entries for cash accounts in the period
      const cashEntries = await this.getCashAccountEntries(startDate, endDate);

      // === OPERATING ACTIVITIES ===
      // Analyze cash entries to categorize them
      const operatingCashFlows = this.categorizeCashFlows(cashEntries, 'operating');
      const operatingActivities: FinancialStatementSection = {
        name: 'Operating Activities',
        accounts: operatingCashFlows,
        subtotal: this.calculateSubtotal(operatingCashFlows),
      };
      const netCashFromOperatingActivities = operatingActivities.subtotal;

      // === INVESTING ACTIVITIES ===
      const investingCashFlows = this.categorizeCashFlows(cashEntries, 'investing');
      const investingActivities: FinancialStatementSection = {
        name: 'Investing Activities',
        accounts: investingCashFlows,
        subtotal: this.calculateSubtotal(investingCashFlows),
      };
      const netCashFromInvestingActivities = investingActivities.subtotal;

      // === FINANCING ACTIVITIES ===
      const financingCashFlows = this.categorizeCashFlows(cashEntries, 'financing');
      const financingActivities: FinancialStatementSection = {
        name: 'Financing Activities',
        accounts: financingCashFlows,
        subtotal: this.calculateSubtotal(financingCashFlows),
      };
      const netCashFromFinancingActivities = financingActivities.subtotal;

      // === NET CHANGE IN CASH ===
      const netIncreaseInCash = round(
        netCashFromOperatingActivities +
        netCashFromInvestingActivities +
        netCashFromFinancingActivities
      );

      // Get cash at beginning and end of period
      const cashAtBeginning = await this.getCashBalance(startDate);
      const cashAtEnd = await this.getCashBalance(endDate);

      const statement: CashFlowStatement = {
        companyId: this.companyId,
        startDate,
        endDate,
        generatedAt: new Date(),
        operatingActivities,
        netCashFromOperatingActivities,
        investingActivities,
        netCashFromInvestingActivities,
        financingActivities,
        netCashFromFinancingActivities,
        netIncreaseInCash,
        cashAtBeginning,
        cashAtEnd,
      };

      console.log('✅ [FinancialStatementsService] Cash Flow Statement generated', {
        netCashFromOperatingActivities,
        netCashFromInvestingActivities,
        netCashFromFinancingActivities,
        netIncreaseInCash,
      });

      return statement;
    } catch (error: any) {
      console.error('❌ [FinancialStatementsService] Error generating Cash Flow Statement:', error);
      throw new Error(`Failed to generate Cash Flow Statement: ${error.message}`);
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Get account balances for specified account code prefixes
   * If startDate is provided, only includes entries from that date onward
   * If only endDate is provided, includes all entries up to that date (cumulative)
   */
  private async getAccountBalances(
    accountCodePrefixes: string[],
    startDate?: Date,
    endDate?: Date
  ): Promise<Map<string, AccountBalance>> {
    try {
      const ledgerRef = collection(db, 'general_ledger');

      // Build query
      let q = query(
        ledgerRef,
        where('tenantId', '==', this.companyId)
      );

      // Add date filters
      if (startDate) {
        q = query(q, where('transactionDate', '>=', Timestamp.fromDate(startDate)));
      }
      if (endDate) {
        q = query(q, where('transactionDate', '<=', Timestamp.fromDate(endDate)));
      }

      const snapshot = await getDocs(q);

      console.log('📊 [FinancialStatementsService] GL Query Results:', {
        totalEntries: snapshot.size,
        dateRange: startDate && endDate ? `${startDate.toISOString()} to ${endDate.toISOString()}` : 'All time',
        accountPrefixes: accountCodePrefixes,
      });

      // Group by account and calculate totals
      const accountMap = new Map<string, {
        accountCode: string;
        accountName: string;
        debitTotal: number;
        creditTotal: number;
      }>();

      snapshot.forEach((doc) => {
        const entry = doc.data() as any;
        const accountCode = entry.accountCode;
        const accountName = entry.accountName || 'Unknown Account';

        // Log first few entries to debug
        if (snapshot.size <= 5 || !accountMap.size) {
          console.log('🔍 GL Entry:', { accountCode, accountName, debit: entry.debit, credit: entry.credit });
        }

        // Check if account matches any of the prefixes
        // Support both numeric prefixes (e.g., "4000", "5000") and fallback codes (e.g., "REV", "AR")
        const matchesPrefix = accountCodePrefixes.some(prefix => {
          if (!accountCode) return false;

          // For numeric prefixes, match codes starting with the first digit
          // e.g., "4000" matches "4XXX", "5000" matches "5XXX"
          if (/^\d/.test(prefix)) {
            const firstDigit = prefix.charAt(0);
            return accountCode.startsWith(firstDigit);
          }

          // For text prefixes, exact match
          return accountCode.toUpperCase().startsWith(prefix.toUpperCase());
        });

        if (!matchesPrefix) return;

        if (!accountMap.has(accountCode)) {
          accountMap.set(accountCode, {
            accountCode,
            accountName,
            debitTotal: 0,
            creditTotal: 0,
          });
        }

        const account = accountMap.get(accountCode)!;
        account.debitTotal += entry.debit || 0;
        account.creditTotal += entry.credit || 0;
      });

      // Calculate balances based on account type
      const balances = new Map<string, AccountBalance>();

      accountMap.forEach((account, accountCode) => {
        const accountType = this.getAccountType(accountCode);
        const balance = this.calculateBalance(
          account.debitTotal,
          account.creditTotal,
          accountType
        );

        balances.set(accountCode, {
          accountCode: account.accountCode,
          accountName: account.accountName,
          balance: round(balance),
          debitTotal: round(account.debitTotal),
          creditTotal: round(account.creditTotal),
        });
      });

      console.log(`📊 [FinancialStatementsService] Retrieved ${balances.size} account balances`);

      return balances;
    } catch (error: any) {
      console.error('❌ [FinancialStatementsService] Error getting account balances:', error);
      throw new Error(`Failed to get account balances: ${error.message}`);
    }
  }

  /**
   * Get account type based on code range
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

    // Handle numeric codes
    const code = parseInt(accountCode);
    if (!isNaN(code)) {
      if (code >= 1000 && code < 2000) return 'asset';
      if (code >= 2000 && code < 3000) return 'liability';
      if (code >= 3000 && code < 4000) return 'equity';
      if (code >= 4000 && code < 5000) return 'revenue';
      if (code >= 5000 && code < 6000) return 'expense';
    }

    throw new Error(`Unknown account type for code: ${accountCode}`);
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
   * Get Chart of Accounts mapping (code -> name)
   */
  private async getChartOfAccounts(): Promise<Map<string, string>> {
    try {
      const accountsRef = collection(db, 'accounting_accounts');
      const q = query(
        accountsRef,
        where('tenantId', '==', this.companyId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const chartMap = new Map<string, string>();

      snapshot.forEach((doc) => {
        const account = doc.data() as AccountRecord;
        chartMap.set(account.code, account.name);
      });

      return chartMap;
    } catch (error: any) {
      console.error('❌ [FinancialStatementsService] Error getting chart of accounts:', error);
      throw new Error(`Failed to get chart of accounts: ${error.message}`);
    }
  }

  /**
   * Group accounts by code range
   */
  private groupAccountsByRange(
    balances: Map<string, AccountBalance>,
    rangeStart: string,
    rangeEnd: string
  ): AccountBalance[] {
    const start = parseInt(rangeStart);
    const end = parseInt(rangeEnd);

    const accounts: AccountBalance[] = [];

    balances.forEach((balance, code) => {
      const codeNum = parseInt(code);

      // Handle numeric codes within range
      if (!isNaN(codeNum) && codeNum >= start && codeNum <= end) {
        accounts.push(balance);
        return;
      }

      // Handle fallback text codes based on the range being requested
      const upperCode = code.toUpperCase();

      // Revenue range (4000-4999)
      if (start >= 4000 && start < 5000) {
        if (upperCode === 'REV' || upperCode === 'REVENUE') {
          accounts.push(balance);
        }
      }

      // Expense range (5000-5999)
      if (start >= 5000 && start < 6000) {
        if (upperCode === 'EXP' || upperCode === 'EXPENSE') {
          accounts.push(balance);
        }
      }

      // Current Assets range (1000-1399) - AR and CASH are current
      if (start >= 1000 && start < 1400) {
        if (upperCode === 'AR' || upperCode === 'RECEIVABLE' || upperCode === 'CASH' || upperCode === 'BANK') {
          accounts.push(balance);
        }
      }

      // Non-Current Assets range (1400-1999) - No fallback codes for non-current
      // (Non-current assets like PPE, Investments typically have specific account codes)

      // Current Liabilities range (2000-2399) - TAX and AP are typically current
      if (start >= 2000 && start < 2400) {
        if (upperCode === 'TAX' || upperCode === 'TAX-PAYABLE' || upperCode === 'AP' || upperCode === 'PAYABLE') {
          accounts.push(balance);
        }
      }

      // Non-Current Liabilities range (2400-2999) - No fallback codes for non-current
      // (Long-term debt, deferred revenue use specific numeric codes)
    });

    // Sort by account code (numeric first, then alphabetic)
    accounts.sort((a, b) => {
      const aNum = parseInt(a.accountCode);
      const bNum = parseInt(b.accountCode);

      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      if (!isNaN(aNum)) return -1; // Numeric codes first
      if (!isNaN(bNum)) return 1;
      return a.accountCode.localeCompare(b.accountCode); // Alphabetic
    });

    return accounts;
  }

  /**
   * Calculate subtotal for a group of accounts
   */
  private calculateSubtotal(accounts: AccountBalance[]): number {
    const total = accounts.reduce((sum, account) => sum + account.balance, 0);
    return round(total);
  }

  /**
   * Get cash account entries for period (for Cash Flow Statement)
   */
  private async getCashAccountEntries(startDate: Date, endDate: Date): Promise<LedgerEntry[]> {
    try {
      const ledgerRef = collection(db, 'general_ledger');
      const q = query(
        ledgerRef,
        where('tenantId', '==', this.companyId),
        where('transactionDate', '>=', Timestamp.fromDate(startDate)),
        where('transactionDate', '<=', Timestamp.fromDate(endDate))
      );

      const snapshot = await getDocs(q);
      const entries: LedgerEntry[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const accountCode = data.accountCode;
        const code = parseInt(accountCode);

        // Only include cash accounts (1000-1099)
        if (code >= 1000 && code < 1100) {
          entries.push({
            id: doc.id,
            tenantId: data.tenantId,
            journalEntryId: data.journalEntryId,
            journalLineId: data.journalLineId,
            accountId: data.accountId,
            accountCode: data.accountCode,
            accountName: data.accountName,
            description: data.description,
            debit: data.debit || 0,
            credit: data.credit || 0,
            cumulativeBalance: data.cumulativeBalance || 0,
            currency: data.currency,
            transactionDate: toDate(data.transactionDate),
            postingDate: toDate(data.postingDate),
            fiscalPeriodId: data.fiscalPeriodId,
            source: data.source,
            metadata: data.metadata,
            dimensions: data.dimensions,
            createdAt: toDate(data.createdAt),
          });
        }
      });

      return entries;
    } catch (error: any) {
      console.error('❌ [FinancialStatementsService] Error getting cash entries:', error);
      throw new Error(`Failed to get cash entries: ${error.message}`);
    }
  }

  /**
   * Categorize cash flows by activity type
   * Operating: Normal business operations (revenue, expenses)
   * Investing: Fixed assets, investments
   * Financing: Loans, equity, dividends
   */
  private categorizeCashFlows(
    entries: LedgerEntry[],
    activityType: 'operating' | 'investing' | 'financing'
  ): AccountBalance[] {
    // This is a simplified categorization
    // In a real system, you'd analyze the contra account or metadata

    const categorized: AccountBalance[] = [];

    // Group entries by description/source for simplified categorization
    const categoryMap = new Map<string, { debit: number; credit: number }>();

    entries.forEach((entry) => {
      // Simplified categorization based on source
      let category: string | null = null;

      if (activityType === 'operating') {
        if (entry.source?.includes('invoice') || entry.source?.includes('payment')) {
          category = entry.description || entry.source;
        }
      } else if (activityType === 'investing') {
        if (entry.source?.includes('asset') || entry.source?.includes('investment')) {
          category = entry.description || entry.source;
        }
      } else if (activityType === 'financing') {
        if (entry.source?.includes('loan') || entry.source?.includes('equity')) {
          category = entry.description || entry.source;
        }
      }

      if (category) {
        if (!categoryMap.has(category)) {
          categoryMap.set(category, { debit: 0, credit: 0 });
        }
        const cat = categoryMap.get(category)!;
        cat.debit += entry.debit;
        cat.credit += entry.credit;
      }
    });

    // Convert to AccountBalance format
    categoryMap.forEach((amounts, name) => {
      // For cash flow, debit to cash is cash in, credit to cash is cash out
      const balance = amounts.debit - amounts.credit;

      categorized.push({
        accountCode: 'CF-' + activityType.toUpperCase().substring(0, 3),
        accountName: name,
        balance: round(balance),
        debitTotal: round(amounts.debit),
        creditTotal: round(amounts.credit),
      });
    });

    return categorized;
  }

  /**
   * Get total cash balance as of a date
   */
  private async getCashBalance(asOfDate: Date): Promise<number> {
    try {
      const balances = await this.getAccountBalances(['1000'], undefined, asOfDate);
      let total = 0;

      balances.forEach((balance) => {
        total += balance.balance;
      });

      return round(total);
    } catch (error: any) {
      console.error('❌ [FinancialStatementsService] Error getting cash balance:', error);
      throw new Error(`Failed to get cash balance: ${error.message}`);
    }
  }
}

// ============================================================================
// SERVICE FACTORY
// ============================================================================

/**
 * Create Financial Statements Service instance
 */
export function createFinancialStatementsService(
  companyId: string,
  userId: string
): FinancialStatementsService {
  return new FinancialStatementsService(companyId, userId);
}
