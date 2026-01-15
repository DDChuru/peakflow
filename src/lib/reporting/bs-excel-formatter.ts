/**
 * Balance Sheet Excel Formatter
 * Formats Balance Sheet (Statement of Financial Position) report data for Excel export using ExcelJS
 *
 * Template Structure:
 * ASSETS
 *   Non-current Assets
 *     - Fixed Assets (Property, Plant & Equipment)
 *     - Accumulated Depreciation
 *     - Investments
 *     - Intangible Assets
 *     - Other Non-Current Assets
 *     (Subtotal: Non-Current Assets)
 *   Current Assets
 *     - Cash & Bank
 *     - Accounts Receivable
 *     - Inventory
 *     - Other Current Assets
 *     (Subtotal: Current Assets)
 *   **TOTAL ASSETS**
 *
 * EQUITY AND LIABILITIES
 *   Capital and Reserves (Equity)
 *     - Share Capital
 *     - Retained Earnings
 *     - Current Year Earnings
 *     - Other Equity
 *     (Subtotal: Total Equity)
 *   Non-current Liabilities
 *     - Long-term Debt
 *     - Other Non-Current Liabilities
 *     (Subtotal: Non-Current Liabilities)
 *   Current Liabilities
 *     - Accounts Payable
 *     - Short-term Debt
 *     - Accrued Expenses
 *     - Other Current Liabilities
 *     (Subtotal: Current Liabilities)
 *   **TOTAL EQUITY AND LIABILITIES**
 *
 * Features:
 * - Hierarchical structure with section headers
 * - Account detail rows under each section
 * - Calculated subtotals and totals
 * - Proper Excel formatting (bold headers, currency formatting, section spacing)
 * - Balance verification (Total Assets = Total Equity + Liabilities)
 */

import { excelService, type ColumnDefinition } from '@/lib/excel';
import type { BalanceSheet, AccountBalance, FinancialStatementSection } from './financial-statements-service';
import type { Workbook, Worksheet } from 'exceljs';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Options for formatting the Balance Sheet Excel export
 */
export interface BSExcelFormatterOptions {
  /** Company name for header */
  companyName?: string;
  /** Report title (default: "Balance Sheet") */
  reportTitle?: string;
  /** Include account details under each section (default: true) */
  includeAccountDetails?: boolean;
  /** Include account codes in detail rows (default: true) */
  includeAccountCodes?: boolean;
  /** Currency format (default: ZAR) */
  currencyFormat?: string;
  /** Prepared by name */
  preparedBy?: string;
  /** Show comparative period (future enhancement) */
  showComparative?: boolean;
}

/**
 * Formatted Balance Sheet line for Excel output
 */
export interface FormattedBSLine {
  accountCode?: string;
  accountName: string;
  amount: number;
  isSection?: boolean;
  isSectionTotal?: boolean;
  isGrandTotal?: boolean;
  indentLevel?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Section styling colors */
const SECTION_COLORS = {
  majorHeader: '1E3A8A', // Dark blue for ASSETS, EQUITY AND LIABILITIES
  header: 'DBEAFE', // Light blue for section headers
  subtotal: 'F3F4F6', // Light gray for subtotals
  grandTotal: 'FEF3C7', // Light yellow for grand totals
  balanced: 'D1FAE5', // Light green for balanced
  unbalanced: 'FEE2E2', // Light red for unbalanced
};

/** Font colors */
const FONT_COLORS = {
  majorHeader: 'FFFFFF', // White for major headers
  sectionHeader: '1E3A8A', // Dark blue
  balanced: '166534', // Dark green
  unbalanced: 'DC2626', // Dark red
  normal: '1F2937', // Dark gray
};

// ============================================================================
// BALANCE SHEET EXCEL FORMATTER CLASS
// ============================================================================

export class BSExcelFormatter {
  private options: Required<BSExcelFormatterOptions>;

  constructor(options: BSExcelFormatterOptions = {}) {
    this.options = {
      companyName: options.companyName || 'Company Name',
      reportTitle: options.reportTitle || 'Balance Sheet',
      includeAccountDetails: options.includeAccountDetails ?? true,
      includeAccountCodes: options.includeAccountCodes ?? true,
      currencyFormat: options.currencyFormat || excelService.CURRENCY_FORMAT_ZAR,
      preparedBy: options.preparedBy || 'System Generated',
      showComparative: options.showComparative ?? false,
    };
  }

  /**
   * Format Balance Sheet report for Excel export
   * @param report - Balance Sheet report data
   * @returns Excel workbook ready for download
   */
  async formatBalanceSheetToExcel(report: BalanceSheet): Promise<Workbook> {
    const workbook = excelService.createWorkbook();

    // Create the Balance Sheet worksheet
    const worksheet = this.createBSWorksheet(workbook, report);

    // Apply final styling
    this.applyBSStyling(worksheet, report);

    return workbook;
  }

  /**
   * Download Balance Sheet as Excel file
   * @param report - Balance Sheet report data
   * @param filename - Output filename (without .xlsx extension)
   */
  async downloadBalanceSheetExcel(
    report: BalanceSheet,
    filename?: string
  ): Promise<void> {
    const workbook = await this.formatBalanceSheetToExcel(report);
    const defaultFilename = `balance-sheet-${this.formatDateForFilename(report.asOfDate)}`;
    await excelService.downloadExcel(workbook, filename || defaultFilename);
  }

  /**
   * Get Balance Sheet Excel as Blob (for storage/upload)
   * @param report - Balance Sheet report data
   * @returns Promise<Blob>
   */
  async getBalanceSheetExcelBlob(report: BalanceSheet): Promise<Blob> {
    const workbook = await this.formatBalanceSheetToExcel(report);
    return excelService.getExcelBlob(workbook);
  }

  // ==========================================================================
  // PRIVATE METHODS - WORKSHEET CREATION
  // ==========================================================================

  /**
   * Create the Balance Sheet worksheet with all data
   */
  private createBSWorksheet(
    workbook: Workbook,
    report: BalanceSheet
  ): Worksheet {
    // Define columns
    const columns: ColumnDefinition[] = this.getColumnDefinitions();

    const worksheet = excelService.addWorksheet(workbook, {
      name: 'Balance Sheet',
      columns,
      freezeHeader: false, // We'll freeze after adding header rows
      autoFilter: false,
      tabColor: '3B82F6', // Blue tab for Balance Sheet
    });

    // Add header section
    let currentRow = 1;
    currentRow = this.addHeaderSection(worksheet, report, currentRow);

    // Add column headers
    currentRow = this.addColumnHeaders(worksheet, currentRow);

    // Freeze panes after header row
    worksheet.views = [{ state: 'frozen', ySplit: currentRow }];

    // =========================================================================
    // ASSETS SECTION
    // =========================================================================
    currentRow = this.addMajorSectionHeader(worksheet, 'ASSETS', currentRow);

    // === NON-CURRENT ASSETS ===
    currentRow = this.addSectionHeader(worksheet, 'Non-current Assets', currentRow);

    // Fixed Assets (Property, Plant & Equipment) - 1400-1499
    if (this.hasAccountsInSubsection(report.assets.nonCurrentAssets, 'Property, Plant & Equipment')) {
      currentRow = this.addSubsectionHeader(worksheet, 'Fixed Assets', currentRow);
      currentRow = this.addSubsectionAccounts(
        worksheet,
        this.getSubsectionAccounts(report.assets.nonCurrentAssets, 'Property, Plant & Equipment'),
        currentRow
      );
      currentRow = this.addSubsectionSubtotal(
        worksheet,
        'Subtotal: Fixed Assets',
        this.getSubsectionTotal(report.assets.nonCurrentAssets, 'Property, Plant & Equipment'),
        currentRow
      );
    }

    // Accumulated Depreciation - 1500-1599 (shows as negative)
    if (this.hasAccountsInSubsection(report.assets.nonCurrentAssets, 'Accumulated Depreciation')) {
      currentRow = this.addSubsectionAccounts(
        worksheet,
        this.getSubsectionAccounts(report.assets.nonCurrentAssets, 'Accumulated Depreciation'),
        currentRow
      );
    }

    // Other Fixed Assets (Investments, Intangibles, Other)
    const otherNonCurrentSubsections = ['Investments', 'Intangible Assets', 'Other Non-Current Assets'];
    let hasOtherFixedAssets = false;
    let otherFixedAssetsTotal = 0;

    for (const subsectionName of otherNonCurrentSubsections) {
      if (this.hasAccountsInSubsection(report.assets.nonCurrentAssets, subsectionName)) {
        if (!hasOtherFixedAssets) {
          currentRow = this.addSubsectionHeader(worksheet, 'Other Fixed Assets', currentRow);
          hasOtherFixedAssets = true;
        }
        currentRow = this.addSubsectionAccounts(
          worksheet,
          this.getSubsectionAccounts(report.assets.nonCurrentAssets, subsectionName),
          currentRow
        );
        otherFixedAssetsTotal += this.getSubsectionTotal(report.assets.nonCurrentAssets, subsectionName);
      }
    }

    if (hasOtherFixedAssets) {
      currentRow = this.addSubsectionSubtotal(
        worksheet,
        'Subtotal: Other Fixed Assets',
        otherFixedAssetsTotal,
        currentRow
      );
    }

    // Non-Current Assets Subtotal
    currentRow = this.addSectionSubtotal(
      worksheet,
      'Total Non-current Assets',
      report.assets.nonCurrentAssets.subtotal,
      currentRow
    );

    // === CURRENT ASSETS ===
    currentRow = this.addEmptyRow(worksheet, currentRow);
    currentRow = this.addSectionHeader(worksheet, 'Current Assets', currentRow);

    // Add all current asset subsections
    if (report.assets.currentAssets.subsections) {
      for (const subsection of report.assets.currentAssets.subsections) {
        if (subsection.accounts.length > 0 || Math.abs(subsection.subtotal) > 0.01) {
          currentRow = this.addSubsectionAccounts(worksheet, subsection.accounts, currentRow);
        }
      }
    } else {
      // Fallback: show all current asset accounts
      currentRow = this.addSubsectionAccounts(worksheet, report.assets.currentAssets.accounts, currentRow);
    }

    // Current Assets Subtotal
    currentRow = this.addSectionSubtotal(
      worksheet,
      'Total Current Assets',
      report.assets.currentAssets.subtotal,
      currentRow
    );

    // === TOTAL ASSETS ===
    currentRow = this.addEmptyRow(worksheet, currentRow);
    currentRow = this.addGrandTotalRow(
      worksheet,
      'TOTAL ASSETS',
      report.assets.totalAssets,
      currentRow
    );

    // =========================================================================
    // EQUITY AND LIABILITIES SECTION
    // =========================================================================
    currentRow = this.addEmptyRow(worksheet, currentRow);
    currentRow = this.addEmptyRow(worksheet, currentRow);
    currentRow = this.addMajorSectionHeader(worksheet, 'EQUITY AND LIABILITIES', currentRow);

    // === CAPITAL AND RESERVES (EQUITY) ===
    currentRow = this.addSectionHeader(worksheet, 'Capital and Reserves', currentRow);

    // Add all equity subsections
    if (report.equity.subsections) {
      for (const subsection of report.equity.subsections) {
        if (subsection.accounts.length > 0 || Math.abs(subsection.subtotal) > 0.01) {
          // Use subsection name as a category label if there are multiple accounts
          if (subsection.accounts.length > 1) {
            currentRow = this.addSubsectionHeader(worksheet, subsection.name, currentRow);
          }
          currentRow = this.addSubsectionAccounts(worksheet, subsection.accounts, currentRow);
        }
      }
    } else {
      // Fallback: show all equity accounts
      currentRow = this.addSubsectionAccounts(worksheet, report.equity.accounts, currentRow);
    }

    // Total Equity
    currentRow = this.addSectionSubtotal(
      worksheet,
      'Total Capital and Reserves',
      report.totalEquity,
      currentRow
    );

    // === NON-CURRENT LIABILITIES ===
    currentRow = this.addEmptyRow(worksheet, currentRow);
    currentRow = this.addSectionHeader(worksheet, 'Non-current Liabilities', currentRow);

    // Add all non-current liability subsections
    if (report.liabilities.nonCurrentLiabilities.subsections) {
      for (const subsection of report.liabilities.nonCurrentLiabilities.subsections) {
        if (subsection.accounts.length > 0 || Math.abs(subsection.subtotal) > 0.01) {
          currentRow = this.addSubsectionAccounts(worksheet, subsection.accounts, currentRow);
        }
      }
    } else {
      // Fallback: show all non-current liability accounts
      currentRow = this.addSubsectionAccounts(worksheet, report.liabilities.nonCurrentLiabilities.accounts, currentRow);
    }

    // Non-Current Liabilities Subtotal
    currentRow = this.addSectionSubtotal(
      worksheet,
      'Total Non-current Liabilities',
      report.liabilities.nonCurrentLiabilities.subtotal,
      currentRow
    );

    // === CURRENT LIABILITIES ===
    currentRow = this.addEmptyRow(worksheet, currentRow);
    currentRow = this.addSectionHeader(worksheet, 'Current Liabilities', currentRow);

    // Add all current liability subsections
    if (report.liabilities.currentLiabilities.subsections) {
      for (const subsection of report.liabilities.currentLiabilities.subsections) {
        if (subsection.accounts.length > 0 || Math.abs(subsection.subtotal) > 0.01) {
          currentRow = this.addSubsectionAccounts(worksheet, subsection.accounts, currentRow);
        }
      }
    } else {
      // Fallback: show all current liability accounts
      currentRow = this.addSubsectionAccounts(worksheet, report.liabilities.currentLiabilities.accounts, currentRow);
    }

    // Current Liabilities Subtotal
    currentRow = this.addSectionSubtotal(
      worksheet,
      'Total Current Liabilities',
      report.liabilities.currentLiabilities.subtotal,
      currentRow
    );

    // === TOTAL EQUITY AND LIABILITIES ===
    currentRow = this.addEmptyRow(worksheet, currentRow);
    currentRow = this.addGrandTotalRow(
      worksheet,
      'TOTAL EQUITY AND LIABILITIES',
      report.totalLiabilitiesAndEquity,
      currentRow
    );

    // === BALANCE VERIFICATION ===
    currentRow = this.addEmptyRow(worksheet, currentRow);
    currentRow = this.addBalanceVerification(worksheet, report, currentRow);

    return worksheet;
  }

  /**
   * Get column definitions for the worksheet
   */
  private getColumnDefinitions(): ColumnDefinition[] {
    const columns: ColumnDefinition[] = [];

    if (this.options.includeAccountCodes) {
      columns.push({
        header: 'Account Code',
        key: 'accountCode',
        width: 15,
        alignment: 'left',
      });
    }

    columns.push({
      header: 'Description',
      key: 'description',
      width: 50,
      alignment: 'left',
    });

    columns.push({
      header: 'Amount',
      key: 'amount',
      width: 20,
      numFmt: this.options.currencyFormat,
      alignment: 'right',
    });

    return columns;
  }

  /**
   * Add header section with company name, report title, and date
   */
  private addHeaderSection(
    worksheet: Worksheet,
    report: BalanceSheet,
    startRow: number
  ): number {
    const columnCount = this.getColumnCount();
    const lastCol = excelService.getColumnLetter(columnCount);

    // Company name
    worksheet.mergeCells(`A${startRow}:${lastCol}${startRow}`);
    const companyCell = worksheet.getCell(`A${startRow}`);
    companyCell.value = this.options.companyName;
    companyCell.font = { bold: true, size: 16, color: { argb: FONT_COLORS.normal } };
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
    const headers = this.getHeaderLabels();

    const row = worksheet.getRow(startRow);
    headers.forEach((header, index) => {
      const cell = row.getCell(index + 1);
      cell.value = header;
      cell.font = { bold: true, size: 11, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '3B82F6' }, // Blue header
      };
      cell.alignment = {
        horizontal: header === 'Amount' ? 'right' : 'left',
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
   * Add major section header row (e.g., "ASSETS", "EQUITY AND LIABILITIES")
   */
  private addMajorSectionHeader(
    worksheet: Worksheet,
    sectionName: string,
    rowNumber: number
  ): number {
    const columnCount = this.getColumnCount();
    const lastCol = excelService.getColumnLetter(columnCount);

    worksheet.mergeCells(`A${rowNumber}:${lastCol}${rowNumber}`);
    const cell = worksheet.getCell(`A${rowNumber}`);
    cell.value = sectionName;
    cell.font = { bold: true, size: 12, color: { argb: FONT_COLORS.majorHeader } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SECTION_COLORS.majorHeader },
    };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
    };
    worksheet.getRow(rowNumber).height = 25;

    return rowNumber + 1;
  }

  /**
   * Add section header row (e.g., "Non-current Assets", "Current Liabilities")
   */
  private addSectionHeader(
    worksheet: Worksheet,
    sectionName: string,
    rowNumber: number
  ): number {
    const columnCount = this.getColumnCount();
    const lastCol = excelService.getColumnLetter(columnCount);

    worksheet.mergeCells(`A${rowNumber}:${lastCol}${rowNumber}`);
    const cell = worksheet.getCell(`A${rowNumber}`);
    cell.value = sectionName;
    cell.font = { bold: true, size: 11, color: { argb: FONT_COLORS.sectionHeader } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SECTION_COLORS.header },
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
   * Add subsection header (lighter styling than main sections)
   */
  private addSubsectionHeader(
    worksheet: Worksheet,
    name: string,
    rowNumber: number
  ): number {
    const row = worksheet.getRow(rowNumber);
    let colIndex = 1;

    // Skip account code column if enabled
    if (this.options.includeAccountCodes) {
      colIndex++;
    }

    const labelCell = row.getCell(colIndex);
    labelCell.value = '  ' + name; // Slight indent
    labelCell.font = { bold: true, size: 10, italic: true, color: { argb: '4B5563' } };
    labelCell.alignment = { horizontal: 'left' };

    row.commit();
    return rowNumber + 1;
  }

  /**
   * Add account detail rows for a subsection
   */
  private addSubsectionAccounts(
    worksheet: Worksheet,
    accounts: AccountBalance[],
    startRow: number
  ): number {
    if (!this.options.includeAccountDetails) {
      return startRow;
    }

    let currentRow = startRow;

    for (const account of accounts) {
      const row = worksheet.getRow(currentRow);
      let colIndex = 1;

      // Account Code (if enabled)
      if (this.options.includeAccountCodes) {
        const codeCell = row.getCell(colIndex++);
        codeCell.value = account.accountCode;
        codeCell.alignment = { horizontal: 'left' };
      }

      // Account Name (indented)
      const nameCell = row.getCell(colIndex++);
      nameCell.value = '      ' + account.accountName; // Indent with spaces
      nameCell.alignment = { horizontal: 'left' };

      // Amount
      const amountCell = row.getCell(colIndex++);
      amountCell.value = account.balance || null;
      amountCell.numFmt = this.options.currencyFormat;
      amountCell.alignment = { horizontal: 'right' };

      // Add light border
      for (let i = 1; i <= this.getColumnCount(); i++) {
        row.getCell(i).border = {
          bottom: { style: 'hair', color: { argb: 'E5E7EB' } },
        };
      }

      row.commit();
      currentRow++;
    }

    return currentRow;
  }

  /**
   * Add subsection subtotal (lighter styling)
   */
  private addSubsectionSubtotal(
    worksheet: Worksheet,
    label: string,
    amount: number,
    rowNumber: number
  ): number {
    const row = worksheet.getRow(rowNumber);
    let colIndex = 1;

    // Skip account code column if enabled
    if (this.options.includeAccountCodes) {
      colIndex++;
    }

    // Label
    const labelCell = row.getCell(colIndex++);
    labelCell.value = '        ' + label; // Indent
    labelCell.font = { italic: true, size: 10 };
    labelCell.alignment = { horizontal: 'right' };

    // Amount
    const amountCell = row.getCell(colIndex++);
    amountCell.value = amount;
    amountCell.numFmt = this.options.currencyFormat;
    amountCell.font = { italic: true };
    amountCell.alignment = { horizontal: 'right' };
    amountCell.border = { top: { style: 'thin' } };

    row.commit();
    return rowNumber + 1;
  }

  /**
   * Add section subtotal row
   */
  private addSectionSubtotal(
    worksheet: Worksheet,
    label: string,
    amount: number,
    rowNumber: number
  ): number {
    const row = worksheet.getRow(rowNumber);
    let colIndex = 1;

    // Skip account code column if enabled
    if (this.options.includeAccountCodes) {
      colIndex++;
    }

    // Label
    const labelCell = row.getCell(colIndex++);
    labelCell.value = label;
    labelCell.font = { bold: true, size: 10 };
    labelCell.alignment = { horizontal: 'right' };

    // Amount
    const amountCell = row.getCell(colIndex++);
    amountCell.value = amount;
    amountCell.numFmt = this.options.currencyFormat;
    amountCell.font = { bold: true };
    amountCell.alignment = { horizontal: 'right' };
    amountCell.border = { top: { style: 'thin' } };
    amountCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SECTION_COLORS.subtotal },
    };

    row.commit();
    return rowNumber + 1;
  }

  /**
   * Add grand total row (e.g., TOTAL ASSETS, TOTAL EQUITY AND LIABILITIES)
   */
  private addGrandTotalRow(
    worksheet: Worksheet,
    label: string,
    amount: number,
    rowNumber: number
  ): number {
    const row = worksheet.getRow(rowNumber);
    let colIndex = 1;

    // Skip account code column if enabled
    if (this.options.includeAccountCodes) {
      colIndex++;
    }

    // Label
    const labelCell = row.getCell(colIndex++);
    labelCell.value = label;
    labelCell.font = {
      bold: true,
      size: 12,
      color: { argb: FONT_COLORS.sectionHeader },
    };
    labelCell.alignment = { horizontal: 'right' };

    // Amount
    const amountCell = row.getCell(colIndex++);
    amountCell.value = amount;
    amountCell.numFmt = this.options.currencyFormat;
    amountCell.font = {
      bold: true,
      size: 12,
      color: { argb: FONT_COLORS.sectionHeader },
    };
    amountCell.alignment = { horizontal: 'right' };
    amountCell.border = {
      top: { style: 'double' },
      bottom: { style: 'double' },
    };
    amountCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SECTION_COLORS.grandTotal },
    };

    row.height = 25;
    row.commit();
    return rowNumber + 1;
  }

  /**
   * Add balance verification row
   */
  private addBalanceVerification(
    worksheet: Worksheet,
    report: BalanceSheet,
    rowNumber: number
  ): number {
    const columnCount = this.getColumnCount();
    const lastCol = excelService.getColumnLetter(columnCount);

    worksheet.mergeCells(`A${rowNumber}:${lastCol}${rowNumber}`);
    const cell = worksheet.getCell(`A${rowNumber}`);

    if (report.balanced) {
      cell.value = 'Balance Sheet is BALANCED (Total Assets = Total Equity + Liabilities)';
      cell.font = { bold: true, size: 11, color: { argb: FONT_COLORS.balanced } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SECTION_COLORS.balanced },
      };
    } else {
      const difference = Math.abs(report.assets.totalAssets - report.totalLiabilitiesAndEquity);
      cell.value = `Balance Sheet is NOT BALANCED - Difference: ${this.formatCurrency(difference)}`;
      cell.font = { bold: true, size: 11, color: { argb: FONT_COLORS.unbalanced } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SECTION_COLORS.unbalanced },
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

    return rowNumber + 1;
  }

  /**
   * Add empty row for spacing
   */
  private addEmptyRow(worksheet: Worksheet, rowNumber: number): number {
    worksheet.getRow(rowNumber).height = 10;
    return rowNumber + 1;
  }

  // ==========================================================================
  // PRIVATE METHODS - STYLING
  // ==========================================================================

  /**
   * Apply additional styling to the worksheet
   */
  private applyBSStyling(worksheet: Worksheet, _report: BalanceSheet): void {
    // Set print setup
    const columnCount = this.getColumnCount();
    const lastCol = excelService.getColumnLetter(columnCount);
    const lastRow = worksheet.rowCount;

    excelService.setPrintSetup(worksheet, lastCol, lastRow);
  }

  // ==========================================================================
  // PRIVATE METHODS - DATA HELPERS
  // ==========================================================================

  /**
   * Check if a subsection has accounts
   */
  private hasAccountsInSubsection(
    section: FinancialStatementSection,
    subsectionName: string
  ): boolean {
    if (!section.subsections) return false;

    const subsection = section.subsections.find((s) => s.name === subsectionName);
    return subsection ? subsection.accounts.length > 0 || Math.abs(subsection.subtotal) > 0.01 : false;
  }

  /**
   * Get accounts from a specific subsection
   */
  private getSubsectionAccounts(
    section: FinancialStatementSection,
    subsectionName: string
  ): AccountBalance[] {
    if (!section.subsections) return [];

    const subsection = section.subsections.find((s) => s.name === subsectionName);
    return subsection ? subsection.accounts : [];
  }

  /**
   * Get total from a specific subsection
   */
  private getSubsectionTotal(
    section: FinancialStatementSection,
    subsectionName: string
  ): number {
    if (!section.subsections) return 0;

    const subsection = section.subsections.find((s) => s.name === subsectionName);
    return subsection ? subsection.subtotal : 0;
  }

  // ==========================================================================
  // PRIVATE METHODS - UTILITIES
  // ==========================================================================

  /**
   * Get number of columns based on options
   */
  private getColumnCount(): number {
    let count = 2; // Description + Amount
    if (this.options.includeAccountCodes) count++;
    return count;
  }

  /**
   * Get header labels based on options
   */
  private getHeaderLabels(): string[] {
    const headers: string[] = [];
    if (this.options.includeAccountCodes) headers.push('Account Code');
    headers.push('Description');
    headers.push('Amount');
    return headers;
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
 * Create a Balance Sheet Excel formatter instance
 * @param options - Formatter options
 * @returns BSExcelFormatter instance
 */
export function createBSExcelFormatter(
  options?: BSExcelFormatterOptions
): BSExcelFormatter {
  return new BSExcelFormatter(options);
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick export of Balance Sheet to Excel
 * @param report - Balance Sheet report data
 * @param options - Formatter options
 * @param filename - Optional filename (default: balance-sheet-YYYY-MM-DD)
 */
export async function exportBalanceSheetToExcel(
  report: BalanceSheet,
  options?: BSExcelFormatterOptions,
  filename?: string
): Promise<void> {
  const formatter = createBSExcelFormatter(options);
  await formatter.downloadBalanceSheetExcel(report, filename);
}

/**
 * Get Balance Sheet Excel as Blob
 * @param report - Balance Sheet report data
 * @param options - Formatter options
 * @returns Promise<Blob>
 */
export async function getBalanceSheetExcelBlob(
  report: BalanceSheet,
  options?: BSExcelFormatterOptions
): Promise<Blob> {
  const formatter = createBSExcelFormatter(options);
  return formatter.getBalanceSheetExcelBlob(report);
}
