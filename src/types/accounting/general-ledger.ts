export interface LedgerEntry {
  id: string;
  tenantId: string;
  journalEntryId: string;
  journalLineId: string;
  accountId: string;
  accountCode: string;
  debit: number;
  credit: number;
  cumulativeBalance: number;
  currency: string;
  transactionDate: Date;
  postingDate: Date;
  fiscalPeriodId: string;
  source: string;
  metadata?: Record<string, unknown>;
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

