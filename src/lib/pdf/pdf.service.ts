/**
 * Centralized PDF Service
 * Handles PDF generation with automatic Firebase image conversion
 * Based on NCR Audit App architecture
 *
 * Includes specialized PDF generators for:
 * - Customer Statements (Phase 7)
 * - Quotes, Invoices, Contracts (existing)
 */

import pdfMake from 'pdfmake/build/pdfmake';
import type { TDocumentDefinitions, Content, ContentTable, TableCell } from 'pdfmake/interfaces';
import type { CustomerStatement } from '@/types/accounting/statement';
import type { CreditNote } from '@/types/accounting/credit-note';
import type {
  FormattedGLReport,
  FormattedGLMonthlySection,
  TrialBalanceReport,
  TrialBalanceLine,
} from '@/lib/reporting/gl-reports-service';
import type {
  IncomeStatement,
  BalanceSheet,
  FinancialStatementSection,
  AccountBalance,
} from '@/lib/reporting/financial-statements-service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface StatementPDFOptions {
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyVatNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankBranchCode?: string;
  logoDataUrl?: string;
}

/**
 * Options for financial report PDF exports
 */
export interface ReportPDFOptions {
  companyName: string;
  preparedBy?: string;
  logoDataUrl?: string;
  /** Include account details (default: true) */
  includeAccountDetails?: boolean;
  /** Include account codes (default: true) */
  includeAccountCodes?: boolean;
  /** Show percentages for Income Statement (default: false) */
  showPercentages?: boolean;
}

/**
 * Options specific to GL Report PDF
 */
export interface GLReportPDFOptions extends ReportPDFOptions {
  /** Include monthly groupings (default: true) */
  includeMonthlyGroupings?: boolean;
}

/**
 * Options specific to Trial Balance PDF
 */
export interface TBReportPDFOptions extends ReportPDFOptions {
  /** Include account type groupings with subtotals (default: true) */
  includeGroupSubtotals?: boolean;
}

/**
 * Options specific to Income Statement PDF
 */
export interface ISReportPDFOptions extends ReportPDFOptions {
  /** Show percentages relative to revenue (default: false) */
  showPercentages?: boolean;
}

/**
 * Options specific to Balance Sheet PDF
 */
export interface BSReportPDFOptions extends ReportPDFOptions {
  /** Show comparative period (future enhancement) */
  showComparative?: boolean;
}

// ============================================================================
// PDF SERVICE
// ============================================================================

export class PDFService {
  private fontsLoaded = false;

  constructor() {
    this.loadFonts();
  }

  /**
   * Load pdfMake fonts
   */
  private async loadFonts(): Promise<void> {
    if (this.fontsLoaded) return;

    try {
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

      // Handle different export structures
      if (pdfFontsModule.pdfMake && pdfFontsModule.pdfMake.vfs) {
        pdfMake.vfs = pdfFontsModule.pdfMake.vfs;
      } else if (pdfFontsModule.default?.vfs) {
        pdfMake.vfs = pdfFontsModule.default.vfs;
      } else if (pdfFontsModule.vfs) {
        pdfMake.vfs = pdfFontsModule.vfs;
      } else {
        // Last resort: use entire module
        pdfMake.vfs = pdfFontsModule;
      }

      this.fontsLoaded = true;
      console.log('📚 pdfMake fonts loaded successfully');
    } catch (error) {
      console.error('❌ Error loading pdfMake fonts:', error);
      throw error;
    }
  }

  /**
   * Convert any image URL (including Firebase Storage) to base64 data URL
   * Works with Firebase URLs, HTTP URLs, or existing data URLs
   */
  private async convertImageToDataUrl(url: string): Promise<string> {
    try {
      // Validate URL first
      if (!url || url.trim() === '') {
        throw new Error('Empty or invalid URL provided');
      }

      // If it's already a data URL, return as is
      if (url.startsWith('data:')) {
        return url;
      }

      console.log('🖼️ Converting image to base64');
      console.log('   Full URL:', url);
      console.log('   URL length:', url.length);
      console.log('   Starts with https:', url.startsWith('https'));

      // Use API proxy route to avoid CORS issues
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
      console.log('   Using proxy:', proxyUrl);

      // Fetch the image via proxy (avoids CORS issues)
      const response = await fetch(proxyUrl);
      console.log('   Fetch response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;

          // Ensure proper data URL format
          if (base64data.startsWith('data:')) {
            console.log('✅ Image converted successfully');
            resolve(base64data);
          } else {
            // Construct proper data URL with mime type
            const mimeType = blob.type || 'image/png';
            const base64 = base64data.split(',')[1] || base64data;
            console.log('✅ Image converted successfully');
            resolve(`data:${mimeType};base64,${base64}`);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ Error converting image to data URL:', error);
      throw error;
    }
  }

  /**
   * Recursively process all images in a pdfMake document definition
   * Converts Firebase Storage URLs and HTTP URLs to base64 data URLs
   */
  private async processImages(content: any, parent?: any, key?: string | number): Promise<void> {
    if (!content) return;

    // Handle arrays
    if (Array.isArray(content)) {
      // Process in reverse to safely remove items
      for (let i = content.length - 1; i >= 0; i--) {
        await this.processImages(content[i], content, i);
      }
      return;
    }

    // Handle objects
    if (typeof content === 'object') {
      // Process direct image property
      if (content.image && typeof content.image === 'string') {
        // Skip empty strings
        if (content.image.trim() === '') {
          console.warn('⚠️ Empty image URL found, removing from document');
          delete content.image;
          return;
        }

        try {
          // Skip if already a data URL
          if (!content.image.startsWith('data:')) {
            content.image = await this.convertImageToDataUrl(content.image);
          }
        } catch (error) {
          console.error('⚠️ Failed to convert image, removing from document:', error);
          console.error('   Image URL was:', content.image);
          // Remove entire object from parent array if image conversion fails
          if (Array.isArray(parent) && typeof key === 'number') {
            parent.splice(key, 1);
          } else {
            // If not in array, just delete the image property
            delete content.image;
          }
          return; // Skip further processing of this object
        }
      }

      // Recursively process nested structures
      if (Array.isArray(content.content)) {
        await this.processImages(content.content);
      }
      if (Array.isArray(content.stack)) {
        await this.processImages(content.stack);
      }
      if (Array.isArray(content.columns)) {
        await this.processImages(content.columns);
      }
      if (content.table?.body) {
        await this.processImages(content.table.body);
      }
    }
  }

  /**
   * Generate a PDF with automatic image conversion
   * @param docDefinition - pdfMake document definition
   * @returns pdfMake PDF object with download/open methods
   */
  async generatePdf(docDefinition: TDocumentDefinitions) {
    try {
      // Ensure fonts are loaded
      await this.loadFonts();

      // Process all images in the document
      if (docDefinition.content) {
        console.log('🔄 Processing images in PDF document...');
        await this.processImages(docDefinition.content);
        console.log('✅ Images processed successfully');
      }

      // Generate PDF
      return pdfMake.createPdf(docDefinition);
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Generate and download a PDF
   * @param docDefinition - pdfMake document definition
   * @param filename - Output filename (without .pdf extension)
   */
  async downloadPdf(docDefinition: TDocumentDefinitions, filename: string): Promise<void> {
    try {
      const pdf = await this.generatePdf(docDefinition);
      pdf.download(`${filename}.pdf`);
      console.log('✅ PDF downloaded:', filename);
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Generate and open PDF in new window
   * @param docDefinition - pdfMake document definition
   */
  async openPdf(docDefinition: TDocumentDefinitions): Promise<void> {
    try {
      const pdf = await this.generatePdf(docDefinition);
      pdf.open();
      console.log('✅ PDF opened in new window');
    } catch (error) {
      console.error('❌ Error opening PDF:', error);
      throw error;
    }
  }

  /**
   * Generate PDF as blob
   * @param docDefinition - pdfMake document definition
   * @returns Promise<Blob>
   */
  async getPdfBlob(docDefinition: TDocumentDefinitions): Promise<Blob> {
    try {
      const pdf = await this.generatePdf(docDefinition);
      return new Promise((resolve, reject) => {
        pdf.getBlob((blob) => {
          resolve(blob);
        });
      });
    } catch (error) {
      console.error('❌ Error getting PDF blob:', error);
      throw error;
    }
  }

  /**
   * Generate PDF as base64 string
   * @param docDefinition - pdfMake document definition
   * @returns Promise<string>
   */
  async getPdfBase64(docDefinition: TDocumentDefinitions): Promise<string> {
    try {
      const pdf = await this.generatePdf(docDefinition);
      return new Promise((resolve, reject) => {
        pdf.getBase64((base64) => {
          resolve(base64);
        });
      });
    } catch (error) {
      console.error('❌ Error getting PDF base64:', error);
      throw error;
    }
  }

  // ============================================================================
  // STATEMENT PDF GENERATION (Phase 7)
  // ============================================================================

  /**
   * Generate PDF for customer statement
   * Uses centralized image conversion for company logos
   */
  async generateStatementPDF(
    statement: CustomerStatement,
    options: StatementPDFOptions
  ): Promise<Blob> {
    const docDefinition = this.buildStatementDocument(statement, options);
    return this.getPdfBlob(docDefinition);
  }

  /**
   * Download statement PDF with proper filename
   */
  async downloadStatementPDF(
    statement: CustomerStatement,
    options: StatementPDFOptions
  ): Promise<void> {
    const docDefinition = this.buildStatementDocument(statement, options);
    const fileName = `Statement-${statement.customerName.replace(/\s+/g, '-')}-${this.formatDate(statement.statementDate)}`;
    await this.downloadPdf(docDefinition, fileName);
  }

  /**
   * Build statement document definition
   * Private helper for statement PDFs
   */
  private buildStatementDocument(
    statement: CustomerStatement,
    options: StatementPDFOptions
  ): TDocumentDefinitions {
    const content: Content[] = [];

    // Header with logo and company info
    content.push({
      columns: [
        {
          width: options.logoDataUrl ? 100 : '*',
          stack: options.logoDataUrl
            ? [
                {
                  image: options.logoDataUrl,
                  width: 80,
                  margin: [0, 0, 0, 10],
                },
              ]
            : [],
        },
        {
          width: '*',
          stack: [
            {
              text: options.companyName,
              style: 'companyName',
            },
            ...(options.companyAddress
              ? [
                  {
                    text: options.companyAddress,
                    style: 'companyInfo',
                  },
                ]
              : []),
            ...(options.companyPhone || options.companyEmail
              ? [
                  {
                    text: [
                      ...(options.companyPhone ? [`Tel: ${options.companyPhone}  `] : []),
                      ...(options.companyEmail ? [`Email: ${options.companyEmail}`] : []),
                    ].join(''),
                    style: 'companyInfo',
                  },
                ]
              : []),
            ...(options.companyVatNumber
              ? [
                  {
                    text: `VAT: ${options.companyVatNumber}`,
                    style: 'companyInfo',
                  },
                ]
              : []),
          ],
          alignment: 'right',
        },
      ],
      margin: [0, 0, 0, 20],
    });

    // Document title
    content.push({
      text: 'CUSTOMER STATEMENT',
      style: 'header',
      margin: [0, 0, 0, 20],
    });

    // Statement details and customer info
    content.push({
      columns: [
        {
          width: '50%',
          stack: [
            {
              text: 'BILL TO:',
              style: 'sectionHeader',
              margin: [0, 0, 0, 5],
            },
            {
              text: statement.customerName,
              bold: true,
            },
            ...(statement.customerAddress
              ? [{ text: statement.customerAddress, margin: [0, 2, 0, 0] }]
              : []),
            ...(statement.customerEmail
              ? [{ text: statement.customerEmail, margin: [0, 2, 0, 0] }]
              : []),
            ...(statement.customerPhone
              ? [{ text: statement.customerPhone, margin: [0, 2, 0, 0] }]
              : []),
          ],
        },
        {
          width: '50%',
          stack: [
            {
              text: 'ACCOUNT SUMMARY:',
              style: 'sectionHeader',
              margin: [0, 0, 0, 5],
            },
            {
              table: {
                widths: ['*', 'auto'],
                body: [
                  ['Statement Date:', { text: this.formatDate(statement.statementDate), bold: true }],
                  ['Period:', `${this.formatDate(statement.periodStart)} - ${this.formatDate(statement.periodEnd)}`],
                  ...(statement.accountNumber
                    ? [['Account #:', statement.accountNumber]]
                    : []),
                  [
                    'Opening Balance:',
                    {
                      text: this.formatCurrency(statement.openingBalance),
                      alignment: 'right',
                    },
                  ],
                  [
                    'Current Charges:',
                    {
                      text: this.formatCurrency(statement.summary.totalInvoices),
                      alignment: 'right',
                    },
                  ],
                  [
                    'Payments Received:',
                    {
                      text: this.formatCurrency(-statement.summary.totalPayments),
                      alignment: 'right',
                      color: '#10b981',
                    },
                  ],
                  [
                    'Credits Applied:',
                    {
                      text: this.formatCurrency(-statement.summary.totalCredits),
                      alignment: 'right',
                      color: '#10b981',
                    },
                  ],
                  [
                    { text: 'Closing Balance:', bold: true },
                    {
                      text: this.formatCurrency(statement.closingBalance),
                      bold: true,
                      alignment: 'right',
                      fontSize: 14,
                    },
                  ],
                ],
              },
              layout: 'noBorders',
            },
          ],
          alignment: 'right',
        },
      ],
      margin: [0, 0, 0, 20],
    });

    // Aged Analysis
    content.push({
      text: 'AGED ANALYSIS',
      style: 'sectionHeader',
      margin: [0, 10, 0, 10],
    });

    content.push({
      table: {
        widths: ['*', '*', '*', '*', '*', 'auto'],
        headerRows: 1,
        body: [
          [
            { text: 'Current', style: 'tableHeader' },
            { text: '31-60 Days', style: 'tableHeader' },
            { text: '61-90 Days', style: 'tableHeader' },
            { text: '91-120 Days', style: 'tableHeader' },
            { text: '120+ Days', style: 'tableHeader' },
            { text: 'Total', style: 'tableHeader', bold: true },
          ],
          [
            { text: this.formatCurrency(statement.agedAnalysis.current), alignment: 'right' },
            {
              text: this.formatCurrency(statement.agedAnalysis.thirtyDays),
              alignment: 'right',
              color: statement.agedAnalysis.thirtyDays > 0 ? '#f59e0b' : undefined,
            },
            {
              text: this.formatCurrency(statement.agedAnalysis.sixtyDays),
              alignment: 'right',
              color: statement.agedAnalysis.sixtyDays > 0 ? '#f97316' : undefined,
            },
            {
              text: this.formatCurrency(statement.agedAnalysis.ninetyDays),
              alignment: 'right',
              color: statement.agedAnalysis.ninetyDays > 0 ? '#dc2626' : undefined,
            },
            {
              text: this.formatCurrency(statement.agedAnalysis.oneTwentyPlus),
              alignment: 'right',
              color: statement.agedAnalysis.oneTwentyPlus > 0 ? '#991b1b' : undefined,
              bold: statement.agedAnalysis.oneTwentyPlus > 0,
            },
            {
              text: this.formatCurrency(statement.agedAnalysis.total),
              alignment: 'right',
              bold: true,
              fontSize: 11,
            },
          ],
        ],
      },
      layout: {
        fillColor: (rowIndex: number) => {
          return rowIndex === 0 ? '#f3f4f6' : null;
        },
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#e5e7eb',
        vLineColor: () => '#e5e7eb',
      },
      margin: [0, 0, 0, 20],
    });

    // Transaction Details
    content.push({
      text: 'TRANSACTION DETAILS',
      style: 'sectionHeader',
      margin: [0, 10, 0, 10],
    });

    const transactionTableBody = [
      [
        { text: 'Date', style: 'tableHeader' },
        { text: 'Type', style: 'tableHeader' },
        { text: 'Reference', style: 'tableHeader' },
        { text: 'Debit', style: 'tableHeader', alignment: 'right' },
        { text: 'Credit', style: 'tableHeader', alignment: 'right' },
        { text: 'Balance', style: 'tableHeader', alignment: 'right' },
      ],
    ];

    statement.transactions.forEach((txn) => {
      transactionTableBody.push([
        this.formatDate(txn.date),
        txn.type.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        txn.reference,
        {
          text: txn.debit ? this.formatCurrency(txn.debit) : '-',
          alignment: 'right',
        },
        {
          text: txn.credit ? this.formatCurrency(txn.credit) : '-',
          alignment: 'right',
          color: '#10b981',
        },
        {
          text: this.formatCurrency(txn.runningBalance),
          alignment: 'right',
          bold: true,
        },
      ]);
    });

    content.push({
      table: {
        widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto'],
        headerRows: 1,
        body: transactionTableBody,
      },
      layout: {
        fillColor: (rowIndex: number) => {
          return rowIndex === 0 ? '#f3f4f6' : rowIndex % 2 === 0 ? '#fafafa' : null;
        },
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#e5e7eb',
        vLineColor: () => '#e5e7eb',
      },
      margin: [0, 0, 0, 20],
    });

    // Total Amount Due
    content.push({
      table: {
        widths: ['*', 'auto'],
        body: [
          [
            { text: 'TOTAL AMOUNT DUE:', bold: true, fontSize: 14 },
            {
              text: this.formatCurrency(statement.closingBalance),
              bold: true,
              fontSize: 16,
              alignment: 'right',
              color: statement.closingBalance > 0 ? '#dc2626' : '#10b981',
            },
          ],
        ],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 20],
    });

    // Payment Details
    if (options.bankName && options.bankAccountNumber) {
      content.push({
        text: 'PAYMENT DETAILS',
        style: 'sectionHeader',
        margin: [0, 10, 0, 10],
      });

      content.push({
        table: {
          widths: ['*', '*'],
          body: [
            ['Bank:', options.bankName],
            ['Account Name:', options.companyName],
            ['Account Number:', options.bankAccountNumber],
            ...(options.bankBranchCode ? [['Branch Code:', options.bankBranchCode]] : []),
            ['Reference:', statement.accountNumber || statement.customerName],
          ],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 20],
      });
    }

    // Footer
    content.push({
      text: [
        { text: 'Questions? ', bold: true },
        `Contact us at ${options.companyEmail || options.companyPhone || ''}`,
      ],
      style: 'footer',
      margin: [0, 20, 0, 0],
    });

    return {
      content,
      styles: {
        header: {
          fontSize: 24,
          bold: true,
          alignment: 'center',
          color: '#1f2937',
        },
        companyName: {
          fontSize: 16,
          bold: true,
          color: '#1f2937',
        },
        companyInfo: {
          fontSize: 9,
          color: '#6b7280',
          margin: [0, 2, 0, 0],
        },
        sectionHeader: {
          fontSize: 12,
          bold: true,
          color: '#374151',
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: '#374151',
        },
        footer: {
          fontSize: 9,
          color: '#6b7280',
          alignment: 'center',
        },
      },
      defaultStyle: {
        fontSize: 10,
        color: '#374151',
      },
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
    };
  }

  // ============================================================================
  // UTILITY FUNCTIONS FOR STATEMENTS
  // ============================================================================

  private formatCurrency(amount: number): string {
    return `R${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Format date for filename (YYYY-MM-DD)
   */
  private formatDateForFilename(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }

  // ============================================================================
  // GENERAL LEDGER REPORT PDF GENERATION
  // ============================================================================

  /**
   * Generate PDF for General Ledger report
   * @param report - Formatted GL report data
   * @param options - PDF generation options
   */
  async generateGLPDF(
    report: FormattedGLReport,
    options: GLReportPDFOptions
  ): Promise<Blob> {
    const docDefinition = this.buildGLDocument(report, options);
    return this.getPdfBlob(docDefinition);
  }

  /**
   * Download GL report PDF
   */
  async downloadGLPDF(
    report: FormattedGLReport,
    options: GLReportPDFOptions
  ): Promise<void> {
    const docDefinition = this.buildGLDocument(report, options);
    const fileName = `general-ledger-${report.accountCode}-${this.formatDateForFilename(report.reportPeriod.startDate)}-to-${this.formatDateForFilename(report.reportPeriod.endDate)}`;
    await this.downloadPdf(docDefinition, fileName);
  }

  /**
   * Build GL document definition
   */
  private buildGLDocument(
    report: FormattedGLReport,
    options: GLReportPDFOptions
  ): TDocumentDefinitions {
    const content: Content[] = [];
    const includeMonthly = options.includeMonthlyGroupings ?? true;

    // Header section
    content.push(this.buildReportHeader(
      options.companyName,
      'General Ledger',
      `Account: ${report.accountCode} - ${report.accountName}`,
      `Period: ${this.formatDate(report.reportPeriod.startDate)} to ${this.formatDate(report.reportPeriod.endDate)}`,
      options.preparedBy || report.preparedBy
    ));

    // Account summary
    content.push({
      table: {
        widths: ['*', 'auto'],
        body: [
          [
            { text: 'Account Type:', style: 'tableLabel' },
            { text: report.accountType.toUpperCase(), alignment: 'right' as const },
          ],
          [
            { text: 'Opening Balance:', style: 'tableLabel' },
            { text: this.formatCurrency(report.openingBalance), alignment: 'right' as const },
          ],
          [
            { text: 'Total Debits:', style: 'tableLabel' },
            { text: this.formatCurrency(report.totalDebits), alignment: 'right' as const },
          ],
          [
            { text: 'Total Credits:', style: 'tableLabel' },
            { text: this.formatCurrency(report.totalCredits), alignment: 'right' as const },
          ],
          [
            { text: 'Net Movement:', style: 'tableLabel', bold: true },
            { text: this.formatCurrency(report.netMovement), alignment: 'right' as const, bold: true },
          ],
          [
            { text: 'Closing Balance:', style: 'tableLabel', bold: true },
            {
              text: this.formatCurrency(report.closingBalance),
              alignment: 'right' as const,
              bold: true,
              color: report.closingBalance >= 0 ? '#166534' : '#dc2626',
            },
          ],
        ],
      },
      layout: 'noBorders',
      margin: [0, 0, 0, 20] as [number, number, number, number],
    });

    // Column headers for entries table
    const tableHeaders: TableCell[] = [
      { text: 'Date', style: 'tableHeader' },
      { text: 'Entry Type', style: 'tableHeader' },
      { text: 'Reference', style: 'tableHeader' },
      { text: 'Contra Acc', style: 'tableHeader' },
      { text: 'Description', style: 'tableHeader' },
      { text: 'Debit', style: 'tableHeader', alignment: 'right' as const },
      { text: 'Credit', style: 'tableHeader', alignment: 'right' as const },
      { text: 'Cumulative', style: 'tableHeader', alignment: 'right' as const },
    ];

    if (includeMonthly && report.monthlySections.length > 0) {
      // Monthly groupings
      for (const monthSection of report.monthlySections) {
        // Month header
        content.push({
          text: monthSection.monthLabel,
          style: 'sectionHeader',
          margin: [0, 15, 0, 5] as [number, number, number, number],
        });

        // Month opening balance
        content.push({
          text: `Opening Balance: ${this.formatCurrency(monthSection.openingBalance)}`,
          style: 'subText',
          margin: [0, 0, 0, 5] as [number, number, number, number],
        });

        // Entries table for this month
        const tableBody: TableCell[][] = [tableHeaders];

        for (const entry of monthSection.entries) {
          tableBody.push([
            { text: this.formatDate(entry.date), fontSize: 9 },
            { text: entry.entryType, fontSize: 9 },
            { text: entry.reference || '-', fontSize: 9 },
            { text: entry.contraAccount || '-', fontSize: 9 },
            { text: entry.description, fontSize: 9 },
            { text: entry.debit ? this.formatCurrency(entry.debit) : '-', alignment: 'right' as const, fontSize: 9 },
            { text: entry.credit ? this.formatCurrency(entry.credit) : '-', alignment: 'right' as const, fontSize: 9, color: '#10b981' },
            { text: this.formatCurrency(entry.cumulative), alignment: 'right' as const, fontSize: 9, bold: true },
          ]);
        }

        // Month totals row
        tableBody.push([
          { text: 'Month Totals', colSpan: 5, bold: true, fillColor: '#f3f4f6' },
          {}, {}, {}, {},
          { text: this.formatCurrency(monthSection.periodDebits), alignment: 'right' as const, bold: true, fillColor: '#f3f4f6' },
          { text: this.formatCurrency(monthSection.periodCredits), alignment: 'right' as const, bold: true, fillColor: '#f3f4f6' },
          { text: this.formatCurrency(monthSection.closingBalance), alignment: 'right' as const, bold: true, fillColor: '#fef3c7' },
        ]);

        content.push({
          table: {
            headerRows: 1,
            widths: ['auto', 'auto', 'auto', 'auto', '*', 'auto', 'auto', 'auto'],
            body: tableBody,
          },
          layout: this.getTableLayout(),
          margin: [0, 0, 0, 10] as [number, number, number, number],
        });
      }
    } else {
      // Flat listing (no monthly groupings)
      const allEntries = report.monthlySections.flatMap(s => s.entries);
      const tableBody: TableCell[][] = [tableHeaders];

      for (const entry of allEntries) {
        tableBody.push([
          { text: this.formatDate(entry.date), fontSize: 9 },
          { text: entry.entryType, fontSize: 9 },
          { text: entry.reference || '-', fontSize: 9 },
          { text: entry.contraAccount || '-', fontSize: 9 },
          { text: entry.description, fontSize: 9 },
          { text: entry.debit ? this.formatCurrency(entry.debit) : '-', alignment: 'right' as const, fontSize: 9 },
          { text: entry.credit ? this.formatCurrency(entry.credit) : '-', alignment: 'right' as const, fontSize: 9, color: '#10b981' },
          { text: this.formatCurrency(entry.cumulative), alignment: 'right' as const, fontSize: 9, bold: true },
        ]);
      }

      content.push({
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', '*', 'auto', 'auto', 'auto'],
          body: tableBody,
        },
        layout: this.getTableLayout(),
      });
    }

    // Grand totals
    content.push({
      table: {
        widths: ['*', 'auto', 'auto', 'auto'],
        body: [
          [
            { text: 'GRAND TOTALS', bold: true, fontSize: 12 },
            { text: this.formatCurrency(report.totalDebits), alignment: 'right' as const, bold: true, fontSize: 12 },
            { text: this.formatCurrency(report.totalCredits), alignment: 'right' as const, bold: true, fontSize: 12 },
            { text: this.formatCurrency(report.closingBalance), alignment: 'right' as const, bold: true, fontSize: 12, color: report.closingBalance >= 0 ? '#166534' : '#dc2626' },
          ],
        ],
      },
      layout: {
        fillColor: () => '#fef3c7',
        hLineWidth: () => 1,
        vLineWidth: () => 0,
        hLineColor: () => '#d1d5db',
      },
      margin: [0, 20, 0, 0] as [number, number, number, number],
    });

    return this.buildReportDocDefinition(content, 'landscape');
  }

  // ============================================================================
  // TRIAL BALANCE REPORT PDF GENERATION
  // ============================================================================

  /**
   * Generate PDF for Trial Balance report
   * @param report - Trial Balance report data
   * @param options - PDF generation options
   */
  async generateTBPDF(
    report: TrialBalanceReport,
    options: TBReportPDFOptions
  ): Promise<Blob> {
    const docDefinition = this.buildTBDocument(report, options);
    return this.getPdfBlob(docDefinition);
  }

  /**
   * Download Trial Balance PDF
   */
  async downloadTBPDF(
    report: TrialBalanceReport,
    options: TBReportPDFOptions
  ): Promise<void> {
    const docDefinition = this.buildTBDocument(report, options);
    const fileName = `trial-balance-${this.formatDateForFilename(report.asOfDate)}`;
    await this.downloadPdf(docDefinition, fileName);
  }

  /**
   * Build Trial Balance document definition
   */
  private buildTBDocument(
    report: TrialBalanceReport,
    options: TBReportPDFOptions
  ): TDocumentDefinitions {
    const content: Content[] = [];
    const includeGroupSubtotals = options.includeGroupSubtotals ?? true;
    const includeAccountCodes = options.includeAccountCodes ?? true;

    // Header section
    content.push(this.buildReportHeader(
      options.companyName,
      'Trial Balance',
      `As of: ${this.formatDate(report.asOfDate)}`,
      undefined,
      options.preparedBy
    ));

    // Group accounts by type
    const accountGroups = this.groupTrialBalanceByType(report.accounts);

    // Column headers
    const headers: TableCell[] = [];
    if (includeAccountCodes) {
      headers.push({ text: 'Account Code', style: 'tableHeader' });
    }
    headers.push(
      { text: 'Account Name', style: 'tableHeader' },
      { text: 'Debit (DR)', style: 'tableHeader', alignment: 'right' as const },
      { text: 'Credit (CR)', style: 'tableHeader', alignment: 'right' as const }
    );

    const colWidths = includeAccountCodes ? ['auto', '*', 'auto', 'auto'] : ['*', 'auto', 'auto'];

    // Build table with groupings
    const tableBody: TableCell[][] = [headers];

    for (const group of accountGroups) {
      if (group.accounts.length === 0 && !includeGroupSubtotals) continue;

      // Group header
      if (includeGroupSubtotals) {
        const groupHeaderRow: TableCell[] = [];
        const colSpan = includeAccountCodes ? 4 : 3;
        groupHeaderRow.push({
          text: group.label,
          colSpan,
          bold: true,
          fillColor: '#dbeafe',
          color: '#1e3a8a',
          margin: [5, 5, 5, 5] as [number, number, number, number],
        });
        for (let i = 1; i < colSpan; i++) groupHeaderRow.push({});
        tableBody.push(groupHeaderRow);
      }

      // Account rows
      for (const account of group.accounts) {
        const debitAmount = this.getTBDebitAmount(account);
        const creditAmount = this.getTBCreditAmount(account);

        const row: TableCell[] = [];
        if (includeAccountCodes) {
          row.push({ text: account.accountCode, fontSize: 10 });
        }
        row.push(
          { text: account.accountName, fontSize: 10 },
          { text: debitAmount ? this.formatCurrency(debitAmount) : '-', alignment: 'right' as const, fontSize: 10 },
          { text: creditAmount ? this.formatCurrency(creditAmount) : '-', alignment: 'right' as const, fontSize: 10, color: '#10b981' }
        );
        tableBody.push(row);
      }

      // Group subtotal
      if (includeGroupSubtotals && group.accounts.length > 0) {
        const subtotalRow: TableCell[] = [];
        if (includeAccountCodes) {
          subtotalRow.push({ text: '', fillColor: '#f3f4f6' });
        }
        subtotalRow.push(
          { text: `Total ${group.label}`, bold: true, alignment: 'right' as const, fillColor: '#f3f4f6' },
          { text: group.totalDebit ? this.formatCurrency(group.totalDebit) : '-', alignment: 'right' as const, bold: true, fillColor: '#f3f4f6' },
          { text: group.totalCredit ? this.formatCurrency(group.totalCredit) : '-', alignment: 'right' as const, bold: true, fillColor: '#f3f4f6' }
        );
        tableBody.push(subtotalRow);

        // Empty row for spacing
        const emptyRow: TableCell[] = [];
        const colSpan = includeAccountCodes ? 4 : 3;
        emptyRow.push({ text: '', colSpan, margin: [0, 5, 0, 5] as [number, number, number, number] });
        for (let i = 1; i < colSpan; i++) emptyRow.push({});
        tableBody.push(emptyRow);
      }
    }

    // Grand totals row
    const totalsRow: TableCell[] = [];
    if (includeAccountCodes) {
      totalsRow.push({ text: '', fillColor: '#fef3c7' });
    }
    totalsRow.push(
      { text: 'TOTALS', bold: true, fontSize: 12, alignment: 'right' as const, fillColor: '#fef3c7' },
      { text: this.formatCurrency(report.totalDebits), bold: true, fontSize: 12, alignment: 'right' as const, fillColor: '#fef3c7' },
      { text: this.formatCurrency(report.totalCredits), bold: true, fontSize: 12, alignment: 'right' as const, fillColor: '#fef3c7' }
    );
    tableBody.push(totalsRow);

    content.push({
      table: {
        headerRows: 1,
        widths: colWidths,
        body: tableBody,
      },
      layout: this.getTableLayout(),
    });

    // Balance verification
    const isBalanced = report.balanced;
    const difference = Math.abs(report.totalDebits - report.totalCredits);

    content.push({
      text: isBalanced
        ? 'Trial Balance is BALANCED'
        : `Trial Balance is NOT BALANCED - Difference: ${this.formatCurrency(difference)}`,
      style: isBalanced ? 'balancedMessage' : 'unbalancedMessage',
      margin: [0, 20, 0, 0] as [number, number, number, number],
      alignment: 'center' as const,
    });

    // Net Profit/Loss calculation
    const { netProfitLoss, isProfit } = this.calculateTBNetProfitLoss(report);
    if (Math.abs(netProfitLoss) > 0.01) {
      content.push({
        text: `${isProfit ? 'Net Profit' : 'Net Loss'}: ${this.formatCurrency(netProfitLoss)}`,
        bold: true,
        color: isProfit ? '#166534' : '#dc2626',
        margin: [0, 10, 0, 0] as [number, number, number, number],
        alignment: 'center' as const,
      });
    }

    return this.buildReportDocDefinition(content, 'portrait');
  }

  // ============================================================================
  // INCOME STATEMENT PDF GENERATION
  // ============================================================================

  /**
   * Generate PDF for Income Statement
   * @param report - Income Statement report data
   * @param options - PDF generation options
   */
  async generateISPDF(
    report: IncomeStatement,
    options: ISReportPDFOptions
  ): Promise<Blob> {
    const docDefinition = this.buildISDocument(report, options);
    return this.getPdfBlob(docDefinition);
  }

  /**
   * Download Income Statement PDF
   */
  async downloadISPDF(
    report: IncomeStatement,
    options: ISReportPDFOptions
  ): Promise<void> {
    const docDefinition = this.buildISDocument(report, options);
    const fileName = `income-statement-${this.formatDateForFilename(report.startDate)}-to-${this.formatDateForFilename(report.endDate)}`;
    await this.downloadPdf(docDefinition, fileName);
  }

  /**
   * Build Income Statement document definition
   */
  private buildISDocument(
    report: IncomeStatement,
    options: ISReportPDFOptions
  ): TDocumentDefinitions {
    const content: Content[] = [];
    const includeAccountCodes = options.includeAccountCodes ?? true;
    const includeDetails = options.includeAccountDetails ?? true;
    const showPercentages = options.showPercentages ?? false;
    const totalRevenue = report.revenue.subtotal;

    // Header section
    content.push(this.buildReportHeader(
      options.companyName,
      'Income Statement',
      `For the period: ${this.formatDate(report.startDate)} to ${this.formatDate(report.endDate)}`,
      undefined,
      options.preparedBy
    ));

    // Helper function to calculate percentage
    const getPct = (amount: number): string => {
      if (!showPercentages || totalRevenue === 0) return '';
      return ` (${((Math.abs(amount) / Math.abs(totalRevenue)) * 100).toFixed(1)}%)`;
    };

    // === SALES SECTION ===
    content.push(this.buildISSectionHeader('SALES'));
    if (includeDetails) {
      content.push(this.buildAccountTable(this.getISSalesAccounts(report.revenue), includeAccountCodes, showPercentages, totalRevenue));
    }
    content.push(this.buildSubtotalRow('Total Sales', this.getISSalesTotal(report.revenue), getPct(this.getISSalesTotal(report.revenue))));

    // === COST OF SALES ===
    content.push(this.buildISSectionHeader('COST OF SALES'));
    if (includeDetails && report.costOfGoodsSold.accounts.length > 0) {
      content.push(this.buildAccountTable(report.costOfGoodsSold.accounts, includeAccountCodes, showPercentages, totalRevenue));
    }
    content.push(this.buildSubtotalRow('Total Cost of Sales', report.costOfGoodsSold.subtotal, getPct(report.costOfGoodsSold.subtotal)));

    // === GROSS PROFIT ===
    content.push(this.buildGrandTotalRow('GROSS PROFIT', report.grossProfit, report.grossProfit >= 0, getPct(report.grossProfit)));

    // === OTHER INCOME ===
    const otherIncome = this.getISOtherIncomeAccounts(report.revenue);
    if (otherIncome.length > 0 || includeDetails) {
      content.push(this.buildISSectionHeader('OTHER INCOME'));
      if (includeDetails && otherIncome.length > 0) {
        content.push(this.buildAccountTable(otherIncome, includeAccountCodes, showPercentages, totalRevenue));
      }
      content.push(this.buildSubtotalRow('Total Other Income', this.getISOtherIncomeTotal(report.revenue), getPct(this.getISOtherIncomeTotal(report.revenue))));
    }

    // === EXPENSES ===
    content.push(this.buildISSectionHeader('EXPENSES'));
    if (includeDetails) {
      // Show expense subsections if available
      if (report.operatingExpenses.subsections && report.operatingExpenses.subsections.length > 0) {
        for (const subsection of report.operatingExpenses.subsections) {
          if (subsection.accounts.length === 0) continue;
          content.push({
            text: `  ${subsection.name}`,
            bold: true,
            italic: true,
            color: '#4b5563',
            margin: [0, 5, 0, 2] as [number, number, number, number],
            fontSize: 10,
          });
          content.push(this.buildAccountTable(subsection.accounts, includeAccountCodes, showPercentages, totalRevenue, 2));
        }
      } else {
        content.push(this.buildAccountTable(report.operatingExpenses.accounts, includeAccountCodes, showPercentages, totalRevenue));
      }
    }
    content.push(this.buildSubtotalRow('Total Expenses', report.operatingExpenses.subtotal, getPct(report.operatingExpenses.subtotal)));

    // === OPERATING PROFIT ===
    content.push(this.buildGrandTotalRow('OPERATING PROFIT', report.operatingIncome, report.operatingIncome >= 0, getPct(report.operatingIncome)));

    // === OTHER INCOME/EXPENSES ===
    if (report.otherIncomeExpenses.accounts.length > 0 || Math.abs(report.otherIncomeExpenses.subtotal) > 0.01) {
      content.push(this.buildISSectionHeader('OTHER INCOME/EXPENSES'));
      if (includeDetails && report.otherIncomeExpenses.accounts.length > 0) {
        content.push(this.buildAccountTable(report.otherIncomeExpenses.accounts, includeAccountCodes, showPercentages, totalRevenue));
      }
      content.push(this.buildSubtotalRow('Total Other Income/Expenses', report.otherIncomeExpenses.subtotal, getPct(report.otherIncomeExpenses.subtotal)));
    }

    // === INCOME TAX ===
    if (Math.abs(report.incomeTaxExpense) > 0.01) {
      content.push({
        table: {
          widths: ['*', 'auto'],
          body: [[
            { text: 'Income Tax Expense', bold: true },
            { text: this.formatCurrency(report.incomeTaxExpense), alignment: 'right' as const, bold: true },
          ]],
        },
        layout: 'noBorders',
        margin: [0, 5, 0, 5] as [number, number, number, number],
      });
    }

    // === NET PROFIT/LOSS ===
    const isProfit = report.netIncome >= 0;
    content.push({
      table: {
        widths: ['*', 'auto'],
        body: [[
          {
            text: isProfit ? 'NET PROFIT' : 'NET LOSS',
            bold: true,
            fontSize: 14,
            color: isProfit ? '#166534' : '#dc2626',
          },
          {
            text: this.formatCurrency(Math.abs(report.netIncome)) + getPct(report.netIncome),
            alignment: 'right' as const,
            bold: true,
            fontSize: 14,
            color: isProfit ? '#166534' : '#dc2626',
          },
        ]],
      },
      layout: {
        fillColor: () => isProfit ? '#d1fae5' : '#fee2e2',
        hLineWidth: (i: number) => i === 0 ? 2 : (i === 1 ? 2 : 0),
        vLineWidth: () => 0,
        hLineColor: () => '#9ca3af',
      },
      margin: [0, 15, 0, 0] as [number, number, number, number],
    });

    return this.buildReportDocDefinition(content, 'portrait');
  }

  // ============================================================================
  // BALANCE SHEET PDF GENERATION
  // ============================================================================

  /**
   * Generate PDF for Balance Sheet
   * @param report - Balance Sheet report data
   * @param options - PDF generation options
   */
  async generateBSPDF(
    report: BalanceSheet,
    options: BSReportPDFOptions
  ): Promise<Blob> {
    const docDefinition = this.buildBSDocument(report, options);
    return this.getPdfBlob(docDefinition);
  }

  /**
   * Download Balance Sheet PDF
   */
  async downloadBSPDF(
    report: BalanceSheet,
    options: BSReportPDFOptions
  ): Promise<void> {
    const docDefinition = this.buildBSDocument(report, options);
    const fileName = `balance-sheet-${this.formatDateForFilename(report.asOfDate)}`;
    await this.downloadPdf(docDefinition, fileName);
  }

  /**
   * Build Balance Sheet document definition
   */
  private buildBSDocument(
    report: BalanceSheet,
    options: BSReportPDFOptions
  ): TDocumentDefinitions {
    const content: Content[] = [];
    const includeAccountCodes = options.includeAccountCodes ?? true;
    const includeDetails = options.includeAccountDetails ?? true;

    // Header section
    content.push(this.buildReportHeader(
      options.companyName,
      'Balance Sheet',
      `As of: ${this.formatDate(report.asOfDate)}`,
      undefined,
      options.preparedBy
    ));

    // =========================================================================
    // ASSETS
    // =========================================================================
    content.push(this.buildBSMajorSectionHeader('ASSETS'));

    // Non-Current Assets
    content.push(this.buildBSSectionHeader('Non-current Assets'));
    if (includeDetails && report.assets.nonCurrentAssets.subsections) {
      for (const subsection of report.assets.nonCurrentAssets.subsections) {
        if (subsection.accounts.length === 0) continue;
        content.push({
          text: `  ${subsection.name}`,
          bold: true,
          italic: true,
          color: '#4b5563',
          margin: [0, 3, 0, 2] as [number, number, number, number],
          fontSize: 10,
        });
        content.push(this.buildBSAccountTable(subsection.accounts, includeAccountCodes));
      }
    } else if (includeDetails) {
      content.push(this.buildBSAccountTable(report.assets.nonCurrentAssets.accounts, includeAccountCodes));
    }
    content.push(this.buildBSSubtotalRow('Total Non-current Assets', report.assets.nonCurrentAssets.subtotal));

    // Current Assets
    content.push(this.buildBSSectionHeader('Current Assets'));
    if (includeDetails && report.assets.currentAssets.subsections) {
      for (const subsection of report.assets.currentAssets.subsections) {
        if (subsection.accounts.length === 0) continue;
        content.push(this.buildBSAccountTable(subsection.accounts, includeAccountCodes));
      }
    } else if (includeDetails) {
      content.push(this.buildBSAccountTable(report.assets.currentAssets.accounts, includeAccountCodes));
    }
    content.push(this.buildBSSubtotalRow('Total Current Assets', report.assets.currentAssets.subtotal));

    // TOTAL ASSETS
    content.push(this.buildBSGrandTotalRow('TOTAL ASSETS', report.assets.totalAssets));

    // =========================================================================
    // EQUITY AND LIABILITIES
    // =========================================================================
    content.push({ text: '', margin: [0, 15, 0, 0] as [number, number, number, number] }); // Spacer
    content.push(this.buildBSMajorSectionHeader('EQUITY AND LIABILITIES'));

    // Capital and Reserves (Equity)
    content.push(this.buildBSSectionHeader('Capital and Reserves'));
    if (includeDetails && report.equity.subsections) {
      for (const subsection of report.equity.subsections) {
        if (subsection.accounts.length === 0 && Math.abs(subsection.subtotal) < 0.01) continue;
        content.push(this.buildBSAccountTable(subsection.accounts, includeAccountCodes));
      }
    } else if (includeDetails) {
      content.push(this.buildBSAccountTable(report.equity.accounts, includeAccountCodes));
    }
    content.push(this.buildBSSubtotalRow('Total Capital and Reserves', report.totalEquity));

    // Non-Current Liabilities
    content.push(this.buildBSSectionHeader('Non-current Liabilities'));
    if (includeDetails && report.liabilities.nonCurrentLiabilities.subsections) {
      for (const subsection of report.liabilities.nonCurrentLiabilities.subsections) {
        if (subsection.accounts.length === 0) continue;
        content.push(this.buildBSAccountTable(subsection.accounts, includeAccountCodes));
      }
    } else if (includeDetails) {
      content.push(this.buildBSAccountTable(report.liabilities.nonCurrentLiabilities.accounts, includeAccountCodes));
    }
    content.push(this.buildBSSubtotalRow('Total Non-current Liabilities', report.liabilities.nonCurrentLiabilities.subtotal));

    // Current Liabilities
    content.push(this.buildBSSectionHeader('Current Liabilities'));
    if (includeDetails && report.liabilities.currentLiabilities.subsections) {
      for (const subsection of report.liabilities.currentLiabilities.subsections) {
        if (subsection.accounts.length === 0) continue;
        content.push(this.buildBSAccountTable(subsection.accounts, includeAccountCodes));
      }
    } else if (includeDetails) {
      content.push(this.buildBSAccountTable(report.liabilities.currentLiabilities.accounts, includeAccountCodes));
    }
    content.push(this.buildBSSubtotalRow('Total Current Liabilities', report.liabilities.currentLiabilities.subtotal));

    // TOTAL EQUITY AND LIABILITIES
    content.push(this.buildBSGrandTotalRow('TOTAL EQUITY AND LIABILITIES', report.totalLiabilitiesAndEquity));

    // Balance verification
    content.push({
      text: report.balanced
        ? 'Balance Sheet is BALANCED (Total Assets = Total Equity + Liabilities)'
        : `Balance Sheet is NOT BALANCED - Difference: ${this.formatCurrency(Math.abs(report.assets.totalAssets - report.totalLiabilitiesAndEquity))}`,
      style: report.balanced ? 'balancedMessage' : 'unbalancedMessage',
      margin: [0, 20, 0, 0] as [number, number, number, number],
      alignment: 'center' as const,
    });

    return this.buildReportDocDefinition(content, 'portrait');
  }

  // ============================================================================
  // HELPER METHODS FOR REPORT PDF GENERATION
  // ============================================================================

  /**
   * Build standard report header
   */
  private buildReportHeader(
    companyName: string,
    reportTitle: string,
    subtitle: string,
    subtitle2?: string,
    preparedBy?: string
  ): Content {
    const headerContent: Content[] = [
      { text: companyName, style: 'companyName', alignment: 'center' as const, margin: [0, 0, 0, 5] as [number, number, number, number] },
      { text: reportTitle, style: 'reportTitle', alignment: 'center' as const, margin: [0, 0, 0, 5] as [number, number, number, number] },
      { text: subtitle, style: 'reportSubtitle', alignment: 'center' as const, margin: [0, 0, 0, 2] as [number, number, number, number] },
    ];

    if (subtitle2) {
      headerContent.push({ text: subtitle2, style: 'reportSubtitle', alignment: 'center' as const, margin: [0, 0, 0, 2] as [number, number, number, number] });
    }

    if (preparedBy) {
      headerContent.push({ text: `Prepared by: ${preparedBy}`, style: 'preparedBy', alignment: 'center' as const, margin: [0, 0, 0, 0] as [number, number, number, number] });
    }

    return {
      stack: headerContent,
      margin: [0, 0, 0, 20] as [number, number, number, number],
    };
  }

  /**
   * Build document definition with common styles
   */
  private buildReportDocDefinition(content: Content[], pageOrientation: 'portrait' | 'landscape'): TDocumentDefinitions {
    return {
      content,
      pageOrientation,
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 60] as [number, number, number, number],
      footer: (currentPage: number, pageCount: number) => ({
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: 'center' as const,
        margin: [0, 20, 0, 0] as [number, number, number, number],
        fontSize: 9,
        color: '#9ca3af',
      }),
      styles: {
        companyName: {
          fontSize: 16,
          bold: true,
          color: '#1f2937',
        },
        reportTitle: {
          fontSize: 14,
          bold: true,
          color: '#374151',
        },
        reportSubtitle: {
          fontSize: 11,
          color: '#6b7280',
        },
        preparedBy: {
          fontSize: 10,
          italic: true,
          color: '#9ca3af',
        },
        sectionHeader: {
          fontSize: 11,
          bold: true,
          color: '#1e3a8a',
        },
        tableHeader: {
          bold: true,
          fontSize: 10,
          color: '#ffffff',
          fillColor: '#4472c4',
        },
        tableLabel: {
          fontSize: 10,
          color: '#4b5563',
        },
        subText: {
          fontSize: 10,
          color: '#6b7280',
          italic: true,
        },
        balancedMessage: {
          fontSize: 11,
          bold: true,
          color: '#166534',
          fillColor: '#d1fae5',
        },
        unbalancedMessage: {
          fontSize: 11,
          bold: true,
          color: '#dc2626',
          fillColor: '#fee2e2',
        },
      },
      defaultStyle: {
        fontSize: 10,
        color: '#374151',
      },
    };
  }

  /**
   * Get standard table layout
   */
  private getTableLayout(): object {
    return {
      fillColor: (rowIndex: number) => rowIndex === 0 ? '#4472c4' : (rowIndex % 2 === 0 ? '#f9fafb' : null),
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#e5e7eb',
      vLineColor: () => '#e5e7eb',
      paddingLeft: () => 5,
      paddingRight: () => 5,
      paddingTop: () => 3,
      paddingBottom: () => 3,
    };
  }

  // ============================================================================
  // TRIAL BALANCE HELPER METHODS
  // ============================================================================

  /**
   * Group Trial Balance accounts by type
   */
  private groupTrialBalanceByType(accounts: TrialBalanceLine[]): Array<{
    type: string;
    label: string;
    accounts: TrialBalanceLine[];
    totalDebit: number;
    totalCredit: number;
  }> {
    const typeOrder = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
    const typeLabels: Record<string, string> = {
      ASSET: 'ASSETS',
      LIABILITY: 'LIABILITIES',
      EQUITY: 'EQUITY',
      REVENUE: 'REVENUE',
      EXPENSE: 'EXPENSES',
    };

    return typeOrder.map(type => {
      const typeAccounts = accounts.filter(acc => acc.accountType === type);
      let totalDebit = 0;
      let totalCredit = 0;

      for (const account of typeAccounts) {
        totalDebit += this.getTBDebitAmount(account);
        totalCredit += this.getTBCreditAmount(account);
      }

      return {
        type,
        label: typeLabels[type] || type,
        accounts: typeAccounts.sort((a, b) => a.accountCode.localeCompare(b.accountCode)),
        totalDebit: Math.round(totalDebit * 100) / 100,
        totalCredit: Math.round(totalCredit * 100) / 100,
      };
    });
  }

  /**
   * Get debit amount for TB display
   */
  private getTBDebitAmount(account: TrialBalanceLine): number {
    if (account.accountType === 'ASSET' || account.accountType === 'EXPENSE') {
      return account.balance > 0 ? account.balance : 0;
    } else {
      return account.balance < 0 ? Math.abs(account.balance) : 0;
    }
  }

  /**
   * Get credit amount for TB display
   */
  private getTBCreditAmount(account: TrialBalanceLine): number {
    if (account.accountType === 'LIABILITY' || account.accountType === 'EQUITY' || account.accountType === 'REVENUE') {
      return account.balance > 0 ? account.balance : 0;
    } else {
      return account.balance < 0 ? Math.abs(account.balance) : 0;
    }
  }

  /**
   * Calculate Net Profit/Loss for TB
   */
  private calculateTBNetProfitLoss(report: TrialBalanceReport): { netProfitLoss: number; isProfit: boolean } {
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
      netProfitLoss: Math.round(Math.abs(netProfitLoss) * 100) / 100,
      isProfit: netProfitLoss >= 0,
    };
  }

  // ============================================================================
  // INCOME STATEMENT HELPER METHODS
  // ============================================================================

  /**
   * Build IS section header
   */
  private buildISSectionHeader(title: string): Content {
    return {
      text: title,
      style: 'sectionHeader',
      fillColor: '#dbeafe',
      margin: [0, 10, 0, 5] as [number, number, number, number],
    };
  }

  /**
   * Build account table for IS
   */
  private buildAccountTable(
    accounts: AccountBalance[],
    includeAccountCodes: boolean,
    showPercentages: boolean,
    totalRevenue: number,
    indentLevel: number = 1
  ): Content {
    if (accounts.length === 0) {
      return { text: '' };
    }

    const indent = '    '.repeat(indentLevel);
    const tableBody: TableCell[][] = [];

    for (const account of accounts) {
      const row: TableCell[] = [];
      if (includeAccountCodes) {
        row.push({ text: account.accountCode, fontSize: 9 });
      }
      row.push({ text: indent + account.accountName, fontSize: 9 });
      row.push({ text: this.formatCurrency(account.balance), alignment: 'right' as const, fontSize: 9 });

      if (showPercentages) {
        const pct = totalRevenue !== 0 ? (Math.abs(account.balance) / Math.abs(totalRevenue)) * 100 : 0;
        row.push({ text: `${pct.toFixed(1)}%`, alignment: 'right' as const, fontSize: 9 });
      }

      tableBody.push(row);
    }

    const widths = includeAccountCodes
      ? (showPercentages ? ['auto', '*', 'auto', 'auto'] : ['auto', '*', 'auto'])
      : (showPercentages ? ['*', 'auto', 'auto'] : ['*', 'auto']);

    return {
      table: {
        widths,
        body: tableBody,
      },
      layout: 'noBorders',
      margin: [0, 2, 0, 2] as [number, number, number, number],
    };
  }

  /**
   * Build subtotal row
   */
  private buildSubtotalRow(label: string, amount: number, pctStr: string = ''): Content {
    return {
      table: {
        widths: ['*', 'auto'],
        body: [[
          { text: label, bold: true, alignment: 'right' as const },
          { text: this.formatCurrency(amount) + pctStr, alignment: 'right' as const, bold: true },
        ]],
      },
      layout: {
        fillColor: () => '#f3f4f6',
        hLineWidth: (i: number) => i === 0 ? 1 : 0,
        vLineWidth: () => 0,
        hLineColor: () => '#d1d5db',
      },
      margin: [0, 5, 0, 5] as [number, number, number, number],
    };
  }

  /**
   * Build grand total row (for GROSS PROFIT, OPERATING PROFIT)
   */
  private buildGrandTotalRow(label: string, amount: number, isPositive: boolean, pctStr: string = ''): Content {
    return {
      table: {
        widths: ['*', 'auto'],
        body: [[
          {
            text: label,
            bold: true,
            fontSize: 12,
            color: isPositive ? '#166534' : '#dc2626',
          },
          {
            text: this.formatCurrency(amount) + pctStr,
            alignment: 'right' as const,
            bold: true,
            fontSize: 12,
            color: isPositive ? '#166534' : '#dc2626',
          },
        ]],
      },
      layout: {
        fillColor: () => isPositive ? '#d1fae5' : '#fee2e2',
        hLineWidth: () => 1,
        vLineWidth: () => 0,
        hLineColor: () => '#d1d5db',
      },
      margin: [0, 10, 0, 10] as [number, number, number, number],
    };
  }

  /**
   * Get Sales accounts from revenue section
   */
  private getISSalesAccounts(revenue: FinancialStatementSection): AccountBalance[] {
    if (revenue.subsections && revenue.subsections.length > 0) {
      const salesAccounts: AccountBalance[] = [];
      for (const subsection of revenue.subsections) {
        if (subsection.name === 'Sales Revenue' || subsection.name === 'Service Revenue') {
          salesAccounts.push(...subsection.accounts);
        }
      }
      return salesAccounts;
    }
    return revenue.accounts.filter(acc => {
      const code = parseInt(acc.accountCode);
      return !isNaN(code) && code >= 4000 && code < 4200;
    });
  }

  /**
   * Get total for Sales
   */
  private getISSalesTotal(revenue: FinancialStatementSection): number {
    if (revenue.subsections && revenue.subsections.length > 0) {
      let total = 0;
      for (const subsection of revenue.subsections) {
        if (subsection.name === 'Sales Revenue' || subsection.name === 'Service Revenue') {
          total += subsection.subtotal;
        }
      }
      return total;
    }
    return this.getISSalesAccounts(revenue).reduce((sum, acc) => sum + acc.balance, 0);
  }

  /**
   * Get Other Income accounts
   */
  private getISOtherIncomeAccounts(revenue: FinancialStatementSection): AccountBalance[] {
    if (revenue.subsections && revenue.subsections.length > 0) {
      for (const subsection of revenue.subsections) {
        if (subsection.name === 'Other Revenue') {
          return subsection.accounts;
        }
      }
      return [];
    }
    return revenue.accounts.filter(acc => {
      const code = parseInt(acc.accountCode);
      return !isNaN(code) && code >= 4200 && code < 5000;
    });
  }

  /**
   * Get total for Other Income
   */
  private getISOtherIncomeTotal(revenue: FinancialStatementSection): number {
    if (revenue.subsections && revenue.subsections.length > 0) {
      for (const subsection of revenue.subsections) {
        if (subsection.name === 'Other Revenue') {
          return subsection.subtotal;
        }
      }
      return 0;
    }
    return this.getISOtherIncomeAccounts(revenue).reduce((sum, acc) => sum + acc.balance, 0);
  }

  // ============================================================================
  // BALANCE SHEET HELPER METHODS
  // ============================================================================

  /**
   * Build BS major section header (ASSETS, EQUITY AND LIABILITIES)
   */
  private buildBSMajorSectionHeader(title: string): Content {
    return {
      text: title,
      bold: true,
      fontSize: 12,
      color: '#ffffff',
      fillColor: '#1e3a8a',
      margin: [5, 5, 5, 5] as [number, number, number, number],
    };
  }

  /**
   * Build BS section header (Non-current Assets, Current Liabilities, etc.)
   */
  private buildBSSectionHeader(title: string): Content {
    return {
      text: title,
      style: 'sectionHeader',
      fillColor: '#dbeafe',
      margin: [0, 8, 0, 5] as [number, number, number, number],
    };
  }

  /**
   * Build BS account table
   */
  private buildBSAccountTable(accounts: AccountBalance[], includeAccountCodes: boolean): Content {
    if (accounts.length === 0) {
      return { text: '' };
    }

    const tableBody: TableCell[][] = [];

    for (const account of accounts) {
      const row: TableCell[] = [];
      if (includeAccountCodes) {
        row.push({ text: account.accountCode, fontSize: 9 });
      }
      row.push({ text: '      ' + account.accountName, fontSize: 9 });
      row.push({ text: this.formatCurrency(account.balance), alignment: 'right' as const, fontSize: 9 });
      tableBody.push(row);
    }

    const widths = includeAccountCodes ? ['auto', '*', 'auto'] : ['*', 'auto'];

    return {
      table: {
        widths,
        body: tableBody,
      },
      layout: 'noBorders',
      margin: [0, 2, 0, 2] as [number, number, number, number],
    };
  }

  /**
   * Build BS subtotal row
   */
  private buildBSSubtotalRow(label: string, amount: number): Content {
    return {
      table: {
        widths: ['*', 'auto'],
        body: [[
          { text: label, bold: true, alignment: 'right' as const },
          { text: this.formatCurrency(amount), alignment: 'right' as const, bold: true },
        ]],
      },
      layout: {
        fillColor: () => '#f3f4f6',
        hLineWidth: (i: number) => i === 0 ? 1 : 0,
        vLineWidth: () => 0,
        hLineColor: () => '#d1d5db',
      },
      margin: [0, 5, 0, 5] as [number, number, number, number],
    };
  }

  /**
   * Build BS grand total row (TOTAL ASSETS, TOTAL EQUITY AND LIABILITIES)
   */
  private buildBSGrandTotalRow(label: string, amount: number): Content {
    return {
      table: {
        widths: ['*', 'auto'],
        body: [[
          {
            text: label,
            bold: true,
            fontSize: 12,
            color: '#1e3a8a',
          },
          {
            text: this.formatCurrency(amount),
            alignment: 'right' as const,
            bold: true,
            fontSize: 12,
            color: '#1e3a8a',
          },
        ]],
      },
      layout: {
        fillColor: () => '#fef3c7',
        hLineWidth: (i: number) => i === 0 ? 2 : (i === 1 ? 2 : 0),
        vLineWidth: () => 0,
        hLineColor: () => '#9ca3af',
      },
      margin: [0, 10, 0, 0] as [number, number, number, number],
    };
  }
}

// Export singleton instance
export const pdfService = new PDFService();
