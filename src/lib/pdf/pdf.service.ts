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
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import type { CustomerStatement } from '@/types/accounting/statement';
import type { CreditNote } from '@/types/accounting/credit-note';

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
}

// Export singleton instance
export const pdfService = new PDFService();
