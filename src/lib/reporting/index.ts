/**
 * Reporting Module
 * Central exports for all reporting services
 */

// AP/AR Reports
export {
  APARReportsService,
  createAPARReportsService,
  type AgingBucket,
  type AgingBucketType,
  type AgedReceivableLine,
  type AgedReceivablesByCustomer,
  type AgedReceivablesReport,
  type AgedPayableLine,
  type AgedPayablesByVendor,
  type AgedPayablesReport,
  type ARSummary,
  type APSummary,
} from './ap-ar-reports-service';

// Financial Statements
export {
  FinancialStatementsService,
  createFinancialStatementsService,
  type AccountBalance,
  type FinancialStatementSection,
  type IncomeStatement,
  type BalanceSheet,
  type CashFlowStatement,
} from './financial-statements-service';

// General Ledger Reports
export {
  GLReportsService,
  createGLReportsService,
  type TrialBalanceLine,
  type TrialBalanceReport,
  type GLAccountEntry,
  type GLAccountReport,
  type JournalEntryLine,
  type JournalEntryDetail,
  type JournalEntriesReport,
  type JournalEntryFilters,
  // Formatted GL Report types
  type GLEntryType,
  type FormattedGLEntry,
  type FormattedGLMonthlySection,
  type FormattedGLReportOptions,
  type FormattedGLReport,
} from './gl-reports-service';

// Trial Balance Excel Formatter
export {
  TBExcelFormatter,
  createTBExcelFormatter,
  exportTrialBalanceToExcel,
  getTrialBalanceExcelBlob,
  type TBExcelFormatterOptions,
  type FormattedTBLine,
} from './tb-excel-formatter';

// Income Statement Excel Formatter
export {
  ISExcelFormatter,
  createISExcelFormatter,
  exportIncomeStatementToExcel,
  getIncomeStatementExcelBlob,
  type ISExcelFormatterOptions,
  type FormattedISLine,
} from './is-excel-formatter';

// Balance Sheet Excel Formatter
export {
  BSExcelFormatter,
  createBSExcelFormatter,
  exportBalanceSheetToExcel,
  getBalanceSheetExcelBlob,
  type BSExcelFormatterOptions,
  type FormattedBSLine,
} from './bs-excel-formatter';

// General Ledger Excel Formatter
export {
  GLExcelFormatter,
  createGLExcelFormatter,
  exportGeneralLedgerToExcel,
  getGeneralLedgerExcelBlob,
  type GLExcelFormatterOptions,
  type FormattedGLLine,
} from './gl-excel-formatter';

// ============================================================================
// PDF EXPORT
// ============================================================================
// PDF export for all report types is available via the centralized PDF service:
//
// import { pdfService } from '@/lib/pdf';
//
// Available methods:
// - pdfService.generateGLPDF(report, options)   - General Ledger PDF
// - pdfService.downloadGLPDF(report, options)   - Download GL PDF
// - pdfService.generateTBPDF(report, options)   - Trial Balance PDF
// - pdfService.downloadTBPDF(report, options)   - Download TB PDF
// - pdfService.generateISPDF(report, options)   - Income Statement PDF
// - pdfService.downloadISPDF(report, options)   - Download IS PDF
// - pdfService.generateBSPDF(report, options)   - Balance Sheet PDF
// - pdfService.downloadBSPDF(report, options)   - Download BS PDF
//
// PDF options types are exported from '@/lib/pdf':
// - GLReportPDFOptions, TBReportPDFOptions, ISReportPDFOptions, BSReportPDFOptions
// ============================================================================
