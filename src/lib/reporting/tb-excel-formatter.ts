/**
 * Trial Balance Excel Formatter
 * Formats Trial Balance report data for Excel export using ExcelJS
 *
 * Template Structure:
 * - External Ref | Account Code | Account Name | DR | CR
 * - Grouped by account type (Assets, Liabilities, Equity, Revenue, Expenses)
 * - Totals row that must balance (DR total = CR total)
 * - Net Loss/Profit calculation at bottom
 *
 * Features:
 * - Proper column formatting with currency
 * - Account type groupings with subtotals
 * - Double-line totals row
 * - Balance verification indicator
 * - Net Profit/Loss calculation
 */

import { excelService, type ColumnDefinition } from '@/lib/excel';
import type { TrialBalanceReport, TrialBalanceLine } from './gl-reports-service';
import type { Workbook, Worksheet } from 'exceljs';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Options for formatting the Trial Balance Excel export
 */
export interface TBExcelFormatterOptions {
  /** Company name for header */
  companyName?: string;
  /** Report title (default: "Trial Balance") */
  reportTitle?: string;
  /** Include account type groupings with subtotals */
  includeGroupSubtotals?: boolean;
  /** Include external reference column */
  includeExternalRef?: boolean;
  /** Currency format (default: ZAR) */
  currencyFormat?: string;
  /** Prepared by name */
  preparedBy?: string;
}

/**
 * Formatted Trial Balance line for Excel output
 */
export interface FormattedTBLine {
  externalRef: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

/**
 * Account type group with subtotals
 */
interface AccountTypeGroup {
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  label: string;
  accounts: TrialBalanceLine[];
  totalDebit: number;
  totalCredit: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ACCOUNT_TYPE_ORDER: Array<'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'> = [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
];

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ASSET: 'ASSETS',
  LIABILITY: 'LIABILITIES',
  EQUITY: 'EQUITY',
  REVENUE: 'REVENUE',
  EXPENSE: 'EXPENSES',
};

// ============================================================================
// TRIAL BALANCE EXCEL FORMATTER CLASS
// ============================================================================

export class TBExcelFormatter {
  private options: Required<TBExcelFormatterOptions>;

  constructor(options: TBExcelFormatterOptions = {}) {
    this.options = {
      companyName: options.companyName || 'Company Name',
      reportTitle: options.reportTitle || 'Trial Balance',
      includeGroupSubtotals: options.includeGroupSubtotals ?? true,
      includeExternalRef: options.includeExternalRef ?? true,
      currencyFormat: options.currencyFormat || excelService.CURRENCY_FORMAT_ZAR,
      preparedBy: options.preparedBy || 'System Generated',
    };
  }

  /**
   * Format Trial Balance report for Excel export
   * @param report - Trial Balance report data
   * @returns Excel workbook ready for download
   */
  async formatTrialBalanceToExcel(report: TrialBalanceReport): Promise<Workbook> {
    const workbook = excelService.createWorkbook();

    // Create the Trial Balance worksheet
    const worksheet = this.createTBWorksheet(workbook, report);

    // Apply styling
    this.applyTBStyling(worksheet, report);

    return workbook;
  }

  /**
   * Download Trial Balance as Excel file
   * @param report - Trial Balance report data
   * @param filename - Output filename (without .xlsx extension)
   */
  async downloadTrialBalanceExcel(
    report: TrialBalanceReport,
    filename?: string
  ): Promise<void> {
    const workbook = await this.formatTrialBalanceToExcel(report);
    const defaultFilename = `trial-balance-${this.formatDateForFilename(report.asOfDate)}`;
    await excelService.downloadExcel(workbook, filename || defaultFilename);
  }

  /**
   * Get Trial Balance Excel as Blob (for storage/upload)
   * @param report - Trial Balance report data
   * @returns Promise<Blob>
   */
  async getTrialBalanceExcelBlob(report: TrialBalanceReport): Promise<Blob> {
    const workbook = await this.formatTrialBalanceToExcel(report);
    return excelService.getExcelBlob(workbook);
  }

  // ==========================================================================
  // PRIVATE METHODS - WORKSHEET CREATION
  // ==========================================================================

  /**
   * Create the Trial Balance worksheet with all data
   */
  private createTBWorksheet(
    workbook: Workbook,
    report: TrialBalanceReport
  ): Worksheet {
    // Define columns
    const columns: ColumnDefinition[] = this.getColumnDefinitions();

    const worksheet = excelService.addWorksheet(workbook, {
      name: 'Trial Balance',
      columns,
      freezeHeader: false, // We'll freeze after adding header rows
      autoFilter: false,
      tabColor: '4472C4', // Blue tab
    });

    // Add header section
    let currentRow = 1;
    currentRow = this.addHeaderSection(worksheet, report, currentRow);

    // Add column headers
    currentRow = this.addColumnHeaders(worksheet, currentRow);

    // Freeze panes after header row
    worksheet.views = [{ state: 'frozen', ySplit: currentRow }];

    // Add data rows grouped by account type
    currentRow = this.addDataRows(worksheet, report, currentRow);

    // Add totals row
    currentRow = this.addTotalsRow(worksheet, report, currentRow);

    // Add Net Profit/Loss row
    currentRow = this.addNetProfitLossRow(worksheet, report, currentRow);

    // Add balance verification
    this.addBalanceVerification(worksheet, report, currentRow);

    return worksheet;
  }

  /**
   * Get column definitions for the worksheet
   */
  private getColumnDefinitions(): ColumnDefinition[] {
    const columns: ColumnDefinition[] = [];

    if (this.options.includeExternalRef) {
      columns.push({
        header: 'External Ref',
        key: 'externalRef',
        width: 15,
        alignment: 'left',
      });
    }

    columns.push(
      {
        header: 'Account Code',
        key: 'accountCode',
        width: 15,
        alignment: 'left',
      },
      {
        header: 'Account Name',
        key: 'accountName',
        width: 40,
        alignment: 'left',
      },
      {
        header: 'DR',
        key: 'debit',
        width: 18,
        numFmt: this.options.currencyFormat,
        alignment: 'right',
      },
      {
        header: 'CR',
        key: 'credit',
        width: 18,
        numFmt: this.options.currencyFormat,
        alignment: 'right',
      }
    );

    return columns;
  }

  /**
   * Add header section with company name, report title, and date
   */
  private addHeaderSection(
    worksheet: Worksheet,
    report: TrialBalanceReport,
    startRow: number
  ): number {
    const columnCount = this.options.includeExternalRef ? 5 : 4;
    const lastCol = excelService.getColumnLetter(columnCount);

    // Company name
    worksheet.mergeCells(`A${startRow}:${lastCol}${startRow}`);
    const companyCell = worksheet.getCell(`A${startRow}`);
    companyCell.value = this.options.companyName;
    companyCell.font = { bold: true, size: 16, color: { argb: '1F2937' } };
    companyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(startRow).height = 30;
    startRow++;

    // Report title
    worksheet.mergeCells(`A${startRow}:${lastCol}${startRow}`);
    const titleCell = worksheet.getCell(`A${startRow}`);
    titleCell.value = this.options.reportTitle;
    titleCell.font = { bold: true, size: 14, color: { argb: '374151' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(startRow).height = 25;
    startRow++;

    // As of date
    worksheet.mergeCells(`A${startRow}:${lastCol}${startRow}`);
    const dateCell = worksheet.getCell(`A${startRow}`);
    dateCell.value = `As of: ${this.formatDate(report.asOfDate)}`;
    dateCell.font = { size: 11, color: { argb: '6B7280' } };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    startRow++;

    // Prepared by
    worksheet.mergeCells(`A${startRow}:${lastCol}${startRow}`);
    const preparedCell = worksheet.getCell(`A${startRow}`);
    preparedCell.value = `Prepared by: ${this.options.preparedBy}`;
    preparedCell.font = { size: 10, italic: true, color: { argb: '9CA3AF' } };
    preparedCell.alignment = { horizontal: 'center', vertical: 'middle' };
    startRow++;

    // Empty row for spacing
    startRow++;

    return startRow;
  }

  /**
   * Add column headers row
   */
  private addColumnHeaders(worksheet: Worksheet, startRow: number): number {
    const headers = this.options.includeExternalRef
      ? ['External Ref', 'Account Code', 'Account Name', 'DR', 'CR']
      : ['Account Code', 'Account Name', 'DR', 'CR'];

    const row = worksheet.getRow(startRow);
    headers.forEach((header, index) => {
      const cell = row.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '4472C4' }, // Blue
      };
      cell.alignment = {
        horizontal: index >= (this.options.includeExternalRef ? 3 : 2) ? 'right' : 'left',
        vertical: 'middle',
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    row.height = 25;
    row.commit();

    return startRow + 1;
  }

  /**
   * Add data rows grouped by account type
   */
  private addDataRows(
    worksheet: Worksheet,
    report: TrialBalanceReport,
    startRow: number
  ): number {
    let currentRow = startRow;

    // Group accounts by type
    const groups = this.groupAccountsByType(report.accounts);

    for (const group of groups) {
      if (group.accounts.length === 0 && !this.options.includeGroupSubtotals) {
        continue;
      }

      // Add group header
      if (this.options.includeGroupSubtotals) {
        currentRow = this.addGroupHeader(worksheet, group.label, currentRow);
      }

      // Add account rows
      for (const account of group.accounts) {
        currentRow = this.addAccountRow(worksheet, account, currentRow);
      }

      // Add group subtotal
      if (this.options.includeGroupSubtotals && group.accounts.length > 0) {
        currentRow = this.addGroupSubtotal(worksheet, group, currentRow);
      }
    }

    return currentRow;
  }

  /**
   * Add group header row (e.g., "ASSETS")
   */
  private addGroupHeader(
    worksheet: Worksheet,
    label: string,
    rowNumber: number
  ): number {
    const columnCount = this.options.includeExternalRef ? 5 : 4;
    const lastCol = excelService.getColumnLetter(columnCount);

    worksheet.mergeCells(`A${rowNumber}:${lastCol}${rowNumber}`);
    const cell = worksheet.getCell(`A${rowNumber}`);
    cell.value = label;
    cell.font = { bold: true, size: 11, color: { argb: '1E3A8A' } }; // Dark blue
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'DBEAFE' }, // Light blue
    };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
    };
    worksheet.getRow(rowNumber).height = 22;

    return rowNumber + 1;
  }

  /**
   * Add individual account row
   */
  private addAccountRow(
    worksheet: Worksheet,
    account: TrialBalanceLine,
    rowNumber: number
  ): number {
    const row = worksheet.getRow(rowNumber);
    let colIndex = 1;

    // External Ref (empty for now - can be populated from account metadata)
    if (this.options.includeExternalRef) {
      row.getCell(colIndex++).value = '';
    }

    // Account Code
    const codeCell = row.getCell(colIndex++);
    codeCell.value = account.accountCode;
    codeCell.alignment = { horizontal: 'left' };

    // Account Name
    const nameCell = row.getCell(colIndex++);
    nameCell.value = account.accountName;
    nameCell.alignment = { horizontal: 'left' };

    // Debit (show balance in DR column if positive for debit-normal accounts)
    const debitCell = row.getCell(colIndex++);
    const debitAmount = this.getDebitAmount(account);
    debitCell.value = debitAmount || null;
    debitCell.numFmt = this.options.currencyFormat;
    debitCell.alignment = { horizontal: 'right' };

    // Credit (show balance in CR column if positive for credit-normal accounts)
    const creditCell = row.getCell(colIndex++);
    const creditAmount = this.getCreditAmount(account);
    creditCell.value = creditAmount || null;
    creditCell.numFmt = this.options.currencyFormat;
    creditCell.alignment = { horizontal: 'right' };

    // Add light borders
    for (let i = 1; i <= (this.options.includeExternalRef ? 5 : 4); i++) {
      row.getCell(i).border = {
        bottom: { style: 'hair', color: { argb: 'E5E7EB' } },
      };
    }

    row.commit();
    return rowNumber + 1;
  }

  /**
   * Add group subtotal row
   */
  private addGroupSubtotal(
    worksheet: Worksheet,
    group: AccountTypeGroup,
    rowNumber: number
  ): number {
    const row = worksheet.getRow(rowNumber);
    let colIndex = 1;

    if (this.options.includeExternalRef) {
      colIndex++;
    }

    // Empty for code column
    colIndex++;

    // Subtotal label
    const labelCell = row.getCell(colIndex++);
    labelCell.value = `Total ${group.label}`;
    labelCell.font = { bold: true, size: 10 };
    labelCell.alignment = { horizontal: 'right' };

    // Debit subtotal
    const debitCell = row.getCell(colIndex++);
    debitCell.value = group.totalDebit || null;
    debitCell.numFmt = this.options.currencyFormat;
    debitCell.font = { bold: true };
    debitCell.alignment = { horizontal: 'right' };
    debitCell.border = { top: { style: 'thin' } };

    // Credit subtotal
    const creditCell = row.getCell(colIndex++);
    creditCell.value = group.totalCredit || null;
    creditCell.numFmt = this.options.currencyFormat;
    creditCell.font = { bold: true };
    creditCell.alignment = { horizontal: 'right' };
    creditCell.border = { top: { style: 'thin' } };

    row.commit();

    // Add empty row after subtotal
    return rowNumber + 2;
  }

  /**
   * Add final totals row
   */
  private addTotalsRow(
    worksheet: Worksheet,
    report: TrialBalanceReport,
    rowNumber: number
  ): number {
    const row = worksheet.getRow(rowNumber);
    let colIndex = 1;

    if (this.options.includeExternalRef) {
      colIndex++;
    }

    // Empty for code column
    colIndex++;

    // Totals label
    const labelCell = row.getCell(colIndex++);
    labelCell.value = 'TOTALS';
    labelCell.font = { bold: true, size: 12 };
    labelCell.alignment = { horizontal: 'right' };

    // Total Debits
    const debitCell = row.getCell(colIndex++);
    debitCell.value = report.totalDebits;
    debitCell.numFmt = this.options.currencyFormat;
    debitCell.font = { bold: true, size: 12 };
    debitCell.alignment = { horizontal: 'right' };
    debitCell.border = {
      top: { style: 'double' },
      bottom: { style: 'double' },
    };
    debitCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FEF3C7' }, // Light yellow
    };

    // Total Credits
    const creditCell = row.getCell(colIndex++);
    creditCell.value = report.totalCredits;
    creditCell.numFmt = this.options.currencyFormat;
    creditCell.font = { bold: true, size: 12 };
    creditCell.alignment = { horizontal: 'right' };
    creditCell.border = {
      top: { style: 'double' },
      bottom: { style: 'double' },
    };
    creditCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FEF3C7' }, // Light yellow
    };

    row.height = 25;
    row.commit();

    return rowNumber + 1;
  }

  /**
   * Add Net Profit/Loss row
   * Calculated as: Revenue Credits - Expense Debits
   */
  private addNetProfitLossRow(
    worksheet: Worksheet,
    report: TrialBalanceReport,
    rowNumber: number
  ): number {
    // Calculate Net Profit/Loss
    const { netProfitLoss, isProfit } = this.calculateNetProfitLoss(report);

    // Skip if zero
    if (Math.abs(netProfitLoss) < 0.01) {
      return rowNumber;
    }

    // Empty row for spacing
    rowNumber++;

    const row = worksheet.getRow(rowNumber);
    let colIndex = 1;

    if (this.options.includeExternalRef) {
      colIndex++;
    }

    // Empty for code column
    colIndex++;

    // Net Profit/Loss label
    const labelCell = row.getCell(colIndex++);
    labelCell.value = isProfit ? 'Net Profit' : 'Net Loss';
    labelCell.font = {
      bold: true,
      size: 11,
      color: { argb: isProfit ? '166534' : 'DC2626' }, // Green for profit, red for loss
    };
    labelCell.alignment = { horizontal: 'right' };

    // Show in appropriate column based on profit/loss
    const debitCell = row.getCell(colIndex++);
    const creditCell = row.getCell(colIndex++);

    if (isProfit) {
      // Profit goes in Credit column (increases equity)
      debitCell.value = null;
      creditCell.value = Math.abs(netProfitLoss);
      creditCell.numFmt = this.options.currencyFormat;
      creditCell.font = { bold: true, color: { argb: '166534' } };
      creditCell.alignment = { horizontal: 'right' };
    } else {
      // Loss goes in Debit column (decreases equity)
      debitCell.value = Math.abs(netProfitLoss);
      debitCell.numFmt = this.options.currencyFormat;
      debitCell.font = { bold: true, color: { argb: 'DC2626' } };
      debitCell.alignment = { horizontal: 'right' };
      creditCell.value = null;
    }

    row.commit();
    return rowNumber + 1;
  }

  /**
   * Add balance verification message
   */
  private addBalanceVerification(
    worksheet: Worksheet,
    report: TrialBalanceReport,
    rowNumber: number
  ): void {
    // Empty row for spacing
    rowNumber++;

    const columnCount = this.options.includeExternalRef ? 5 : 4;
    const lastCol = excelService.getColumnLetter(columnCount);

    worksheet.mergeCells(`A${rowNumber}:${lastCol}${rowNumber}`);
    const cell = worksheet.getCell(`A${rowNumber}`);

    if (report.balanced) {
      cell.value = 'Trial Balance is BALANCED';
      cell.font = { bold: true, size: 11, color: { argb: '166534' } }; // Green
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D1FAE5' }, // Light green
      };
    } else {
      const difference = Math.abs(report.totalDebits - report.totalCredits);
      cell.value = `Trial Balance is NOT BALANCED - Difference: ${this.formatCurrency(difference)}`;
      cell.font = { bold: true, size: 11, color: { argb: 'DC2626' } }; // Red
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FEE2E2' }, // Light red
      };
    }

    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
    worksheet.getRow(rowNumber).height = 25;
  }

  // ==========================================================================
  // PRIVATE METHODS - STYLING
  // ==========================================================================

  /**
   * Apply additional styling to the worksheet
   */
  private applyTBStyling(worksheet: Worksheet, _report: TrialBalanceReport): void {
    // Set print setup
    const columnCount = this.options.includeExternalRef ? 5 : 4;
    const lastCol = excelService.getColumnLetter(columnCount);
    const lastRow = worksheet.rowCount;

    excelService.setPrintSetup(worksheet, lastCol, lastRow);
  }

  // ==========================================================================
  // PRIVATE METHODS - UTILITIES
  // ==========================================================================

  /**
   * Group accounts by type with calculated subtotals
   */
  private groupAccountsByType(accounts: TrialBalanceLine[]): AccountTypeGroup[] {
    const groups: AccountTypeGroup[] = [];

    for (const type of ACCOUNT_TYPE_ORDER) {
      const typeAccounts = accounts.filter((acc) => acc.accountType === type);

      let totalDebit = 0;
      let totalCredit = 0;

      for (const account of typeAccounts) {
        totalDebit += this.getDebitAmount(account);
        totalCredit += this.getCreditAmount(account);
      }

      groups.push({
        type,
        label: ACCOUNT_TYPE_LABELS[type] || type,
        accounts: typeAccounts.sort((a, b) =>
          a.accountCode.localeCompare(b.accountCode)
        ),
        totalDebit: this.round(totalDebit),
        totalCredit: this.round(totalCredit),
      });
    }

    return groups;
  }

  /**
   * Get debit amount for display in Trial Balance
   * For debit-normal accounts (Assets, Expenses): show positive balance
   * For credit-normal accounts: show negative balance as debit
   */
  private getDebitAmount(account: TrialBalanceLine): number {
    // Use the balance field which is already calculated correctly
    // Positive balance for debit-normal accounts goes in DR
    // Negative balance for credit-normal accounts goes in DR
    if (account.accountType === 'ASSET' || account.accountType === 'EXPENSE') {
      return account.balance > 0 ? account.balance : 0;
    } else {
      // Credit-normal accounts - show negative balance in DR
      return account.balance < 0 ? Math.abs(account.balance) : 0;
    }
  }

  /**
   * Get credit amount for display in Trial Balance
   * For credit-normal accounts (Liabilities, Equity, Revenue): show positive balance
   * For debit-normal accounts: show negative balance as credit
   */
  private getCreditAmount(account: TrialBalanceLine): number {
    // Use the balance field which is already calculated correctly
    // Positive balance for credit-normal accounts goes in CR
    // Negative balance for debit-normal accounts goes in CR
    if (account.accountType === 'LIABILITY' || account.accountType === 'EQUITY' || account.accountType === 'REVENUE') {
      return account.balance > 0 ? account.balance : 0;
    } else {
      // Debit-normal accounts - show negative balance in CR
      return account.balance < 0 ? Math.abs(account.balance) : 0;
    }
  }

  /**
   * Calculate Net Profit or Loss
   * Profit = Revenue - Expenses (when Revenue > Expenses)
   * Loss = Expenses - Revenue (when Expenses > Revenue)
   */
  private calculateNetProfitLoss(report: TrialBalanceReport): {
    netProfitLoss: number;
    isProfit: boolean;
  } {
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const account of report.accounts) {
      if (account.accountType === 'REVENUE') {
        totalRevenue += Math.abs(account.balance);
      } else if (account.accountType === 'EXPENSE') {
        totalExpenses += Math.abs(account.balance);
      }
    }

    const netProfitLoss = totalRevenue - totalExpenses;
    return {
      netProfitLoss: this.round(Math.abs(netProfitLoss)),
      isProfit: netProfitLoss >= 0,
    };
  }

  /**
   * Round to 2 decimal places
   */
  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Format date for filename
   */
  private formatDateForFilename(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }

  /**
   * Format currency for display
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a Trial Balance Excel formatter instance
 * @param options - Formatter options
 * @returns TBExcelFormatter instance
 */
export function createTBExcelFormatter(
  options?: TBExcelFormatterOptions
): TBExcelFormatter {
  return new TBExcelFormatter(options);
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick export of Trial Balance to Excel
 * @param report - Trial Balance report data
 * @param options - Formatter options
 * @param filename - Optional filename (default: trial-balance-YYYY-MM-DD)
 */
export async function exportTrialBalanceToExcel(
  report: TrialBalanceReport,
  options?: TBExcelFormatterOptions,
  filename?: string
): Promise<void> {
  const formatter = createTBExcelFormatter(options);
  await formatter.downloadTrialBalanceExcel(report, filename);
}

/**
 * Get Trial Balance Excel as Blob
 * @param report - Trial Balance report data
 * @param options - Formatter options
 * @returns Promise<Blob>
 */
export async function getTrialBalanceExcelBlob(
  report: TrialBalanceReport,
  options?: TBExcelFormatterOptions
): Promise<Blob> {
  const formatter = createTBExcelFormatter(options);
  return formatter.getTrialBalanceExcelBlob(report);
}
