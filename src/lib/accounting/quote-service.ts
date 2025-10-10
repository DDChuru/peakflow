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
  Quote,
  QuoteCreateRequest,
  QuoteRevisionRequest,
  QuoteApprovalRequest,
  QuoteConversionRequest,
  QuoteSummary,
  QuoteFilters,
  QuoteLineItem,
  QuoteStatus
} from '@/types/accounting/quote';

export class QuoteService {
  private getCollectionPath(companyId: string): string {
    return `companies/${companyId}/quotes`;
  }

  // Helper to remove undefined values for Firestore
  private cleanForFirestore(quote: Quote): Record<string, any> {
    const cleanData: Record<string, any> = {
      id: quote.id,
      companyId: quote.companyId,
      quoteNumber: quote.quoteNumber,
      customerId: quote.customerId,
      customerName: quote.customerName || '',
      quoteDate: quote.quoteDate instanceof Date
        ? Timestamp.fromDate(quote.quoteDate)
        : Timestamp.fromDate(new Date(quote.quoteDate)),
      validUntil: quote.validUntil instanceof Date
        ? Timestamp.fromDate(quote.validUntil)
        : Timestamp.fromDate(new Date(quote.validUntil)),
      status: quote.status,
      subtotal: quote.subtotal,
      taxAmount: quote.taxAmount,
      totalAmount: quote.totalAmount,
      currency: quote.currency,
      exchangeRate: quote.exchangeRate,
      lineItems: quote.lineItems,
      validityPeriod: quote.validityPeriod,
      requiresApproval: quote.requiresApproval,
      version: quote.version,
      isLatestVersion: quote.isLatestVersion,
      metadata: quote.metadata,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: quote.createdBy
    };

    // Add optional fields only if they have values
    if (quote.customerAddress) cleanData.customerAddress = quote.customerAddress;
    if (quote.customerEmail) cleanData.customerEmail = quote.customerEmail;
    if (quote.customerPhone) cleanData.customerPhone = quote.customerPhone;
    if (quote.customerTaxId) cleanData.customerTaxId = quote.customerTaxId;
    if (quote.sourceType) cleanData.sourceType = quote.sourceType;
    if (quote.sourceDocumentId) cleanData.sourceDocumentId = quote.sourceDocumentId;
    if (quote.taxRate !== undefined) cleanData.taxRate = quote.taxRate;
    if (quote.notes) cleanData.notes = quote.notes;
    if (quote.termsAndConditions) cleanData.termsAndConditions = quote.termsAndConditions;
    if (quote.convertedToInvoiceId) cleanData.convertedToInvoiceId = quote.convertedToInvoiceId;
    if (quote.convertedToSalesOrderId) cleanData.convertedToSalesOrderId = quote.convertedToSalesOrderId;
    if (quote.conversionDate) cleanData.conversionDate = Timestamp.fromDate(new Date(quote.conversionDate));
    if (quote.approvedBy) cleanData.approvedBy = quote.approvedBy;
    if (quote.approvedDate) cleanData.approvedDate = Timestamp.fromDate(new Date(quote.approvedDate));
    if (quote.rejectionReason) cleanData.rejectionReason = quote.rejectionReason;
    if (quote.parentQuoteId) cleanData.parentQuoteId = quote.parentQuoteId;
    if (quote.modifiedBy) cleanData.modifiedBy = quote.modifiedBy;

    return cleanData;
  }

  // Generate quote number
  private async generateQuoteNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const quotesQuery = query(
      collection(db, this.getCollectionPath(companyId)),
      where('quoteNumber', '>=', `QUO-${year}-`),
      where('quoteNumber', '<', `QUO-${year + 1}-`),
      orderBy('quoteNumber', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(quotesQuery);
    let nextNumber = 1;

    if (!snapshot.empty) {
      const lastQuote = snapshot.docs[0].data();
      const lastNumber = parseInt(lastQuote.quoteNumber.split('-')[2]) || 0;
      nextNumber = lastNumber + 1;
    }

    return `QUO-${year}-${nextNumber.toString().padStart(4, '0')}`;
  }

  // Calculate line item amounts and totals
  private calculateQuoteAmounts(
    lineItems: Omit<QuoteLineItem, 'id' | 'amount' | 'taxAmount'>[],
    documentTaxRate?: number
  ): {
    calculatedLineItems: QuoteLineItem[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
  } {
    const calculatedLineItems: QuoteLineItem[] = lineItems.map((item, index) => {
      const amount = item.quantity * item.unitPrice;
      // Don't calculate tax at line item level anymore
      const taxAmount = 0;

      // Build clean line item without undefined fields
      const cleanItem: QuoteLineItem = {
        id: `line-${index + 1}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount,
        glAccountId: item.glAccountId,
      };

      // Only add optional fields if they have values
      if (item.accountCode !== undefined) cleanItem.accountCode = item.accountCode;
      if (item.itemCode !== undefined) cleanItem.itemCode = item.itemCode;
      if (item.notes !== undefined) cleanItem.notes = item.notes;

      return cleanItem;
    });

    const subtotal = calculatedLineItems.reduce((sum, item) => sum + item.amount, 0);
    // Calculate tax at document level
    const taxAmount = documentTaxRate ? (subtotal * documentTaxRate) / 100 : 0;
    const totalAmount = subtotal + taxAmount;

    return {
      calculatedLineItems,
      subtotal,
      taxAmount,
      totalAmount
    };
  }

  // Create a new quote
  async createQuote(
    companyId: string,
    quoteData: QuoteCreateRequest,
    userId: string
  ): Promise<Quote> {
    try {
      const quotesRef = collection(db, this.getCollectionPath(companyId));
      const quoteRef = doc(quotesRef);

      const quoteNumber = await this.generateQuoteNumber(companyId);
      const { calculatedLineItems, subtotal, taxAmount, totalAmount } =
        this.calculateQuoteAmounts(quoteData.lineItems, quoteData.taxRate);

      // Calculate valid until date
      const quoteDate = new Date(quoteData.quoteDate);
      const validUntil = new Date(quoteDate);
      validUntil.setDate(validUntil.getDate() + quoteData.validityPeriod);

      const newQuote: Quote = {
        id: quoteRef.id,
        companyId,
        quoteNumber,
        customerId: quoteData.customerId,
        customerName: quoteData.customerName || '',
        customerAddress: quoteData.customerAddress || '',
        customerEmail: quoteData.customerEmail || '',
        customerPhone: quoteData.customerPhone || '',
        quoteDate: quoteData.quoteDate,
        validUntil: validUntil.toISOString(),
        status: 'draft',
        sourceType: quoteData.sourceType,
        sourceDocumentId: quoteData.sourceDocumentId,
        subtotal,
        taxRate: quoteData.taxRate,
        taxAmount,
        totalAmount,
        currency: quoteData.currency,
        exchangeRate: quoteData.exchangeRate || 1,
        lineItems: calculatedLineItems,
        notes: quoteData.notes,
        termsAndConditions: quoteData.termsAndConditions,
        validityPeriod: quoteData.validityPeriod,
        requiresApproval: quoteData.requiresApproval || false,
        version: 1,
        isLatestVersion: true,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      };

      await setDoc(quoteRef, this.cleanForFirestore(newQuote));

      return newQuote;
    } catch (error) {
      console.error('Error creating quote:', error);
      throw new Error(`Failed to create quote: ${error}`);
    }
  }

  // Get all quotes with filtering
  async getQuotes(companyId: string, filters?: QuoteFilters): Promise<Quote[]> {
    try {
      const constraints: QueryConstraint[] = [];

      if (filters?.status?.length) {
        constraints.push(where('status', 'in', filters.status));
      }

      if (filters?.customerId) {
        constraints.push(where('customerId', '==', filters.customerId));
      }

      if (filters?.requiresApproval !== undefined) {
        constraints.push(where('requiresApproval', '==', filters.requiresApproval));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(
        collection(db, this.getCollectionPath(companyId)),
        ...constraints
      );

      const querySnapshot = await getDocs(q);
      const quotes: Quote[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const quote = this.convertFirestoreToQuote(doc.id, data);

        // Client-side filtering for date ranges and search
        let includeQuote = true;

        if (filters?.dateFrom) {
          const quoteDate = new Date(quote.quoteDate);
          const fromDate = new Date(filters.dateFrom);
          if (quoteDate < fromDate) includeQuote = false;
        }

        if (filters?.dateTo) {
          const quoteDate = new Date(quote.quoteDate);
          const toDate = new Date(filters.dateTo);
          if (quoteDate > toDate) includeQuote = false;
        }

        if (filters?.amountFrom && quote.totalAmount < filters.amountFrom) {
          includeQuote = false;
        }

        if (filters?.amountTo && quote.totalAmount > filters.amountTo) {
          includeQuote = false;
        }

        if (filters?.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          const searchText = `${quote.quoteNumber} ${quote.customerName}`.toLowerCase();
          if (!searchText.includes(term)) includeQuote = false;
        }

        if (includeQuote) {
          quotes.push(quote);
        }
      });

      return quotes;
    } catch (error) {
      console.error('Error fetching quotes:', error);
      throw new Error(`Failed to fetch quotes: ${error}`);
    }
  }

  // Get a single quote
  async getQuote(companyId: string, quoteId: string): Promise<Quote | null> {
    try {
      const quoteRef = doc(db, this.getCollectionPath(companyId), quoteId);
      const quoteDoc = await getDoc(quoteRef);

      if (!quoteDoc.exists()) {
        return null;
      }

      return this.convertFirestoreToQuote(quoteDoc.id, quoteDoc.data());
    } catch (error) {
      console.error('Error fetching quote:', error);
      throw new Error(`Failed to fetch quote: ${error}`);
    }
  }

  // Update quote
  async updateQuote(
    companyId: string,
    quoteId: string,
    updates: Partial<Quote>,
    userId: string
  ): Promise<void> {
    console.log('🔄 QuoteService.updateQuote called:', { companyId, quoteId, userId });
    console.log('Updates received:', updates);

    try {
      const quoteRef = doc(db, this.getCollectionPath(companyId), quoteId);
      console.log('Firestore path:', this.getCollectionPath(companyId), quoteId);

      // Recalculate amounts if line items changed
      if (updates.lineItems) {
        console.log('📊 Recalculating amounts for line items...');

        // Clean line items before calculation - remove undefined optional fields
        const cleanedItemsForCalc = updates.lineItems.map(item => {
          const cleanItem: any = {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            glAccountId: item.glAccountId,
          };

          // Only add optional fields if they have values
          if (item.accountCode !== undefined) cleanItem.accountCode = item.accountCode;
          if (item.itemCode !== undefined) cleanItem.itemCode = item.itemCode;
          if (item.notes !== undefined) cleanItem.notes = item.notes;

          return cleanItem;
        });

        const { calculatedLineItems, subtotal, taxAmount, totalAmount } =
          this.calculateQuoteAmounts(cleanedItemsForCalc, updates.taxRate);

        updates.lineItems = calculatedLineItems;
        updates.subtotal = subtotal;
        updates.taxAmount = taxAmount;
        updates.totalAmount = totalAmount;

        console.log('✅ Calculated amounts:', { subtotal, taxAmount, totalAmount });
      }

      // Calculate validUntil if dates changed
      if (updates.quoteDate && updates.validityPeriod) {
        const quoteDate = new Date(updates.quoteDate);
        const validUntil = new Date(quoteDate);
        validUntil.setDate(validUntil.getDate() + updates.validityPeriod);
        updates.validUntil = validUntil.toISOString();
        console.log('📅 Calculated validUntil:', updates.validUntil);
      }

      // Clean data for Firestore - only add fields that are not undefined
      const cleanUpdates: Record<string, any> = {
        modifiedBy: userId,
        updatedAt: serverTimestamp()
      };

      // Add fields that have values (not undefined)
      if (updates.customerId !== undefined) cleanUpdates.customerId = updates.customerId;
      if (updates.customerName !== undefined) cleanUpdates.customerName = updates.customerName;
      if (updates.customerEmail !== undefined) cleanUpdates.customerEmail = updates.customerEmail;
      if (updates.customerAddress !== undefined) cleanUpdates.customerAddress = updates.customerAddress;
      if (updates.customerPhone !== undefined) cleanUpdates.customerPhone = updates.customerPhone;
      if (updates.quoteDate !== undefined) cleanUpdates.quoteDate = Timestamp.fromDate(new Date(updates.quoteDate));
      if (updates.validUntil !== undefined) cleanUpdates.validUntil = Timestamp.fromDate(new Date(updates.validUntil));
      if (updates.validityPeriod !== undefined) cleanUpdates.validityPeriod = updates.validityPeriod;
      if (updates.currency !== undefined) cleanUpdates.currency = updates.currency;
      if (updates.exchangeRate !== undefined) cleanUpdates.exchangeRate = updates.exchangeRate;
      if (updates.taxRate !== undefined) cleanUpdates.taxRate = updates.taxRate;
      if (updates.lineItems !== undefined) cleanUpdates.lineItems = updates.lineItems;
      if (updates.subtotal !== undefined) cleanUpdates.subtotal = updates.subtotal;
      if (updates.taxAmount !== undefined) cleanUpdates.taxAmount = updates.taxAmount;
      if (updates.totalAmount !== undefined) cleanUpdates.totalAmount = updates.totalAmount;
      if (updates.notes !== undefined) cleanUpdates.notes = updates.notes;
      if (updates.termsAndConditions !== undefined) cleanUpdates.termsAndConditions = updates.termsAndConditions;

      console.log('🧹 Clean updates prepared for Firestore:', cleanUpdates);

      // Final safety check: filter out any undefined values
      const safeUpdates = Object.entries(cleanUpdates).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        } else {
          console.warn(`⚠️ Filtered out undefined value for key: ${key}`);
        }
        return acc;
      }, {} as Record<string, any>);

      console.log('📤 Final safe updates for Firestore:', safeUpdates);
      console.log('📤 Updating Firestore document...');

      await updateDoc(quoteRef, safeUpdates);

      console.log('✅ Firestore update completed successfully');
    } catch (error) {
      console.error('❌ Error updating quote in service:', error);
      console.error('Error details:', {
        error,
        companyId,
        quoteId,
        path: this.getCollectionPath(companyId)
      });
      throw new Error(`Failed to update quote: ${error}`);
    }
  }

  // Update quote status
  async updateQuoteStatus(
    companyId: string,
    quoteId: string,
    status: QuoteStatus,
    userId: string
  ): Promise<void> {
    try {
      const quoteRef = doc(db, this.getCollectionPath(companyId), quoteId);

      await updateDoc(quoteRef, {
        status,
        modifiedBy: userId,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating quote status:', error);
      throw new Error(`Failed to update quote status: ${error}`);
    }
  }

  // Create quote revision
  async createRevision(
    companyId: string,
    revisionRequest: QuoteRevisionRequest,
    userId: string
  ): Promise<Quote> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Get the original quote
        const originalQuoteRef = doc(db, this.getCollectionPath(companyId), revisionRequest.quoteId);
        const originalQuoteDoc = await transaction.get(originalQuoteRef);

        if (!originalQuoteDoc.exists()) {
          throw new Error('Original quote not found');
        }

        const originalQuote = this.convertFirestoreToQuote(originalQuoteDoc.id, originalQuoteDoc.data());

        // Mark original as not latest version
        transaction.update(originalQuoteRef, {
          isLatestVersion: false,
          updatedAt: serverTimestamp()
        });

        // Create new revision
        const quotesRef = collection(db, this.getCollectionPath(companyId));
        const newQuoteRef = doc(quotesRef);

        let lineItems = originalQuote.lineItems;
        const documentTaxRate = revisionRequest.changes.taxRate ?? originalQuote.taxRate;

        if (revisionRequest.changes.lineItems) {
          const { calculatedLineItems } = this.calculateQuoteAmounts(revisionRequest.changes.lineItems, documentTaxRate);
          lineItems = calculatedLineItems;
        }

        const { subtotal, taxAmount, totalAmount } = this.calculateQuoteAmounts(
          lineItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            glAccountId: item.glAccountId,
            accountCode: item.accountCode,
            itemCode: item.itemCode,
            notes: item.notes
          })),
          documentTaxRate
        );

        // Update valid until if validity period changed
        let validUntil = originalQuote.validUntil;
        if (revisionRequest.changes.validityPeriod) {
          const quoteDate = new Date(originalQuote.quoteDate);
          const newValidUntil = new Date(quoteDate);
          newValidUntil.setDate(newValidUntil.getDate() + revisionRequest.changes.validityPeriod);
          validUntil = newValidUntil.toISOString();
        }

        const revisedQuote: Quote = {
          ...originalQuote,
          id: newQuoteRef.id,
          status: 'draft', // Reset to draft for review
          lineItems,
          subtotal,
          taxRate: documentTaxRate,
          taxAmount,
          totalAmount,
          validUntil,
          validityPeriod: revisionRequest.changes.validityPeriod || originalQuote.validityPeriod,
          notes: revisionRequest.changes.notes || originalQuote.notes,
          termsAndConditions: revisionRequest.changes.termsAndConditions || originalQuote.termsAndConditions,
          version: originalQuote.version + 1,
          parentQuoteId: originalQuote.id,
          isLatestVersion: true,
          updatedAt: new Date(),
          modifiedBy: userId
        };

        transaction.set(newQuoteRef, this.cleanForFirestore(revisedQuote));

        return revisedQuote;
      });
    } catch (error) {
      console.error('Error creating quote revision:', error);
      throw new Error(`Failed to create quote revision: ${error}`);
    }
  }

  // Handle quote approval
  async handleApproval(
    companyId: string,
    approvalRequest: QuoteApprovalRequest,
    userId: string
  ): Promise<void> {
    try {
      const quoteRef = doc(db, this.getCollectionPath(companyId), approvalRequest.quoteId);

      const updateData: Partial<Quote> = {
        modifiedBy: userId,
        updatedAt: new Date()
      };

      if (approvalRequest.action === 'approve') {
        updateData.status = 'sent';
        updateData.approvedBy = userId;
        updateData.approvedDate = new Date().toISOString();
      } else {
        updateData.status = 'rejected';
        updateData.rejectionReason = approvalRequest.reason;
      }

      await updateDoc(quoteRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
        approvedDate: updateData.approvedDate ? Timestamp.fromDate(new Date(updateData.approvedDate)) : undefined
      });
    } catch (error) {
      console.error('Error handling quote approval:', error);
      throw new Error(`Failed to handle quote approval: ${error}`);
    }
  }

  // Get quotes summary
  async getQuotesSummary(companyId: string): Promise<QuoteSummary> {
    try {
      const quotes = await this.getQuotes(companyId);

      const summary: QuoteSummary = {
        totalQuotes: quotes.length,
        draftQuotes: quotes.filter(q => q.status === 'draft').length,
        sentQuotes: quotes.filter(q => q.status === 'sent').length,
        acceptedQuotes: quotes.filter(q => q.status === 'accepted').length,
        convertedQuotes: quotes.filter(q => q.status === 'converted').length,
        expiredQuotes: quotes.filter(q => q.status === 'expired').length,
        totalValue: quotes.reduce((sum, q) => sum + q.totalAmount, 0),
        acceptanceRate: 0,
        averageQuoteValue: 0,
        conversionRate: 0
      };

      if (summary.totalQuotes > 0) {
        summary.averageQuoteValue = summary.totalValue / summary.totalQuotes;

        const sentAndProcessed = summary.sentQuotes + summary.acceptedQuotes + summary.convertedQuotes + summary.expiredQuotes;
        if (sentAndProcessed > 0) {
          summary.acceptanceRate = ((summary.acceptedQuotes + summary.convertedQuotes) / sentAndProcessed) * 100;
          summary.conversionRate = (summary.convertedQuotes / sentAndProcessed) * 100;
        }
      }

      return summary;
    } catch (error) {
      console.error('Error getting quotes summary:', error);
      throw new Error(`Failed to get quotes summary: ${error}`);
    }
  }

  // Helper method to convert Firestore document to Quote type
  private convertFirestoreToQuote(id: string, data: DocumentData): Quote {
    return {
      id,
      companyId: data.companyId,
      quoteNumber: data.quoteNumber,
      customerId: data.customerId,
      customerName: data.customerName || '',
      customerAddress: data.customerAddress,
      customerTaxId: data.customerTaxId,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      quoteDate: data.quoteDate?.toDate()?.toISOString() || data.quoteDate,
      validUntil: data.validUntil?.toDate()?.toISOString() || data.validUntil,
      status: data.status || 'draft',
      sourceType: data.sourceType,
      sourceDocumentId: data.sourceDocumentId,
      subtotal: data.subtotal || 0,
      taxRate: data.taxRate,
      taxAmount: data.taxAmount || 0,
      totalAmount: data.totalAmount || 0,
      currency: data.currency || 'USD',
      exchangeRate: data.exchangeRate || 1,
      lineItems: data.lineItems || [],
      convertedToInvoiceId: data.convertedToInvoiceId,
      convertedToSalesOrderId: data.convertedToSalesOrderId,
      conversionDate: data.conversionDate?.toDate()?.toISOString() || data.conversionDate,
      notes: data.notes,
      termsAndConditions: data.termsAndConditions,
      validityPeriod: data.validityPeriod || 30,
      requiresApproval: data.requiresApproval || false,
      approvedBy: data.approvedBy,
      approvedDate: data.approvedDate?.toDate()?.toISOString() || data.approvedDate,
      rejectionReason: data.rejectionReason,
      version: data.version || 1,
      parentQuoteId: data.parentQuoteId,
      isLatestVersion: data.isLatestVersion !== false,
      metadata: data.metadata || {},
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy,
      modifiedBy: data.modifiedBy
    };
  }
}

// Export singleton instance
export const quoteService = new QuoteService();