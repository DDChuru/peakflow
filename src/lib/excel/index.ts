/**
 * Excel Export Service
 * Centralized Excel workbook generation and export
 *
 * Usage:
 * ```typescript
 * import { excelService } from '@/lib/excel';
 *
 * // Create workbook
 * const workbook = excelService.createWorkbook();
 *
 * // Add worksheet with columns
 * const worksheet = excelService.addWorksheet(workbook, {
 *   name: 'Report',
 *   columns: [
 *     { header: 'Date', key: 'date', width: 15 },
 *     { header: 'Description', key: 'description', width: 40 },
 *     { header: 'Amount', key: 'amount', numFmt: excelService.CURRENCY_FORMAT_ZAR },
 *   ],
 *   freezeHeader: true,
 *   autoFilter: true,
 * });
 *
 * // Apply header styling
 * excelService.applyHeaderStyle(worksheet);
 *
 * // Add data rows
 * excelService.addRows(worksheet, [
 *   { date: '2024-01-15', description: 'Invoice #001', amount: 1500.00 },
 *   { date: '2024-01-16', description: 'Payment received', amount: -500.00 },
 * ]);
 *
 * // Auto-fit columns based on content
 * excelService.autoFitColumns(worksheet);
 *
 * // Download in browser
 * await excelService.downloadExcel(workbook, 'my-report');
 *
 * // Or get as Blob for upload
 * const blob = await excelService.getExcelBlob(workbook);
 * ```
 */

export {
  ExcelService,
  excelService,
  type WorksheetOptions,
  type ColumnDefinition,
  type HeaderStyle,
  type ExcelBrandingOptions,
  type CellValue,
  type RowData,
} from './excel.service';
