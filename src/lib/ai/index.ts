/**
 * AI Services Index
 * Export all AI-related services for entity matching and accounting assistance
 */

// Accounting Assistant (existing)
export { AccountingAssistant } from './accounting-assistant';

// Entity Matching Services (Phase 1)
export { DebtorMatchingService } from './debtor-matching-service';
export { CreditorMatchingService } from './creditor-matching-service';

// Entity Matching Types (Phase 1)
export type {
  DebtorMatch,
  CreditorMatch,
  InvoiceSuggestion,
  BillSuggestion,
  MatchingConfig,
  MatchingContext,
} from '@/types/ai/entity-matching';

// Pending Payment Types (Phase 2)
export type {
  PendingPayment,
  PaymentAllocation,
  PendingPaymentFilter,
  CreatePendingPaymentOptions,
  AllocatePaymentOptions,
  AllocationResult,
  CreateCreditNoteOptions,
  PendingPaymentSummary,
  PaymentStatus,
  PaymentEntityType,
} from '@/types/ai/pending-payment';
