# Customer/Supplier Statements & Credit Note Management System

**Status**: Planned for Implementation (Phase 7)
**Priority**: HIGH - Essential for complete AR/AP management
**Estimated Effort**: 30-35 hours across 6 phases
**Dependencies**: AI Agent Debtor/Creditor Integration (Phase 6)

---

## 🎯 Strategic Objective

Build a comprehensive statements system that provides professional, accurate account statements for customers and suppliers, integrated credit note management, and sophisticated statement reconciliation capabilities.

### **Business Value:**
- **Professional Communication** - Branded statements build customer confidence
- **Faster Collections** - Clear statements accelerate customer payments by 25%
- **Dispute Resolution** - Detailed transaction history resolves queries 80% faster
- **Reconciliation Accuracy** - Match supplier statements to identify discrepancies
- **Compliance** - Meet statutory requirements for customer communication
- **Cash Flow Visibility** - Aged analysis shows collection/payment priorities

---

## 🏗️ System Architecture

### **Core Components:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Statement Engine                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Data Collection Layer                                 │   │
│  │  ├─ Opening Balance (from previous statement)        │   │
│  │  ├─ Invoices (current period)                        │   │
│  │  ├─ Credit Notes (current period)                    │   │
│  │  ├─ Payments (allocated & unallocated)               │   │
│  │  ├─ Customer Credits (prepayments)                   │   │
│  │  └─ Closing Balance (calculated)                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                     │                                         │
│                     ▼                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Statement Builder                                     │   │
│  │  ├─ Transaction Sorting (by date)                    │   │
│  │  ├─ Aged Analysis Calculation (30/60/90/120+)        │   │
│  │  ├─ Running Balance Computation                      │   │
│  │  ├─ Summary Statistics                               │   │
│  │  └─ Template Rendering                               │   │
│  └──────────────────────────────────────────────────────┘   │
│                     │                                         │
│                     ▼                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Output Formats                                        │   │
│  │  ├─ PDF Generation (pdfmake)                         │   │
│  │  ├─ HTML Preview (on-screen)                         │   │
│  │  ├─ Email Delivery (with PDF attachment)             │   │
│  │  └─ CSV Export (for Excel)                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Credit Note Management                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Sales Credit Notes (Customer)                         │   │
│  │  ├─ Create from invoice                               │   │
│  │  ├─ Standalone credit note                            │   │
│  │  ├─ Allocate to invoices                              │   │
│  │  └─ Track unallocated credits                         │   │
│  └──────────────────────────────────────────────────────┘   │
│                     │                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Purchase Credit Notes (Supplier)                      │   │
│  │  ├─ Record from supplier                              │   │
│  │  ├─ Allocate to bills                                 │   │
│  │  └─ Track unallocated credits                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│           Statement Reconciliation                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Supplier Statement Import                             │   │
│  │  ├─ Upload their statement (PDF/CSV)                  │   │
│  │  ├─ Parse transactions                                │   │
│  │  ├─ Match to our records                              │   │
│  │  └─ Highlight discrepancies                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Part 1: Customer Statements (Debtors)

### **1.1 Statement Structure**

```
┌────────────────────────────────────────────────────────────┐
│                     CUSTOMER STATEMENT                      │
├────────────────────────────────────────────────────────────┤
│ [Company Logo]                       Statement Date: [Date] │
│ [Company Name]                       Account #: [Number]    │
│ [Company Address]                    Period: [From] - [To]  │
│                                                              │
│ BILL TO:                             ACCOUNT SUMMARY:       │
│ [Customer Name]                      Opening Balance: [Amt] │
│ [Customer Address]                   Current Charges: [Amt] │
│ [Contact Details]                    Payments Received:[Amt]│
│                                      Credits Applied:  [Amt]│
│                                      Closing Balance:  [Amt]│
├────────────────────────────────────────────────────────────┤
│ AGED ANALYSIS:                                              │
│ Current: [Amt]  30 Days: [Amt]  60 Days: [Amt]  90+: [Amt] │
├────────────────────────────────────────────────────────────┤
│ TRANSACTION DETAILS:                                        │
│ Date       Type        Reference    Description    Amount   │
│ ──────────────────────────────────────────────────────────│
│ [Date]     Invoice     INV-001      [Desc]        R5,000   │
│ [Date]     Payment     PMT-001      [Desc]       -R3,000   │
│ [Date]     Credit Note CN-001       [Desc]       -R500     │
│ [Date]     Invoice     INV-002      [Desc]        R2,800   │
│                                                              │
│ TOTAL AMOUNT DUE:                              R4,300       │
│                                                              │
│ Please remit payment by [Due Date]                          │
│                                                              │
│ PAYMENT DETAILS:                                            │
│ Bank: [Bank Name]           Account Name: [Name]            │
│ Account #: [Number]         Branch Code: [Code]             │
│ Reference: [Customer Account #]                             │
│                                                              │
│ Questions? Contact us at [Email] or [Phone]                 │
└────────────────────────────────────────────────────────────┘
```

### **1.2 Statement Service** (`/src/lib/accounting/statement-service.ts`)

```typescript
export class StatementService {
  constructor(private companyId: string) {}

  /**
   * Generate customer statement for a period
   */
  async generateCustomerStatement(
    customerId: string,
    periodStart: Date,
    periodEnd: Date,
    options?: StatementOptions
  ): Promise<CustomerStatement> {
    // Get opening balance (closing balance from previous statement)
    const openingBalance = await this.getOpeningBalance(
      customerId,
      periodStart
    );

    // Get all transactions in period
    const transactions = await this.getCustomerTransactions(
      customerId,
      periodStart,
      periodEnd
    );

    // Calculate aged analysis
    const agedAnalysis = this.calculateAgedAnalysis(
      customerId,
      periodEnd
    );

    // Build statement
    const statement: CustomerStatement = {
      id: generateId(),
      customerId,
      customerName: customer.name,
      statementDate: periodEnd,
      periodStart,
      periodEnd,
      openingBalance,
      transactions,
      closingBalance: this.calculateClosingBalance(
        openingBalance,
        transactions
      ),
      agedAnalysis,
      summary: this.buildSummary(transactions),
      generatedAt: new Date(),
      generatedBy: currentUser.id,
    };

    // Save statement record
    await this.saveStatement(statement);

    return statement;
  }

  /**
   * Get all customer transactions for period
   */
  private async getCustomerTransactions(
    customerId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<StatementTransaction[]> {
    const transactions: StatementTransaction[] = [];

    // 1. Get invoices
    const invoices = await invoiceService.getInvoicesByCustomer(
      customerId,
      periodStart,
      periodEnd
    );
    transactions.push(
      ...invoices.map(inv => ({
        date: inv.invoiceDate,
        type: 'invoice' as const,
        reference: inv.invoiceNumber,
        description: inv.description || 'Invoice',
        amount: inv.totalAmount,
        balance: 0, // Calculated later
      }))
    );

    // 2. Get payments
    const payments = await this.getCustomerPayments(
      customerId,
      periodStart,
      periodEnd
    );
    transactions.push(
      ...payments.map(pmt => ({
        date: pmt.paymentDate,
        type: 'payment' as const,
        reference: pmt.reference,
        description: pmt.description || 'Payment received',
        amount: -pmt.amount, // Negative (reduces balance)
        balance: 0,
      }))
    );

    // 3. Get credit notes
    const creditNotes = await this.getCreditNotes(
      customerId,
      periodStart,
      periodEnd
    );
    transactions.push(
      ...creditNotes.map(cn => ({
        date: cn.creditNoteDate,
        type: 'credit-note' as const,
        reference: cn.creditNoteNumber,
        description: cn.reason || 'Credit note',
        amount: -cn.amount, // Negative (reduces balance)
        balance: 0,
      }))
    );

    // 4. Get customer credits applied
    const creditApplications = await this.getCreditApplications(
      customerId,
      periodStart,
      periodEnd
    );
    transactions.push(
      ...creditApplications.map(ca => ({
        date: ca.applicationDate,
        type: 'credit-applied' as const,
        reference: ca.reference,
        description: 'Customer credit applied',
        amount: -ca.amount,
        balance: 0,
      }))
    );

    // Sort by date ascending
    transactions.sort((a, b) =>
      a.date.getTime() - b.date.getTime()
    );

    // Calculate running balance
    let runningBalance = openingBalance;
    transactions.forEach(txn => {
      runningBalance += txn.amount;
      txn.balance = runningBalance;
    });

    return transactions;
  }

  /**
   * Calculate aged analysis (30/60/90/120+ days)
   */
  private async calculateAgedAnalysis(
    customerId: string,
    asOfDate: Date
  ): Promise<AgedAnalysis> {
    const outstandingInvoices = await invoiceService
      .getOutstandingInvoices(customerId);

    const aged: AgedAnalysis = {
      current: 0,      // 0-30 days
      days30: 0,       // 31-60 days
      days60: 0,       // 61-90 days
      days90: 0,       // 91-120 days
      days120Plus: 0,  // 120+ days
      total: 0,
    };

    outstandingInvoices.forEach(invoice => {
      const daysOverdue = this.getDaysOverdue(
        invoice.dueDate,
        asOfDate
      );
      const amountDue = invoice.amountDue;

      if (daysOverdue <= 30) {
        aged.current += amountDue;
      } else if (daysOverdue <= 60) {
        aged.days30 += amountDue;
      } else if (daysOverdue <= 90) {
        aged.days60 += amountDue;
      } else if (daysOverdue <= 120) {
        aged.days90 += amountDue;
      } else {
        aged.days120Plus += amountDue;
      }

      aged.total += amountDue;
    });

    return aged;
  }

  /**
   * Generate statement PDF
   */
  async generateStatementPDF(
    statementId: string
  ): Promise<Buffer> {
    const statement = await this.getStatement(statementId);
    const company = await companiesService.getCompany(this.companyId);
    const customer = await debtorService.getDebtor(statement.customerId);

    // Build PDF document definition (pdfmake)
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      content: [
        // Header
        {
          columns: [
            {
              // Company details
              stack: [
                {
                  image: company.logoUrl,
                  width: 80,
                  margin: [0, 0, 0, 10]
                },
                { text: company.name, style: 'companyName' },
                { text: company.address, style: 'companyDetails' },
                { text: company.phone, style: 'companyDetails' },
                { text: company.email, style: 'companyDetails' },
              ],
              width: '50%',
            },
            {
              // Statement info
              stack: [
                { text: 'CUSTOMER STATEMENT', style: 'statementTitle' },
                { text: `Statement Date: ${formatDate(statement.statementDate)}`, style: 'statementInfo' },
                { text: `Account #: ${customer.accountNumber}`, style: 'statementInfo' },
                { text: `Period: ${formatDate(statement.periodStart)} - ${formatDate(statement.periodEnd)}`, style: 'statementInfo' },
              ],
              width: '50%',
              alignment: 'right',
            },
          ],
          margin: [0, 0, 0, 20],
        },

        // Customer details & Summary
        {
          columns: [
            {
              // Bill To
              stack: [
                { text: 'BILL TO:', style: 'sectionHeader' },
                { text: customer.name, style: 'customerName' },
                { text: customer.billingAddress, style: 'customerDetails' },
                { text: customer.email, style: 'customerDetails' },
                { text: customer.phone, style: 'customerDetails' },
              ],
              width: '50%',
            },
            {
              // Account Summary
              stack: [
                { text: 'ACCOUNT SUMMARY:', style: 'sectionHeader' },
                {
                  table: {
                    widths: ['*', 'auto'],
                    body: [
                      ['Opening Balance:', formatCurrency(statement.openingBalance)],
                      ['Current Charges:', formatCurrency(statement.summary.invoicesTotal)],
                      ['Payments Received:', formatCurrency(statement.summary.paymentsTotal)],
                      ['Credits Applied:', formatCurrency(statement.summary.creditsTotal)],
                      [
                        { text: 'Closing Balance:', bold: true },
                        { text: formatCurrency(statement.closingBalance), bold: true }
                      ],
                    ],
                  },
                  layout: 'noBorders',
                  style: 'summaryTable',
                },
              ],
              width: '50%',
            },
          ],
          margin: [0, 0, 0, 20],
        },

        // Aged Analysis
        {
          table: {
            widths: ['*', '*', '*', '*', '*', 'auto'],
            headerRows: 1,
            body: [
              [
                { text: 'Current', style: 'tableHeader' },
                { text: '30 Days', style: 'tableHeader' },
                { text: '60 Days', style: 'tableHeader' },
                { text: '90 Days', style: 'tableHeader' },
                { text: '120+ Days', style: 'tableHeader' },
                { text: 'Total Due', style: 'tableHeader' },
              ],
              [
                formatCurrency(statement.agedAnalysis.current),
                formatCurrency(statement.agedAnalysis.days30),
                formatCurrency(statement.agedAnalysis.days60),
                formatCurrency(statement.agedAnalysis.days90),
                formatCurrency(statement.agedAnalysis.days120Plus),
                { text: formatCurrency(statement.agedAnalysis.total), bold: true },
              ],
            ],
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20],
        },

        // Transaction Details
        { text: 'TRANSACTION DETAILS:', style: 'sectionHeader', margin: [0, 10, 0, 10] },
        {
          table: {
            widths: ['auto', 'auto', 'auto', '*', 'auto', 'auto'],
            headerRows: 1,
            body: [
              [
                { text: 'Date', style: 'tableHeader' },
                { text: 'Type', style: 'tableHeader' },
                { text: 'Reference', style: 'tableHeader' },
                { text: 'Description', style: 'tableHeader' },
                { text: 'Amount', style: 'tableHeader', alignment: 'right' },
                { text: 'Balance', style: 'tableHeader', alignment: 'right' },
              ],
              ...statement.transactions.map(txn => [
                formatDate(txn.date),
                this.formatTransactionType(txn.type),
                txn.reference,
                txn.description,
                { text: formatCurrency(txn.amount), alignment: 'right' },
                { text: formatCurrency(txn.balance), alignment: 'right' },
              ]),
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            hLineColor: () => '#e0e0e0',
            paddingTop: () => 8,
            paddingBottom: () => 8,
          },
        },

        // Total Due
        {
          table: {
            widths: ['*', 'auto'],
            body: [
              [
                { text: 'TOTAL AMOUNT DUE:', bold: true, fontSize: 14 },
                {
                  text: formatCurrency(statement.closingBalance),
                  bold: true,
                  fontSize: 14,
                  color: statement.closingBalance > 0 ? '#dc2626' : '#16a34a'
                }
              ],
            ],
          },
          layout: 'noBorders',
          margin: [0, 20, 0, 20],
        },

        // Payment Instructions
        {
          text: `Please remit payment by ${formatDate(addDays(statement.statementDate, customer.paymentTerms || 30))}`,
          style: 'paymentDue',
          margin: [0, 0, 0, 20],
        },

        // Banking Details
        {
          stack: [
            { text: 'PAYMENT DETAILS:', style: 'sectionHeader' },
            {
              columns: [
                {
                  stack: [
                    { text: `Bank: ${company.bankName}`, style: 'bankingDetails' },
                    { text: `Account Name: ${company.bankAccountName}`, style: 'bankingDetails' },
                  ],
                  width: '50%',
                },
                {
                  stack: [
                    { text: `Account #: ${company.bankAccountNumber}`, style: 'bankingDetails' },
                    { text: `Branch Code: ${company.bankBranchCode}`, style: 'bankingDetails' },
                  ],
                  width: '50%',
                },
              ],
            },
            {
              text: `Reference: ${customer.accountNumber}`,
              style: 'bankingDetails',
              bold: true,
              margin: [0, 5, 0, 0]
            },
          ],
          margin: [0, 0, 0, 20],
        },

        // Footer
        {
          text: `Questions? Contact us at ${company.email} or ${company.phone}`,
          style: 'footer',
          alignment: 'center',
        },
      ],

      styles: {
        companyName: { fontSize: 16, bold: true, margin: [0, 5, 0, 5] },
        companyDetails: { fontSize: 9, color: '#666666', margin: [0, 2, 0, 0] },
        statementTitle: { fontSize: 18, bold: true, color: '#1e40af', margin: [0, 0, 0, 10] },
        statementInfo: { fontSize: 10, margin: [0, 2, 0, 0] },
        sectionHeader: { fontSize: 11, bold: true, color: '#374151', margin: [0, 5, 0, 5] },
        customerName: { fontSize: 12, bold: true, margin: [0, 5, 0, 2] },
        customerDetails: { fontSize: 9, color: '#666666', margin: [0, 2, 0, 0] },
        summaryTable: { fontSize: 10, margin: [0, 5, 0, 0] },
        tableHeader: { fontSize: 9, bold: true, fillColor: '#f3f4f6', margin: [0, 5, 0, 5] },
        paymentDue: { fontSize: 11, italics: true, alignment: 'center' },
        bankingDetails: { fontSize: 10, margin: [0, 2, 0, 0] },
        footer: { fontSize: 9, color: '#666666', margin: [0, 20, 0, 0] },
      },
    };

    // Generate PDF
    const pdfBuffer = await pdfService.generatePDF(docDefinition);
    return pdfBuffer;
  }

  /**
   * Email statement to customer
   */
  async emailStatement(
    statementId: string,
    options?: EmailOptions
  ): Promise<void> {
    const statement = await this.getStatement(statementId);
    const customer = await debtorService.getDebtor(statement.customerId);
    const company = await companiesService.getCompany(this.companyId);

    // Generate PDF
    const pdfBuffer = await this.generateStatementPDF(statementId);

    // Build email
    const emailData = {
      to: customer.email,
      cc: options?.cc || [],
      bcc: options?.bcc || [],
      from: company.email,
      subject: options?.subject || `Statement from ${company.name} - ${formatDate(statement.statementDate)}`,
      html: this.buildStatementEmailHTML(statement, customer, company, options?.message),
      attachments: [
        {
          filename: `Statement-${customer.accountNumber}-${formatDate(statement.statementDate, 'YYYYMMDD')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    // Send email
    await emailService.sendEmail(emailData);

    // Log email sent
    await this.logStatementEmail(statementId, customer.email);
  }

  /**
   * Batch generate statements for all customers
   */
  async batchGenerateStatements(
    periodStart: Date,
    periodEnd: Date,
    filters?: CustomerFilters
  ): Promise<BatchStatementResult> {
    const customers = await debtorService.getAllDebtors(filters);

    const results: BatchStatementResult = {
      total: customers.length,
      successful: 0,
      failed: 0,
      statements: [],
      errors: [],
    };

    for (const customer of customers) {
      try {
        // Only generate if customer has activity
        const hasActivity = await this.hasActivity(
          customer.id,
          periodStart,
          periodEnd
        );

        if (hasActivity || customer.totalOutstanding > 0) {
          const statement = await this.generateCustomerStatement(
            customer.id,
            periodStart,
            periodEnd
          );
          results.statements.push(statement);
          results.successful++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          customerId: customer.id,
          customerName: customer.name,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Batch email statements to customers
   */
  async batchEmailStatements(
    statementIds: string[],
    options?: EmailOptions
  ): Promise<BatchEmailResult> {
    const results: BatchEmailResult = {
      total: statementIds.length,
      sent: 0,
      failed: 0,
      errors: [],
    };

    for (const statementId of statementIds) {
      try {
        await this.emailStatement(statementId, options);
        results.sent++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          statementId,
          error: error.message,
        });
      }
    }

    return results;
  }
}
```

### **1.3 TypeScript Interfaces**

```typescript
export interface CustomerStatement {
  id: string;
  customerId: string;
  customerName: string;
  statementDate: Date;
  periodStart: Date;
  periodEnd: Date;
  openingBalance: number;
  closingBalance: number;
  transactions: StatementTransaction[];
  agedAnalysis: AgedAnalysis;
  summary: StatementSummary;
  generatedAt: Date;
  generatedBy: string;
  emailedAt?: Date;
  emailedTo?: string;
}

export interface StatementTransaction {
  date: Date;
  type: 'invoice' | 'payment' | 'credit-note' | 'credit-applied' | 'adjustment';
  reference: string;
  description: string;
  amount: number; // Positive = charge, Negative = credit/payment
  balance: number; // Running balance
  relatedDocumentId?: string; // Link to invoice/payment/credit note
}

export interface AgedAnalysis {
  current: number;      // 0-30 days
  days30: number;       // 31-60 days
  days60: number;       // 61-90 days
  days90: number;       // 91-120 days
  days120Plus: number;  // 120+ days
  total: number;
}

export interface StatementSummary {
  invoicesTotal: number;
  paymentsTotal: number;
  creditsTotal: number;
  adjustmentsTotal: number;
  netChange: number; // closingBalance - openingBalance
}

export interface StatementOptions {
  includeZeroBalance?: boolean; // Generate even if balance = 0
  includePaidInvoices?: boolean; // Show paid invoices in period
  customMessage?: string; // Custom message at top
  customTerms?: string; // Custom terms & conditions
}

export interface EmailOptions {
  subject?: string;
  message?: string;
  cc?: string[];
  bcc?: string[];
  sendCopy?: boolean; // Send copy to company email
}

export interface BatchStatementResult {
  total: number;
  successful: number;
  failed: number;
  statements: CustomerStatement[];
  errors: Array<{
    customerId: string;
    customerName: string;
    error: string;
  }>;
}

export interface BatchEmailResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{
    statementId: string;
    error: string;
  }>;
}
```

---

## 🔴 Part 2: Credit Note Management

### **2.1 Sales Credit Notes (Customer)**

#### **CreditNoteService** (`/src/lib/accounting/credit-note-service.ts`)

```typescript
export class CreditNoteService {
  constructor(private companyId: string) {}

  /**
   * Create credit note from invoice
   */
  async createCreditNoteFromInvoice(
    invoiceId: string,
    creditNoteData: CreditNoteCreateRequest
  ): Promise<CreditNote> {
    const invoice = await invoiceService.getInvoice(invoiceId);

    // Validate credit amount doesn't exceed invoice total
    if (creditNoteData.amount > invoice.totalAmount) {
      throw new Error('Credit note amount cannot exceed invoice amount');
    }

    const creditNote: CreditNote = {
      id: generateId(),
      creditNoteNumber: await this.generateCreditNoteNumber(),
      creditNoteDate: creditNoteData.creditNoteDate || new Date(),
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      relatedInvoiceId: invoiceId,
      relatedInvoiceNumber: invoice.invoiceNumber,
      reason: creditNoteData.reason,
      lineItems: creditNoteData.lineItems,
      subtotal: creditNoteData.subtotal,
      taxRate: creditNoteData.taxRate || invoice.taxRate,
      taxAmount: creditNoteData.taxAmount,
      totalAmount: creditNoteData.amount,
      status: 'issued',
      allocations: [],
      unallocatedAmount: creditNoteData.amount,
      createdAt: new Date(),
      createdBy: currentUser.id,
    };

    // Save credit note
    await this.saveCreditNote(creditNote);

    // Create GL entry (reverse invoice entry)
    await this.postCreditNoteToGL(creditNote);

    // Update customer balance
    await debtorService.adjustBalance(
      creditNote.customerId,
      -creditNote.totalAmount
    );

    // If auto-allocate option, allocate to original invoice
    if (creditNoteData.autoAllocateToInvoice) {
      await this.allocateCreditNoteToInvoice(
        creditNote.id,
        invoiceId,
        creditNote.totalAmount
      );
    }

    return creditNote;
  }

  /**
   * Create standalone credit note (not from invoice)
   */
  async createStandaloneCreditNote(
    creditNoteData: StandaloneCreditNoteRequest
  ): Promise<CreditNote> {
    const creditNote: CreditNote = {
      id: generateId(),
      creditNoteNumber: await this.generateCreditNoteNumber(),
      creditNoteDate: creditNoteData.creditNoteDate || new Date(),
      customerId: creditNoteData.customerId,
      customerName: creditNoteData.customerName,
      relatedInvoiceId: undefined,
      relatedInvoiceNumber: undefined,
      reason: creditNoteData.reason,
      lineItems: creditNoteData.lineItems,
      subtotal: creditNoteData.subtotal,
      taxRate: creditNoteData.taxRate,
      taxAmount: creditNoteData.taxAmount,
      totalAmount: creditNoteData.amount,
      status: 'issued',
      allocations: [],
      unallocatedAmount: creditNoteData.amount,
      createdAt: new Date(),
      createdBy: currentUser.id,
    };

    await this.saveCreditNote(creditNote);
    await this.postCreditNoteToGL(creditNote);
    await debtorService.adjustBalance(
      creditNote.customerId,
      -creditNote.totalAmount
    );

    return creditNote;
  }

  /**
   * Allocate credit note to invoice(s)
   */
  async allocateCreditNoteToInvoice(
    creditNoteId: string,
    invoiceId: string,
    amount: number
  ): Promise<void> {
    const creditNote = await this.getCreditNote(creditNoteId);
    const invoice = await invoiceService.getInvoice(invoiceId);

    // Validate
    if (creditNote.customerId !== invoice.customerId) {
      throw new Error('Credit note and invoice must be for same customer');
    }

    if (amount > creditNote.unallocatedAmount) {
      throw new Error('Amount exceeds unallocated credit note balance');
    }

    if (amount > invoice.amountDue) {
      throw new Error('Amount exceeds invoice outstanding balance');
    }

    // Create allocation record
    const allocation: CreditNoteAllocation = {
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      amount,
      allocationDate: new Date(),
      allocatedBy: currentUser.id,
    };

    // Update credit note
    creditNote.allocations.push(allocation);
    creditNote.unallocatedAmount -= amount;
    if (creditNote.unallocatedAmount === 0) {
      creditNote.status = 'fully-allocated';
    } else {
      creditNote.status = 'partially-allocated';
    }
    await this.updateCreditNote(creditNote);

    // Update invoice
    await invoiceService.applyCreditNote(invoiceId, amount, creditNoteId);

    // Create GL entry for allocation
    await this.postAllocationToGL(creditNote, invoice, amount);
  }

  /**
   * Allocate credit note to multiple invoices (split)
   */
  async allocateCreditNoteToMultipleInvoices(
    creditNoteId: string,
    allocations: Array<{ invoiceId: string; amount: number }>
  ): Promise<void> {
    const creditNote = await this.getCreditNote(creditNoteId);

    // Validate total allocation
    const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
    if (totalAllocated > creditNote.unallocatedAmount) {
      throw new Error('Total allocation exceeds unallocated credit note balance');
    }

    // Process each allocation
    for (const allocation of allocations) {
      await this.allocateCreditNoteToInvoice(
        creditNoteId,
        allocation.invoiceId,
        allocation.amount
      );
    }
  }

  /**
   * Post credit note to general ledger
   */
  private async postCreditNoteToGL(
    creditNote: CreditNote
  ): Promise<string> {
    // Credit note reverses the invoice entry:
    // DR: Revenue (reduce revenue)
    // DR: Tax Payable (reduce tax liability)
    // CR: Accounts Receivable (reduce customer debt)

    const journalEntry: JournalEntry = {
      id: generateId(),
      date: creditNote.creditNoteDate,
      reference: creditNote.creditNoteNumber,
      description: `Credit Note - ${creditNote.customerName}`,
      sourceType: 'credit-note',
      sourceId: creditNote.id,
      lines: [
        {
          accountCode: '4000', // Revenue
          accountName: 'Sales Revenue',
          debit: creditNote.subtotal,
          credit: 0,
        },
        {
          accountCode: '2200', // Tax Payable
          accountName: 'VAT Output',
          debit: creditNote.taxAmount,
          credit: 0,
        },
        {
          accountCode: '1100', // Accounts Receivable
          accountName: 'Accounts Receivable',
          debit: 0,
          credit: creditNote.totalAmount,
        },
      ],
      totalDebit: creditNote.totalAmount,
      totalCredit: creditNote.totalAmount,
      status: 'posted',
      createdAt: new Date(),
      createdBy: currentUser.id,
    };

    await postingService.createJournalEntry(journalEntry);
    return journalEntry.id;
  }
}
```

### **2.2 Credit Note TypeScript Interfaces**

```typescript
export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  creditNoteDate: Date;
  customerId: string;
  customerName: string;
  relatedInvoiceId?: string;
  relatedInvoiceNumber?: string;
  reason: string;
  lineItems: CreditNoteLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'issued' | 'partially-allocated' | 'fully-allocated' | 'void';
  allocations: CreditNoteAllocation[];
  unallocatedAmount: number;
  glEntryId?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
  voidedAt?: Date;
  voidedBy?: string;
  voidReason?: string;
}

export interface CreditNoteLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  glAccountCode: string;
  glAccountName: string;
  originalInvoiceLineId?: string;
}

export interface CreditNoteAllocation {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  allocationDate: Date;
  allocatedBy: string;
}

export interface CreditNoteCreateRequest {
  creditNoteDate?: Date;
  reason: string;
  lineItems: CreditNoteLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  amount: number;
  autoAllocateToInvoice?: boolean;
  notes?: string;
}

export interface StandaloneCreditNoteRequest {
  customerId: string;
  customerName: string;
  creditNoteDate?: Date;
  reason: string;
  lineItems: CreditNoteLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  amount: number;
  notes?: string;
}
```

### **2.3 Purchase Credit Notes (Supplier)**

Similar structure to sales credit notes, but:
- Called `SupplierCreditNote` or `PurchaseCreditNote`
- References bills instead of invoices
- GL entry reverses purchase entry:
  ```
  DR: Accounts Payable (reduce what we owe)
  CR: Expense Account (reduce expense)
  CR: Tax Receivable (reduce tax input)
  ```

---

## 🔍 Part 3: Statement Reconciliation

### **3.1 Supplier Statement Import & Matching**

```typescript
export class StatementReconciliationService {
  constructor(private companyId: string) {}

  /**
   * Import supplier statement for reconciliation
   */
  async importSupplierStatement(
    supplierId: string,
    file: File,
    statementDate: Date
  ): Promise<SupplierStatementImport> {
    // Parse statement (PDF or CSV)
    const parsedData = await this.parseSupplierStatement(file);

    // Match transactions to our records
    const matchedTransactions = await this.matchTransactions(
      supplierId,
      parsedData.transactions
    );

    // Identify discrepancies
    const discrepancies = this.identifyDiscrepancies(matchedTransactions);

    const importRecord: SupplierStatementImport = {
      id: generateId(),
      supplierId,
      statementDate,
      fileName: file.name,
      theirOpeningBalance: parsedData.openingBalance,
      theirClosingBalance: parsedData.closingBalance,
      ourOpeningBalance: await this.getSupplierBalance(supplierId, parsedData.periodStart),
      ourClosingBalance: await this.getSupplierBalance(supplierId, statementDate),
      transactions: matchedTransactions,
      matchedCount: matchedTransactions.filter(t => t.matched).length,
      unmatchedCount: matchedTransactions.filter(t => !t.matched).length,
      discrepancies,
      status: discrepancies.length > 0 ? 'has-discrepancies' : 'reconciled',
      importedAt: new Date(),
      importedBy: currentUser.id,
    };

    await this.saveStatementImport(importRecord);
    return importRecord;
  }

  /**
   * Match supplier statement transactions to our records
   */
  private async matchTransactions(
    supplierId: string,
    theirTransactions: SupplierStatementTransaction[]
  ): Promise<MatchedTransaction[]> {
    const matched: MatchedTransaction[] = [];

    for (const theirTxn of theirTransactions) {
      // Try to find matching transaction in our records
      const ourTxn = await this.findMatchingTransaction(
        supplierId,
        theirTxn
      );

      matched.push({
        theirTransaction: theirTxn,
        ourTransaction: ourTxn,
        matched: !!ourTxn,
        matchScore: ourTxn ? this.calculateMatchScore(theirTxn, ourTxn) : 0,
        discrepancy: this.calculateDiscrepancy(theirTxn, ourTxn),
      });
    }

    return matched;
  }

  /**
   * Find matching transaction using multiple criteria
   */
  private async findMatchingTransaction(
    supplierId: string,
    theirTxn: SupplierStatementTransaction
  ): Promise<OurTransaction | null> {
    // Get all our transactions for supplier in date range
    const dateRange = {
      start: subDays(theirTxn.date, 7),
      end: addDays(theirTxn.date, 7),
    };

    const ourTransactions = await this.getSupplierTransactions(
      supplierId,
      dateRange.start,
      dateRange.end
    );

    // Score each potential match
    const scoredMatches = ourTransactions.map(ourTxn => ({
      transaction: ourTxn,
      score: this.calculateMatchScore(theirTxn, ourTxn),
    }));

    // Return best match if score > 70%
    const bestMatch = scoredMatches.sort((a, b) => b.score - a.score)[0];
    return bestMatch && bestMatch.score >= 70 ? bestMatch.transaction : null;
  }

  /**
   * Calculate match score between two transactions
   */
  private calculateMatchScore(
    theirTxn: SupplierStatementTransaction,
    ourTxn: OurTransaction
  ): number {
    let score = 0;

    // Exact amount match: +50 points
    if (Math.abs(theirTxn.amount - ourTxn.amount) < 0.01) {
      score += 50;
    }
    // Close amount match (within 5%): +30 points
    else if (Math.abs(theirTxn.amount - ourTxn.amount) / ourTxn.amount < 0.05) {
      score += 30;
    }

    // Date proximity: +30 points (within 3 days)
    const daysDiff = Math.abs(
      differenceInDays(theirTxn.date, ourTxn.date)
    );
    if (daysDiff === 0) score += 30;
    else if (daysDiff <= 3) score += 20;
    else if (daysDiff <= 7) score += 10;

    // Reference number match: +20 points
    if (theirTxn.reference && ourTxn.reference) {
      if (theirTxn.reference === ourTxn.reference) {
        score += 20;
      } else if (
        theirTxn.reference.toLowerCase().includes(ourTxn.reference.toLowerCase()) ||
        ourTxn.reference.toLowerCase().includes(theirTxn.reference.toLowerCase())
      ) {
        score += 10;
      }
    }

    return score;
  }

  /**
   * Identify discrepancies
   */
  private identifyDiscrepancies(
    matchedTransactions: MatchedTransaction[]
  ): Discrepancy[] {
    const discrepancies: Discrepancy[] = [];

    // Unmatched transactions on their statement
    const unmatchedTheirs = matchedTransactions.filter(t => !t.matched);
    unmatchedTheirs.forEach(t => {
      discrepancies.push({
        type: 'unmatched-supplier',
        date: t.theirTransaction.date,
        reference: t.theirTransaction.reference,
        description: t.theirTransaction.description,
        amount: t.theirTransaction.amount,
        message: 'Transaction on supplier statement not found in our records',
        severity: 'high',
      });
    });

    // Amount discrepancies
    matchedTransactions
      .filter(t => t.matched && t.discrepancy && t.discrepancy.type === 'amount')
      .forEach(t => {
        discrepancies.push({
          type: 'amount-difference',
          date: t.theirTransaction.date,
          reference: t.theirTransaction.reference,
          description: t.theirTransaction.description,
          amount: t.theirTransaction.amount,
          ourAmount: t.ourTransaction?.amount,
          difference: t.discrepancy?.difference,
          message: `Amount difference: Theirs R${t.theirTransaction.amount.toFixed(2)}, Ours R${t.ourTransaction?.amount.toFixed(2)}`,
          severity: 'medium',
        });
      });

    return discrepancies;
  }
}
```

### **3.2 Statement Reconciliation UI**

```tsx
// Component: SupplierStatementReconciliation
export function SupplierStatementReconciliation() {
  const [importedStatement, setImportedStatement] =
    useState<SupplierStatementImport | null>(null);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Import Supplier Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            accept=".pdf,.csv"
            onUpload={handleStatementUpload}
          />
        </CardContent>
      </Card>

      {/* Reconciliation Results */}
      {importedStatement && (
        <>
          {/* Balance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Balance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Their Statement</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Opening:</span>
                      <span className="font-semibold">
                        R{importedStatement.theirOpeningBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Closing:</span>
                      <span className="font-semibold">
                        R{importedStatement.theirClosingBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Our Records</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Opening:</span>
                      <span className="font-semibold">
                        R{importedStatement.ourOpeningBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Closing:</span>
                      <span className="font-semibold">
                        R{importedStatement.ourClosingBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discrepancy Alert */}
              {Math.abs(
                importedStatement.theirClosingBalance -
                importedStatement.ourClosingBalance
              ) > 0.01 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Balance Discrepancy</AlertTitle>
                  <AlertDescription>
                    Difference: R
                    {Math.abs(
                      importedStatement.theirClosingBalance -
                      importedStatement.ourClosingBalance
                    ).toFixed(2)}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Transaction Matching */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Matching</CardTitle>
              <div className="flex gap-4 text-sm">
                <Badge variant="success">
                  Matched: {importedStatement.matchedCount}
                </Badge>
                <Badge variant="destructive">
                  Unmatched: {importedStatement.unmatchedCount}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Their Amount</TableHead>
                    <TableHead className="text-right">Our Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importedStatement.transactions.map((txn, idx) => (
                    <TableRow key={idx} className={
                      !txn.matched ? 'bg-red-50' :
                      txn.discrepancy ? 'bg-yellow-50' :
                      'bg-green-50'
                    }>
                      <TableCell>
                        {format(txn.theirTransaction.date, 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>{txn.theirTransaction.reference}</TableCell>
                      <TableCell>{txn.theirTransaction.description}</TableCell>
                      <TableCell className="text-right">
                        R{txn.theirTransaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {txn.ourTransaction
                          ? `R${txn.ourTransaction.amount.toFixed(2)}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {!txn.matched ? (
                          <Badge variant="destructive">Unmatched</Badge>
                        ) : txn.discrepancy ? (
                          <Badge variant="warning">Discrepancy</Badge>
                        ) : (
                          <Badge variant="success">Matched</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Discrepancies */}
          {importedStatement.discrepancies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Discrepancies Requiring Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {importedStatement.discrepancies.map((disc, idx) => (
                    <Alert
                      key={idx}
                      variant={disc.severity === 'high' ? 'destructive' : 'default'}
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>
                        {disc.type === 'unmatched-supplier'
                          ? 'Transaction Not in Our Records'
                          : 'Amount Difference'
                        }
                      </AlertTitle>
                      <AlertDescription>
                        <div className="mt-2 space-y-1">
                          <div>Date: {format(disc.date, 'dd MMM yyyy')}</div>
                          <div>Reference: {disc.reference}</div>
                          <div>Description: {disc.description}</div>
                          <div>Amount: R{disc.amount.toFixed(2)}</div>
                          {disc.difference && (
                            <div className="font-semibold">
                              Difference: R{Math.abs(disc.difference).toFixed(2)}
                            </div>
                          )}
                          <div className="mt-2 text-sm">{disc.message}</div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
```

---

## 📱 Part 4: UI Components

### **4.1 Customer Statements Page** (`/app/workspace/[companyId]/statements/page.tsx`)

```tsx
'use client';

export default function StatementsPage() {
  const [statementPeriod, setStatementPeriod] = useState<'month' | 'custom'>('month');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [generatedStatements, setGeneratedStatements] = useState<CustomerStatement[]>([]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Statements</h1>
          <p className="text-muted-foreground">
            Generate and email account statements to customers
          </p>
        </div>
        <Button onClick={handleGenerateStatements}>
          <FileText className="h-4 w-4 mr-2" />
          Generate Statements
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Statement Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Period Selection */}
          <div>
            <Label>Statement Period</Label>
            <RadioGroup value={statementPeriod} onValueChange={setStatementPeriod}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="month" id="month" />
                <Label htmlFor="month">Current Month</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">Custom Date Range</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Customer Selection */}
          <div>
            <Label>Customers</Label>
            <MultiSelect
              options={customers}
              value={selectedCustomers}
              onChange={setSelectedCustomers}
              placeholder="Select customers (leave empty for all)"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="includeZero" />
              <Label htmlFor="includeZero">
                Include customers with zero balance
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="includePaid" />
              <Label htmlFor="includePaid">
                Show paid invoices in period
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Statements */}
      {generatedStatements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Statements</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleEmailAll}>
                <Mail className="h-4 w-4 mr-2" />
                Email All ({generatedStatements.length})
              </Button>
              <Button variant="outline" onClick={handleDownloadAll}>
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Statement Date</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Aged 30+</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {generatedStatements.map(statement => (
                  <TableRow key={statement.id}>
                    <TableCell>{statement.customerName}</TableCell>
                    <TableCell>
                      {format(statement.statementDate, 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      R{statement.closingBalance.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        statement.agedAnalysis.days30 +
                        statement.agedAnalysis.days60 +
                        statement.agedAnalysis.days90 +
                        statement.agedAnalysis.days120Plus > 0
                          ? 'destructive'
                          : 'success'
                      }>
                        R{(
                          statement.agedAnalysis.days30 +
                          statement.agedAnalysis.days60 +
                          statement.agedAnalysis.days90 +
                          statement.agedAnalysis.days120Plus
                        ).toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(statement.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(statement.id)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEmail(statement.id)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### **4.2 Credit Notes Page** (`/app/workspace/[companyId]/credit-notes/page.tsx`)

```tsx
'use client';

export default function CreditNotesPage() {
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Credit Notes</h1>
          <p className="text-muted-foreground">
            Issue credit notes for returns, discounts, and adjustments
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Credit Note
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Credit Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditNotes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{creditNotes.reduce((sum, cn) => sum + cn.totalAmount, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Unallocated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{creditNotes.reduce((sum, cn) => sum + cn.unallocatedAmount, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creditNotes.filter(cn =>
                isThisMonth(cn.creditNoteDate)
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credit Notes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Credit Note #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Related Invoice</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Unallocated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditNotes.map(cn => (
                <TableRow key={cn.id}>
                  <TableCell className="font-medium">
                    {cn.creditNoteNumber}
                  </TableCell>
                  <TableCell>
                    {format(cn.creditNoteDate, 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>{cn.customerName}</TableCell>
                  <TableCell>
                    {cn.relatedInvoiceNumber || '-'}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {cn.reason}
                  </TableCell>
                  <TableCell className="text-right">
                    R{cn.totalAmount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {cn.unallocatedAmount > 0 ? (
                      <span className="text-red-600 font-semibold">
                        R{cn.unallocatedAmount.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-green-600">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      cn.status === 'fully-allocated' ? 'success' :
                      cn.status === 'partially-allocated' ? 'warning' :
                      'default'
                    }>
                      {cn.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleView(cn.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownloadPDF(cn.id)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </DropdownMenuItem>
                        {cn.unallocatedAmount > 0 && (
                          <DropdownMenuItem onClick={() => handleAllocate(cn.id)}>
                            <Link className="h-4 w-4 mr-2" />
                            Allocate to Invoice
                          </DropdownMenuItem>
                        )}
                        {cn.status === 'draft' && (
                          <DropdownMenuItem
                            onClick={() => handleVoid(cn.id)}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Void
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Credit Note Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create Credit Note</DialogTitle>
          </DialogHeader>
          <CreditNoteForm
            onSubmit={handleCreateCreditNote}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## 📊 Implementation Phases

### **Phase 1: Statement Generation Engine (8-10 hours)**

**Deliverables:**
- StatementService with all core methods
- Transaction collection and sorting
- Aged analysis calculation
- PDF generation with pdfmake
- Email delivery integration

**Tasks:**
1. Create StatementService class
2. Implement `generateCustomerStatement()`
3. Implement `getCustomerTransactions()`
4. Implement `calculateAgedAnalysis()`
5. Build PDF template with pdfmake
6. Implement `emailStatement()`
7. Add batch generation support
8. Write unit tests

---

### **Phase 2: Credit Note Management (6-8 hours)**

**Deliverables:**
- CreditNoteService with CRUD operations
- Credit note allocation to invoices
- GL posting for credit notes
- Credit note PDF generation

**Tasks:**
1. Create CreditNoteService class
2. Implement `createCreditNoteFromInvoice()`
3. Implement `createStandaloneCreditNote()`
4. Implement `allocateCreditNoteToInvoice()`
5. Implement GL posting logic
6. Build credit note PDF template
7. Add customer balance adjustments
8. Write integration tests

---

### **Phase 3: Statements UI (6-7 hours)**

**Deliverables:**
- Statements page with generation options
- Statement preview dialog
- Batch email functionality
- Download capabilities

**Tasks:**
1. Create statements page component
2. Build statement generation form
3. Add customer selection interface
4. Implement preview dialog
5. Add batch email functionality
6. Implement download all feature
7. Add progress indicators
8. Test email delivery

---

### **Phase 4: Credit Notes UI (5-6 hours)**

**Deliverables:**
- Credit notes page with CRUD
- Create credit note form
- Allocate credit note dialog
- Credit note viewing/PDF download

**Tasks:**
1. Create credit notes page component
2. Build credit note creation form
3. Add allocation dialog
4. Implement view/preview functionality
5. Add PDF download
6. Build allocation interface
7. Add status indicators
8. Test workflows

---

### **Phase 5: Statement Reconciliation (7-9 hours)**

**Deliverables:**
- Supplier statement import
- Transaction matching algorithm
- Discrepancy identification
- Reconciliation UI

**Tasks:**
1. Create StatementReconciliationService
2. Implement statement parsing (PDF/CSV)
3. Build transaction matching algorithm
4. Implement discrepancy detection
5. Create reconciliation UI
6. Add match score visualization
7. Build discrepancy resolution workflow
8. Test with real supplier statements

---

### **Phase 6: Supplier Statements (3-4 hours)**

**Deliverables:**
- Supplier statement generation (reverse of customer)
- Supplier statement PDF
- Purchase credit notes

**Tasks:**
1. Mirror customer statement logic for suppliers
2. Build supplier statement PDF template
3. Implement purchase credit note service
4. Add supplier statement page
5. Test end-to-end

---

## 📋 Firestore Collections

### **`statements` Subcollection**
```
companies/{companyId}/statements/{statementId}
{
  id: string;
  type: 'customer' | 'supplier';
  entityId: string;
  entityName: string;
  statementDate: Date;
  periodStart: Date;
  periodEnd: Date;
  openingBalance: number;
  closingBalance: number;
  transactionCount: number;
  agedAnalysis: AgedAnalysis;
  generatedAt: Date;
  generatedBy: string;
  emailedAt?: Date;
  emailedTo?: string;
  pdfUrl?: string;
}
```

### **`creditNotes` Subcollection**
```
companies/{companyId}/creditNotes/{creditNoteId}
{
  id: string;
  creditNoteNumber: string;
  creditNoteDate: Date;
  customerId: string;
  customerName: string;
  relatedInvoiceId?: string;
  relatedInvoiceNumber?: string;
  reason: string;
  lineItems: CreditNoteLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  allocations: CreditNoteAllocation[];
  unallocatedAmount: number;
  glEntryId?: string;
  createdAt: Date;
  createdBy: string;
}
```

### **`supplierStatementImports` Subcollection**
```
companies/{companyId}/supplierStatementImports/{importId}
{
  id: string;
  supplierId: string;
  statementDate: Date;
  fileName: string;
  theirOpeningBalance: number;
  theirClosingBalance: number;
  ourOpeningBalance: number;
  ourClosingBalance: number;
  transactionCount: number;
  matchedCount: number;
  unmatchedCount: number;
  discrepancyCount: number;
  status: string;
  importedAt: Date;
  importedBy: string;
}
```

---

## 🎯 Success Metrics

### **Statement Adoption:**
- 80%+ of customers receive monthly statements
- 90%+ statements emailed successfully
- <5% email bounce rate

### **Credit Note Usage:**
- Credit notes issued within 48hrs of return
- 95%+ allocation accuracy
- Zero GL entry errors

### **Reconciliation Efficiency:**
- 70%+ automatic transaction matching
- Discrepancies identified in <5 minutes
- 90%+ resolution within 1 week

### **Business Impact:**
- 25% faster customer collections (clear statements)
- 60% reduction in customer balance queries
- 80% faster supplier reconciliation
- Zero missed credit notes

---

## 🚀 Total Implementation Estimate

| Phase | Hours | Priority |
|-------|-------|----------|
| 1. Statement Engine | 8-10 | Must Have |
| 2. Credit Notes | 6-8 | Must Have |
| 3. Statements UI | 6-7 | Must Have |
| 4. Credit Notes UI | 5-6 | Should Have |
| 5. Reconciliation | 7-9 | Should Have |
| 6. Supplier Statements | 3-4 | Could Have |

**Total: 35-44 hours (~5-6 weeks part-time)**

---

## 📚 Documentation Requirements

### **User Guides:**
1. "How to Generate Customer Statements"
2. "Issuing Credit Notes"
3. "Allocating Credit Notes to Invoices"
4. "Reconciling Supplier Statements"
5. "Email Statement Best Practices"

### **Technical Docs:**
1. Statement Generation API
2. Credit Note Service API
3. PDF Template Customization Guide
4. Email Delivery Configuration

### **Videos:**
1. 3-min: Generate and Email Statements
2. 2-min: Create Credit Note from Invoice
3. 4-min: Supplier Statement Reconciliation

---

## 💡 Future Enhancements (Phase 8+)

### **Advanced Features:**
- **SMS Statement Delivery** - Send via WhatsApp/SMS for rural customers
- **Statement Templates** - Industry-specific layouts
- **Multi-Currency Statements** - Show amounts in customer's currency
- **Statement Scheduling** - Auto-generate monthly
- **Paperless Incentives** - Discount for accepting email statements
- **Customer Portal** - Self-service statement access
- **E-Signature Integration** - Digital acceptance of credit notes

### **Compliance:**
- **GDPR Compliance** - Statement data retention policies
- **Audit Trail** - Complete history of all statements sent
- **Statutory Requirements** - Meet local accounting standards

---

## 🎯 Summary

This comprehensive statements and credit note system completes the AR/AP cycle by providing:

1. ✅ **Professional customer communication** with branded statements
2. ✅ **Complete credit note management** (sales & purchases)
3. ✅ **Sophisticated statement reconciliation** with supplier import
4. ✅ **Aged analysis** for collection priorities
5. ✅ **Batch operations** for efficiency
6. ✅ **Email delivery** with tracking
7. ✅ **PDF generation** for downloads
8. ✅ **Full GL integration** for compliance

**Dependencies Met:** Requires completion of AI Agent Debtor/Creditor Integration (Phase 6) for entity records and pending payment system.

**Ready for Implementation:** All phases documented, estimated, and prioritized.
