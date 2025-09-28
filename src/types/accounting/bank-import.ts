import { BankTransaction } from '../bank-statement';

export interface BankImportSession {
  id: string;
  companyId: string;
  bankAccountId: string;
  bankAccountName?: string;
  importDate: Date;
  status: 'draft' | 'mapping' | 'reviewing' | 'posted' | 'cancelled';
  transactions: ImportedTransaction[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    fileName?: string;
    statementId?: string;
    totalTransactions?: number;
    mappedTransactions?: number;
    postedTransactions?: number;
  };
}

export interface ImportedTransaction extends BankTransaction {
  importSessionId: string;
  mappingStatus: 'unmapped' | 'suggested' | 'mapped' | 'posted';
  glMapping?: GLMapping;
  journalEntryId?: string;
  selected?: boolean;
  notes?: string;
}

export interface GLMapping {
  debitAccount?: {
    id: string;
    code: string;
    name: string;
  };
  creditAccount?: {
    id: string;
    code: string;
    name: string;
  };
  confidence?: number;
  ruleApplied?: string;
  manuallyMapped?: boolean;
}

export interface GLMappingRule {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  pattern: string;
  patternType: 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'exact';
  matchField: 'description' | 'reference' | 'category' | 'amount';
  glAccountCode: string;
  glAccountId: string;
  glAccountName?: string;
  transactionType?: 'debit' | 'credit' | 'both';
  priority: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  usageCount?: number;
  lastUsed?: Date;
  metadata?: {
    vendor?: string;
    category?: string;
    tags?: string[];
  };
}

export interface BulkMappingRequest {
  sessionId: string;
  transactionIds: string[];
  mapping: {
    debitAccountId?: string;
    debitAccountCode?: string;
    creditAccountId?: string;
    creditAccountCode?: string;
  };
  applyRule?: boolean;
  rulePattern?: string;
}

export interface ImportStatistics {
  totalTransactions: number;
  mappedTransactions: number;
  unmappedTransactions: number;
  suggestedMappings: number;
  postedTransactions: number;
  totalDebits: number;
  totalCredits: number;
  netAmount: number;
  categorySummary: Record<string, {
    count: number;
    totalAmount: number;
    mapped: number;
  }>;
}

export interface ImportWorkflowState {
  currentStep: 'upload' | 'review' | 'mapping' | 'preview' | 'posting' | 'complete';
  sessionId?: string;
  canProceed: boolean;
  validationErrors?: string[];
  warnings?: string[];
}