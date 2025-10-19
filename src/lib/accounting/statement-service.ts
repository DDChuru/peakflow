/**
 * Statement Service
 *
 * Comprehensive service for generating professional customer and supplier statements
 * with aged analysis, PDF generation, and email delivery.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  CustomerStatement,
  SupplierStatement,
  Statement,
  StatementTransaction,
  StatementTransactionType,
  AgedAnalysis,
  AgedAnalysisItem,
  AgeBucket,
  StatementSummary,
  StatementGenerationRequest,
  StatementGenerationOptions,
  BatchStatementRequest,
  BatchStatementResult,
  StatementServiceResult,
  StatementQueryFilters,
  StatementStatistics,
  StatementEmailConfig,
} from '@/types/accounting/statement';
import type { Invoice } from '@/types/accounting/invoice';
import type { CreditNote } from '@/types/accounting/credit-note';
import { pdfService } from '@/lib/pdf/pdf.service';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert a date field to Date object (handles both Timestamp and ISO string)
 */
function toDate(dateValue: any): Date {
  if (!dateValue) {
    return new Date();
  }

  // If it's already a Date
  if (dateValue instanceof Date) {
    return dateValue;
  }

  // If it's a Firestore Timestamp
  if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
    return dateValue.toDate();
  }

  // If it's an ISO string
  if (typeof dateValue === 'string') {
    return new Date(dateValue);
  }

  // Fallback
  return new Date();
}

/**
 * Calculate days between dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc2 - utc1) / msPerDay);
}

/**
 * Determine age bucket based on days outstanding
 */
function getAgeBucket(daysOutstanding: number): AgeBucket {
  if (daysOutstanding <= 30) return 'current';
  if (daysOutstanding <= 60) return '30-days';
  if (daysOutstanding <= 90) return '60-days';
  if (daysOutstanding <= 120) return '90-days';
  return '120-plus';
}

/**
 * Generate statement ID
 */
function generateStatementId(): string {
  return `STMT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
}

// ============================================================================
// STATEMENT SERVICE CLASS
// ============================================================================

export class StatementService {
  constructor(
    private companyId: string,
    private userId: string
  ) {}

  // ==========================================================================
  // CUSTOMER STATEMENT GENERATION
  // ==========================================================================

  /**
   * Generate customer statement for a period
   */
  async generateCustomerStatement(
    customerId: string,
    periodStart: Date,
    periodEnd: Date,
    options: StatementGenerationOptions = {}
  ): Promise<StatementServiceResult> {
    try {
      console.log('🧾 [StatementService] Generating customer statement', {
        customerId,
        periodStart,
        periodEnd,
      });

      // Get customer details
      const customerDoc = await getDoc(
        doc(db, 'companies', this.companyId, 'debtors', customerId)
      );

      if (!customerDoc.exists()) {
        return {
          success: false,
          message: 'Customer not found',
          error: 'CUSTOMER_NOT_FOUND',
        };
      }

      const customer = customerDoc.data();

      // Get opening balance
      const openingBalance = await this.getOpeningBalance(
        'customer',
        customerId,
        periodStart
      );

      // Get all transactions for period
      const transactions = await this.getCustomerTransactions(
        customerId,
        periodStart,
        periodEnd
      );

      // Calculate running balances
      let runningBalance = openingBalance;
      const transactionsWithBalance = transactions.map((txn) => {
        runningBalance += (txn.debit || 0) - (txn.credit || 0);
        return { ...txn, runningBalance };
      });

      // Calculate aged analysis
      const { agedAnalysis, agedDetails } = await this.calculateAgedAnalysis(
        'customer',
        customerId,
        periodEnd
      );

      // Build summary
      const summary = this.buildSummary(
        openingBalance,
        transactions,
        periodStart,
        periodEnd
      );

      // Create statement
      const statement: CustomerStatement = {
        id: generateStatementId(),
        companyId: this.companyId,
        entityType: 'customer',
        customerId,
        customerName: customer.name,
        customerEmail: customer.email,
        customerAddress: customer.address,
        customerPhone: customer.phone,
        accountNumber: customer.accountNumber,
        statementDate: periodEnd,
        periodStart,
        periodEnd,
        openingBalance,
        closingBalance: runningBalance,
        transactions: transactionsWithBalance,
        agedAnalysis,
        agedDetails,
        summary,
        status: 'draft',
        generatedAt: new Date(),
        generatedBy: this.userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Save statement to Firestore
      const statementRef = doc(
        db,
        'companies',
        this.companyId,
        'statements',
        statement.id
      );

      // Build statement data, excluding undefined optional fields
      const statementData: any = {
        id: statement.id,
        companyId: statement.companyId,
        entityType: statement.entityType,
        customerId: statement.customerId,
        customerName: statement.customerName,
        statementDate: Timestamp.fromDate(statement.statementDate),
        periodStart: Timestamp.fromDate(statement.periodStart),
        periodEnd: Timestamp.fromDate(statement.periodEnd),
        openingBalance: statement.openingBalance,
        closingBalance: statement.closingBalance,
        transactions: statement.transactions.map((t) => ({
          ...t,
          date: Timestamp.fromDate(t.date),
          dueDate: t.dueDate ? Timestamp.fromDate(t.dueDate) : null,
        })),
        agedAnalysis: statement.agedAnalysis,
        agedDetails: statement.agedDetails.map((item) => ({
          ...item,
          documentDate: Timestamp.fromDate(item.documentDate),
          dueDate: Timestamp.fromDate(item.dueDate),
        })),
        summary: {
          ...statement.summary,
          periodStart: Timestamp.fromDate(statement.summary.periodStart),
          periodEnd: Timestamp.fromDate(statement.summary.periodEnd),
          statementDate: Timestamp.fromDate(statement.summary.statementDate),
        },
        status: statement.status,
        generatedAt: Timestamp.fromDate(statement.generatedAt),
        generatedBy: statement.generatedBy,
        createdAt: statement.createdAt,
        updatedAt: statement.updatedAt,
      };

      // Only add optional fields if they have values
      if (statement.customerEmail) statementData.customerEmail = statement.customerEmail;
      if (statement.customerAddress) statementData.customerAddress = statement.customerAddress;
      if (statement.customerPhone) statementData.customerPhone = statement.customerPhone;
      if (statement.accountNumber) statementData.accountNumber = statement.accountNumber;

      await writeBatch(db)
        .set(statementRef, statementData)
        .commit();

      console.log('✅ [StatementService] Customer statement generated successfully', {
        statementId: statement.id,
      });

      return {
        success: true,
        message: 'Statement generated successfully',
        statementId: statement.id,
        statement,
      };
    } catch (error: any) {
      console.error('❌ [StatementService] Error generating statement:', error);
      return {
        success: false,
        message: 'Failed to generate statement',
        error: error.message,
      };
    }
  }

  /**
   * Get customer transactions for period
   */
  private async getCustomerTransactions(
    customerId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<StatementTransaction[]> {
    const transactions: StatementTransaction[] = [];

    // Get invoices (exclude draft and cancelled)
    const invoicesRef = collection(
      db,
      'companies',
      this.companyId,
      'invoices'
    );
    const invoicesQuery = query(
      invoicesRef,
      where('customerId', '==', customerId),
      orderBy('invoiceDate', 'asc')
    );

    const invoicesDocs = await getDocs(invoicesQuery);
    invoicesDocs.forEach((doc) => {
      const invoice = doc.data() as Invoice;

      // Skip draft and cancelled invoices
      if (invoice.status === 'draft' || invoice.status === 'cancelled') {
        return;
      }

      // Filter by date range (invoiceDate is ISO string)
      const invoiceDate = toDate(invoice.invoiceDate);
      if (invoiceDate < periodStart || invoiceDate > periodEnd) {
        return;
      }

      // Add invoice transaction
      transactions.push({
        id: doc.id,
        date: toDate(invoice.invoiceDate),
        type: 'invoice',
        reference: invoice.invoiceNumber,
        description: `Invoice ${invoice.invoiceNumber}`,
        debit: invoice.totalAmount,
        runningBalance: 0, // Will be calculated later
        dueDate: invoice.dueDate ? toDate(invoice.dueDate) : undefined,
        relatedDocumentId: doc.id,
      });

      // Add payment transactions from invoice's payment history
      if (invoice.paymentHistory && Array.isArray(invoice.paymentHistory)) {
        invoice.paymentHistory.forEach((payment: any) => {
          const paymentDate = payment.paymentDate
            ? (typeof payment.paymentDate === 'string'
                ? new Date(payment.paymentDate)
                : (payment.paymentDate as Timestamp).toDate())
            : new Date();

          // Check if payment is within period
          if (paymentDate >= periodStart && paymentDate <= periodEnd) {
            transactions.push({
              id: payment.id || `${doc.id}-payment-${Math.random()}`,
              date: paymentDate,
              type: 'payment',
              reference: payment.reference || `Payment ${invoice.invoiceNumber}`,
              description: `Payment - ${payment.paymentMethod || 'received'}`,
              credit: payment.amount,
              runningBalance: 0, // Will be calculated later
              relatedDocumentId: doc.id,
            });
          }
        });
      }
    });

    // Get credit notes
    const creditNotesRef = collection(
      db,
      'companies',
      this.companyId,
      'creditNotes'
    );
    const creditNotesQuery = query(
      creditNotesRef,
      where('type', '==', 'sales'),
      where('customerId', '==', customerId),
      orderBy('creditNoteDate', 'asc')
    );

    const creditNotesDocs = await getDocs(creditNotesQuery);
    creditNotesDocs.forEach((doc) => {
      const creditNote = doc.data() as CreditNote;

      // Filter by date range (creditNoteDate is ISO string)
      const creditNoteDate = toDate(creditNote.creditNoteDate);
      if (creditNoteDate < periodStart || creditNoteDate > periodEnd) {
        return;
      }

      transactions.push({
        id: doc.id,
        date: toDate(creditNote.creditNoteDate),
        type: 'credit-note',
        reference: creditNote.creditNoteNumber,
        description: `Credit Note ${creditNote.creditNoteNumber}`,
        credit: creditNote.totalAmount,
        runningBalance: 0, // Will be calculated later
        relatedDocumentId: doc.id,
      });
    });

    // Sort by date
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    return transactions;
  }

  /**
   * Get opening balance for customer
   */
  private async getOpeningBalance(
    entityType: 'customer' | 'supplier',
    entityId: string,
    asOfDate: Date
  ): Promise<number> {
    // Query for previous statement
    const statementsRef = collection(
      db,
      'companies',
      this.companyId,
      'statements'
    );

    const previousStatementQuery = query(
      statementsRef,
      where('entityType', '==', entityType),
      where(
        entityType === 'customer' ? 'customerId' : 'supplierId',
        '==',
        entityId
      ),
      where('periodEnd', '<', Timestamp.fromDate(asOfDate)),
      orderBy('periodEnd', 'desc'),
      firestoreLimit(1)
    );

    const previousStatementDocs = await getDocs(previousStatementQuery);

    if (!previousStatementDocs.empty) {
      const previousStatement = previousStatementDocs.docs[0].data();
      return previousStatement.closingBalance || 0;
    }

    // No previous statement, calculate from inception
    // This would sum all invoices - payments - credits before asOfDate
    // For now, return 0 (opening balance for first statement)
    return 0;
  }

  /**
   * Calculate aged analysis for customer
   */
  private async calculateAgedAnalysis(
    entityType: 'customer' | 'supplier',
    entityId: string,
    asOfDate: Date
  ): Promise<{ agedAnalysis: AgedAnalysis; agedDetails: AgedAnalysisItem[] }> {
    const agedAnalysis: AgedAnalysis = {
      current: 0,
      thirtyDays: 0,
      sixtyDays: 0,
      ninetyDays: 0,
      oneTwentyPlus: 0,
      total: 0,
    };

    const agedDetails: AgedAnalysisItem[] = [];

    // Get all unpaid invoices as of statement date
    const invoicesRef = collection(
      db,
      'companies',
      this.companyId,
      'invoices'
    );

    const invoicesQuery = query(
      invoicesRef,
      where(
        entityType === 'customer' ? 'customerId' : 'supplierId',
        '==',
        entityId
      ),
      where('status', 'in', ['sent', 'partial', 'overdue'])
    );

    const invoicesDocs = await getDocs(invoicesQuery);

    invoicesDocs.forEach((doc) => {
      const invoice = doc.data() as Invoice;
      const dueDate = invoice.dueDate
        ? toDate(invoice.dueDate)
        : toDate(invoice.invoiceDate);

      const daysOutstanding = daysBetween(dueDate, asOfDate);
      const outstandingAmount = invoice.amountDue || 0;

      if (outstandingAmount > 0) {
        const ageBucket = getAgeBucket(daysOutstanding);

        // Update aged analysis totals
        switch (ageBucket) {
          case 'current':
            agedAnalysis.current += outstandingAmount;
            break;
          case '30-days':
            agedAnalysis.thirtyDays += outstandingAmount;
            break;
          case '60-days':
            agedAnalysis.sixtyDays += outstandingAmount;
            break;
          case '90-days':
            agedAnalysis.ninetyDays += outstandingAmount;
            break;
          case '120-plus':
            agedAnalysis.oneTwentyPlus += outstandingAmount;
            break;
        }

        agedAnalysis.total += outstandingAmount;

        // Add to details
        agedDetails.push({
          documentId: doc.id,
          documentNumber: invoice.invoiceNumber,
          documentDate: toDate(invoice.invoiceDate),
          dueDate,
          originalAmount: invoice.totalAmount,
          outstandingAmount,
          daysOutstanding,
          ageBucket,
        });
      }
    });

    // Sort details by days outstanding (descending)
    agedDetails.sort((a, b) => b.daysOutstanding - a.daysOutstanding);

    return { agedAnalysis, agedDetails };
  }

  /**
   * Build statement summary
   */
  private buildSummary(
    openingBalance: number,
    transactions: StatementTransaction[],
    periodStart: Date,
    periodEnd: Date
  ): StatementSummary {
    let totalInvoices = 0;
    let totalPayments = 0;
    let totalCredits = 0;
    let totalAdjustments = 0;

    let invoiceCount = 0;
    let paymentCount = 0;
    let creditNoteCount = 0;

    transactions.forEach((txn) => {
      switch (txn.type) {
        case 'invoice':
          totalInvoices += txn.debit || 0;
          invoiceCount++;
          break;
        case 'payment':
          totalPayments += txn.credit || 0;
          paymentCount++;
          break;
        case 'credit-note':
          totalCredits += txn.credit || 0;
          creditNoteCount++;
          break;
        case 'adjustment':
          totalAdjustments += (txn.debit || 0) - (txn.credit || 0);
          break;
      }
    });

    const closingBalance =
      openingBalance + totalInvoices - totalPayments - totalCredits + totalAdjustments;

    return {
      openingBalance,
      totalInvoices,
      totalPayments,
      totalCredits,
      totalAdjustments,
      closingBalance,
      invoiceCount,
      paymentCount,
      creditNoteCount,
      periodStart,
      periodEnd,
      statementDate: periodEnd,
    };
  }

  // ==========================================================================
  // SUPPLIER STATEMENT GENERATION (Mirror of Customer)
  // ==========================================================================

  /**
   * Generate supplier statement for a period
   */
  async generateSupplierStatement(
    supplierId: string,
    periodStart: Date,
    periodEnd: Date,
    options: StatementGenerationOptions = {}
  ): Promise<StatementServiceResult> {
    try {
      console.log('🧾 [StatementService] Generating supplier statement', {
        supplierId,
        periodStart,
        periodEnd,
      });

      // Get supplier details
      const supplierDoc = await getDoc(
        doc(db, 'companies', this.companyId, 'creditors', supplierId)
      );

      if (!supplierDoc.exists()) {
        return {
          success: false,
          message: 'Supplier not found',
          error: 'SUPPLIER_NOT_FOUND',
        };
      }

      const supplier = supplierDoc.data();

      // Get opening balance
      const openingBalance = await this.getOpeningBalance(
        'supplier',
        supplierId,
        periodStart
      );

      // Get all transactions for period
      const transactions = await this.getSupplierTransactions(
        supplierId,
        periodStart,
        periodEnd
      );

      // Calculate running balances
      let runningBalance = openingBalance;
      const transactionsWithBalance = transactions.map((txn) => {
        runningBalance += (txn.debit || 0) - (txn.credit || 0);
        return { ...txn, runningBalance };
      });

      // Calculate aged analysis
      const { agedAnalysis, agedDetails } = await this.calculateAgedAnalysis(
        'supplier',
        supplierId,
        periodEnd
      );

      // Build summary
      const summary = this.buildSummary(
        openingBalance,
        transactions,
        periodStart,
        periodEnd
      );

      // Create statement
      const statement: SupplierStatement = {
        id: generateStatementId(),
        companyId: this.companyId,
        entityType: 'supplier',
        supplierId,
        supplierName: supplier.name,
        supplierEmail: supplier.email,
        supplierAddress: supplier.address,
        supplierPhone: supplier.phone,
        accountNumber: supplier.accountNumber,
        statementDate: periodEnd,
        periodStart,
        periodEnd,
        openingBalance,
        closingBalance: runningBalance,
        transactions: transactionsWithBalance,
        agedAnalysis,
        agedDetails,
        summary,
        status: 'draft',
        generatedAt: new Date(),
        generatedBy: this.userId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Save statement to Firestore
      const statementRef = doc(
        db,
        'companies',
        this.companyId,
        'statements',
        statement.id
      );

      // Build statement data, excluding undefined optional fields
      const statementData: any = {
        id: statement.id,
        companyId: statement.companyId,
        entityType: statement.entityType,
        supplierId: statement.supplierId,
        supplierName: statement.supplierName,
        statementDate: Timestamp.fromDate(statement.statementDate),
        periodStart: Timestamp.fromDate(statement.periodStart),
        periodEnd: Timestamp.fromDate(statement.periodEnd),
        openingBalance: statement.openingBalance,
        closingBalance: statement.closingBalance,
        transactions: statement.transactions.map((t) => ({
          ...t,
          date: Timestamp.fromDate(t.date),
          dueDate: t.dueDate ? Timestamp.fromDate(t.dueDate) : null,
        })),
        agedAnalysis: statement.agedAnalysis,
        agedDetails: statement.agedDetails.map((item) => ({
          ...item,
          documentDate: Timestamp.fromDate(item.documentDate),
          dueDate: Timestamp.fromDate(item.dueDate),
        })),
        summary: {
          ...statement.summary,
          periodStart: Timestamp.fromDate(statement.summary.periodStart),
          periodEnd: Timestamp.fromDate(statement.summary.periodEnd),
          statementDate: Timestamp.fromDate(statement.summary.statementDate),
        },
        status: statement.status,
        generatedAt: Timestamp.fromDate(statement.generatedAt),
        generatedBy: statement.generatedBy,
        createdAt: statement.createdAt,
        updatedAt: statement.updatedAt,
      };

      // Only add optional fields if they have values
      if (statement.supplierEmail) statementData.supplierEmail = statement.supplierEmail;
      if (statement.supplierAddress) statementData.supplierAddress = statement.supplierAddress;
      if (statement.supplierPhone) statementData.supplierPhone = statement.supplierPhone;
      if (statement.accountNumber) statementData.accountNumber = statement.accountNumber;

      await writeBatch(db)
        .set(statementRef, statementData)
        .commit();

      console.log('✅ [StatementService] Supplier statement generated successfully', {
        statementId: statement.id,
      });

      return {
        success: true,
        message: 'Supplier statement generated successfully',
        statementId: statement.id,
        statement,
      };
    } catch (error: any) {
      console.error('❌ [StatementService] Error generating supplier statement:', error);
      return {
        success: false,
        message: 'Failed to generate supplier statement',
        error: error.message,
      };
    }
  }

  /**
   * Get supplier transactions for period
   */
  private async getSupplierTransactions(
    supplierId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<StatementTransaction[]> {
    const transactions: StatementTransaction[] = [];

    // Get bills (supplier invoices)
    const billsRef = collection(db, 'companies', this.companyId, 'vendorBills');
    const billsQuery = query(
      billsRef,
      where('vendorId', '==', supplierId),
      orderBy('billDate', 'asc')
    );

    const billsDocs = await getDocs(billsQuery);
    billsDocs.forEach((doc) => {
      const bill = doc.data();

      // Skip draft and cancelled bills
      if (bill.status === 'draft' || bill.status === 'cancelled') {
        return;
      }

      // Filter by date range (billDate may be ISO string or Timestamp)
      const billDate = toDate(bill.billDate);
      if (billDate < periodStart || billDate > periodEnd) {
        return;
      }

      transactions.push({
        id: doc.id,
        date: toDate(bill.billDate),
        type: 'invoice',
        reference: bill.billNumber,
        description: `Bill ${bill.billNumber}`,
        debit: bill.totalAmount,
        runningBalance: 0,
        dueDate: bill.dueDate ? toDate(bill.dueDate) : undefined,
        relatedDocumentId: doc.id,
      });
    });

    // Get payments made to supplier from vendorPayments collection
    const paymentsRef = collection(
      db,
      'companies',
      this.companyId,
      'vendorPayments'
    );
    const paymentsQuery = query(
      paymentsRef,
      where('vendorId', '==', supplierId),
      orderBy('paymentDate', 'asc')
    );

    const paymentsDocs = await getDocs(paymentsQuery);
    paymentsDocs.forEach((doc) => {
      const payment = doc.data();

      // Filter by date range
      const paymentDate = toDate(payment.paymentDate);
      if (paymentDate < periodStart || paymentDate > periodEnd) {
        return;
      }

      transactions.push({
        id: doc.id,
        date: toDate(payment.paymentDate),
        type: 'payment',
        reference: payment.checkNumber || payment.referenceNumber || payment.id,
        description: `Payment made - ${payment.paymentMethod}`,
        credit: payment.amount,
        runningBalance: 0,
        relatedDocumentId: doc.id,
      });
    });

    // Get purchase credit notes
    const creditNotesRef = collection(
      db,
      'companies',
      this.companyId,
      'creditNotes'
    );
    const creditNotesQuery = query(
      creditNotesRef,
      where('type', '==', 'purchase'),
      where('supplierId', '==', supplierId),
      orderBy('creditNoteDate', 'asc')
    );

    const creditNotesDocs = await getDocs(creditNotesQuery);
    creditNotesDocs.forEach((doc) => {
      const creditNote = doc.data() as CreditNote;

      // Filter by date range
      const creditNoteDate = toDate(creditNote.creditNoteDate);
      if (creditNoteDate < periodStart || creditNoteDate > periodEnd) {
        return;
      }

      transactions.push({
        id: doc.id,
        date: toDate(creditNote.creditNoteDate),
        type: 'credit-note',
        reference: creditNote.creditNoteNumber,
        description: `Credit Note ${creditNote.creditNoteNumber}`,
        credit: creditNote.totalAmount,
        runningBalance: 0,
        relatedDocumentId: doc.id,
      });
    });

    // Sort by date
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    return transactions;
  }

  // ==========================================================================
  // PDF GENERATION (Will be implemented with pdfmake)
  // ==========================================================================

  /**
   * Generate PDF for statement
   */
  async generateStatementPDF(
    statementId: string,
    pdfOptions: any
  ): Promise<Blob> {
    // Get statement
    const statementDoc = await getDoc(
      doc(db, 'companies', this.companyId, 'statements', statementId)
    );

    if (!statementDoc.exists()) {
      throw new Error('Statement not found');
    }

    const statement = statementDoc.data() as CustomerStatement;

    // Convert Firestore timestamps to Dates
    const statementWithDates: CustomerStatement = {
      ...statement,
      statementDate: (statement.statementDate as any).toDate(),
      periodStart: (statement.periodStart as any).toDate(),
      periodEnd: (statement.periodEnd as any).toDate(),
      generatedAt: (statement.generatedAt as any).toDate(),
      transactions: statement.transactions.map((t) => ({
        ...t,
        date: (t.date as any).toDate(),
        dueDate: t.dueDate ? (t.dueDate as any).toDate() : undefined,
      })),
      agedDetails: statement.agedDetails.map((item) => ({
        ...item,
        documentDate: (item.documentDate as any).toDate(),
        dueDate: (item.dueDate as any).toDate(),
      })),
      summary: {
        ...statement.summary,
        periodStart: (statement.summary.periodStart as any).toDate(),
        periodEnd: (statement.summary.periodEnd as any).toDate(),
        statementDate: (statement.summary.statementDate as any).toDate(),
      },
    };

    // Generate PDF
    return pdfService.generateStatementPDF(statementWithDates, pdfOptions);
  }

  // ==========================================================================
  // QUERY OPERATIONS
  // ==========================================================================

  /**
   * Get statements with optional filters
   */
  async getStatements(filters?: StatementQueryFilters): Promise<Statement[]> {
    try {
      const statementsRef = collection(
        db,
        'companies',
        this.companyId,
        'statements'
      );

      // Build query with filters
      let constraints: any[] = [orderBy('createdAt', 'desc')];

      if (filters) {
        if (filters.entityType) {
          constraints.push(where('entityType', '==', filters.entityType));
        }

        if (filters.entityIds && filters.entityIds.length > 0) {
          // Firestore 'in' queries support up to 10 values
          const entityIdField = filters.entityType === 'customer' ? 'customerId' : 'supplierId';
          constraints.push(where(entityIdField, 'in', filters.entityIds.slice(0, 10)));
        }

        if (filters.status && filters.status.length > 0) {
          constraints.push(where('status', 'in', filters.status));
        }

        if (filters.dateFrom) {
          constraints.push(
            where('periodEnd', '>=', Timestamp.fromDate(filters.dateFrom))
          );
        }

        if (filters.dateTo) {
          constraints.push(
            where('periodStart', '<=', Timestamp.fromDate(filters.dateTo))
          );
        }
      }

      // Apply limit if specified
      if (filters?.limit) {
        constraints.push(firestoreLimit(filters.limit));
      }

      const q = query(statementsRef, ...constraints);
      const snapshot = await getDocs(q);

      // Convert Firestore documents to Statement objects
      const statements: Statement[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return this.convertFirestoreToStatement(data);
      });

      return statements;
    } catch (error: any) {
      console.error('❌ [StatementService] Error getting statements:', error);
      throw new Error(`Failed to get statements: ${error.message}`);
    }
  }

  /**
   * Get a single statement by ID
   */
  async getStatementById(statementId: string): Promise<Statement | null> {
    try {
      const statementRef = doc(
        db,
        'companies',
        this.companyId,
        'statements',
        statementId
      );

      const statementDoc = await getDoc(statementRef);

      if (!statementDoc.exists()) {
        return null;
      }

      return this.convertFirestoreToStatement(statementDoc.data());
    } catch (error: any) {
      console.error('❌ [StatementService] Error getting statement:', error);
      throw new Error(`Failed to get statement: ${error.message}`);
    }
  }

  /**
   * Convert Firestore data to Statement object
   */
  private convertFirestoreToStatement(data: any): Statement {
    const baseStatement = {
      id: data.id,
      companyId: data.companyId,
      entityType: data.entityType,
      statementDate: (data.statementDate as Timestamp).toDate(),
      periodStart: (data.periodStart as Timestamp).toDate(),
      periodEnd: (data.periodEnd as Timestamp).toDate(),
      openingBalance: data.openingBalance,
      closingBalance: data.closingBalance,
      transactions: data.transactions.map((t: any) => ({
        ...t,
        date: (t.date as Timestamp).toDate(),
        dueDate: t.dueDate ? (t.dueDate as Timestamp).toDate() : undefined,
      })),
      agedAnalysis: data.agedAnalysis,
      agedDetails: data.agedDetails.map((item: any) => ({
        ...item,
        documentDate: (item.documentDate as Timestamp).toDate(),
        dueDate: (item.dueDate as Timestamp).toDate(),
      })),
      summary: {
        ...data.summary,
        periodStart: (data.summary.periodStart as Timestamp).toDate(),
        periodEnd: (data.summary.periodEnd as Timestamp).toDate(),
        statementDate: (data.summary.statementDate as Timestamp).toDate(),
      },
      status: data.status,
      generatedAt: (data.generatedAt as Timestamp).toDate(),
      generatedBy: data.generatedBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    // Add entity-specific fields
    if (data.entityType === 'customer') {
      return {
        ...baseStatement,
        customerId: data.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerAddress: data.customerAddress,
        customerPhone: data.customerPhone,
        accountNumber: data.accountNumber,
        sentAt: data.sentAt ? (data.sentAt as Timestamp).toDate() : undefined,
        sentTo: data.sentTo,
        viewedAt: data.viewedAt ? (data.viewedAt as Timestamp).toDate() : undefined,
        pdfUrl: data.pdfUrl,
      } as CustomerStatement;
    } else {
      return {
        ...baseStatement,
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        supplierEmail: data.supplierEmail,
        supplierAddress: data.supplierAddress,
        supplierPhone: data.supplierPhone,
        accountNumber: data.accountNumber,
      } as SupplierStatement;
    }
  }

  // ==========================================================================
  // BATCH OPERATIONS
  // ==========================================================================

  /**
   * Generate statements for all customers
   */
  async batchGenerateCustomerStatements(
    request: BatchStatementRequest
  ): Promise<BatchStatementResult> {
    const result: BatchStatementResult = {
      totalRequested: request.entityIds.length,
      successful: 0,
      failed: 0,
      statementIds: [],
      errors: [],
    };

    for (const customerId of request.entityIds) {
      try {
        const statementResult = await this.generateCustomerStatement(
          customerId,
          request.periodStart,
          request.periodEnd,
          request.options
        );

        if (statementResult.success && statementResult.statementId) {
          result.successful++;
          result.statementIds.push(statementResult.statementId);
        } else {
          result.failed++;
          result.errors.push({
            entityId: customerId,
            entityName: 'Unknown',
            error: statementResult.error || 'Unknown error',
          });
        }
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          entityId: customerId,
          entityName: 'Unknown',
          error: error.message,
        });
      }
    }

    return result;
  }
}

// ============================================================================
// SERVICE FACTORY
// ============================================================================

/**
 * Create statement service instance
 */
export function createStatementService(
  companyId: string,
  userId: string
): StatementService {
  return new StatementService(companyId, userId);
}
