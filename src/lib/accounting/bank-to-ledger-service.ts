import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  runTransaction,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { BankTransaction } from '@/types/bank-statement';
import { JournalEntry, JournalLine, JournalSource } from '@/types/accounting/journal';
import { PostingService } from './posting-service';
import { ChartOfAccountsService } from './chart-of-accounts-service';
import { AccountRecord } from '@/types/accounting/chart-of-accounts';

export interface GLMappingRule {
  id: string;
  companyId: string;
  pattern: string;
  patternType: 'contains' | 'starts_with' | 'ends_with' | 'regex';
  glAccountCode: string;
  glAccountId: string;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    description?: string;
    category?: string;
    vendor?: string;
  };
}

export interface BankImportSession {
  id: string;
  companyId: string;
  bankAccountId: string;
  bankAccountCode?: string;
  importDate: Date;
  transactions: BankTransaction[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    fileName?: string;
    statementId?: string;
    totalTransactions?: number;
    processedTransactions?: number;
  };
}

export interface DirectPostingRequest {
  sessionId: string;
  transactions: BankTransactionMapping[];
  fiscalPeriodId: string;
  postImmediately?: boolean;
  createdBy: string;
}

export interface BankTransactionMapping {
  bankTransaction: BankTransaction;
  debitAccountId: string;
  debitAccountCode: string;
  creditAccountId: string;
  creditAccountCode: string;
  description?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface PostingResult {
  success: boolean;
  journalEntryIds: string[];
  errors?: string[];
  processedCount: number;
  failedCount: number;
}

export class BankToLedgerService {
  private postingService: PostingService;
  private coaService: ChartOfAccountsService;

  constructor(private companyId: string) {
    this.postingService = new PostingService({ tenantId: companyId });
    this.coaService = new ChartOfAccountsService(companyId);
  }

  /**
   * Create a new bank import session
   */
  async createImportSession(
    bankAccountId: string,
    transactions: BankTransaction[],
    createdBy: string,
    metadata?: BankImportSession['metadata']
  ): Promise<BankImportSession> {
    const sessionId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: BankImportSession = {
      id: sessionId,
      companyId: this.companyId,
      bankAccountId,
      importDate: new Date(),
      transactions,
      status: 'pending',
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        ...metadata,
        totalTransactions: transactions.length,
        processedTransactions: 0,
      },
    };

    await setDoc(
      doc(db, `companies/${this.companyId}/bankImportSessions`, sessionId),
      {
        ...session,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    return session;
  }

  /**
   * Get or suggest GL accounts for a bank transaction
   */
  async suggestGLAccounts(
    transaction: BankTransaction
  ): Promise<{ debitAccount?: AccountRecord; creditAccount?: AccountRecord; confidence: number }> {
    // Get active mapping rules
    const rules = await this.getMappingRules();

    // Find matching rule with highest priority
    let matchedRule: GLMappingRule | null = null;
    for (const rule of rules) {
      if (this.matchesRule(transaction, rule)) {
        matchedRule = rule;
        break; // Rules are sorted by priority
      }
    }

    if (matchedRule) {
      const account = await this.coaService.getAccount(matchedRule.glAccountId);

      // For deposits (credit to bank), suggest expense/asset account for debit
      // For withdrawals (debit from bank), suggest revenue/liability account for credit
      if (transaction.credit && transaction.credit > 0) {
        return {
          creditAccount: account || undefined,
          confidence: 0.9,
        };
      } else if (transaction.debit && transaction.debit > 0) {
        return {
          debitAccount: account || undefined,
          confidence: 0.9,
        };
      }
    }

    // Default suggestions based on transaction type
    return this.getDefaultSuggestions(transaction);
  }

  /**
   * Check if a transaction matches a mapping rule
   */
  private matchesRule(transaction: BankTransaction, rule: GLMappingRule): boolean {
    const description = transaction.description.toLowerCase();
    const pattern = rule.pattern.toLowerCase();

    switch (rule.patternType) {
      case 'contains':
        return description.includes(pattern);
      case 'starts_with':
        return description.startsWith(pattern);
      case 'ends_with':
        return description.endsWith(pattern);
      case 'regex':
        try {
          const regex = new RegExp(rule.pattern, 'i');
          return regex.test(transaction.description);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  /**
   * Get default GL account suggestions based on transaction type
   */
  private async getDefaultSuggestions(
    transaction: BankTransaction
  ): Promise<{ debitAccount?: AccountRecord; creditAccount?: AccountRecord; confidence: number }> {
    const accounts = await this.coaService.listAccounts();

    // Common account mappings
    const commonMappings: Record<string, string> = {
      'Bank Fees': '6600', // Bank charges expense
      'Interest': '7100', // Interest income
      'Transfer': '1200', // Inter-bank transfers
      'Payroll': '5100', // Salaries expense
      'Rent': '5200', // Rent expense
      'Sales': '4000', // Sales revenue
      'Customer Payment': '1100', // Accounts receivable
    };

    const suggestedCode = commonMappings[transaction.category || 'Other'];
    if (suggestedCode) {
      const account = accounts.find(a => a.code === suggestedCode);
      if (account) {
        // Determine if it's debit or credit based on transaction type
        if (transaction.credit && transaction.credit > 0) {
          return { creditAccount: account, confidence: 0.6 };
        } else {
          return { debitAccount: account, confidence: 0.6 };
        }
      }
    }

    return { confidence: 0.3 };
  }

  /**
   * Get all mapping rules for the company
   */
  async getMappingRules(): Promise<GLMappingRule[]> {
    const rulesQuery = query(
      collection(db, `companies/${this.companyId}/glMappingRules`),
      where('isActive', '==', true),
      orderBy('priority', 'asc')
    );

    const snapshot = await getDocs(rulesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as GLMappingRule));
  }

  /**
   * Create or update a mapping rule
   */
  async saveMappingRule(rule: Omit<GLMappingRule, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>): Promise<GLMappingRule> {
    const ruleId = rule.pattern.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

    const ruleData: GLMappingRule = {
      id: ruleId,
      companyId: this.companyId,
      ...rule,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(
      doc(db, `companies/${this.companyId}/glMappingRules`, ruleId),
      {
        ...ruleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );

    return ruleData;
  }

  /**
   * Post bank transactions directly to general ledger
   */
  async postToLedger(request: DirectPostingRequest): Promise<PostingResult> {
    const result: PostingResult = {
      success: false,
      journalEntryIds: [],
      errors: [],
      processedCount: 0,
      failedCount: 0,
    };

    try {
      // Update session status
      await this.updateSessionStatus(request.sessionId, 'processing');

      // Process each transaction
      for (const mapping of request.transactions) {
        try {
          const journalEntry = await this.createJournalEntry(
            mapping,
            request.fiscalPeriodId,
            request.createdBy
          );

          if (request.postImmediately) {
            await this.postingService.post(journalEntry);
          }

          result.journalEntryIds.push(journalEntry.id);
          result.processedCount++;
        } catch (error) {
          result.errors?.push(`Failed to process transaction ${mapping.bankTransaction.id}: ${error}`);
          result.failedCount++;
        }
      }

      // Update session status
      await this.updateSessionStatus(
        request.sessionId,
        result.failedCount === 0 ? 'completed' : 'failed',
        {
          processedTransactions: result.processedCount,
        }
      );

      result.success = result.failedCount === 0;
      return result;
    } catch (error) {
      result.errors?.push(`Critical error: ${error}`);
      await this.updateSessionStatus(request.sessionId, 'failed');
      throw error;
    }
  }

  /**
   * Create a journal entry from a bank transaction mapping
   */
  private async createJournalEntry(
    mapping: BankTransactionMapping,
    fiscalPeriodId: string,
    createdBy: string
  ): Promise<JournalEntry> {
    const { bankTransaction } = mapping;
    const amount = bankTransaction.credit || bankTransaction.debit || 0;

    // Determine which account gets debited and credited
    const isDeposit = (bankTransaction.credit || 0) > 0;

    const lines: JournalLine[] = [];

    if (isDeposit) {
      // Money coming into bank - debit bank, credit revenue/liability
      lines.push({
        id: `${bankTransaction.id}_debit`,
        accountId: mapping.debitAccountId,
        accountCode: mapping.debitAccountCode,
        description: mapping.description || bankTransaction.description,
        debit: amount,
        credit: 0,
        currency: 'USD',
      });
      lines.push({
        id: `${bankTransaction.id}_credit`,
        accountId: mapping.creditAccountId,
        accountCode: mapping.creditAccountCode,
        description: mapping.description || bankTransaction.description,
        debit: 0,
        credit: amount,
        currency: 'USD',
      });
    } else {
      // Money going out of bank - credit bank, debit expense/asset
      lines.push({
        id: `${bankTransaction.id}_debit`,
        accountId: mapping.debitAccountId,
        accountCode: mapping.debitAccountCode,
        description: mapping.description || bankTransaction.description,
        debit: amount,
        credit: 0,
        currency: 'USD',
      });
      lines.push({
        id: `${bankTransaction.id}_credit`,
        accountId: mapping.creditAccountId,
        accountCode: mapping.creditAccountCode,
        description: mapping.description || bankTransaction.description,
        debit: 0,
        credit: amount,
        currency: 'USD',
      });
    }

    const journalEntry: JournalEntry = {
      id: `bank_${bankTransaction.id}_${Date.now()}`,
      tenantId: this.companyId,
      fiscalPeriodId,
      journalCode: 'BANK_IMPORT',
      reference: mapping.reference || bankTransaction.reference || `BANK-${bankTransaction.id}`,
      description: `Bank import: ${bankTransaction.description}`,
      status: 'draft',
      source: 'bank_import' as JournalSource,
      transactionDate: new Date(bankTransaction.date),
      postingDate: new Date(),
      createdBy,
      metadata: {
        ...mapping.metadata,
        bankTransactionId: bankTransaction.id,
        bankTransactionDate: bankTransaction.date,
        originalDescription: bankTransaction.description,
      },
      lines,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return journalEntry;
  }

  /**
   * Update import session status
   */
  private async updateSessionStatus(
    sessionId: string,
    status: BankImportSession['status'],
    metadata?: Partial<BankImportSession['metadata']>
  ): Promise<void> {
    const sessionRef = doc(db, `companies/${this.companyId}/bankImportSessions`, sessionId);

    await runTransaction(db, async (transaction) => {
      const sessionDoc = await transaction.get(sessionRef);
      if (!sessionDoc.exists()) {
        throw new Error('Import session not found');
      }

      const currentMetadata = sessionDoc.data().metadata || {};

      transaction.update(sessionRef, {
        status,
        updatedAt: serverTimestamp(),
        metadata: {
          ...currentMetadata,
          ...metadata,
        },
      });
    });
  }

  /**
   * Bulk process multiple bank transactions
   */
  async bulkProcess(
    transactions: BankTransaction[],
    defaultMappings?: Partial<BankTransactionMapping>,
    autoPost = false
  ): Promise<PostingResult> {
    const mappings: BankTransactionMapping[] = [];

    // Create mappings for each transaction
    for (const transaction of transactions) {
      const suggestions = await this.suggestGLAccounts(transaction);

      // Use suggestions or defaults
      const mapping: BankTransactionMapping = {
        bankTransaction: transaction,
        debitAccountId: defaultMappings?.debitAccountId || suggestions.debitAccount?.id || '',
        debitAccountCode: defaultMappings?.debitAccountCode || suggestions.debitAccount?.code || '',
        creditAccountId: defaultMappings?.creditAccountId || suggestions.creditAccount?.id || '',
        creditAccountCode: defaultMappings?.creditAccountCode || suggestions.creditAccount?.code || '',
        description: defaultMappings?.description,
        reference: defaultMappings?.reference,
        metadata: defaultMappings?.metadata,
      };

      mappings.push(mapping);
    }

    // Create import session
    const session = await this.createImportSession(
      defaultMappings?.metadata?.bankAccountId || '',
      transactions,
      defaultMappings?.metadata?.createdBy || 'system'
    );

    // Post to ledger
    return this.postToLedger({
      sessionId: session.id,
      transactions: mappings,
      fiscalPeriodId: defaultMappings?.metadata?.fiscalPeriodId || '',
      postImmediately: autoPost,
      createdBy: defaultMappings?.metadata?.createdBy || 'system',
    });
  }
}