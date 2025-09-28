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
  SalesOrder,
  SalesOrderCreateRequest,
  SalesOrderShipmentRequest,
  SalesOrderInvoiceRequest,
  SalesOrderSummary,
  SalesOrderFilters,
  SalesOrderLineItem,
  SalesOrderStatus
} from '@/types/accounting/sales-order';
import { Quote } from '@/types/accounting/quote';
import { quoteService } from './quote-service';
import { invoiceService } from './invoice-service';

export class SalesOrderService {
  private getCollectionPath(companyId: string): string {
    return `companies/${companyId}/sales_orders`;
  }

  // Generate sales order number
  private async generateSalesOrderNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const ordersQuery = query(
      collection(db, this.getCollectionPath(companyId)),
      where('salesOrderNumber', '>=', `SO-${year}-`),
      where('salesOrderNumber', '<', `SO-${year + 1}-`),
      orderBy('salesOrderNumber', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(ordersQuery);
    let nextNumber = 1;

    if (!snapshot.empty) {
      const lastOrder = snapshot.docs[0].data();
      const lastNumber = parseInt(lastOrder.salesOrderNumber.split('-')[2]) || 0;
      nextNumber = lastNumber + 1;
    }

    return `SO-${year}-${nextNumber.toString().padStart(4, '0')}`;
  }

  // Calculate line item amounts and totals
  private calculateSalesOrderAmounts(lineItems: Omit<SalesOrderLineItem, 'id' | 'amount' | 'taxAmount' | 'quantityShipped' | 'quantityInvoiced' | 'quantityRemaining'>[]): {
    calculatedLineItems: SalesOrderLineItem[];
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
  } {
    const calculatedLineItems: SalesOrderLineItem[] = lineItems.map((item, index) => {
      const amount = item.quantity * item.unitPrice;
      const taxAmount = item.taxRate ? (amount * item.taxRate) / 100 : 0;

      return {
        ...item,
        id: `line-${index + 1}`,
        amount,
        taxAmount,
        quantityShipped: 0,
        quantityInvoiced: 0,
        quantityRemaining: item.quantity
      };
    });

    const subtotal = calculatedLineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = calculatedLineItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const totalAmount = subtotal + taxAmount;

    return {
      calculatedLineItems,
      subtotal,
      taxAmount,
      totalAmount
    };
  }

  // Create a new sales order
  async createSalesOrder(
    companyId: string,
    orderData: SalesOrderCreateRequest,
    userId: string
  ): Promise<SalesOrder> {
    try {
      const ordersRef = collection(db, this.getCollectionPath(companyId));
      const orderRef = doc(ordersRef);

      const salesOrderNumber = await this.generateSalesOrderNumber(companyId);
      const { calculatedLineItems, subtotal, taxAmount, totalAmount } =
        this.calculateSalesOrderAmounts(orderData.lineItems);

      const totalQuantityOrdered = calculatedLineItems.reduce((sum, item) => sum + item.quantity, 0);

      const newSalesOrder: SalesOrder = {
        id: orderRef.id,
        companyId,
        salesOrderNumber,
        customerId: orderData.customerId,
        customerName: '', // Will be populated from customer service
        customerAddress: '',
        customerEmail: '',
        orderDate: orderData.orderDate,
        requestedDeliveryDate: orderData.requestedDeliveryDate,
        status: 'draft',
        sourceQuoteId: orderData.sourceQuoteId,
        sourceQuoteNumber: '', // Will be populated if from quote
        customerPONumber: orderData.customerPONumber,
        subtotal,
        taxAmount,
        totalAmount,
        currency: orderData.currency,
        exchangeRate: orderData.exchangeRate || 1,
        lineItems: calculatedLineItems,
        totalQuantityOrdered,
        totalQuantityShipped: 0,
        totalQuantityInvoiced: 0,
        isFullyShipped: false,
        isFullyInvoiced: false,
        deliveryAddress: orderData.deliveryAddress,
        deliveryInstructions: orderData.deliveryInstructions,
        shippingMethod: orderData.shippingMethod,
        paymentTerms: orderData.paymentTerms,
        invoiceIds: [],
        notes: orderData.notes,
        termsAndConditions: orderData.termsAndConditions,
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      };

      await setDoc(orderRef, {
        ...newSalesOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        orderDate: Timestamp.fromDate(new Date(newSalesOrder.orderDate)),
        requestedDeliveryDate: newSalesOrder.requestedDeliveryDate
          ? Timestamp.fromDate(new Date(newSalesOrder.requestedDeliveryDate))
          : null,
        confirmedDeliveryDate: newSalesOrder.confirmedDeliveryDate
          ? Timestamp.fromDate(new Date(newSalesOrder.confirmedDeliveryDate))
          : null
      });

      return newSalesOrder;
    } catch (error) {
      console.error('Error creating sales order:', error);
      throw new Error(`Failed to create sales order: ${error}`);
    }
  }

  // Create sales order from quote
  async createFromQuote(
    companyId: string,
    quoteId: string,
    orderOptions: {
      orderDate: string;
      requestedDeliveryDate?: string;
      deliveryAddress?: string;
      deliveryInstructions?: string;
      shippingMethod?: string;
      notes?: string;
    },
    userId: string
  ): Promise<SalesOrder> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Get the quote
        const quote = await quoteService.getQuote(companyId, quoteId);
        if (!quote) {
          throw new Error('Quote not found');
        }

        if (quote.status !== 'accepted') {
          throw new Error('Quote must be accepted before converting to sales order');
        }

        // Create sales order from quote data
        const orderRef = doc(collection(db, this.getCollectionPath(companyId)));
        const salesOrderNumber = await this.generateSalesOrderNumber(companyId);

        const lineItems: SalesOrderLineItem[] = quote.lineItems.map(item => ({
          ...item,
          quantityShipped: 0,
          quantityInvoiced: 0,
          quantityRemaining: item.quantity,
          quoteLineId: item.id
        }));

        const totalQuantityOrdered = lineItems.reduce((sum, item) => sum + item.quantity, 0);

        const newSalesOrder: SalesOrder = {
          id: orderRef.id,
          companyId,
          salesOrderNumber,
          customerId: quote.customerId,
          customerName: quote.customerName,
          customerAddress: quote.customerAddress,
          customerEmail: quote.customerEmail,
          orderDate: orderOptions.orderDate,
          requestedDeliveryDate: orderOptions.requestedDeliveryDate,
          status: 'confirmed',
          sourceQuoteId: quoteId,
          sourceQuoteNumber: quote.quoteNumber,
          subtotal: quote.subtotal,
          taxAmount: quote.taxAmount,
          totalAmount: quote.totalAmount,
          currency: quote.currency,
          exchangeRate: quote.exchangeRate,
          lineItems,
          totalQuantityOrdered,
          totalQuantityShipped: 0,
          totalQuantityInvoiced: 0,
          isFullyShipped: false,
          isFullyInvoiced: false,
          deliveryAddress: orderOptions.deliveryAddress,
          deliveryInstructions: orderOptions.deliveryInstructions,
          shippingMethod: orderOptions.shippingMethod,
          paymentTerms: 30, // Default payment terms
          invoiceIds: [],
          notes: orderOptions.notes || quote.notes,
          termsAndConditions: quote.termsAndConditions,
          metadata: {
            convertedFromQuote: true,
            originalQuoteId: quoteId
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId
        };

        // Save the sales order
        transaction.set(orderRef, {
          ...newSalesOrder,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          orderDate: Timestamp.fromDate(new Date(newSalesOrder.orderDate)),
          requestedDeliveryDate: newSalesOrder.requestedDeliveryDate
            ? Timestamp.fromDate(new Date(newSalesOrder.requestedDeliveryDate))
            : null
        });

        // Update quote status to converted
        const quoteRef = doc(db, `companies/${companyId}/quotes`, quoteId);
        transaction.update(quoteRef, {
          status: 'converted',
          convertedToSalesOrderId: orderRef.id,
          conversionDate: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        return newSalesOrder;
      });
    } catch (error) {
      console.error('Error creating sales order from quote:', error);
      throw new Error(`Failed to create sales order from quote: ${error}`);
    }
  }

  // Record shipment
  async recordShipment(
    companyId: string,
    shipmentRequest: SalesOrderShipmentRequest,
    userId: string
  ): Promise<void> {
    try {
      return await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, this.getCollectionPath(companyId), shipmentRequest.salesOrderId);
        const orderDoc = await transaction.get(orderRef);

        if (!orderDoc.exists()) {
          throw new Error('Sales order not found');
        }

        const salesOrder = this.convertFirestoreToSalesOrder(orderDoc.id, orderDoc.data());

        // Update line item quantities
        const updatedLineItems = salesOrder.lineItems.map(lineItem => {
          const shipmentLine = shipmentRequest.lineItems.find(
            sl => sl.lineItemId === lineItem.id
          );

          if (shipmentLine) {
            if (shipmentLine.quantityToShip > lineItem.quantityRemaining) {
              throw new Error(
                `Cannot ship ${shipmentLine.quantityToShip} units for item ${lineItem.description}. Only ${lineItem.quantityRemaining} remaining.`
              );
            }

            return {
              ...lineItem,
              quantityShipped: lineItem.quantityShipped + shipmentLine.quantityToShip,
              quantityRemaining: lineItem.quantityRemaining - shipmentLine.quantityToShip
            };
          }

          return lineItem;
        });

        // Calculate totals
        const totalQuantityShipped = updatedLineItems.reduce(
          (sum, item) => sum + item.quantityShipped,
          0
        );
        const totalRemaining = updatedLineItems.reduce(
          (sum, item) => sum + item.quantityRemaining,
          0
        );
        const isFullyShipped = totalRemaining === 0;

        // Update status based on shipment
        let newStatus: SalesOrderStatus = salesOrder.status;
        if (isFullyShipped) {
          newStatus = 'shipped';
        } else if (totalQuantityShipped > 0) {
          newStatus = 'in_progress';
        }

        transaction.update(orderRef, {
          lineItems: updatedLineItems,
          totalQuantityShipped,
          isFullyShipped,
          status: newStatus,
          modifiedBy: userId,
          updatedAt: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Error recording shipment:', error);
      throw new Error(`Failed to record shipment: ${error}`);
    }
  }

  // Create invoice from sales order
  async createInvoiceFromOrder(
    companyId: string,
    invoiceRequest: SalesOrderInvoiceRequest,
    userId: string
  ): Promise<string> {
    try {
      // Use the invoice service to create invoice from sales order
      const invoice = await invoiceService.createFromSalesOrder(
        companyId,
        invoiceRequest.salesOrderId,
        {
          invoiceDate: invoiceRequest.invoiceDate,
          lineItems: invoiceRequest.lineItems,
          notes: invoiceRequest.notes
        },
        userId
      );

      return invoice.id;
    } catch (error) {
      console.error('Error creating invoice from sales order:', error);
      throw new Error(`Failed to create invoice from sales order: ${error}`);
    }
  }

  // Get all sales orders with filtering
  async getSalesOrders(companyId: string, filters?: SalesOrderFilters): Promise<SalesOrder[]> {
    try {
      const constraints: QueryConstraint[] = [];

      if (filters?.status?.length) {
        constraints.push(where('status', 'in', filters.status));
      }

      if (filters?.customerId) {
        constraints.push(where('customerId', '==', filters.customerId));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      const q = query(
        collection(db, this.getCollectionPath(companyId)),
        ...constraints
      );

      const querySnapshot = await getDocs(q);
      const orders: SalesOrder[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const order = this.convertFirestoreToSalesOrder(doc.id, data);

        // Client-side filtering
        let includeOrder = true;

        if (filters?.dateFrom) {
          const orderDate = new Date(order.orderDate);
          const fromDate = new Date(filters.dateFrom);
          if (orderDate < fromDate) includeOrder = false;
        }

        if (filters?.dateTo) {
          const orderDate = new Date(order.orderDate);
          const toDate = new Date(filters.dateTo);
          if (orderDate > toDate) includeOrder = false;
        }

        if (filters?.amountFrom && order.totalAmount < filters.amountFrom) {
          includeOrder = false;
        }

        if (filters?.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          const searchText = `${order.salesOrderNumber} ${order.customerName} ${order.customerPONumber || ''}`.toLowerCase();
          if (!searchText.includes(term)) includeOrder = false;
        }

        if (includeOrder) {
          orders.push(order);
        }
      });

      return orders;
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      throw new Error(`Failed to fetch sales orders: ${error}`);
    }
  }

  // Get a single sales order
  async getSalesOrder(companyId: string, salesOrderId: string): Promise<SalesOrder | null> {
    try {
      const orderRef = doc(db, this.getCollectionPath(companyId), salesOrderId);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        return null;
      }

      return this.convertFirestoreToSalesOrder(orderDoc.id, orderDoc.data());
    } catch (error) {
      console.error('Error fetching sales order:', error);
      throw new Error(`Failed to fetch sales order: ${error}`);
    }
  }

  // Update sales order status
  async updateSalesOrderStatus(
    companyId: string,
    salesOrderId: string,
    status: SalesOrderStatus,
    userId: string
  ): Promise<void> {
    try {
      const orderRef = doc(db, this.getCollectionPath(companyId), salesOrderId);

      await updateDoc(orderRef, {
        status,
        modifiedBy: userId,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating sales order status:', error);
      throw new Error(`Failed to update sales order status: ${error}`);
    }
  }

  // Get sales orders summary
  async getSalesOrdersSummary(companyId: string): Promise<SalesOrderSummary> {
    try {
      const orders = await this.getSalesOrders(companyId);

      const summary: SalesOrderSummary = {
        totalOrders: orders.length,
        draftOrders: orders.filter(o => o.status === 'draft').length,
        confirmedOrders: orders.filter(o => o.status === 'confirmed').length,
        shippedOrders: orders.filter(o => o.status === 'shipped').length,
        invoicedOrders: orders.filter(o => o.status === 'invoiced').length,
        totalValue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
        averageOrderValue: 0,
        fulfillmentRate: 0
      };

      if (summary.totalOrders > 0) {
        summary.averageOrderValue = summary.totalValue / summary.totalOrders;

        const fulfillableOrders = orders.filter(o => o.status !== 'draft' && o.status !== 'cancelled');
        const fulfilledOrders = orders.filter(o => o.status === 'shipped' || o.status === 'invoiced');

        if (fulfillableOrders.length > 0) {
          summary.fulfillmentRate = (fulfilledOrders.length / fulfillableOrders.length) * 100;
        }
      }

      return summary;
    } catch (error) {
      console.error('Error getting sales orders summary:', error);
      throw new Error(`Failed to get sales orders summary: ${error}`);
    }
  }

  // Helper method to convert Firestore document to SalesOrder type
  private convertFirestoreToSalesOrder(id: string, data: DocumentData): SalesOrder {
    return {
      id,
      companyId: data.companyId,
      salesOrderNumber: data.salesOrderNumber,
      customerId: data.customerId,
      customerName: data.customerName || '',
      customerAddress: data.customerAddress,
      customerTaxId: data.customerTaxId,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      orderDate: data.orderDate?.toDate()?.toISOString() || data.orderDate,
      requestedDeliveryDate: data.requestedDeliveryDate?.toDate()?.toISOString() || data.requestedDeliveryDate,
      confirmedDeliveryDate: data.confirmedDeliveryDate?.toDate()?.toISOString() || data.confirmedDeliveryDate,
      status: data.status || 'draft',
      sourceQuoteId: data.sourceQuoteId,
      sourceQuoteNumber: data.sourceQuoteNumber,
      customerPONumber: data.customerPONumber,
      subtotal: data.subtotal || 0,
      taxAmount: data.taxAmount || 0,
      totalAmount: data.totalAmount || 0,
      currency: data.currency || 'USD',
      exchangeRate: data.exchangeRate || 1,
      lineItems: data.lineItems || [],
      totalQuantityOrdered: data.totalQuantityOrdered || 0,
      totalQuantityShipped: data.totalQuantityShipped || 0,
      totalQuantityInvoiced: data.totalQuantityInvoiced || 0,
      isFullyShipped: data.isFullyShipped || false,
      isFullyInvoiced: data.isFullyInvoiced || false,
      deliveryAddress: data.deliveryAddress,
      deliveryInstructions: data.deliveryInstructions,
      shippingMethod: data.shippingMethod,
      paymentTerms: data.paymentTerms || 30,
      paymentMethod: data.paymentMethod,
      invoiceIds: data.invoiceIds || [],
      notes: data.notes,
      termsAndConditions: data.termsAndConditions,
      metadata: data.metadata || {},
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy,
      modifiedBy: data.modifiedBy
    };
  }
}

// Export singleton instance
export const salesOrderService = new SalesOrderService();