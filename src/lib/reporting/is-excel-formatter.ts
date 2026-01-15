/**
 * Income Statement Excel Formatter
 * Formats Income Statement (Profit & Loss) report data for Excel export using ExcelJS
 *
 * Template Structure:
 * - SALES section (Revenue accounts 4000-4099, 4100-4199)
 * - COST OF SALES section (COGS accounts 5000-5099)
 * - GROSS PROFIT line (calculated: SALES - COST OF SALES)
 * - OTHER INCOME section (Other revenue 4200-4999)
 * - EXPENSES section with detail items (5100-5899)
 * - OPERATING PROFIT (calculated: GROSS PROFIT + OTHER INCOME - EXPENSES)
 * - OTHER INCOME/EXPENSES section (5900-5999)
 * - NET PROFIT/LOSS line (calculated)
 *
 * Features:
 * - Hierarchical structure with section headers
 * - Account detail rows under each section
 * - Calculated subtotals and totals
 * - Proper Excel formatting (bold headers, currency formatting, section spacing)
 * - Period comparison support (optional)
 */

import { excelService, type ColumnDefinition } from '@/lib/excel';
import type { IncomeStatement, AccountBalance, FinancialStatementSection } from './financial-statements-service';
import type { Workbook, Worksheet } from 'exceljs';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Options for formatting the Income Statement Excel export
 */
export interface ISExcelFormatterOptions {
  /** Company name for header */
  companyName?: string;
  /** Report title (default: "Income Statement") */
  reportTitle?: string;
  /** Include account details under each section (default: true) */
  includeAccountDetails?: boolean;
  /** Include account codes in detail rows (default: true) */
  includeAccountCodes?: boolean;
  /** Currency format (default: ZAR) */
  currencyFormat?: string;
  /** Prepared by name */
  preparedBy?: string;
  /** Show percentages relative to revenue (default: false) */
  showPercentages?: boolean;
}

/**
 * Formatted Income Statement line for Excel output
 */
export interface FormattedISLine {
  accountCode?: string;
  accountName: string;
  amount: number;
  percentage?: number;
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
  header: 'DBEAFE', // Light blue for section headers
  subtotal: 'F3F4F6', // Light gray for subtotals
  grandTotal: 'FEF3C7', // Light yellow for grand totals
  profit: 'D1FAE5', // Light green for profit
  loss: 'FEE2E2', // Light red for loss
};

/** Font colors */
const FONT_COLORS = {
  sectionHeader: '1E3A8A', // Dark blue
  profit: '166534', // Dark green
  loss: 'DC2626', // Dark red
  normal: '1F2937', // Dark gray
};

// ============================================================================
// INCOME STATEMENT EXCEL FORMATTER CLASS
// ============================================================================

export class ISExcelFormatter {
  private options: Required<ISExcelFormatterOptions>;

  constructor(options: ISExcelFormatterOptions = {}) {
    this.options = {
      companyName: options.companyName || 'Company Name',
      reportTitle: options.reportTitle || 'Income Statement',
      includeAccountDetails: options.includeAccountDetails ?? true,
      includeAccountCodes: options.includeAccountCodes ?? true,
      currencyFormat: options.currencyFormat || excelService.CURRENCY_FORMAT_ZAR,
      preparedBy: options.preparedBy || 'System Generated',
      showPercentages: options.showPercentages ?? false,
    };
  }

  /**
   * Format Income Statement report for Excel export
   * @param report - Income Statement report data
   * @returns Excel workbook ready for download
   */
  async formatIncomeStatementToExcel(report: IncomeStatement): Promise<Workbook> {
    const workbook = excelService.createWorkbook();

    // Create the Income Statement worksheet
    const worksheet = this.createISWorksheet(workbook, report);

    // Apply final styling
    this.applyISStyling(worksheet, report);

    return workbook;
  }

  /**
   * Download Income Statement as Excel file
   * @param report - Income Statement report data
   * @param filename - Output filename (without .xlsx extension)
   */
  async downloadIncomeStatementExcel(
    report: IncomeStatement,
    filename?: string
  ): Promise<void> {
    const workbook = await this.formatIncomeStatementToExcel(report);
    const defaultFilename = `income-statement-${this.formatDateForFilename(report.startDate)}-to-${this.formatDateForFilename(report.endDate)}`;
    await excelService.downloadExcel(workbook, filename || defaultFilename);
  }

  /**
   * Get Income Statement Excel as Blob (for storage/upload)
   * @param report - Income Statement report data
   * @returns Promise<Blob>
   */
  async getIncomeStatementExcelBlob(report: IncomeStatement): Promise<Blob> {
    const workbook = await this.formatIncomeStatementToExcel(report);
    return excelService.getExcelBlob(workbook);
  }

  // ==========================================================================
  // PRIVATE METHODS - WORKSHEET CREATION
  // ==========================================================================

  /**
   * Create the Income Statement worksheet with all data
   */
  private createISWorksheet(
    workbook: Workbook,
    report: IncomeStatement
  ): Worksheet {
    // Define columns
    const columns: ColumnDefinition[] = this.getColumnDefinitions();

    const worksheet = excelService.addWorksheet(workbook, {
      name: 'Income Statement',
      columns,
      freezeHeader: false, // We'll freeze after adding header rows
      autoFilter: false,
      tabColor: '10B981', // Green tab for P&L
    });

    // Add header section
    let currentRow = 1;
    currentRow = this.addHeaderSection(worksheet, report, currentRow);

    // Add column headers
    currentRow = this.addColumnHeaders(worksheet, currentRow);

    // Freeze panes after header row
    worksheet.views = [{ state: 'frozen', ySplit: currentRow }];

    // Calculate total revenue for percentage calculations
    const totalRevenue = report.revenue.subtotal;

    // === SALES SECTION ===
    currentRow = this.addSectionHeader(worksheet, 'SALES', currentRow);
    currentRow = this.addSectionAccounts(
      worksheet,
      this.getSalesAccounts(report.revenue),
      totalRevenue,
      currentRow
    );
    currentRow = this.addSectionSubtotal(
      worksheet,
      'Total Sales',
      this.getSalesTotal(report.revenue),
      totalRevenue,
      currentRow
    );

    // === COST OF SALES SECTION ===
    currentRow = this.addEmptyRow(worksheet, currentRow);
    currentRow = this.addSectionHeader(worksheet, 'COST OF SALES', currentRow);
    currentRow = this.addSectionAccounts(
      worksheet,
      report.costOfGoodsSold.accounts,
      totalRevenue,
      currentRow
    );
    currentRow = this.addSectionSubtotal(
      worksheet,
      'Total Cost of Sales',
      report.costOfGoodsSold.subtotal,
      totalRevenue,
      currentRow
    );

    // === GROSS PROFIT LINE ===
    currentRow = this.addEmptyRow(worksheet, currentRow);
    currentRow = this.addGrandTotalRow(
      worksheet,
      'GROSS PROFIT',
      report.grossProfit,
      totalRevenue,
      currentRow,
      report.grossProfit >= 0
    );

    // === OTHER INCOME SECTION ===
    const otherIncome = this.getOtherIncomeAccounts(report.revenue);
    if (otherIncome.length > 0 || this.options.includeAccountDetails) {
      currentRow = this.addEmptyRow(worksheet, currentRow);
      currentRow = this.addSectionHeader(worksheet, 'OTHER INCOME', currentRow);
      currentRow = this.addSectionAccounts(
        worksheet,
        otherIncome,
        totalRevenue,
        currentRow
      );
      currentRow = this.addSectionSubtotal(
        worksheet,
        'Total Other Income',
        this.getOtherIncomeTotal(report.revenue),
        totalRevenue,
        currentRow
      );
    }

    // === EXPENSES SECTION ===
    currentRow = this.addEmptyRow(worksheet, currentRow);
    currentRow = this.addSectionHeader(worksheet, 'EXPENSES', currentRow);
    currentRow = this.addExpenseSubsections(
      worksheet,
      report.operatingExpenses,
      totalRevenue,
      currentRow
    );
    currentRow = this.addSectionSubtotal(
      worksheet,
      'Total Expenses',
      report.operatingExpenses.subtotal,
      totalRevenue,
      currentRow
    );

    // === OPERATING PROFIT LINE ===
    currentRow = this.addEmptyRow(worksheet, currentRow);
    currentRow = this.addGrandTotalRow(
      worksheet,
      'OPERATING PROFIT',
      report.operatingIncome,
      totalRevenue,
      currentRow,
      report.operatingIncome >= 0
    );

    // === OTHER INCOME/EXPENSES SECTION (if applicable) ===
    if (report.otherIncomeExpenses.accounts.length > 0 || Math.abs(report.otherIncomeExpenses.subtotal) > 0.01) {
      currentRow = this.addEmptyRow(worksheet, currentRow);
      currentRow = this.addSectionHeader(worksheet, 'OTHER INCOME/EXPENSES', currentRow);
      currentRow = this.addSectionAccounts(
        worksheet,
        report.otherIncomeExpenses.accounts,
        totalRevenue,
        currentRow
      );
      currentRow = this.addSectionSubtotal(
        worksheet,
        'Total Other Income/Expenses',
        report.otherIncomeExpenses.subtotal,
        totalRevenue,
        currentRow
      );

      // === NET INCOME BEFORE TAX ===
      currentRow = this.addEmptyRow(worksheet, currentRow);
      currentRow = this.addCalculatedRow(
        worksheet,
        'Net Income Before Tax',
        report.netIncomeBeforeTax,
        totalRevenue,
        currentRow
      );
    }

    // === INCOME TAX (if applicable) ===
    if (Math.abs(report.incomeTaxExpense) > 0.01) {
      currentRow = this.addCalculatedRow(
        worksheet,
        'Income Tax Expense',
        report.incomeTaxExpense,
        totalRevenue,
        currentRow
      );
    }

    // === NET PROFIT/LOSS LINE ===
    currentRow = this.addEmptyRow(worksheet, currentRow);
    currentRow = this.addNetProfitLossRow(
      worksheet,
      report.netIncome,
      totalRevenue,
      currentRow
    );

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
      width: 45,
      alignment: 'left',
    });

    columns.push({
      header: 'Amount',
      key: 'amount',
      width: 18,
      numFmt: this.options.currencyFormat,
      alignment: 'right',
    });

    if (this.options.showPercentages) {
      columns.push({
        header: '% of Revenue',
        key: 'percentage',
        width: 14,
        numFmt: '0.0%',
        alignment: 'right',
      });
    }

    return columns;
  }

  /**
   * Add header section with company name, report title, and date range
   */
  private addHeaderSection(
    worksheet: Worksheet,
    report: IncomeStatement,
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

    // Period
    worksheet.mergeCells(`A${startRow}:${lastCol}${startRow}`);
    const periodCell = worksheet.getCell(`A${startRow}`);
    periodCell.value = `For the period: ${this.formatDate(report.startDate)} to ${this.formatDate(report.endDate)}`;
    periodCell.font = { size: 11, color: { argb: '6B7280' } };
    periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
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
        fgColor: { argb: '10B981' }, // Green header
      };
      cell.alignment = {
        horizontal: index === 0 ? 'left' : (header === 'Description' ? 'left' : 'right'),
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
   * Add section header row (e.g., "SALES", "EXPENSES")
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
   * Add account detail rows for a section
   */
  private addSectionAccounts(
    worksheet: Worksheet,
    accounts: AccountBalance[],
    totalRevenue: number,
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
      nameCell.value = '    ' + account.accountName; // Indent with spaces
      nameCell.alignment = { horizontal: 'left' };

      // Amount
      const amountCell = row.getCell(colIndex++);
      amountCell.value = account.balance || null;
      amountCell.numFmt = this.options.currencyFormat;
      amountCell.alignment = { horizontal: 'right' };

      // Percentage (if enabled)
      if (this.options.showPercentages) {
        const pctCell = row.getCell(colIndex++);
        pctCell.value = totalRevenue !== 0 ? Math.abs(account.balance) / Math.abs(totalRevenue) : 0;
        pctCell.numFmt = '0.0%';
        pctCell.alignment = { horizontal: 'right' };
      }

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
   * Add section subtotal row
   */
  private addSectionSubtotal(
    worksheet: Worksheet,
    label: string,
    amount: number,
    totalRevenue: number,
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

    // Percentage (if enabled)
    if (this.options.showPercentages) {
      const pctCell = row.getCell(colIndex++);
      pctCell.value = totalRevenue !== 0 ? Math.abs(amount) / Math.abs(totalRevenue) : 0;
      pctCell.numFmt = '0.0%';
      pctCell.font = { bold: true };
      pctCell.alignment = { horizontal: 'right' };
      pctCell.border = { top: { style: 'thin' } };
      pctCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SECTION_COLORS.subtotal },
      };
    }

    row.commit();
    return rowNumber + 1;
  }

  /**
   * Add expense subsections with category breakdowns
   */
  private addExpenseSubsections(
    worksheet: Worksheet,
    operatingExpenses: FinancialStatementSection,
    totalRevenue: number,
    startRow: number
  ): number {
    let currentRow = startRow;

    // If subsections exist, display them
    if (operatingExpenses.subsections && operatingExpenses.subsections.length > 0) {
      for (const subsection of operatingExpenses.subsections) {
        // Skip empty subsections
        if (subsection.accounts.length === 0 && Math.abs(subsection.subtotal) < 0.01) {
          continue;
        }

        // Add subsection header (lighter styling)
        currentRow = this.addSubsectionHeader(worksheet, subsection.name, currentRow);

        // Add accounts
        currentRow = this.addSectionAccounts(
          worksheet,
          subsection.accounts,
          totalRevenue,
          currentRow
        );

        // Add subsection subtotal (if multiple accounts)
        if (subsection.accounts.length > 1) {
          currentRow = this.addSubsectionSubtotal(
            worksheet,
            `Subtotal: ${subsection.name}`,
            subsection.subtotal,
            totalRevenue,
            currentRow
          );
        }
      }
    } else {
      // Just show all expense accounts
      currentRow = this.addSectionAccounts(
        worksheet,
        operatingExpenses.accounts,
        totalRevenue,
        currentRow
      );
    }

    return currentRow;
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
   * Add subsection subtotal (lighter styling)
   */
  private addSubsectionSubtotal(
    worksheet: Worksheet,
    label: string,
    amount: number,
    totalRevenue: number,
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

    // Percentage (if enabled)
    if (this.options.showPercentages) {
      const pctCell = row.getCell(colIndex++);
      pctCell.value = totalRevenue !== 0 ? Math.abs(amount) / Math.abs(totalRevenue) : 0;
      pctCell.numFmt = '0.0%';
      pctCell.font = { italic: true };
      pctCell.alignment = { horizontal: 'right' };
    }

    row.commit();
    return rowNumber + 1;
  }

  /**
   * Add grand total row (e.g., GROSS PROFIT, OPERATING PROFIT)
   */
  private addGrandTotalRow(
    worksheet: Worksheet,
    label: string,
    amount: number,
    totalRevenue: number,
    rowNumber: number,
    isPositive: boolean
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
      color: { argb: isPositive ? FONT_COLORS.profit : FONT_COLORS.loss },
    };
    labelCell.alignment = { horizontal: 'right' };

    // Amount
    const amountCell = row.getCell(colIndex++);
    amountCell.value = amount;
    amountCell.numFmt = this.options.currencyFormat;
    amountCell.font = {
      bold: true,
      size: 12,
      color: { argb: isPositive ? FONT_COLORS.profit : FONT_COLORS.loss },
    };
    amountCell.alignment = { horizontal: 'right' };
    amountCell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
    };
    amountCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isPositive ? SECTION_COLORS.profit : SECTION_COLORS.loss },
    };

    // Percentage (if enabled)
    if (this.options.showPercentages) {
      const pctCell = row.getCell(colIndex++);
      pctCell.value = totalRevenue !== 0 ? Math.abs(amount) / Math.abs(totalRevenue) : 0;
      pctCell.numFmt = '0.0%';
      pctCell.font = {
        bold: true,
        size: 12,
        color: { argb: isPositive ? FONT_COLORS.profit : FONT_COLORS.loss },
      };
      pctCell.alignment = { horizontal: 'right' };
      pctCell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
      };
      pctCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isPositive ? SECTION_COLORS.profit : SECTION_COLORS.loss },
      };
    }

    row.height = 25;
    row.commit();
    return rowNumber + 1;
  }

  /**
   * Add calculated row (intermediate calculations)
   */
  private addCalculatedRow(
    worksheet: Worksheet,
    label: string,
    amount: number,
    totalRevenue: number,
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
    labelCell.font = { bold: true, size: 11 };
    labelCell.alignment = { horizontal: 'right' };

    // Amount
    const amountCell = row.getCell(colIndex++);
    amountCell.value = amount;
    amountCell.numFmt = this.options.currencyFormat;
    amountCell.font = { bold: true };
    amountCell.alignment = { horizontal: 'right' };

    // Percentage (if enabled)
    if (this.options.showPercentages) {
      const pctCell = row.getCell(colIndex++);
      pctCell.value = totalRevenue !== 0 ? Math.abs(amount) / Math.abs(totalRevenue) : 0;
      pctCell.numFmt = '0.0%';
      pctCell.font = { bold: true };
      pctCell.alignment = { horizontal: 'right' };
    }

    row.commit();
    return rowNumber + 1;
  }

  /**
   * Add Net Profit/Loss row (final calculation)
   */
  private addNetProfitLossRow(
    worksheet: Worksheet,
    netIncome: number,
    totalRevenue: number,
    rowNumber: number
  ): number {
    const isProfit = netIncome >= 0;
    const label = isProfit ? 'NET PROFIT' : 'NET LOSS';

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
      size: 14,
      color: { argb: isProfit ? FONT_COLORS.profit : FONT_COLORS.loss },
    };
    labelCell.alignment = { horizontal: 'right' };

    // Amount
    const amountCell = row.getCell(colIndex++);
    amountCell.value = Math.abs(netIncome);
    amountCell.numFmt = this.options.currencyFormat;
    amountCell.font = {
      bold: true,
      size: 14,
      color: { argb: isProfit ? FONT_COLORS.profit : FONT_COLORS.loss },
    };
    amountCell.alignment = { horizontal: 'right' };
    amountCell.border = {
      top: { style: 'double' },
      bottom: { style: 'double' },
    };
    amountCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isProfit ? SECTION_COLORS.profit : SECTION_COLORS.loss },
    };

    // Percentage (if enabled)
    if (this.options.showPercentages) {
      const pctCell = row.getCell(colIndex++);
      pctCell.value = totalRevenue !== 0 ? Math.abs(netIncome) / Math.abs(totalRevenue) : 0;
      pctCell.numFmt = '0.0%';
      pctCell.font = {
        bold: true,
        size: 14,
        color: { argb: isProfit ? FONT_COLORS.profit : FONT_COLORS.loss },
      };
      pctCell.alignment = { horizontal: 'right' };
      pctCell.border = {
        top: { style: 'double' },
        bottom: { style: 'double' },
      };
      pctCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isProfit ? SECTION_COLORS.profit : SECTION_COLORS.loss },
      };
    }

    row.height = 30;
    row.commit();
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
   * Note: The report parameter is reserved for future enhancements (e.g., conditional formatting)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private applyISStyling(worksheet: Worksheet, report: IncomeStatement): void {
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
   * Get Sales accounts (4000-4199 typically - Sales Revenue + Service Revenue)
   */
  private getSalesAccounts(revenue: FinancialStatementSection): AccountBalance[] {
    // If we have subsections, return Sales + Service Revenue accounts
    if (revenue.subsections && revenue.subsections.length > 0) {
      const salesAccounts: AccountBalance[] = [];
      for (const subsection of revenue.subsections) {
        if (subsection.name === 'Sales Revenue' || subsection.name === 'Service Revenue') {
          salesAccounts.push(...subsection.accounts);
        }
      }
      return salesAccounts;
    }

    // Otherwise, filter by account code range
    return revenue.accounts.filter((acc) => {
      const code = parseInt(acc.accountCode);
      return !isNaN(code) && code >= 4000 && code < 4200;
    });
  }

  /**
   * Get total for Sales (not including Other Revenue)
   */
  private getSalesTotal(revenue: FinancialStatementSection): number {
    if (revenue.subsections && revenue.subsections.length > 0) {
      let total = 0;
      for (const subsection of revenue.subsections) {
        if (subsection.name === 'Sales Revenue' || subsection.name === 'Service Revenue') {
          total += subsection.subtotal;
        }
      }
      return total;
    }

    // Calculate from accounts
    return this.getSalesAccounts(revenue).reduce((sum, acc) => sum + acc.balance, 0);
  }

  /**
   * Get Other Income accounts (4200-4999 typically)
   */
  private getOtherIncomeAccounts(revenue: FinancialStatementSection): AccountBalance[] {
    if (revenue.subsections && revenue.subsections.length > 0) {
      const otherAccounts: AccountBalance[] = [];
      for (const subsection of revenue.subsections) {
        if (subsection.name === 'Other Revenue') {
          otherAccounts.push(...subsection.accounts);
        }
      }
      return otherAccounts;
    }

    // Otherwise, filter by account code range
    return revenue.accounts.filter((acc) => {
      const code = parseInt(acc.accountCode);
      return !isNaN(code) && code >= 4200 && code < 5000;
    });
  }

  /**
   * Get total for Other Income
   */
  private getOtherIncomeTotal(revenue: FinancialStatementSection): number {
    if (revenue.subsections && revenue.subsections.length > 0) {
      for (const subsection of revenue.subsections) {
        if (subsection.name === 'Other Revenue') {
          return subsection.subtotal;
        }
      }
      return 0;
    }

    return this.getOtherIncomeAccounts(revenue).reduce((sum, acc) => sum + acc.balance, 0);
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
    if (this.options.showPercentages) count++;
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
    if (this.options.showPercentages) headers.push('% of Revenue');
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
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create an Income Statement Excel formatter instance
 * @param options - Formatter options
 * @returns ISExcelFormatter instance
 */
export function createISExcelFormatter(
  options?: ISExcelFormatterOptions
): ISExcelFormatter {
  return new ISExcelFormatter(options);
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick export of Income Statement to Excel
 * @param report - Income Statement report data
 * @param options - Formatter options
 * @param filename - Optional filename (default: income-statement-YYYY-MM-DD-to-YYYY-MM-DD)
 */
export async function exportIncomeStatementToExcel(
  report: IncomeStatement,
  options?: ISExcelFormatterOptions,
  filename?: string
): Promise<void> {
  const formatter = createISExcelFormatter(options);
  await formatter.downloadIncomeStatementExcel(report, filename);
}

/**
 * Get Income Statement Excel as Blob
 * @param report - Income Statement report data
 * @param options - Formatter options
 * @returns Promise<Blob>
 */
export async function getIncomeStatementExcelBlob(
  report: IncomeStatement,
  options?: ISExcelFormatterOptions
): Promise<Blob> {
  const formatter = createISExcelFormatter(options);
  return formatter.getIncomeStatementExcelBlob(report);
}
