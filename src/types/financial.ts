// Primary contact person for a customer/supplier
export interface ContactPerson {
  name: string;
  email?: string;
  phone?: string;
  position?: string; // Job title/role
}

// Financial department contact for invoicing/mailing lists
export interface FinancialContact {
  id: string; // UUID
  name: string;
  email: string; // Required for mailing list
  phone?: string;
  position: string; // Free text: "Financial Director", "Creditor Controller", etc.
  isActive: boolean; // For enabling/disabling without deletion
  isPrimary: boolean; // Mark one as primary contact
  createdAt: string;
  updatedAt: string;
}

export interface Debtor {
  id: string;
  companyId: string; // Required for tenant isolation
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  creditLimit?: number;
  currentBalance: number;
  overdueAmount: number;
  paymentTerms: number; // Days
  status: 'active' | 'inactive' | 'blocked';
  notes?: string;
  primaryContact?: ContactPerson;
  financialContacts?: FinancialContact[]; // For invoice mailing list
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Creditor {
  id: string;
  companyId: string; // Required for tenant isolation
  name: string;
  creditorType: 'trade' | 'tax-authority' | 'statutory' | 'utility' | 'other'; // Type of creditor
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  accountNumber?: string;
  bankDetails?: {
    bankName: string;
    branchCode?: string;
    swiftCode?: string;
  };
  paymentTerms: number; // Days
  currentBalance: number;
  status: 'active' | 'inactive';
  category?: string; // e.g., 'supplier', 'contractor', 'service_provider'
  notes?: string;
  primaryContact?: ContactPerson;
  financialContacts?: FinancialContact[]; // For invoice mailing list
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Transaction {
  id: string;
  companyId: string; // Required for tenant isolation
  type: 'debit' | 'credit';
  entityType: 'debtor' | 'creditor';
  entityId: string; // Reference to Debtor or Creditor
  amount: number;
  currency: string;
  description: string;
  reference?: string;
  dueDate?: Date;
  paidDate?: Date;
  status: 'pending' | 'completed' | 'cancelled' | 'overdue';
  attachments?: string[]; // URLs to attached documents
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface PaymentReconciliation {
  id: string;
  companyId: string;
  transactionId: string;
  reconciledAmount: number;
  reconciledDate: Date;
  reconciledBy: string;
  bankReference?: string;
  notes?: string;
  createdAt: Date;
}

// Summary types for dashboard
export interface DebtorSummary {
  totalDebtors: number;
  activeDebtors: number;
  totalOutstanding: number;
  overdueAmount: number;
  averageDaysOutstanding: number;
}

export interface CreditorSummary {
  totalCreditors: number;
  activeCreditors: number;
  totalPayable: number;
  overduePayments: number;
  averagePaymentDays: number;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalDebits: number;
  totalCredits: number;
  pendingAmount: number;
  completedAmount: number;
  overdueAmount: number;
  debtorTransactions: number;
  creditorTransactions: number;
}
