/**
 * Centralized Excel Export Service
 * Handles Excel workbook creation and export with styling support
 * Mirrors the architecture of pdf.service.ts
 *
 * Features:
 * - Workbook creation and management
 * - Styled headers with background colors, bold fonts
 * - Auto-width and custom column widths
 * - Currency and number formatting for financial data
 * - Company branding support (name/logo in headers)
 * - Browser download and Blob/Buffer export
 */

import * as ExcelJS from 'exceljs';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Options for creating a new worksheet
 */
export interface WorksheetOptions {
  /** Name of the worksheet (appears on tab) */
  name: string;
  /** Column definitions with header text and optional width */
  columns?: ColumnDefinition[];
  /** Whether to freeze the header row */
  freezeHeader?: boolean;
  /** Whether to apply auto-filter to header row */
  autoFilter?: boolean;
  /** Tab color (hex without #) */
  tabColor?: string;
}

/**
 * Column definition for worksheet setup
 */
export interface ColumnDefinition {
  /** Header text displayed in first row */
  header: string;
  /** Key for data mapping (used with addRows) */
  key: string;
  /** Column width (in characters). If not set, auto-width is calculated */
  width?: number;
  /** Number format for the column (e.g., '#,##0.00' for currency) */
  numFmt?: string;
  /** Text alignment */
  alignment?: 'left' | 'center' | 'right';
}

/**
 * Header style configuration
 */
export interface HeaderStyle {
  /** Background color (hex without #) */
  backgroundColor?: string;
  /** Font color (hex without #) */
  fontColor?: string;
  /** Whether header text should be bold */
  bold?: boolean;
  /** Font size */
  fontSize?: number;
  /** Border style */
  border?: boolean;
}

/**
 * Company branding options for Excel exports
 */
export interface ExcelBrandingOptions {
  /** Company name to display in header */
  companyName: string;
  /** Company address */
  companyAddress?: string;
  /** Company phone number */
  companyPhone?: string;
  /** Company email */
  companyEmail?: string;
  /** Company VAT number */
  companyVatNumber?: string;
  /** Logo as base64 data URL (currently limited support in ExcelJS) */
  logoDataUrl?: string;
}

/**
 * Cell value type that ExcelJS accepts
 */
export type CellValue = string | number | boolean | Date | null | undefined;

/**
 * Row data type - can be array of values or object with column keys
 */
export type RowData = CellValue[] | Record<string, CellValue>;

// ============================================================================
// EXCEL SERVICE
// ============================================================================

export class ExcelService {
  /**
   * Default header style configuration
   */
  private defaultHeaderStyle: HeaderStyle = {
    backgroundColor: '4472C4', // Blue
    fontColor: 'FFFFFF',
    bold: true,
    fontSize: 11,
    border: true,
  };

  /**
   * Currency format for South African Rand
   */
  public readonly CURRENCY_FORMAT_ZAR = 'R #,##0.00';

  /**
   * Standard number format with thousands separator
   */
  public readonly NUMBER_FORMAT = '#,##0.00';

  /**
   * Date format
   */
  public readonly DATE_FORMAT = 'YYYY-MM-DD';

  /**
   * DateTime format
   */
  public readonly DATETIME_FORMAT = 'YYYY-MM-DD HH:mm';

  /**
   * Create a new Excel workbook
   * @returns ExcelJS Workbook instance
   */
  createWorkbook(): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();

    // Set workbook properties
    workbook.creator = 'Peakflow';
    workbook.lastModifiedBy = 'Peakflow';
    workbook.created = new Date();
    workbook.modified = new Date();

    return workbook;
  }

  /**
   * Add a worksheet to an existing workbook with optional configuration
   * @param workbook - The workbook to add the worksheet to
   * @param options - Worksheet configuration options
   * @returns The created worksheet
   */
  addWorksheet(workbook: ExcelJS.Workbook, options: WorksheetOptions): ExcelJS.Worksheet {
    const worksheet = workbook.addWorksheet(options.name, {
      properties: {
        tabColor: options.tabColor ? { argb: options.tabColor } : undefined,
      },
    });

    // Set up columns if provided
    if (options.columns && options.columns.length > 0) {
      worksheet.columns = options.columns.map((col) => ({
        header: col.header,
        key: col.key,
        width: col.width || this.calculateColumnWidth(col.header),
        style: {
          numFmt: col.numFmt,
          alignment: col.alignment
            ? { horizontal: col.alignment }
            : undefined,
        },
      }));
    }

    // Freeze header row if requested
    if (options.freezeHeader !== false) {
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    // Apply auto-filter if requested
    if (options.autoFilter && options.columns) {
      const lastColumn = this.getColumnLetter(options.columns.length);
      worksheet.autoFilter = {
        from: 'A1',
        to: `${lastColumn}1`,
      };
    }

    return worksheet;
  }

  /**
   * Apply styled header to the first row of a worksheet
   * @param worksheet - The worksheet to style
   * @param style - Header style options (uses defaults if not provided)
   */
  applyHeaderStyle(worksheet: ExcelJS.Worksheet, style?: Partial<HeaderStyle>): void {
    const mergedStyle = { ...this.defaultHeaderStyle, ...style };
    const headerRow = worksheet.getRow(1);

    headerRow.eachCell((cell) => {
      // Background fill
      if (mergedStyle.backgroundColor) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: mergedStyle.backgroundColor },
        };
      }

      // Font styling
      cell.font = {
        bold: mergedStyle.bold,
        size: mergedStyle.fontSize,
        color: mergedStyle.fontColor ? { argb: mergedStyle.fontColor } : undefined,
      };

      // Border
      if (mergedStyle.border) {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }

      // Center alignment for headers
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };
    });

    // Set row height for header
    headerRow.height = 25;
  }

  /**
   * Add data rows to a worksheet
   * @param worksheet - The worksheet to add rows to
   * @param rows - Array of row data (arrays or objects with column keys)
   * @param startRow - Starting row number (default: 2, after header)
   */
  addRows(
    worksheet: ExcelJS.Worksheet,
    rows: RowData[],
    startRow: number = 2
  ): void {
    rows.forEach((rowData, index) => {
      const row = worksheet.getRow(startRow + index);

      if (Array.isArray(rowData)) {
        rowData.forEach((value, colIndex) => {
          row.getCell(colIndex + 1).value = value;
        });
      } else {
        // Object with column keys
        const columns = worksheet.columns;
        columns.forEach((col, colIndex) => {
          if (col.key && rowData[col.key] !== undefined) {
            row.getCell(colIndex + 1).value = rowData[col.key];
          }
        });
      }

      row.commit();
    });
  }

  /**
   * Apply currency formatting to a column
   * @param worksheet - The worksheet
   * @param columnKey - The column key or letter (e.g., 'amount' or 'D')
   * @param format - Number format string (default: ZAR currency format)
   */
  applyCurrencyFormat(
    worksheet: ExcelJS.Worksheet,
    columnKey: string,
    format: string = this.CURRENCY_FORMAT_ZAR
  ): void {
    const column = worksheet.getColumn(columnKey);
    column.numFmt = format;
  }

  /**
   * Auto-fit column widths based on content
   * @param worksheet - The worksheet to adjust
   * @param minWidth - Minimum column width (default: 10)
   * @param maxWidth - Maximum column width (default: 50)
   */
  autoFitColumns(
    worksheet: ExcelJS.Worksheet,
    minWidth: number = 10,
    maxWidth: number = 50
  ): void {
    worksheet.columns.forEach((column) => {
      let maxLength = column.header ? column.header.toString().length : minWidth;

      column.eachCell?.({ includeEmpty: false }, (cell) => {
        const cellValue = cell.value?.toString() || '';
        maxLength = Math.max(maxLength, cellValue.length);
      });

      // Apply width with constraints
      column.width = Math.min(Math.max(maxLength + 2, minWidth), maxWidth);
    });
  }

  /**
   * Add company branding header rows to worksheet
   * @param worksheet - The worksheet
   * @param options - Branding options
   * @param columnCount - Number of columns to merge for header
   * @returns Number of rows added (for data offset calculation)
   */
  addBrandingHeader(
    worksheet: ExcelJS.Worksheet,
    options: ExcelBrandingOptions,
    columnCount: number
  ): number {
    let rowsAdded = 0;
    const lastCol = this.getColumnLetter(columnCount);

    // Company name row
    worksheet.insertRow(1, [options.companyName]);
    worksheet.mergeCells(`A1:${lastCol}1`);
    const companyCell = worksheet.getCell('A1');
    companyCell.font = { bold: true, size: 16, color: { argb: '1F2937' } };
    companyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;
    rowsAdded++;

    // Contact info row (if any contact details provided)
    const contactParts: string[] = [];
    if (options.companyAddress) contactParts.push(options.companyAddress);
    if (options.companyPhone) contactParts.push(`Tel: ${options.companyPhone}`);
    if (options.companyEmail) contactParts.push(options.companyEmail);
    if (options.companyVatNumber) contactParts.push(`VAT: ${options.companyVatNumber}`);

    if (contactParts.length > 0) {
      worksheet.insertRow(2, [contactParts.join(' | ')]);
      worksheet.mergeCells(`A2:${lastCol}2`);
      const contactCell = worksheet.getCell('A2');
      contactCell.font = { size: 10, color: { argb: '6B7280' } };
      contactCell.alignment = { horizontal: 'center', vertical: 'middle' };
      rowsAdded++;
    }

    // Empty row for spacing
    worksheet.insertRow(rowsAdded + 1, []);
    rowsAdded++;

    return rowsAdded;
  }

  /**
   * Download workbook as Excel file in browser
   * @param workbook - The workbook to download
   * @param filename - Output filename (without .xlsx extension)
   */
  async downloadExcel(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
    try {
      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // Create blob
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.xlsx`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('Excel file downloaded:', filename);
    } catch (error) {
      console.error('Error downloading Excel file:', error);
      throw error;
    }
  }

  /**
   * Get workbook as Blob (for storage/upload)
   * @param workbook - The workbook to convert
   * @returns Promise<Blob>
   */
  async getExcelBlob(workbook: ExcelJS.Workbook): Promise<Blob> {
    try {
      const buffer = await workbook.xlsx.writeBuffer();
      return new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    } catch (error) {
      console.error('Error getting Excel blob:', error);
      throw error;
    }
  }

  /**
   * Get workbook as Buffer (for server-side use)
   * @param workbook - The workbook to convert
   * @returns Promise<Buffer>
   */
  async getExcelBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
    try {
      const arrayBuffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Error getting Excel buffer:', error);
      throw error;
    }
  }

  /**
   * Get workbook as base64 string
   * @param workbook - The workbook to convert
   * @returns Promise<string>
   */
  async getExcelBase64(workbook: ExcelJS.Workbook): Promise<string> {
    try {
      const buffer = await this.getExcelBuffer(workbook);
      return buffer.toString('base64');
    } catch (error) {
      console.error('Error getting Excel base64:', error);
      throw error;
    }
  }

  /**
   * Add alternating row colors (zebra striping) for better readability
   * @param worksheet - The worksheet to style
   * @param startRow - First data row (default: 2)
   * @param endRow - Last data row (if not provided, uses last row with data)
   * @param evenColor - Color for even rows (hex without #, default: light gray)
   */
  addZebraStriping(
    worksheet: ExcelJS.Worksheet,
    startRow: number = 2,
    endRow?: number,
    evenColor: string = 'F9FAFB'
  ): void {
    const lastRow = endRow || worksheet.rowCount;
    const columnCount = worksheet.columnCount;

    for (let rowNum = startRow; rowNum <= lastRow; rowNum++) {
      if (rowNum % 2 === 0) {
        const row = worksheet.getRow(rowNum);
        for (let col = 1; col <= columnCount; col++) {
          const cell = row.getCell(col);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: evenColor },
          };
        }
      }
    }
  }

  /**
   * Add borders to a range of cells
   * @param worksheet - The worksheet
   * @param startRow - Starting row number
   * @param endRow - Ending row number
   * @param startCol - Starting column number
   * @param endCol - Ending column number
   * @param borderStyle - Border style (default: 'thin')
   */
  addBorders(
    worksheet: ExcelJS.Worksheet,
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number,
    borderStyle: 'thin' | 'medium' | 'thick' = 'thin'
  ): void {
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const cell = worksheet.getRow(row).getCell(col);
        cell.border = {
          top: { style: borderStyle },
          left: { style: borderStyle },
          bottom: { style: borderStyle },
          right: { style: borderStyle },
        };
      }
    }
  }

  /**
   * Add a summary/total row with styling
   * @param worksheet - The worksheet
   * @param rowNumber - Row number for the total row
   * @param values - Array of cell values for the row
   * @param sumColumns - Array of column indices (1-based) to apply sum styling
   */
  addTotalRow(
    worksheet: ExcelJS.Worksheet,
    rowNumber: number,
    values: CellValue[],
    sumColumns?: number[]
  ): void {
    const row = worksheet.getRow(rowNumber);

    values.forEach((value, index) => {
      const cell = row.getCell(index + 1);
      cell.value = value;
      cell.font = { bold: true };
      cell.border = {
        top: { style: 'double' },
        bottom: { style: 'double' },
      };

      // Highlight sum columns
      if (sumColumns && sumColumns.includes(index + 1)) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FEF3C7' }, // Light yellow
        };
      }
    });

    row.height = 25;
    row.commit();
  }

  /**
   * Set print area and page setup for printing
   * @param worksheet - The worksheet
   * @param lastColumn - Last column letter
   * @param lastRow - Last row number
   */
  setPrintSetup(
    worksheet: ExcelJS.Worksheet,
    lastColumn: string,
    lastRow: number
  ): void {
    worksheet.pageSetup = {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      printArea: `A1:${lastColumn}${lastRow}`,
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.75,
        bottom: 0.75,
        header: 0.3,
        footer: 0.3,
      },
    };

    // Repeat header row on each page
    worksheet.pageSetup.printTitlesRow = '1:1';
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Calculate a reasonable column width based on header text
   * @param header - The header text
   * @returns Suggested column width
   */
  private calculateColumnWidth(header: string): number {
    const length = header.length;
    // Add some padding for readability
    return Math.max(length + 4, 10);
  }

  /**
   * Convert column number to Excel letter (1 = A, 27 = AA, etc.)
   * @param columnNumber - 1-based column number
   * @returns Column letter(s)
   */
  getColumnLetter(columnNumber: number): string {
    let result = '';
    let num = columnNumber;

    while (num > 0) {
      const remainder = (num - 1) % 26;
      result = String.fromCharCode(65 + remainder) + result;
      num = Math.floor((num - 1) / 26);
    }

    return result;
  }

  /**
   * Convert column letter to number (A = 1, AA = 27, etc.)
   * @param columnLetter - Column letter(s)
   * @returns 1-based column number
   */
  getColumnNumber(columnLetter: string): number {
    let result = 0;
    const letters = columnLetter.toUpperCase();

    for (let i = 0; i < letters.length; i++) {
      result = result * 26 + (letters.charCodeAt(i) - 64);
    }

    return result;
  }

  /**
   * Format a date value for Excel
   * @param date - Date to format
   * @returns Formatted date or empty string
   */
  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';

    const d = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(d.getTime())) return '';

    return d.toISOString().split('T')[0];
  }

  /**
   * Format a currency value for display
   * @param amount - Amount to format
   * @param decimals - Number of decimal places (default: 2)
   * @returns Formatted number
   */
  formatCurrency(amount: number | null | undefined, decimals: number = 2): number {
    if (amount === null || amount === undefined) return 0;
    return Number(amount.toFixed(decimals));
  }
}

// Export singleton instance
export const excelService = new ExcelService();
