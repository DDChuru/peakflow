/**
 * Accounting Services Index
 * Export all accounting-related services
 */

// Invoice Service (existing)
export { InvoiceService } from './invoice-service';

// Quote Service (existing)
export { QuoteService } from './quote-service';

// SLA Service (existing)
export { SLAService } from './sla-service';

// Pending Payment Service (Phase 2: AI Agent)
export {
  PendingPaymentService,
  getPendingPaymentService,
  pendingPaymentService,
} from './pending-payment-service';

// Payment Allocation Service (Phase 5: AI Agent)
export {
  PaymentAllocationService,
  createPaymentAllocationService,
  type PaymentAllocationOptions,
  type MultiInvoiceAllocation,
  type PartialPaymentAllocation,
  type AllocationResult,
} from './payment-allocation-service';

// Statement Service (Phase 7)
export {
  StatementService,
  createStatementService,
} from './statement-service';

// Credit Note Service (Phase 7)
export {
  CreditNoteService,
  createCreditNoteService,
} from './credit-note-service';

// PDF Service (Phase 7 - Re-exported from centralized service)
export {
  PDFService,
  pdfService,
  type StatementPDFOptions,
} from '@/lib/pdf/pdf.service';

// Fiscal Period Service (Phase 1 - GL Foundation)
export {
  FiscalPeriodService,
  fiscalPeriodService,
} from './fiscal-period-service';

// Journal Service (Phase 1 - GL Foundation)
export {
  JournalService,
  journalService,
} from './journal-service';

// Purchase Order Service (Phase 2 - Accounts Payable)
export {
  PurchaseOrderService,
  createPurchaseOrderService,
} from './purchase-order-service';

// Vendor Bill Service (Phase 2 - Accounts Payable)
export {
  VendorBillService,
  createVendorBillService,
} from './vendor-bill-service';

// Vendor Payment Service (Phase 2 - Accounts Payable)
export {
  VendorPaymentService,
  createVendorPaymentService,
} from './vendor-payment-service';

// Vendor Bill Posting Service (Phase 2 - AP GL Integration)
export {
  VendorBillPostingService,
  createVendorBillPostingService,
} from './vendor-bill-posting-service';
