export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface AccountHierarchyNode {
  parentId?: string | null;
  path: string;
  depth: number;
}

export interface AccountMetadata {
  normalBalance: 'debit' | 'credit';
  isPostingAllowed: boolean;
  isTaxRelevant?: boolean;
  tags?: string[];
  banking?: AccountBankingMetadata;
}

export interface AccountBankingMetadata {
  enabled: boolean;
  bankAccountId?: string | null;
  preferredCurrency?: string;
}

export interface AccountTemplate {
  id: string;
  name: string;
  type: AccountType;
  description?: string;
  metadata: AccountMetadata;
}

export interface ChartOfAccounts {
  id: string;
  tenantId: string;
  name: string;
  currency: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountRecord {
  id: string;
  tenantId: string;
  chartId: string;
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  hierarchy: AccountHierarchyNode;
  metadata: AccountMetadata;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountBalanceSnapshot {
  tenantId: string;
  accountId: string;
  fiscalPeriodId: string;
  currency: string;
  openingBalance: number;
  closingBalance: number;
  debits: number;
  credits: number;
  updatedAt: Date;
}
