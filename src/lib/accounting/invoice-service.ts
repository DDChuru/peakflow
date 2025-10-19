import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  DocumentData,
  QueryConstraint,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Invoice,
  InvoiceCreateRequest,
  InvoicePayment,
  InvoiceSummary,
  InvoiceFilters,
  InvoiceLineItem,
  InvoiceStatus,
  InvoiceAging,
  InvoiceBulkAction,
  InvoiceBulkResult
} from '@/types/accounting/invoice';
import { Quote } from '@/types/accounting/quote';
import { SalesOrder } from '@/types/accounting/sales-order';
import { quoteService } from './quote-service';

export class InvoiceService {
  private getCollectionPath(companyId: string): string {
    return `companies/${companyId}/invoices`;
  }

  // Generate invoice number
  private async generateInvoiceNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const invoicesQuery = query(
      collection(db, this.getCollectionPath(companyId)),
      where('invoiceNumber', '>=', `INV-${year}-`),
      where('invoiceNumber', '<', `INV-${year + 1}-`),
      orderBy('invoiceNumber', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(invoicesQuery);
    let nextNumber = 1;

    if (!snapshot.empty) {
      const lastInvoice = snapshot.docs[0].data();
      const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]) || 0;
      nextNumber = lastNumber + 1;
    }

    return `INV-${year}-${nextNumber.toString().padStart(4, '0')}`;
  }

  // Calculate line item amounts and totals (with document-level tax)
  private calculateInvoiceAmounts(
    lineItems: Omit<InvoiceLineItem, 'id' | 'amount' | 'taxAmount'>[],
    taxRate: number = 0
  ): {
    calculatedLineItems: InvoiceLineItem[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
  } {
    const calculatedLineItems: InvoiceLineItem[] = lineItems.map((item, index) => {
      const amount = item.quantity * item.unitPrice;

      return {
        ...item,
        id: `line-${index + 1}`,
        amount,
        taxAmount: 0 // No per-line-item tax
      };
    });

    const subtotal = calculatedLineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    return {
      calculatedLineItems,
      subtotal,
      taxAmount,
      totalAmount
    };
  }

  // Calculate due date from invoice date and payment terms
  private calculateDueDate(invoiceDate: string, paymentTerms: number): string {
    const date = new Date(invoiceDate);
    date.setDate(date.getDate() + paymentTerms);
    return date.toISOString();
  }

  // CREATION PATH 1: Direct invoice creation (manual)
  async createDirectInvoice(
    companyId: string,
    invoiceData: InvoiceCreateRequest,
    userId: string
  ): Promise<Invoice> {
    try {
      const invoicesRef = collection(db, this.getCollectionPath(companyId));
      const invoiceRef = doc(invoicesRef);

      const invoiceNumber = await this.generateInvoiceNumber(companyId);
      const { calculatedLineItems, subtotal, taxAmount, totalAmount } =
        this.calculateInvoiceAmounts(invoiceData.lineItems, invoiceData.taxRate || 0);

      const dueDate = this.calculateDueDate(invoiceData.invoiceDate, invoiceData.paymentTerms);

      // Build invoice object with only defined values
      const newInvoice: any = {
        id: invoiceRef.id,
        companyId,
        invoiceNumber,
        customerId: invoiceData.customerId,
        customerName: '', // Will be populated from customer service
        customerAddress: '',
        customerEmail: '',
        invoiceDate: invoiceData.invoiceDate,
        dueDate,
        paymentTerms: invoiceData.paymentTerms,
        status: 'draft',
        source: invoiceData.source,
        subtotal,
        taxRate: invoiceData.taxRate || 0,
        taxAmount,
        totalAmount,
        amountPaid: 0,
        amountDue: totalAmount,
        currency: invoiceData.currency,
        exchangeRate: invoiceData.exchangeRate || 1,
        lineItems: calculatedLineItems,
        paymentHistory: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      };

      // Only add optional fields if they have values
      if (invoiceData.sourceDocumentId) newInvoice.sourceDocumentId = invoiceData.sourceDocumentId;
      if (invoiceData.purchaseOrderNumber) newInvoice.purchaseOrderNumber = invoiceData.purchaseOrderNumber;
      if (invoiceData.notes) newInvoice.notes = invoiceData.notes;
      if (invoiceData.termsAndConditions) newInvoice.termsAndConditions = invoiceData.termsAndConditions;

      // Filter out undefined values before saving to Firestore
      const cleanInvoiceData = Object.fromEntries(
        Object.entries(newInvoice).filter(([_, value]) => value !== undefined)
      );

      await setDoc(invoiceRef, {
        ...cleanInvoiceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        invoiceDate: Timestamp.fromDate(new Date(newInvoice.invoiceDate)),
        dueDate: Timestamp.fromDate(new Date(newInvoice.dueDate))
      });

      return newInvoice;
    } catch (error) {
      console.error('Error creating direct invoice:', error);
      throw new Error(`Failed to create direct invoice: ${error}`);
    }
  }

  // CREATION PATH 2: Create invoice from quote
  async createFromQuote(
    companyId: string,
    quoteId: string,
    invoiceOptions: {
      invoiceDate: string;
      paymentTerms?: number;
      notes?: string;
    },
    userId: string
  ): Promise<Invoice> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Get the quote
        const quote = await quoteService.getQuote(companyId, quoteId);
        if (!quote) {
          throw new Error('Quote not found');
        }

        if (quote.status !== 'accepted') {
          throw new Error('Quote must be accepted before converting to invoice');
        }

        // Create invoice from quote data
        const invoiceRef = doc(collection(db, this.getCollectionPath(companyId)));
        const invoiceNumber = await this.generateInvoiceNumber(companyId);

        const paymentTerms = invoiceOptions.paymentTerms || 30;
        const dueDate = this.calculateDueDate(invoiceOptions.invoiceDate, paymentTerms);

        const newInvoice: Invoice = {
          id: invoiceRef.id,
          companyId,
          invoiceNumber,
          customerId: quote.customerId,
          customerName: quote.customerName,
          customerAddress: quote.customerAddress,
          customerEmail: quote.customerEmail,
          invoiceDate: invoiceOptions.invoiceDate,
          dueDate,
          paymentTerms,
          status: 'draft',
          source: 'quote',
          sourceDocumentId: quoteId,
          sourceDocumentNumber: quote.quoteNumber,
          subtotal: quote.subtotal,
          taxAmount: quote.taxAmount,
          totalAmount: quote.totalAmount,
          amountPaid: 0,
          amountDue: quote.totalAmount,
          currency: quote.currency,
          exchangeRate: quote.exchangeRate,
          lineItems: quote.lineItems.map(item => ({
            ...item,
            // Map quote line items to invoice line items
            glAccountId: item.glAccountId
          })),
          paymentHistory: [],
          notes: invoiceOptions.notes || quote.notes,
          termsAndConditions: quote.termsAndConditions,
          metadata: {
            convertedFromQuote: true,
            originalQuoteId: quoteId
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId
        };

        // Save the invoice
        transaction.set(invoiceRef, {
          ...newInvoice,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          invoiceDate: Timestamp.fromDate(new Date(newInvoice.invoiceDate)),
          dueDate: Timestamp.fromDate(new Date(newInvoice.dueDate))
        });

        // Update quote status to converted
        const quoteRef = doc(db, `companies/${companyId}/quotes`, quoteId);
        transaction.update(quoteRef, {
          status: 'converted',
          convertedToInvoiceId: invoiceRef.id,
          conversionDate: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        return newInvoice;
      });
    } catch (error) {
      console.error('Error creating invoice from quote:', error);
      throw new Error(`Failed to create invoice from quote: ${error}`);
    }
  }

  // CREATION PATH 3: Create invoice from sales order (partial or full)
  async createFromSalesOrder(
    companyId: string,
    salesOrderId: string,
    invoiceOptions: {
      invoiceDate: string;
      lineItems: Array<{
        lineItemId: string;
        quantityToInvoice: number;
      }>;
      notes?: string;
    },
    userId: string
  ): Promise<Invoice> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Get the sales order
        const salesOrderRef = doc(db, `companies/${companyId}/sales_orders`, salesOrderId);
        const salesOrderDoc = await transaction.get(salesOrderRef);

        if (!salesOrderDoc.exists()) {
          throw new Error('Sales order not found');
        }

        const salesOrder = salesOrderDoc.data() as SalesOrder;

        // Validate line items and create invoice line items
        const invoiceLineItems: InvoiceLineItem[] = [];
        let subtotal = 0;
        let taxAmount = 0;

        for (const invoiceLineRequest of invoiceOptions.lineItems) {
          const soLineItem = salesOrder.lineItems.find(li => li.id === invoiceLineRequest.lineItemId);
          if (!soLineItem) {
            throw new Error(`Sales order line item ${invoiceLineRequest.lineItemId} not found`);
          }

          if (invoiceLineRequest.quantityToInvoice > soLineItem.quantityRemaining) {
            throw new Error(`Cannot invoice ${invoiceLineRequest.quantityToInvoice} units. Only ${soLineItem.quantityRemaining} remaining.`);
          }

          const lineAmount = invoiceLineRequest.quantityToInvoice * soLineItem.unitPrice;
          const lineTaxAmount = soLineItem.taxRate ? (lineAmount * soLineItem.taxRate) / 100 : 0;

          invoiceLineItems.push({
            id: `line-${invoiceLineItems.length + 1}`,
            description: soLineItem.description,
            quantity: invoiceLineRequest.quantityToInvoice,
            unitPrice: soLineItem.unitPrice,
            amount: lineAmount,
            taxRate: soLineItem.taxRate,
            taxAmount: lineTaxAmount,
            glAccountId: soLineItem.glAccountId,
            accountCode: soLineItem.accountCode,
            itemCode: soLineItem.itemCode
          });

          subtotal += lineAmount;
          taxAmount += lineTaxAmount;
        }

        const totalAmount = subtotal + taxAmount;

        // Create invoice
        const invoiceRef = doc(collection(db, this.getCollectionPath(companyId)));
        const invoiceNumber = await this.generateInvoiceNumber(companyId);
        const dueDate = this.calculateDueDate(invoiceOptions.invoiceDate, salesOrder.paymentTerms);

        const newInvoice: Invoice = {
          id: invoiceRef.id,
          companyId,
          invoiceNumber,
          customerId: salesOrder.customerId,
          customerName: salesOrder.customerName,
          customerAddress: salesOrder.customerAddress,
          customerEmail: salesOrder.customerEmail,
          invoiceDate: invoiceOptions.invoiceDate,
          dueDate,
          paymentTerms: salesOrder.paymentTerms,
          status: 'draft',
          source: 'sales_order',
          sourceDocumentId: salesOrderId,
          sourceDocumentNumber: salesOrder.salesOrderNumber,
          purchaseOrderNumber: salesOrder.customerPONumber,
          subtotal,
          taxAmount,
          totalAmount,
          amountPaid: 0,
          amountDue: totalAmount,
          currency: salesOrder.currency,
          exchangeRate: salesOrder.exchangeRate,
          lineItems: invoiceLineItems,
          paymentHistory: [],
          notes: invoiceOptions.notes || salesOrder.notes,
          termsAndConditions: salesOrder.termsAndConditions,
          metadata: {
            convertedFromSalesOrder: true,
            originalSalesOrderId: salesOrderId
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId
        };

        // Save the invoice
        transaction.set(invoiceRef, {
          ...newInvoice,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          invoiceDate: Timestamp.fromDate(new Date(newInvoice.invoiceDate)),
          dueDate: Timestamp.fromDate(new Date(newInvoice.dueDate))
        });

        // Update sales order line item quantities
        const updatedLineItems = salesOrder.lineItems.map(lineItem => {
          const invoiceLineRequest = invoiceOptions.lineItems.find(ili => ili.lineItemId === lineItem.id);
          if (invoiceLineRequest) {
            return {
              ...lineItem,
              quantityInvoiced: lineItem.quantityInvoiced + invoiceLineRequest.quantityToInvoice,
              quantityRemaining: lineItem.quantityRemaining - invoiceLineRequest.quantityToInvoice
            };
          }
          return lineItem;
        });

        // Check if sales order is fully invoiced
        const totalRemaining = updatedLineItems.reduce((sum, item) => sum + item.quantityRemaining, 0);
        const isFullyInvoiced = totalRemaining === 0;

        // Update sales order
        transaction.update(salesOrderRef, {
          lineItems: updatedLineItems,
          isFullyInvoiced,
          status: isFullyInvoiced ? 'invoiced' : salesOrder.status,
          invoiceIds: [...(salesOrder.invoiceIds || []), invoiceRef.id],
          updatedAt: serverTimestamp()
        });

        return newInvoice;
      });
    } catch (error) {
      console.error('Error creating invoice from sales order:', error);
      throw new Error(`Failed to create invoice from sales order: ${error}`);
    }
  }

  // CREATION PATH 4: Create invoice from customer PO
  async createFromCustomerPO(
    companyId: string,
    customerPOData: {
      customerId: string;
      customerPONumber: string;
      invoiceDate: string;
      paymentTerms: number;
      currency: string;
      lineItems: Omit<InvoiceLineItem, 'id' | 'amount' | 'taxAmount'>[];
      notes?: string;
    },
    userId: string
  ): Promise<Invoice> {
    try {
      const invoiceRequest: InvoiceCreateRequest = {
        customerId: customerPOData.customerId,
        invoiceDate: customerPOData.invoiceDate,
        paymentTerms: customerPOData.paymentTerms,
        source: 'manual',
        purchaseOrderNumber: customerPOData.customerPONumber,
        currency: customerPOData.currency,
        lineItems: customerPOData.lineItems,
        notes: customerPOData.notes
      };

      const invoice = await this.createDirectInvoice(companyId, invoiceRequest, userId);

      // Update metadata to indicate PO source
      await updateDoc(doc(db, this.getCollectionPath(companyId), invoice.id), {
        metadata: {
          ...invoice.metadata,
          createdFromCustomerPO: true,
          customerPONumber: customerPOData.customerPONumber
        }
      });

      return invoice;
    } catch (error) {
      console.error('Error creating invoice from customer PO:', error);
      throw new Error(`Failed to create invoice from customer PO: ${error}`);
    }
  }

  // Get all invoices with filtering
  async getInvoices(companyId: string, filters?: InvoiceFilters): Promise<Invoice[]> {
    try {
      const constraints: QueryConstraint[] = [];

      if (filters?.status?.length) {
        constraints.push(where('status', 'in', filters.status));
      }

      if (filters?.customerId) {
        constraints.push(where('customerId', '==', filters.customerId));
      }

      if (filters?.source?.length) {
        constraints.push(where('source', 'in', filters.source));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(
        collection(db, this.getCollectionPath(companyId)),
        ...constraints
      );

      const querySnapshot = await getDocs(q);
      const invoices: Invoice[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const invoice = this.convertFirestoreToInvoice(doc.id, data);

        // Client-side filtering
        let includeInvoice = true;

        if (filters?.dateFrom) {
          const invoiceDate = new Date(invoice.invoiceDate);
          const fromDate = new Date(filters.dateFrom);
          if (invoiceDate < fromDate) includeInvoice = false;
        }

        if (filters?.dateTo) {
          const invoiceDate = new Date(invoice.invoiceDate);
          const toDate = new Date(filters.dateTo);
          if (invoiceDate > toDate) includeInvoice = false;
        }

        if (filters?.amountFrom && invoice.totalAmount < filters.amountFrom) {
          includeInvoice = false;
        }

        if (filters?.amountTo && invoice.totalAmount > filters.amountTo) {
          includeInvoice = false;
        }

        if (filters?.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          const searchText = `${invoice.invoiceNumber} ${invoice.customerName} ${invoice.purchaseOrderNumber || ''}`.toLowerCase();
          if (!searchText.includes(term)) includeInvoice = false;
        }

        if (includeInvoice) {
          invoices.push(invoice);
        }
      });

      return invoices;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw new Error(`Failed to fetch invoices: ${error}`);
    }
  }

  // Get a single invoice
  async getInvoice(companyId: string, invoiceId: string): Promise<Invoice | null> {
    try {
      const invoiceRef = doc(db, this.getCollectionPath(companyId), invoiceId);
      const invoiceDoc = await getDoc(invoiceRef);

      if (!invoiceDoc.exists()) {
        return null;
      }

      return this.convertFirestoreToInvoice(invoiceDoc.id, invoiceDoc.data());
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw new Error(`Failed to fetch invoice: ${error}`);
    }
  }

  // Update invoice
  async updateInvoice(
    companyId: string,
    invoiceId: string,
    updates: Partial<Invoice>,
    userId: string
  ): Promise<void> {
    try {
      const invoiceRef = doc(db, this.getCollectionPath(companyId), invoiceId);

      // If line items are being updated, recalculate amounts
      if (updates.lineItems) {
        const taxRate = updates.taxRate !== undefined ? updates.taxRate : 0;
        const { calculatedLineItems, subtotal, taxAmount, totalAmount } =
          this.calculateInvoiceAmounts(updates.lineItems as any, taxRate);

        updates.lineItems = calculatedLineItems;
        updates.subtotal = subtotal;
        updates.taxAmount = taxAmount;
        updates.totalAmount = totalAmount;
        updates.amountDue = totalAmount - (updates.amountPaid || 0);
      }

      await updateDoc(invoiceRef, {
        ...updates,
        modifiedBy: userId,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw new Error(`Failed to update invoice: ${error}`);
    }
  }

  // Update invoice status
  async updateInvoiceStatus(
    companyId: string,
    invoiceId: string,
    status: InvoiceStatus,
    userId: string
  ): Promise<void> {
    try {
      const invoiceRef = doc(db, this.getCollectionPath(companyId), invoiceId);

      await updateDoc(invoiceRef, {
        status,
        modifiedBy: userId,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw new Error(`Failed to update invoice status: ${error}`);
    }
  }

  // Record payment
  async recordPayment(
    companyId: string,
    invoiceId: string,
    payment: Omit<InvoicePayment, 'id' | 'invoiceId' | 'createdAt'>,
    userId: string
  ): Promise<void> {
    try {
      return await runTransaction(db, async (transaction) => {
        const invoiceRef = doc(db, this.getCollectionPath(companyId), invoiceId);
        const invoiceDoc = await transaction.get(invoiceRef);

        if (!invoiceDoc.exists()) {
          throw new Error('Invoice not found');
        }

        const invoice = this.convertFirestoreToInvoice(invoiceDoc.id, invoiceDoc.data());

        if (payment.amount > invoice.amountDue) {
          throw new Error('Payment amount cannot exceed amount due');
        }

        const newPayment: InvoicePayment = {
          ...payment,
          id: `payment-${Date.now()}`,
          invoiceId,
          createdAt: new Date(),
          createdBy: userId
        };

        const newAmountPaid = invoice.amountPaid + payment.amount;
        const newAmountDue = invoice.totalAmount - newAmountPaid;

        let newStatus: InvoiceStatus = invoice.status;
        if (newAmountDue === 0) {
          newStatus = 'paid';
        } else if (newAmountPaid > 0 && newAmountDue > 0) {
          newStatus = 'partial';
        }

        transaction.update(invoiceRef, {
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newStatus,
          paymentHistory: [...(invoice.paymentHistory || []), {
            ...newPayment,
            createdAt: serverTimestamp()
          }],
          modifiedBy: userId,
          updatedAt: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Error recording payment:', error);
      throw new Error(`Failed to record payment: ${error}`);
    }
  }

  // Get invoice summary
  async getInvoicesSummary(companyId: string): Promise<InvoiceSummary> {
    try {
      const invoices = await this.getInvoices(companyId);

      const summary: InvoiceSummary = {
        totalInvoices: invoices.length,
        totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        paidAmount: invoices.reduce((sum, inv) => sum + inv.amountPaid, 0),
        overdueAmount: 0,
        draftInvoices: invoices.filter(inv => inv.status === 'draft').length,
        sentInvoices: invoices.filter(inv => inv.status === 'sent').length,
        overdueInvoices: 0,
        averageDaysToPayment: 0
      };

      // Calculate overdue amounts and invoices
      const currentDate = new Date();
      const overdueInvoices = invoices.filter(inv => {
        if (inv.status === 'paid') return false;
        const dueDate = new Date(inv.dueDate);
        return dueDate < currentDate;
      });

      summary.overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);
      summary.overdueInvoices = overdueInvoices.length;

      // Calculate average days to payment for paid invoices
      const paidInvoices = invoices.filter(inv => inv.status === 'paid' && inv.paymentHistory?.length);
      if (paidInvoices.length > 0) {
        const totalDays = paidInvoices.reduce((sum, inv) => {
          const invoiceDate = new Date(inv.invoiceDate);
          const lastPayment = inv.paymentHistory![inv.paymentHistory!.length - 1];
          const paymentDate = new Date(lastPayment.paymentDate);
          const days = Math.floor((paymentDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);

        summary.averageDaysToPayment = Math.round(totalDays / paidInvoices.length);
      }

      return summary;
    } catch (error) {
      console.error('Error getting invoices summary:', error);
      throw new Error(`Failed to get invoices summary: ${error}`);
    }
  }

  // Get aging report
  async getInvoiceAging(companyId: string): Promise<InvoiceAging> {
    try {
      const invoices = await this.getInvoices(companyId, {
        status: ['sent', 'partial', 'overdue']
      });

      const aging: InvoiceAging = {
        current: 0,
        days31to60: 0,
        days61to90: 0,
        days91to120: 0,
        over120Days: 0,
        totalOutstanding: 0
      };

      const currentDate = new Date();

      invoices.forEach(invoice => {
        const dueDate = new Date(invoice.dueDate);
        const daysOverdue = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        const amount = invoice.amountDue;

        aging.totalOutstanding += amount;

        if (daysOverdue <= 0) {
          aging.current += amount;
        } else if (daysOverdue <= 60) {
          aging.days31to60 += amount;
        } else if (daysOverdue <= 90) {
          aging.days61to90 += amount;
        } else if (daysOverdue <= 120) {
          aging.days91to120 += amount;
        } else {
          aging.over120Days += amount;
        }
      });

      return aging;
    } catch (error) {
      console.error('Error getting invoice aging:', error);
      throw new Error(`Failed to get invoice aging: ${error}`);
    }
  }

  // Helper method to safely convert Timestamp or string to ISO string
  private convertToISOString(value: any): string {
    if (!value) return new Date().toISOString();

    // If it's already a string, return it
    if (typeof value === 'string') return value;

    // If it's a Firestore Timestamp, convert it
    if (value.toDate && typeof value.toDate === 'function') {
      return value.toDate().toISOString();
    }

    // If it's a Date object
    if (value instanceof Date) {
      return value.toISOString();
    }

    // Fallback: try to create a Date from it
    try {
      return new Date(value).toISOString();
    } catch (error) {
      console.warn('Could not convert date value:', value);
      return new Date().toISOString();
    }
  }

  // Helper method to safely convert Timestamp or string to Date
  private convertToDate(value: any): Date {
    if (!value) return new Date();

    // If it's already a Date, return it
    if (value instanceof Date) return value;

    // If it's a Firestore Timestamp, convert it
    if (value.toDate && typeof value.toDate === 'function') {
      return value.toDate();
    }

    // If it's a string or number, parse it
    try {
      return new Date(value);
    } catch (error) {
      console.warn('Could not convert to Date:', value);
      return new Date();
    }
  }

  // Helper method to convert Firestore document to Invoice type
  private convertFirestoreToInvoice(id: string, data: DocumentData): Invoice {
    return {
      id,
      companyId: data.companyId,
      invoiceNumber: data.invoiceNumber,
      customerId: data.customerId,
      customerName: data.customerName || '',
      customerAddress: data.customerAddress,
      customerTaxId: data.customerTaxId,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      invoiceDate: this.convertToISOString(data.invoiceDate),
      dueDate: this.convertToISOString(data.dueDate),
      paymentTerms: data.paymentTerms || 30,
      status: data.status || 'draft',
      source: data.source || 'manual',
      sourceDocumentId: data.sourceDocumentId,
      sourceDocumentNumber: data.sourceDocumentNumber,
      purchaseOrderNumber: data.purchaseOrderNumber,
      subtotal: data.subtotal || 0,
      taxRate: data.taxRate || 0,
      taxAmount: data.taxAmount || 0,
      totalAmount: data.totalAmount || 0,
      amountPaid: data.amountPaid || 0,
      amountDue: data.amountDue || 0,
      currency: data.currency || 'USD',
      exchangeRate: data.exchangeRate || 1,
      lineItems: data.lineItems || [],
      taxLines: data.taxLines,
      journalEntryId: data.journalEntryId,
      postedDate: this.convertToISOString(data.postedDate),
      fiscalPeriodId: data.fiscalPeriodId,
      paymentHistory: (data.paymentHistory || []).map((payment: any) => ({
        ...payment,
        createdAt: this.convertToDate(payment.createdAt)
      })),
      notes: data.notes,
      termsAndConditions: data.termsAndConditions,
      footerText: data.footerText,
      metadata: data.metadata || {},
      createdAt: this.convertToDate(data.createdAt),
      updatedAt: this.convertToDate(data.updatedAt),
      createdBy: data.createdBy,
      modifiedBy: data.modifiedBy
    };
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService();