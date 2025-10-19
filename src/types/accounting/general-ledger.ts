export interface LedgerEntry {
  id: string;
  tenantId: string;
  journalEntryId: string;
  journalLineId: string;
  accountId: string;
  accountCode: string;
  accountName: string;  // Full account name for display
  description?: string;  // Line-level transaction description
  debit: number;
  credit: number;
  cumulativeBalance: number;
  currency: string;
  transactionDate: Date;
  postingDate: Date;
  fiscalPeriodId: string;
  source: string;
  metadata?: Record<string, unknown>;  // Journal-level metadata
  dimensions?: Record<string, string>;  // Line-level dimensions (customerId, invoiceId, etc.)
  createdAt: Date;
}

export interface LedgerIndexKey {
  accountId: string;
  fiscalPeriodId: string;
  tenantId: string;
}

export interface PostingBatchResult {
  journalEntryId: string;
  entries: LedgerEntry[];
}

