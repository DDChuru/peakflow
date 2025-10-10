// Export all Firebase configurations and services
export { app, auth, db, storage, functions } from './config';
export { AdminService } from './admin-service';
export { CompaniesService } from './companies-service';
export { DebtorService } from './debtor-service';
export { CreditorService } from './creditor-service';
export { TransactionService } from './transaction-service';
export { BankAccountService } from './bank-account-service';
export { BankStatementService } from './bank-statement-service';
export { ReconciliationService } from '../accounting/reconciliation-service';
export { SLAService } from '../accounting/sla-service';
export { RecurringInvoiceService } from '../accounting/recurring-invoice-service';
export { SLAIntegrationService } from '../accounting/sla-integration-service';
export { ChartOfAccountsService } from '../accounting/chart-of-accounts-service';

// Export new invoice system services
export { InvoiceService } from '../accounting/invoice-service';
export { QuoteService } from '../accounting/quote-service';
export { SalesOrderService } from '../accounting/sales-order-service';
export { InvoicePostingService } from '../accounting/invoice-posting-service';
export { InvoiceIntegrationService } from '../accounting/invoice-integration-service';

// Export all financial types
export type {
  Debtor,
  Creditor,
  Transaction,
  PaymentReconciliation,
  DebtorSummary,
  CreditorSummary,
  TransactionSummary,
  ContactPerson,
  FinancialContact
} from '@/types/financial';

// Export bank account types
export type {
  BankAccount,
  BankAccountBalance,
  BankAccountStatus,
  BankAccountType,
  BankSignatory,
  BankTransfer,
  TransferStatus,
  TransferType,
  TransferValidation,
  BankAccountValidation,
  TransferApproval
} from '@/types/accounting/bank-account';

// Export SLA types
export type {
  ServiceAgreement,
  SLALineItem,
  SLALineItemHistory,
  SLASummary,
  SLAFilters,
  SLAValidationResult,
  SLAProcessingResult,
  SLAProcessingOptions,
  InvoiceGenerationRequest,
  ProrationCalculation,
  BillingFrequency,
  SLAStatus
} from '@/types/accounting/sla';

// Export invoice system types
export type {
  Invoice,
  InvoiceLineItem,
  InvoiceTaxLine,
  InvoicePayment,
  InvoiceCreateRequest,
  InvoiceSummary,
  InvoiceAging,
  InvoiceFilters,
  InvoiceBulkAction,
  InvoiceBulkResult,
  InvoiceStatus,
  InvoiceSource
} from '@/types/accounting/invoice';

export type {
  Quote,
  QuoteLineItem,
  QuoteCreateRequest,
  QuoteRevisionRequest,
  QuoteApprovalRequest,
  QuoteConversionRequest,
  QuoteSummary,
  QuoteFilters,
  QuoteStatus
} from '@/types/accounting/quote';

export type {
  SalesOrder,
  SalesOrderLineItem,
  SalesOrderCreateRequest,
  SalesOrderShipmentRequest,
  SalesOrderInvoiceRequest,
  SalesOrderSummary,
  SalesOrderFilters,
  SalesOrderStatus
} from '@/types/accounting/sales-order';

export type {
  AccountType,
  AccountHierarchyNode,
  AccountMetadata,
  AccountBankingMetadata,
  AccountTemplate,
  ChartOfAccounts,
  AccountRecord as ChartOfAccount,
  AccountBalanceSnapshot
} from '@/types/accounting/chart-of-accounts';

// Export auth types
export type {
  User,
  Company,
  UserRole,
  CompanyType,
  SupportedCurrency,
  AuthState,
  LoginCredentials,
  SignupCredentials,
  PasswordResetRequest,
  RateLimitEntry
} from '@/types/auth';

// Create singleton instances for services
import { AdminService } from './admin-service';
import { CompaniesService } from './companies-service';
import { DebtorService } from './debtor-service';
import { CreditorService } from './creditor-service';
import { TransactionService } from './transaction-service';
import { BankAccountService } from './bank-account-service';
import { BankStatementService } from './bank-statement-service';
import { ReconciliationService } from '../accounting/reconciliation-service';
import { SLAService } from '../accounting/sla-service';
import { ChartOfAccountsService } from '../accounting/chart-of-accounts-service';
import { InvoiceService } from '../accounting/invoice-service';
import { QuoteService } from '../accounting/quote-service';
import { SalesOrderService } from '../accounting/sales-order-service';
import { InvoiceIntegrationService } from '../accounting/invoice-integration-service';

export const adminService = new AdminService();
export const companiesService = new CompaniesService();
export const debtorService = new DebtorService();
export const creditorService = new CreditorService();
export const transactionService = new TransactionService();
export const bankAccountService = new BankAccountService();
export const bankStatementService = new BankStatementService();
export const reconciliationService = new ReconciliationService();
export const slaService = new SLAService();
export const chartOfAccountsService = new ChartOfAccountsService();

// Invoice system singletons
export const invoiceService = new InvoiceService();
export const quoteService = new QuoteService();
export const salesOrderService = new SalesOrderService();
export const invoiceIntegrationService = new InvoiceIntegrationService();

// Note: RecurringInvoiceService, SLAIntegrationService, and InvoicePostingService require companyId parameter, so no singleton instances are created
// Import and instantiate per-company:
//   new RecurringInvoiceService(companyId)
//   new SLAIntegrationService(companyId)
//   createInvoicePostingService(companyId, options)
