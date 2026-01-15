/**
 * General Ledger Excel Formatter
 * Formats General Ledger report data for Excel export using ExcelJS
 *
 * Template Structure:
 * - Header: Company Name, Report Title, Account Code/Name, Period, Prepared By
 * - Monthly sections with:
 *   - Opening Balance row
 *   - Transaction rows: Date | Entry Type | Reference | Contra Acc | Description | Debit | Credit | Cumulative
 *   - Closing Balance row
 * - Report Summary:
 *   - Total Debits
 *   - Total Credits
 *   - Net Movement
 *   - Opening Balance
 *   - Closing Balance
 *
 * Features:
 * - Monthly grouping with section headers
 * - Opening/closing balances per month
 * - Entry type classification (Journal Entry, Bank Import, AR Invoice, etc.)
 * - Contra account display
 * - Running cumulative balance
 * - Summary statistics at end
 * - Proper Excel formatting (bold headers, currency formatting, section spacing)
 */

import { excelService, type ColumnDefinition } from '@/lib/excel';
import type { FormattedGLReport, FormattedGLEntry, FormattedGLMonthlySection } from './gl-reports-service';
import type { Workbook, Worksheet } from 'exceljs';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Options for formatting the General Ledger Excel export
 */
export interface GLExcelFormatterOptions {
  /** Company name for header */
  companyName?: string;
  /** Report title (default: "General Ledger") */
  reportTitle?: string;
  /** Include entry type column (default: true) */
  includeEntryType?: boolean;
  /** Include contra account column (default: true) */
  includeContraAccount?: boolean;
  /** Include reference column (default: true) */
  includeReference?: boolean;
  /** Currency format (default: ZAR) */
  currencyFormat?: string;
  /** Show monthly subtotals (default: true) */
  showMonthlySubtotals?: boolean;
  /** Show report summary (default: true) */
  showReportSummary?: boolean;
}

/**
 * Formatted GL line for Excel output
 */
export interface FormattedGLLine {
  date: string;
  entryType?: string;
  reference?: string;
  contraAccount?: string;
  description: string;
  debit: number | null;
  credit: number | null;
  cumulative: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Section styling colors */
const SECTION_COLORS = {
  monthHeader: '1E3A8A', // Dark blue for month headers
  openingBalance: 'E0E7FF', // Light indigo for opening balance
  closingBalance: 'C7D2FE', // Slightly darker indigo for closing balance
  subtotal: 'F3F4F6', // Light gray for subtotals
  summary: 'FEF3C7', // Light yellow for summary section
};

/** Font colors */
const FONT_COLORS = {
  monthHeader: 'FFFFFF', // White for month headers
  openingBalance: '3730A3', // Dark indigo
  closingBalance: '3730A3', // Dark indigo
  normal: '1F2937', // Dark gray
  positive: '166534', // Green for positive balances
  negative: 'DC2626', // Red for negative balances
};

// ============================================================================
// GENERAL LEDGER EXCEL FORMATTER CLASS
// ============================================================================

export class GLExcelFormatter {
  private options: Required<GLExcelFormatterOptions>;

  constructor(options: GLExcelFormatterOptions = {}) {
    this.options = {
      companyName: options.companyName || 'Company Name',
      reportTitle: options.reportTitle || 'General Ledger',
      includeEntryType: options.includeEntryType ?? true,
      includeContraAccount: options.includeContraAccount ?? true,
      includeReference: options.includeReference ?? true,
      currencyFormat: options.currencyFormat || excelService.CURRENCY_FORMAT_ZAR,
      showMonthlySubtotals: options.showMonthlySubtotals ?? true,
      showReportSummary: options.showReportSummary ?? true,
    };
  }

  /**
   * Format General Ledger report for Excel export
   * @param report - Formatted GL report data
   * @returns Excel workbook ready for download
   */
  async formatGeneralLedgerToExcel(report: FormattedGLReport): Promise<Workbook> {
    const workbook = excelService.createWorkbook();

    // Create the General Ledger worksheet
    const worksheet = this.createGLWorksheet(workbook, report);

    // Apply final styling
    this.applyGLStyling(worksheet, report);

    return workbook;
  }

  /**
   * Download General Ledger as Excel file
   * @param report - Formatted GL report data
   * @param filename - Output filename (without .xlsx extension)
   */
  async downloadGeneralLedgerExcel(
    report: FormattedGLReport,
    filename?: string
  ): Promise<void> {
    const workbook = await this.formatGeneralLedgerToExcel(report);
    const defaultFilename = `general-ledger-${report.accountCode}-${this.formatDateForFilename(report.reportPeriod.startDate)}-to-${this.formatDateForFilename(report.reportPeriod.endDate)}`;
    await excelService.downloadExcel(workbook, filename || defaultFilename);
  }

  /**
   * Get General Ledger Excel as Blob (for storage/upload)
   * @param report - Formatted GL report data
   * @returns Promise<Blob>
   */
  async getGeneralLedgerExcelBlob(report: FormattedGLReport): Promise<Blob> {
    const workbook = await this.formatGeneralLedgerToExcel(report);
    return excelService.getExcelBlob(workbook);
  }

  // ==========================================================================
  // PRIVATE METHODS - WORKSHEET CREATION
  // ==========================================================================

  /**
   * Create the General Ledger worksheet with all data
   */
  private createGLWorksheet(
    workbook: Workbook,
    report: FormattedGLReport
  ): Worksheet {
    // Define columns
    const columns: ColumnDefinition[] = this.getColumnDefinitions();

    const worksheet = excelService.addWorksheet(workbook, {
      name: 'General Ledger',
      columns,
      freezeHeader: false, // We'll freeze after adding header rows
      autoFilter: false,
      tabColor: '6366F1', // Indigo tab for GL
    });

    // Add header section
    let currentRow = 1;
    currentRow = this.addHeaderSection(worksheet, report, currentRow);

    // Add column headers
    currentRow = this.addColumnHeaders(worksheet, currentRow);

    // Freeze panes after header row
    worksheet.views = [{ state: 'frozen', ySplit: currentRow }];

    // Add monthly sections
    for (const section of report.monthlySections) {
      currentRow = this.addMonthlySection(worksheet, section, currentRow);
    }

    // Add report summary
    if (this.options.showReportSummary) {
      currentRow = this.addEmptyRow(worksheet, currentRow);
      currentRow = this.addReportSummary(worksheet, report, currentRow);
    }

    return worksheet;
  }

  /**
   * Get column definitions for the worksheet
   */
  private getColumnDefinitions(): ColumnDefinition[] {
    const columns: ColumnDefinition[] = [
      {
        header: 'Date',
        key: 'date',
        width: 12,
        alignment: 'left',
      },
    ];

    if (this.options.includeEntryType) {
      columns.push({
        header: 'Entry Type',
        key: 'entryType',
        width: 15,
        alignment: 'left',
      });
    }

    if (this.options.includeReference) {
      columns.push({
        header: 'Reference',
        key: 'reference',
        width: 18,
        alignment: 'left',
      });
    }

    if (this.options.includeContraAccount) {
      columns.push({
        header: 'Contra Acc',
        key: 'contraAccount',
        width: 18,
        alignment: 'left',
      });
    }

    columns.push(
      {
        header: 'Description',
        key: 'description',
        width: 40,
        alignment: 'left',
      },
      {
        header: 'Debit',
        key: 'debit',
        width: 16,
        numFmt: this.options.currencyFormat,
        alignment: 'right',
      },
      {
        header: 'Credit',
        key: 'credit',
        width: 16,
        numFmt: this.options.currencyFormat,
        alignment: 'right',
      },
      {
        header: 'Cumulative',
        key: 'cumulative',
        width: 18,
        numFmt: this.options.currencyFormat,
        alignment: 'right',
      }
    );

    return columns;
  }

  /**
   * Add header section with company name, report title, account info, and period
   */
  private addHeaderSection(
    worksheet: Worksheet,
    report: FormattedGLReport,
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

    // Account code and name
    worksheet.mergeCells(`A${startRow}:${lastCol}${startRow}`);
    const accountCell = worksheet.getCell(`A${startRow}`);
    accountCell.value = `Account: ${report.accountCode} - ${report.accountName}`;
    accountCell.font = { bold: true, size: 12, color: { argb: '4B5563' } };
    accountCell.alignment = { horizontal: 'center', vertical: 'middle' };
    startRow++;

    // Period
    worksheet.mergeCells(`A${startRow}:${lastCol}${startRow}`);
    const periodCell = worksheet.getCell(`A${startRow}`);
    periodCell.value = `Period: ${this.formatDate(report.reportPeriod.startDate)} to ${this.formatDate(report.reportPeriod.endDate)}`;
    periodCell.font = { size: 11, color: { argb: '6B7280' } };
    periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
    startRow++;

    // Prepared by
    worksheet.mergeCells(`A${startRow}:${lastCol}${startRow}`);
    const preparedCell = worksheet.getCell(`A${startRow}`);
    preparedCell.value = `Prepared by: ${report.preparedBy}`;
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
        fgColor: { argb: '6366F1' }, // Indigo header
      };
      cell.alignment = {
        horizontal: this.getHeaderAlignment(header),
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
   * Add a monthly section with header, entries, and closing balance
   */
  private addMonthlySection(
    worksheet: Worksheet,
    section: FormattedGLMonthlySection,
    startRow: number
  ): number {
    let currentRow = startRow;

    // Add month header
    currentRow = this.addMonthHeader(worksheet, section.monthLabel, currentRow);

    // Add opening balance row
    currentRow = this.addOpeningBalanceRow(worksheet, section.openingBalance, currentRow);

    // Add transaction rows
    for (const entry of section.entries) {
      currentRow = this.addTransactionRow(worksheet, entry, currentRow);
    }

    // Add closing balance row
    currentRow = this.addClosingBalanceRow(worksheet, section.closingBalance, currentRow);

    // Add monthly subtotals if enabled
    if (this.options.showMonthlySubtotals && section.entries.length > 0) {
      currentRow = this.addMonthlySubtotals(
        worksheet,
        section.periodDebits,
        section.periodCredits,
        currentRow
      );
    }

    // Add spacing between months
    currentRow = this.addEmptyRow(worksheet, currentRow);

    return currentRow;
  }

  /**
   * Add month header row (e.g., "January 2025")
   */
  private addMonthHeader(
    worksheet: Worksheet,
    monthLabel: string,
    rowNumber: number
  ): number {
    const columnCount = this.getColumnCount();
    const lastCol = excelService.getColumnLetter(columnCount);

    worksheet.mergeCells(`A${rowNumber}:${lastCol}${rowNumber}`);
    const cell = worksheet.getCell(`A${rowNumber}`);
    cell.value = monthLabel;
    cell.font = { bold: true, size: 11, color: { argb: FONT_COLORS.monthHeader } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SECTION_COLORS.monthHeader },
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
   * Add opening balance row
   */
  private addOpeningBalanceRow(
    worksheet: Worksheet,
    openingBalance: number,
    rowNumber: number
  ): number {
    const row = worksheet.getRow(rowNumber);
    const columnCount = this.getColumnCount();

    // Fill entire row with opening balance background
    for (let i = 1; i <= columnCount; i++) {
      row.getCell(i).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SECTION_COLORS.openingBalance },
      };
    }

    // Date column - empty
    let colIndex = 1;
    row.getCell(colIndex++).value = '';

    // Entry Type column - "Opening Balance"
    if (this.options.includeEntryType) {
      const cell = row.getCell(colIndex++);
      cell.value = 'Opening Balance';
      cell.font = { bold: true, italic: true, color: { argb: FONT_COLORS.openingBalance } };
    }

    // Reference column - empty
    if (this.options.includeReference) {
      row.getCell(colIndex++).value = '';
    }

    // Contra Account column - empty
    if (this.options.includeContraAccount) {
      row.getCell(colIndex++).value = '';
    }

    // Description column
    const descCell = row.getCell(colIndex++);
    descCell.value = 'Balance brought forward';
    descCell.font = { italic: true, color: { argb: FONT_COLORS.openingBalance } };

    // Debit column - empty
    row.getCell(colIndex++).value = null;

    // Credit column - empty
    row.getCell(colIndex++).value = null;

    // Cumulative column
    const cumCell = row.getCell(colIndex++);
    cumCell.value = openingBalance;
    cumCell.numFmt = this.options.currencyFormat;
    cumCell.font = { bold: true, color: { argb: openingBalance >= 0 ? FONT_COLORS.openingBalance : FONT_COLORS.negative } };
    cumCell.alignment = { horizontal: 'right' };

    row.commit();
    return rowNumber + 1;
  }

  /**
   * Add closing balance row
   */
  private addClosingBalanceRow(
    worksheet: Worksheet,
    closingBalance: number,
    rowNumber: number
  ): number {
    const row = worksheet.getRow(rowNumber);
    const columnCount = this.getColumnCount();

    // Fill entire row with closing balance background
    for (let i = 1; i <= columnCount; i++) {
      row.getCell(i).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SECTION_COLORS.closingBalance },
      };
    }

    // Date column - empty
    let colIndex = 1;
    row.getCell(colIndex++).value = '';

    // Entry Type column - "Closing Balance"
    if (this.options.includeEntryType) {
      const cell = row.getCell(colIndex++);
      cell.value = 'Closing Balance';
      cell.font = { bold: true, italic: true, color: { argb: FONT_COLORS.closingBalance } };
    }

    // Reference column - empty
    if (this.options.includeReference) {
      row.getCell(colIndex++).value = '';
    }

    // Contra Account column - empty
    if (this.options.includeContraAccount) {
      row.getCell(colIndex++).value = '';
    }

    // Description column
    const descCell = row.getCell(colIndex++);
    descCell.value = 'Balance carried forward';
    descCell.font = { italic: true, color: { argb: FONT_COLORS.closingBalance } };

    // Debit column - empty
    row.getCell(colIndex++).value = null;

    // Credit column - empty
    row.getCell(colIndex++).value = null;

    // Cumulative column
    const cumCell = row.getCell(colIndex++);
    cumCell.value = closingBalance;
    cumCell.numFmt = this.options.currencyFormat;
    cumCell.font = { bold: true, color: { argb: closingBalance >= 0 ? FONT_COLORS.closingBalance : FONT_COLORS.negative } };
    cumCell.alignment = { horizontal: 'right' };

    row.commit();
    return rowNumber + 1;
  }

  /**
   * Add transaction row
   */
  private addTransactionRow(
    worksheet: Worksheet,
    entry: FormattedGLEntry,
    rowNumber: number
  ): number {
    const row = worksheet.getRow(rowNumber);
    let colIndex = 1;

    // Date
    const dateCell = row.getCell(colIndex++);
    dateCell.value = this.formatDateShort(entry.date);
    dateCell.alignment = { horizontal: 'left' };

    // Entry Type
    if (this.options.includeEntryType) {
      const cell = row.getCell(colIndex++);
      cell.value = entry.entryType;
      cell.alignment = { horizontal: 'left' };
    }

    // Reference
    if (this.options.includeReference) {
      const cell = row.getCell(colIndex++);
      cell.value = entry.reference || '';
      cell.alignment = { horizontal: 'left' };
    }

    // Contra Account
    if (this.options.includeContraAccount) {
      const cell = row.getCell(colIndex++);
      cell.value = entry.contraAccount || '-';
      cell.alignment = { horizontal: 'left' };
    }

    // Description
    const descCell = row.getCell(colIndex++);
    descCell.value = entry.description;
    descCell.alignment = { horizontal: 'left' };

    // Debit
    const debitCell = row.getCell(colIndex++);
    debitCell.value = entry.debit || null;
    debitCell.numFmt = this.options.currencyFormat;
    debitCell.alignment = { horizontal: 'right' };

    // Credit
    const creditCell = row.getCell(colIndex++);
    creditCell.value = entry.credit || null;
    creditCell.numFmt = this.options.currencyFormat;
    creditCell.alignment = { horizontal: 'right' };

    // Cumulative
    const cumCell = row.getCell(colIndex++);
    cumCell.value = entry.cumulative;
    cumCell.numFmt = this.options.currencyFormat;
    cumCell.alignment = { horizontal: 'right' };
    if (entry.cumulative < 0) {
      cumCell.font = { color: { argb: FONT_COLORS.negative } };
    }

    // Add light bottom border
    for (let i = 1; i <= this.getColumnCount(); i++) {
      row.getCell(i).border = {
        bottom: { style: 'hair', color: { argb: 'E5E7EB' } },
      };
    }

    row.commit();
    return rowNumber + 1;
  }

  /**
   * Add monthly subtotals row
   */
  private addMonthlySubtotals(
    worksheet: Worksheet,
    periodDebits: number,
    periodCredits: number,
    rowNumber: number
  ): number {
    const row = worksheet.getRow(rowNumber);
    const columnCount = this.getColumnCount();

    // Fill with subtotal background
    for (let i = 1; i <= columnCount; i++) {
      row.getCell(i).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SECTION_COLORS.subtotal },
      };
    }

    // Find the description column index
    let colIndex = 1;
    if (this.options.includeEntryType) colIndex++;
    if (this.options.includeReference) colIndex++;
    if (this.options.includeContraAccount) colIndex++;
    colIndex++; // Date column

    // Description column - "Period Totals"
    const descCell = row.getCell(colIndex++);
    descCell.value = 'Period Totals';
    descCell.font = { bold: true, size: 10 };
    descCell.alignment = { horizontal: 'right' };

    // Debit subtotal
    const debitCell = row.getCell(colIndex++);
    debitCell.value = periodDebits;
    debitCell.numFmt = this.options.currencyFormat;
    debitCell.font = { bold: true };
    debitCell.alignment = { horizontal: 'right' };
    debitCell.border = { top: { style: 'thin' } };

    // Credit subtotal
    const creditCell = row.getCell(colIndex++);
    creditCell.value = periodCredits;
    creditCell.numFmt = this.options.currencyFormat;
    creditCell.font = { bold: true };
    creditCell.alignment = { horizontal: 'right' };
    creditCell.border = { top: { style: 'thin' } };

    // Leave cumulative empty for subtotals
    row.getCell(colIndex).value = null;

    row.commit();
    return rowNumber + 1;
  }

  /**
   * Add report summary section at the end
   */
  private addReportSummary(
    worksheet: Worksheet,
    report: FormattedGLReport,
    startRow: number
  ): number {
    let currentRow = startRow;
    const columnCount = this.getColumnCount();
    const lastCol = excelService.getColumnLetter(columnCount);

    // Summary header
    worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
    const headerCell = worksheet.getCell(`A${currentRow}`);
    headerCell.value = 'REPORT SUMMARY';
    headerCell.font = { bold: true, size: 12, color: { argb: '1F2937' } };
    headerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: SECTION_COLORS.summary },
    };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    headerCell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
    };
    worksheet.getRow(currentRow).height = 25;
    currentRow++;

    // Summary rows
    const summaryItems = [
      { label: 'Opening Balance', value: report.openingBalance },
      { label: 'Total Debits', value: report.totalDebits },
      { label: 'Total Credits', value: report.totalCredits },
      { label: 'Net Movement', value: report.netMovement },
      { label: 'Closing Balance', value: report.closingBalance },
    ];

    for (const item of summaryItems) {
      currentRow = this.addSummaryRow(worksheet, item.label, item.value, currentRow);
    }

    return currentRow;
  }

  /**
   * Add a single summary row
   */
  private addSummaryRow(
    worksheet: Worksheet,
    label: string,
    value: number,
    rowNumber: number
  ): number {
    const row = worksheet.getRow(rowNumber);
    const columnCount = this.getColumnCount();

    // Label in description column position
    let labelColIndex = 1;
    if (this.options.includeEntryType) labelColIndex++;
    if (this.options.includeReference) labelColIndex++;
    if (this.options.includeContraAccount) labelColIndex++;
    labelColIndex++; // Date column

    const labelCell = row.getCell(labelColIndex);
    labelCell.value = label;
    labelCell.font = { bold: label === 'Closing Balance', size: label === 'Closing Balance' ? 11 : 10 };
    labelCell.alignment = { horizontal: 'right' };

    // Value in cumulative column
    const valueColIndex = columnCount;
    const valueCell = row.getCell(valueColIndex);
    valueCell.value = value;
    valueCell.numFmt = this.options.currencyFormat;
    valueCell.font = {
      bold: label === 'Closing Balance',
      size: label === 'Closing Balance' ? 11 : 10,
      color: { argb: value < 0 ? FONT_COLORS.negative : FONT_COLORS.normal },
    };
    valueCell.alignment = { horizontal: 'right' };

    // Special styling for closing balance
    if (label === 'Closing Balance') {
      valueCell.border = {
        top: { style: 'double' },
        bottom: { style: 'double' },
      };
      valueCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: SECTION_COLORS.summary },
      };
    }

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
   */
  private applyGLStyling(worksheet: Worksheet, _report: FormattedGLReport): void {
    // Set print setup
    const columnCount = this.getColumnCount();
    const lastCol = excelService.getColumnLetter(columnCount);
    const lastRow = worksheet.rowCount;

    excelService.setPrintSetup(worksheet, lastCol, lastRow);
  }

  // ==========================================================================
  // PRIVATE METHODS - UTILITIES
  // ==========================================================================

  /**
   * Get number of columns based on options
   */
  private getColumnCount(): number {
    let count = 5; // Date, Description, Debit, Credit, Cumulative
    if (this.options.includeEntryType) count++;
    if (this.options.includeReference) count++;
    if (this.options.includeContraAccount) count++;
    return count;
  }

  /**
   * Get header labels based on options
   */
  private getHeaderLabels(): string[] {
    const headers: string[] = ['Date'];
    if (this.options.includeEntryType) headers.push('Entry Type');
    if (this.options.includeReference) headers.push('Reference');
    if (this.options.includeContraAccount) headers.push('Contra Acc');
    headers.push('Description', 'Debit', 'Credit', 'Cumulative');
    return headers;
  }

  /**
   * Get column alignment based on header name
   */
  private getHeaderAlignment(header: string): 'left' | 'center' | 'right' {
    if (['Debit', 'Credit', 'Cumulative'].includes(header)) {
      return 'right';
    }
    return 'left';
  }

  /**
   * Format date for display (long format)
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
   * Format date for display (short format)
   */
  private formatDateShort(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
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
 * Create a General Ledger Excel formatter instance
 * @param options - Formatter options
 * @returns GLExcelFormatter instance
 */
export function createGLExcelFormatter(
  options?: GLExcelFormatterOptions
): GLExcelFormatter {
  return new GLExcelFormatter(options);
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick export of General Ledger to Excel
 * @param report - Formatted GL report data
 * @param options - Formatter options
 * @param filename - Optional filename (default: general-ledger-XXXX-YYYY-MM-DD-to-YYYY-MM-DD)
 */
export async function exportGeneralLedgerToExcel(
  report: FormattedGLReport,
  options?: GLExcelFormatterOptions,
  filename?: string
): Promise<void> {
  const formatter = createGLExcelFormatter(options);
  await formatter.downloadGeneralLedgerExcel(report, filename);
}

/**
 * Get General Ledger Excel as Blob
 * @param report - Formatted GL report data
 * @param options - Formatter options
 * @returns Promise<Blob>
 */
export async function getGeneralLedgerExcelBlob(
  report: FormattedGLReport,
  options?: GLExcelFormatterOptions
): Promise<Blob> {
  const formatter = createGLExcelFormatter(options);
  return formatter.getGeneralLedgerExcelBlob(report);
}
