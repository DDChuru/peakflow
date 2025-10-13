import { BankTransaction } from '@/types/bank-statement';
import { IndustryTemplateService, CompanyAccountRecord } from '../accounting/industry-template-service';
import { BankToLedgerService } from '../accounting/bank-to-ledger-service';

export interface TransactionMapping {
  transaction: BankTransaction;
  debitAccount: CompanyAccountRecord;
  creditAccount: CompanyAccountRecord;
  confidence: number;
  source: 'exact-match' | 'pattern-match' | 'fuzzy-match' | 'category-match' | 'ai-suggested' | 'manual';
  ruleId?: string;
  reasoning?: string[];
}

export interface ProcessingResult {
  // High confidence - auto-apply
  autoMapped: Array<{
    transaction: BankTransaction;
    mapping: TransactionMapping;
  }>;

  // Medium confidence - needs review
  needsReview: Array<{
    transaction: BankTransaction;
    suggestedMapping: TransactionMapping;
  }>;

  // Low/no confidence - needs AI
  needsAI: Array<{
    transaction: BankTransaction;
  }>;

  // Statistics
  stats: {
    total: number;
    autoMappedCount: number;
    autoMappedPercentage: number;
    needsReviewCount: number;
    needsAICount: number;
    estimatedAICost: number;
    processingTimeMs: number;
  };
}

export interface MatchingStrategy {
  // Confidence thresholds
  autoMapThreshold: number;      // >= 85% auto-applies
  reviewThreshold: number;        // 60-84% needs review

  // Matching priorities
  enableExactMatch: boolean;      // Exact vendor name match
  enablePatternMatch: boolean;    // Regex pattern matching
  enableFuzzyMatch: boolean;      // Levenshtein distance matching
  enableCategoryMatch: boolean;   // Fall back to category templates

  // Fuzzy matching config
  fuzzyMatchThreshold: number;    // 0-1, higher = stricter
}

const DEFAULT_STRATEGY: MatchingStrategy = {
  autoMapThreshold: 85,
  reviewThreshold: 60,
  enableExactMatch: true,
  enablePatternMatch: true,
  enableFuzzyMatch: true,
  enableCategoryMatch: true,
  fuzzyMatchThreshold: 0.8,
};

export class MappingPipeline {
  private bankToLedgerService: BankToLedgerService;
  private coaService: IndustryTemplateService;
  private glAccounts: CompanyAccountRecord[] = [];

  constructor(private companyId: string) {
    this.bankToLedgerService = new BankToLedgerService(companyId);
    this.coaService = new IndustryTemplateService(companyId);
  }

  /**
   * Main processing pipeline: Rules first, AI second
   */
  async processTransactions(
    transactions: BankTransaction[],
    strategy: Partial<MatchingStrategy> = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const config = { ...DEFAULT_STRATEGY, ...strategy };

    // Load GL accounts once
    this.glAccounts = await this.coaService.listAccounts();

    const autoMapped: ProcessingResult['autoMapped'] = [];
    const needsReview: ProcessingResult['needsReview'] = [];
    const needsAI: ProcessingResult['needsAI'] = [];

    console.log(`[MAPPING PIPELINE] Processing ${transactions.length} transactions...`);

    for (const transaction of transactions) {
      try {
        // Step 1: Try rule-based matching
        const ruleMatch = await this.tryRuleMatching(transaction, config);

        if (ruleMatch && ruleMatch.confidence >= config.autoMapThreshold) {
          // High confidence - auto-map
          autoMapped.push({
            transaction,
            mapping: ruleMatch,
          });
          console.log(`[AUTO-MAP] ${transaction.description} → ${ruleMatch.debitAccount.name} (${ruleMatch.confidence}%)`);

        } else if (ruleMatch && ruleMatch.confidence >= config.reviewThreshold) {
          // Medium confidence - needs review
          needsReview.push({
            transaction,
            suggestedMapping: ruleMatch,
          });
          console.log(`[REVIEW] ${transaction.description} → ${ruleMatch.debitAccount.name} (${ruleMatch.confidence}%)`);

        } else {
          // Low/no confidence - needs AI
          needsAI.push({ transaction });
          console.log(`[AI NEEDED] ${transaction.description} (no suitable rule match)`);
        }

      } catch (error) {
        console.error(`[ERROR] Failed to process transaction ${transaction.id}:`, error);
        // On error, send to AI for analysis
        needsAI.push({ transaction });
      }
    }

    const processingTimeMs = Date.now() - startTime;

    const result: ProcessingResult = {
      autoMapped,
      needsReview,
      needsAI,
      stats: {
        total: transactions.length,
        autoMappedCount: autoMapped.length,
        autoMappedPercentage: (autoMapped.length / transactions.length) * 100,
        needsReviewCount: needsReview.length,
        needsAICount: needsAI.length,
        estimatedAICost: needsAI.length * 0.005, // $0.005 per AI call
        processingTimeMs,
      },
    };

    console.log(`[MAPPING PIPELINE] Complete in ${processingTimeMs}ms:`, {
      autoMapped: result.stats.autoMappedCount,
      needsReview: result.stats.needsReviewCount,
      needsAI: result.stats.needsAICount,
      autoMapPercentage: `${result.stats.autoMappedPercentage.toFixed(1)}%`,
      estimatedCost: `$${result.stats.estimatedAICost.toFixed(3)}`,
    });

    return result;
  }

  /**
   * Try to match transaction using rule-based methods
   */
  private async tryRuleMatching(
    transaction: BankTransaction,
    config: MatchingStrategy
  ): Promise<TransactionMapping | null> {
    // Step 1: Try exact vendor match (highest priority)
    if (config.enableExactMatch) {
      const exactMatch = await this.tryExactMatch(transaction);
      if (exactMatch) return exactMatch;
    }

    // Step 2: Try pattern-based match (regex)
    if (config.enablePatternMatch) {
      const patternMatch = await this.tryPatternMatch(transaction);
      if (patternMatch) return patternMatch;
    }

    // Step 3: Try fuzzy match (Levenshtein distance)
    if (config.enableFuzzyMatch) {
      const fuzzyMatch = await this.tryFuzzyMatch(transaction, config.fuzzyMatchThreshold);
      if (fuzzyMatch) return fuzzyMatch;
    }

    // Step 4: Try category-based template match
    if (config.enableCategoryMatch) {
      const categoryMatch = await this.tryCategoryMatch(transaction);
      if (categoryMatch) return categoryMatch;
    }

    return null;
  }

  /**
   * Try exact vendor name match from GL mapping rules
   */
  private async tryExactMatch(transaction: BankTransaction): Promise<TransactionMapping | null> {
    const rules = await this.bankToLedgerService.getMappingRules();
    const description = transaction.description.toLowerCase().trim();

    for (const rule of rules) {
      const pattern = rule.pattern.toLowerCase().trim();

      if (rule.patternType === 'contains' && description.includes(pattern)) {
        const account = this.glAccounts.find(a => a.id === rule.glAccountId || a.code === rule.glAccountCode);
        if (account) {
          return this.createMapping(transaction, account, 100, 'exact-match', rule.id);
        }
      }
    }

    return null;
  }

  /**
   * Try regex pattern matching
   */
  private async tryPatternMatch(transaction: BankTransaction): Promise<TransactionMapping | null> {
    const rules = await this.bankToLedgerService.getMappingRules();
    const description = transaction.description;

    for (const rule of rules) {
      if (rule.patternType === 'regex') {
        try {
          const regex = new RegExp(rule.pattern, 'i');
          if (regex.test(description)) {
            const account = this.glAccounts.find(a => a.id === rule.glAccountId || a.code === rule.glAccountCode);
            if (account) {
              // Pattern matches get high confidence if matched multiple times before
              const confidence = rule.metadata?.matchCount && rule.metadata.matchCount > 5 ? 95 : 90;
              return this.createMapping(transaction, account, confidence, 'pattern-match', rule.id);
            }
          }
        } catch (error) {
          console.error(`Invalid regex pattern: ${rule.pattern}`, error);
        }
      }
    }

    return null;
  }

  /**
   * Try fuzzy matching using Levenshtein distance
   */
  private async tryFuzzyMatch(
    transaction: BankTransaction,
    threshold: number
  ): Promise<TransactionMapping | null> {
    const rules = await this.bankToLedgerService.getMappingRules();
    const description = transaction.description.toLowerCase();

    let bestMatch: { rule: any; similarity: number } | null = null;

    for (const rule of rules) {
      const pattern = rule.pattern.toLowerCase();
      const similarity = this.calculateSimilarity(description, pattern);

      if (similarity >= threshold && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { rule, similarity };
      }
    }

    if (bestMatch) {
      const account = this.glAccounts.find(
        a => a.id === bestMatch.rule.glAccountId || a.code === bestMatch.rule.glAccountCode
      );
      if (account) {
        const confidence = Math.round(bestMatch.similarity * 100);
        return this.createMapping(transaction, account, confidence, 'fuzzy-match', bestMatch.rule.id);
      }
    }

    return null;
  }

  /**
   * Try category-based template matching
   */
  private async tryCategoryMatch(transaction: BankTransaction): Promise<TransactionMapping | null> {
    if (!transaction.category) return null;

    // Common category mappings
    const categoryMappings: Record<string, string> = {
      'food': '6200',           // Meals & Entertainment
      'transport': '6300',      // Travel & Transport
      'utilities': '5200',      // Utilities
      'software': '6400',       // Software & Subscriptions
      'office': '6500',         // Office Expenses
      'professional': '6600',   // Professional Fees
      'bank': '6700',           // Bank Charges
      'payroll': '5100',        // Salaries
      'rent': '5200',           // Rent
    };

    const categoryKey = transaction.category.toLowerCase();
    const accountCode = categoryMappings[categoryKey];

    if (accountCode) {
      const account = this.glAccounts.find(a => a.code === accountCode);
      if (account) {
        return this.createMapping(transaction, account, 70, 'category-match');
      }
    }

    return null;
  }

  /**
   * Create a transaction mapping with proper debit/credit accounts
   */
  private createMapping(
    transaction: BankTransaction,
    primaryAccount: CompanyAccountRecord,
    confidence: number,
    source: TransactionMapping['source'],
    ruleId?: string
  ): TransactionMapping {
    // Determine if this is a payment (debit) or receipt (credit)
    const isPayment = transaction.debit && transaction.debit > 0;

    // Find the bank account (typically code 1000 or similar)
    const bankAccount = this.glAccounts.find(
      a => a.type === 'asset' && (a.code.startsWith('1') || a.name.toLowerCase().includes('bank'))
    ) || this.glAccounts[0]; // Fallback to first account

    // For payments: Debit expense, Credit bank
    // For receipts: Debit bank, Credit revenue
    const debitAccount = isPayment ? primaryAccount : bankAccount;
    const creditAccount = isPayment ? bankAccount : primaryAccount;

    return {
      transaction,
      debitAccount,
      creditAccount,
      confidence,
      source,
      ruleId,
    };
  }

  /**
   * Calculate similarity between two strings (Levenshtein-based)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get processing statistics for analytics
   */
  async getProcessingStats(periodDays: number = 30): Promise<{
    totalImports: number;
    avgAutoMatchRate: number;
    avgAICalls: number;
    totalAICost: number;
    improvementTrend: number; // percentage improvement over time
  }> {
    // This would query historical import sessions
    // For now, return placeholder
    return {
      totalImports: 0,
      avgAutoMatchRate: 0,
      avgAICalls: 0,
      totalAICost: 0,
      improvementTrend: 0,
    };
  }
}
