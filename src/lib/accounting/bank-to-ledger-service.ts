import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
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
import { IndustryTemplateService, CompanyAccountRecord } from './industry-template-service';
import { AccountRecord } from '@/types/accounting/chart-of-accounts';
import { fiscalPeriodService } from './fiscal-period-service';
import { SupportedCurrency } from '@/types/auth';
import { ArchiveService } from './archive-service';

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
  private coaService: IndustryTemplateService;
  private companyCurrency: SupportedCurrency = 'USD'; // Default fallback

  constructor(private companyId: string) {
    this.postingService = new PostingService({ tenantId: companyId });
    this.coaService = new IndustryTemplateService(companyId);
    // Initialize currency asynchronously
    this.initializeCurrency();
  }

  /**
   * Initialize company currency from Firestore
   */
  private async initializeCurrency(): Promise<void> {
    try {
      const companyRef = doc(db, 'companies', this.companyId);
      const companySnap = await getDoc(companyRef);

      if (companySnap.exists()) {
        const companyData = companySnap.data();
        this.companyCurrency = companyData.defaultCurrency || 'USD';
        console.log(`[BankToLedger] Using company currency: ${this.companyCurrency}`);
      } else {
        console.warn(`[BankToLedger] Company ${this.companyId} not found, using USD as default`);
      }
    } catch (error) {
      console.error('[BankToLedger] Error fetching company currency:', error);
      // Keep default USD
    }
  }

  /**
   * Get the company currency (waits for initialization if needed)
   */
  private async getCurrency(): Promise<SupportedCurrency> {
    // If currency is still default, try to fetch again
    if (this.companyCurrency === 'USD') {
      await this.initializeCurrency();
    }
    return this.companyCurrency;
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
  ): Promise<{ debitAccount?: CompanyAccountRecord; creditAccount?: CompanyAccountRecord; confidence: number }> {
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
  ): Promise<{ debitAccount?: CompanyAccountRecord; creditAccount?: CompanyAccountRecord; confidence: number }> {
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
   * Get all mapping rules (including inactive ones)
   */
  async getAllMappingRules(): Promise<GLMappingRule[]> {
    const rulesQuery = query(
      collection(db, `companies/${this.companyId}/glMappingRules`),
      orderBy('priority', 'asc')
    );

    const snapshot = await getDocs(rulesQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      companyId: this.companyId,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    } as GLMappingRule));
  }

  /**
   * Delete a mapping rule by ID
   */
  async deleteMappingRule(ruleId: string): Promise<void> {
    const ruleRef = doc(db, `companies/${this.companyId}/glMappingRules`, ruleId);
    await deleteDoc(ruleRef);
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
        // Declare fiscalPeriodId outside try block so it's accessible in catch
        let fiscalPeriodId = request.fiscalPeriodId;

        try {
          // Resolve fiscal period for this transaction
          const transactionDate = new Date(mapping.bankTransaction.date);

          // If fiscalPeriodId is 'current', resolve it based on transaction date
          if (fiscalPeriodId === 'current') {
            const period = await fiscalPeriodService.getPeriodForDate(
              this.companyId,
              transactionDate
            );

            if (period) {
              fiscalPeriodId = period.id;
            } else {
              console.warn(`[BankToLedger] No fiscal period found for date ${transactionDate.toISOString()}, using fallback`);
              // Generate period ID from date as fallback
              const year = transactionDate.getFullYear();
              const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
              fiscalPeriodId = `${year}-${month}`;
            }
          }

          const journalEntry = await this.createJournalEntry(
            mapping,
            fiscalPeriodId,
            request.createdBy
          );

          if (request.postImmediately) {
            await this.postingService.post(journalEntry);
          }

          result.journalEntryIds.push(journalEntry.id);
          result.processedCount++;
        } catch (error) {
          // Extract detailed error information
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorCode = (error as any)?.code;
          const errorDetails = (error as any)?.details;

          // Log full error for debugging
          console.error('[BankToLedger] Transaction posting failed:', {
            transactionId: mapping.bankTransaction.id,
            description: mapping.bankTransaction.description,
            date: mapping.bankTransaction.date,
            amount: mapping.bankTransaction.credit || mapping.bankTransaction.debit,
            debitAccountId: mapping.debitAccountId,
            creditAccountId: mapping.creditAccountId,
            fiscalPeriodId,
            errorCode,
            errorMessage,
            errorDetails,
            fullError: error
          });

          // Create detailed error message
          let detailedError = `Transaction ${mapping.bankTransaction.id}`;
          if (errorCode) detailedError += ` [${errorCode}]`;
          detailedError += `: ${errorMessage}`;

          result.errors?.push(detailedError);
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

    // Get company currency
    const currency = await this.getCurrency();

    // Fetch account names for the accounts being used
    const debitAccount = await this.coaService.getAccount(mapping.debitAccountId);
    const creditAccount = await this.coaService.getAccount(mapping.creditAccountId);

    if (!debitAccount) {
      throw new Error(`Debit account not found: ${mapping.debitAccountId} (${mapping.debitAccountCode})`);
    }
    if (!creditAccount) {
      throw new Error(`Credit account not found: ${mapping.creditAccountId} (${mapping.creditAccountCode})`);
    }

    // Determine which account gets debited and credited
    const isDeposit = (bankTransaction.credit || 0) > 0;

    const lines: JournalLine[] = [];

    if (isDeposit) {
      // Money coming into bank - debit bank, credit revenue/liability
      lines.push({
        id: `${bankTransaction.id}_debit`,
        accountId: mapping.debitAccountId,
        accountCode: mapping.debitAccountCode,
        accountName: debitAccount.name,
        description: mapping.description || bankTransaction.description,
        debit: amount,
        credit: 0,
        currency,
      });
      lines.push({
        id: `${bankTransaction.id}_credit`,
        accountId: mapping.creditAccountId,
        accountCode: mapping.creditAccountCode,
        accountName: creditAccount.name,
        description: mapping.description || bankTransaction.description,
        debit: 0,
        credit: amount,
        currency,
      });
    } else {
      // Money going out of bank - credit bank, debit expense/asset
      lines.push({
        id: `${bankTransaction.id}_debit`,
        accountId: mapping.debitAccountId,
        accountCode: mapping.debitAccountCode,
        accountName: debitAccount.name,
        description: mapping.description || bankTransaction.description,
        debit: amount,
        credit: 0,
        currency,
      });
      lines.push({
        id: `${bankTransaction.id}_credit`,
        accountId: mapping.creditAccountId,
        accountCode: mapping.creditAccountCode,
        accountName: creditAccount.name,
        description: mapping.description || bankTransaction.description,
        debit: 0,
        credit: amount,
        currency,
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

  /**
   * ========================================================================
   * STAGING LEDGER METHODS
   * ========================================================================
   * Methods for posting to staging area before production ledger.
   * Allows preview, verification, and export before final posting.
   */

  /**
   * Post bank import to staging ledger (not production)
   * Creates entries in staging_journal_entries and staging_general_ledger
   */
  async postToStaging(request: DirectPostingRequest): Promise<any> {
    const stagingResult = {
      success: false,
      journalCount: 0,
      glCount: 0,
      balance: {
        totalDebits: 0,
        totalCredits: 0,
        difference: 0,
        isBalanced: false,
        accountSummary: [] as any[],
        verifiedAt: new Date(),
        errors: [] as string[],
        warnings: [] as string[]
      },
      stagingJournalIds: [] as string[],
      stagingGLIds: [] as string[]
    };

    try {
      // Update session status to 'staging'
      await this.updateSessionStatus(request.sessionId, 'processing');

      // Step 1: Generate all journal entries (in memory)
      const journalEntries: any[] = [];

      for (const mapping of request.transactions) {
        let fiscalPeriodId = request.fiscalPeriodId;

        // Resolve fiscal period
        const transactionDate = new Date(mapping.bankTransaction.date);
        if (fiscalPeriodId === 'current') {
          const period = await fiscalPeriodService.getPeriodForDate(
            this.companyId,
            transactionDate
          );
          if (period) {
            fiscalPeriodId = period.id;
          } else {
            const year = transactionDate.getFullYear();
            const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
            fiscalPeriodId = `${year}-${month}`;
          }
        }

        const journalEntry = await this.createJournalEntry(
          mapping,
          fiscalPeriodId,
          request.createdBy
        );

        journalEntries.push(journalEntry);
      }

      // Step 2: Generate GL entries from journal entries (in memory)
      const glEntries: any[] = [];
      const accountSummary = new Map<string, any>();

      for (const journalEntry of journalEntries) {
        for (const line of journalEntry.lines) {
          const glEntry = {
            id: `staging_gl_${journalEntry.id}_${line.id}_${Date.now()}`,
            tenantId: this.companyId,
            bankImportSessionId: request.sessionId,
            status: 'staged',
            journalEntryId: journalEntry.id,
            journalLineId: line.id,
            accountId: line.accountId,
            accountCode: line.accountCode,
            accountName: line.accountName,
            debit: line.debit,
            credit: line.credit,
            cumulativeBalance: 0, // Will be calculated if needed
            currency: line.currency,
            transactionDate: Timestamp.fromDate(journalEntry.transactionDate),
            postingDate: Timestamp.now(),
            fiscalPeriodId: journalEntry.fiscalPeriodId,
            source: journalEntry.source,
            description: line.description || journalEntry.description,
            metadata: journalEntry.metadata,
            stagedAt: Timestamp.now(),
            postedAt: null,
            exportedAt: null,
            archivedAt: null,
            productionGLId: null,
            createdAt: Timestamp.now()
          };

          glEntries.push(glEntry);

          // Track account summary for balance verification
          const accountKey = line.accountCode;
          if (!accountSummary.has(accountKey)) {
            accountSummary.set(accountKey, {
              accountId: line.accountId,
              accountCode: line.accountCode,
              accountName: line.accountName,
              accountType: 'asset', // TODO: Get from account
              debits: 0,
              credits: 0,
              balance: 0,
              entryCount: 0
            });
          }

          const summary = accountSummary.get(accountKey);
          summary.debits += line.debit;
          summary.credits += line.credit;
          summary.balance += (line.debit - line.credit);
          summary.entryCount += 1;
        }
      }

      // Step 3: Verify balance
      stagingResult.balance.totalDebits = glEntries.reduce((sum, entry) => sum + entry.debit, 0);
      stagingResult.balance.totalCredits = glEntries.reduce((sum, entry) => sum + entry.credit, 0);
      stagingResult.balance.difference = Math.abs(stagingResult.balance.totalDebits - stagingResult.balance.totalCredits);
      stagingResult.balance.isBalanced = stagingResult.balance.difference < 0.01; // Allow for floating point
      stagingResult.balance.accountSummary = Array.from(accountSummary.values());
      stagingResult.balance.verifiedAt = new Date();

      if (!stagingResult.balance.isBalanced) {
        stagingResult.balance.errors.push(
          `Import not balanced: Debits ${stagingResult.balance.totalDebits} != Credits ${stagingResult.balance.totalCredits}`
        );
        throw new Error('Import not balanced');
      }

      // Step 4: Batch write to staging_journal_entries
      const batch = writeBatch(db);

      for (const journalEntry of journalEntries) {
        const stagingJournal = {
          ...journalEntry,
          id: journalEntry.id,
          bankImportSessionId: request.sessionId,
          status: 'staged',
          transactionDate: Timestamp.fromDate(journalEntry.transactionDate),
          postingDate: Timestamp.fromDate(journalEntry.postingDate || new Date()),
          createdAt: Timestamp.fromDate(journalEntry.createdAt),
          updatedAt: Timestamp.fromDate(journalEntry.updatedAt),
          stagedAt: Timestamp.now(),
          postedAt: null,
          exportedAt: null,
          archivedAt: null,
          productionJournalId: null
        };

        const docRef = doc(collection(db, 'staging_journal_entries'), journalEntry.id);
        batch.set(docRef, stagingJournal);
        stagingResult.stagingJournalIds.push(journalEntry.id);
      }

      // Step 5: Batch write to staging_general_ledger
      for (const glEntry of glEntries) {
        const docRef = doc(collection(db, 'staging_general_ledger'), glEntry.id);
        batch.set(docRef, glEntry);
        stagingResult.stagingGLIds.push(glEntry.id);
      }

      // Commit all staging entries
      await batch.commit();

      // Step 6: Update session with staging summary
      const sessionRef = doc(db, 'companies', this.companyId, 'bankImportSessions', request.sessionId);
      await setDoc(sessionRef, {
        status: 'staged',
        staging: {
          journalEntryCount: journalEntries.length,
          glEntryCount: glEntries.length,
          totalDebits: stagingResult.balance.totalDebits,
          totalCredits: stagingResult.balance.totalCredits,
          isBalanced: stagingResult.balance.isBalanced,
          stagedAt: Timestamp.now(),
          balance: stagingResult.balance
        },
        updatedAt: Timestamp.now()
      }, { merge: true });

      stagingResult.success = true;
      stagingResult.journalCount = journalEntries.length;
      stagingResult.glCount = glEntries.length;

      return stagingResult;

    } catch (error) {
      console.error('[BankToLedger] Staging failed:', error);
      await this.updateSessionStatus(request.sessionId, 'failed');
      stagingResult.balance.errors.push(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Post staging entries to production ledger (batch migration)
   * Copies from staging_* collections to production collections
   */
  async postToProduction(sessionId: string): Promise<any> {
    const productionResult: {
      success: boolean;
      journalCount: number;
      glCount: number;
      productionJournalIds: string[];
      productionGLIds: string[];
      postedAt: Date;
      archiveWarning?: string;
    } = {
      success: false,
      journalCount: 0,
      glCount: 0,
      productionJournalIds: [] as string[],
      productionGLIds: [] as string[],
      postedAt: new Date()
    };

    try {
      // Step 1: Load staging journal entries for this session
      const stagingJournalsQuery = query(
        collection(db, 'staging_journal_entries'),
        where('bankImportSessionId', '==', sessionId),
        where('status', '==', 'staged')
      );
      const stagingJournalsSnapshot = await getDocs(stagingJournalsQuery);

      if (stagingJournalsSnapshot.empty) {
        throw new Error('No staged journal entries found for this session');
      }

      // Step 2: Load staging GL entries for this session
      const stagingGLsQuery = query(
        collection(db, 'staging_general_ledger'),
        where('bankImportSessionId', '==', sessionId),
        where('status', '==', 'staged')
      );
      const stagingGLsSnapshot = await getDocs(stagingGLsQuery);

      if (stagingGLsSnapshot.empty) {
        throw new Error('No staged GL entries found for this session');
      }

      // Step 3: Verify still balanced (safety check)
      const totalDebits = stagingGLsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().debit || 0), 0);
      const totalCredits = stagingGLsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().credit || 0), 0);
      const difference = Math.abs(totalDebits - totalCredits);

      if (difference >= 0.01) {
        throw new Error(`Staging data no longer balanced: Debits ${totalDebits} != Credits ${totalCredits}`);
      }

      // Step 4: Batch write to production journal_entries
      const batch = writeBatch(db);

      // Create mapping: staging journal ID → production journal ID (same ID)
      for (const stagingDoc of stagingJournalsSnapshot.docs) {
        const stagingData = stagingDoc.data();

        const productionJournal = {
          id: stagingData.id,
          tenantId: stagingData.tenantId,
          fiscalPeriodId: stagingData.fiscalPeriodId,
          journalCode: stagingData.journalCode,
          reference: stagingData.reference,
          description: stagingData.description,
          status: 'posted',
          source: stagingData.source,
          transactionDate: stagingData.transactionDate,
          postingDate: Timestamp.now(),
          createdBy: stagingData.createdBy,
          metadata: stagingData.metadata,
          lines: stagingData.lines,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        const productionRef = doc(collection(db, 'journal_entries'), stagingData.id);
        batch.set(productionRef, productionJournal);
        productionResult.productionJournalIds.push(stagingData.id);

        // Update staging entry with production link
        batch.update(stagingDoc.ref, {
          status: 'posted',
          postedAt: Timestamp.now(),
          productionJournalId: stagingData.id
        });
      }

      // Step 5: Batch write to production general_ledger
      for (const stagingDoc of stagingGLsSnapshot.docs) {
        const stagingData = stagingDoc.data();

        const productionGL = {
          id: stagingData.id,
          tenantId: stagingData.tenantId,
          journalEntryId: stagingData.journalEntryId,
          journalLineId: stagingData.journalLineId,
          accountId: stagingData.accountId,
          accountCode: stagingData.accountCode,
          accountName: stagingData.accountName,
          debit: stagingData.debit,
          credit: stagingData.credit,
          cumulativeBalance: stagingData.cumulativeBalance,
          currency: stagingData.currency,
          transactionDate: stagingData.transactionDate,
          postingDate: Timestamp.now(),
          fiscalPeriodId: stagingData.fiscalPeriodId,
          source: stagingData.source,
          description: stagingData.description,
          metadata: stagingData.metadata,
          createdAt: Timestamp.now()
        };

        const productionRef = doc(collection(db, 'general_ledger'), stagingData.id);
        batch.set(productionRef, productionGL);
        productionResult.productionGLIds.push(stagingData.id);

        // Update staging entry with production link
        batch.update(stagingDoc.ref, {
          status: 'posted',
          postedAt: Timestamp.now(),
          productionGLId: stagingData.id
        });
      }

      // Commit all changes
      await batch.commit();

      // Step 6: Update session
      const sessionRef = doc(db, 'companies', this.companyId, 'bankImportSessions', sessionId);
      await setDoc(sessionRef, {
        status: 'posted',
        production: {
          journalEntryIds: productionResult.productionJournalIds,
          glEntryIds: productionResult.productionGLIds,
          postedAt: Timestamp.now(),
          postedBy: 'system' // TODO: Get from auth
        },
        updatedAt: Timestamp.now()
      }, { merge: true });

      productionResult.success = true;
      productionResult.journalCount = productionResult.productionJournalIds.length;
      productionResult.glCount = productionResult.productionGLIds.length;
      productionResult.postedAt = new Date();

      // Step 7: Archive the posted session (move to archive, remove from staging)
      try {
        console.log('[BankToLedger] Archiving posted session...');
        const archiveService = new ArchiveService(this.companyId);
        const archiveResult = await archiveService.archivePostedSession(
          sessionId,
          'system' // TODO: Get from auth
        );

        console.log(
          `[BankToLedger] Session archived: ${archiveResult.archivedJournalCount} journals, ${archiveResult.archivedGLCount} GL entries`
        );
      } catch (archiveError) {
        // Log but don't fail the posting - data is already in production
        console.error('[BankToLedger] Archive failed (posting successful):', archiveError);
        // Add warning to result
        productionResult.archiveWarning = archiveError instanceof Error ? archiveError.message : 'Archive failed';
      }

      return productionResult;

    } catch (error) {
      console.error('[BankToLedger] Production posting failed:', error);
      throw error;
    }
  }
}