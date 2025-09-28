export interface BankTransaction {
  id?: string;
  date: string;
  description: string;
  reference?: string;
  debit?: number;
  credit?: number;
  balance: number;
  type?: 'deposit' | 'withdrawal' | 'fee' | 'interest' | 'transfer' | 'other';
  category?: string;
}

export interface BankStatementSummary {
  openingBalance: number;
  closingBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalFees: number;
  interestEarned: number;
  transactionCount: number;
  statementPeriod: {
    from: string;
    to: string;
  };
}

export interface BankAccountInfo {
  accountNumber: string;
  accountName: string;
  accountType?: string;
  bankName: string;
  branch?: string;
  currency?: string;
}

export interface BankStatement {
  id?: string;
  companyId: string;
  companyName?: string;
  uploadedAt: Date;
  processedAt?: Date;
  fileName: string;
  fileSize: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  accountInfo: BankAccountInfo;
  summary: BankStatementSummary;
  transactions: BankTransaction[];
  extractedData?: unknown; // Raw extracted data from Gemini
  error?: string;
  userId: string;
}

export interface ProcessedBankStatement {
  success: boolean;
  documentType: string;
  data: {
    accountInfo: BankAccountInfo;
    summary: BankStatementSummary;
    transactions: BankTransaction[];
  };
  extractedAt: string;
  documentId?: string;
  error?: string;
}
