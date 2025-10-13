import { BankTransaction } from '@/types/bank-statement';
import { MappingSuggestion, AccountCreationSuggestion } from './accounting-assistant';
import { BankToLedgerService } from '../accounting/bank-to-ledger-service';
import { IndustryTemplateService, CompanyAccountRecord } from '../accounting/industry-template-service';

export interface RuleLearningResult {
  ruleId: string;
  pattern: string;
  confidence: number;
  source: 'ai-assisted' | 'user-created';
  created: boolean;
  message: string;
}

export interface AccountCreationResult {
  accountId: string;
  code: string;
  name: string;
  created: boolean;
  message: string;
}

export class RuleLearningService {
  private bankToLedgerService: BankToLedgerService;
  private coaService: IndustryTemplateService;

  constructor(private companyId: string) {
    this.bankToLedgerService = new BankToLedgerService(companyId);
    this.coaService = new IndustryTemplateService(companyId);
  }

  /**
   * Save AI-approved mapping as a high-priority rule
   */
  async saveAIApprovalAsRule(
    transaction: BankTransaction,
    approvedMapping: MappingSuggestion,
    createdAccountId?: string
  ): Promise<RuleLearningResult> {
    try {
      // Extract pattern from transaction description
      const pattern = this.extractPattern(transaction.description);

      // Determine which account to map (debit or credit based on transaction type)
      const isPayment = transaction.debit && transaction.debit > 0;
      const primaryAccountCode = isPayment
        ? approvedMapping.debitAccount.code
        : approvedMapping.creditAccount.code;

      // Create high-priority rule
      const rule = await this.bankToLedgerService.saveMappingRule({
        pattern,
        patternType: 'contains',
        glAccountCode: primaryAccountCode,
        glAccountId: createdAccountId || '', // Will be resolved by service
        priority: 90, // High priority (user-approved)
        isActive: true,
        metadata: {
          description: `AI-assisted mapping for: ${transaction.description}`,
          category: transaction.category || 'General',
          vendor: this.extractVendorName(transaction.description),
          originalDescription: transaction.description,
          aiConfidence: approvedMapping.confidence,
          approvedAt: new Date().toISOString(),
          transactionAmount: transaction.debit || transaction.credit || 0,
          source: 'ai-assisted',
          matchCount: 1,
        },
      });

      console.log('✅ AI-approved mapping saved as rule:', {
        ruleId: rule.id,
        pattern,
        account: primaryAccountCode,
        priority: 90
      });

      return {
        ruleId: rule.id,
        pattern,
        confidence: 95, // AI-approved rules get high confidence
        source: 'ai-assisted',
        created: true,
        message: `Future transactions matching "${pattern}" will auto-map to ${approvedMapping.debitAccount.name}`,
      };

    } catch (error) {
      console.error('❌ Failed to save AI approval as rule:', error);
      return {
        ruleId: '',
        pattern: transaction.description,
        confidence: 0,
        source: 'ai-assisted',
        created: false,
        message: `Failed to save rule: ${error}`,
      };
    }
  }

  /**
   * Create a new GL account from AI suggestion
   */
  async createAccountFromAISuggestion(
    suggestion: AccountCreationSuggestion
  ): Promise<AccountCreationResult> {
    try {
      // Create the account using COA service
      const account = await this.coaService.createAccount({
        code: suggestion.code,
        name: suggestion.name,
        type: suggestion.type,
        subtype: suggestion.subtype,
        category: suggestion.category,
        normalBalance: suggestion.normalBalance,
        isActive: true,
        isRequired: false,
        metadata: {
          createdBy: 'ai-assistant',
          reasoning: suggestion.reasoning,
          createdAt: new Date().toISOString(),
          source: 'ai-suggested',
        },
      });

      console.log('✅ GL Account created from AI suggestion:', {
        accountId: account.id,
        code: account.code,
        name: account.name,
        type: account.type
      });

      return {
        accountId: account.id || account.code,
        code: account.code,
        name: account.name,
        created: true,
        message: `Account ${account.code} - ${account.name} created successfully`,
      };

    } catch (error) {
      console.error('❌ Failed to create account from AI suggestion:', error);
      return {
        accountId: '',
        code: suggestion.code,
        name: suggestion.name,
        created: false,
        message: `Failed to create account: ${error}`,
      };
    }
  }

  /**
   * Create account AND save mapping rule in one operation
   */
  async createAccountAndSaveRule(
    transaction: BankTransaction,
    approvedMapping: MappingSuggestion,
    accountSuggestion: AccountCreationSuggestion
  ): Promise<{
    account: AccountCreationResult;
    rule: RuleLearningResult;
  }> {
    // Step 1: Create the account
    const accountResult = await this.createAccountFromAISuggestion(accountSuggestion);

    if (!accountResult.created) {
      return {
        account: accountResult,
        rule: {
          ruleId: '',
          pattern: transaction.description,
          confidence: 0,
          source: 'ai-assisted',
          created: false,
          message: 'Cannot create rule - account creation failed',
        },
      };
    }

    // Step 2: Save the mapping rule using the new account ID
    const ruleResult = await this.saveAIApprovalAsRule(
      transaction,
      approvedMapping,
      accountResult.accountId
    );

    return {
      account: accountResult,
      rule: ruleResult,
    };
  }

  /**
   * Extract a clean pattern from transaction description
   * Removes numbers, dates, and common noise words
   */
  private extractPattern(description: string): string {
    let pattern = description
      .toLowerCase()
      .trim()
      // Remove common prefixes
      .replace(/^(payment to|payment from|transfer to|transfer from|purchase at|pos)\s*/i, '')
      // Remove dates in various formats
      .replace(/\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/g, '')
      // Remove times
      .replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, '')
      // Remove transaction IDs and reference numbers
      .replace(/\b(ref|trn|txn|id|#)\s*:?\s*\w+/gi, '')
      // Remove standalone numbers (like transaction amounts or IDs)
      .replace(/\b\d{4,}\b/g, '')
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      .trim();

    // Take first meaningful part (usually vendor name)
    const parts = pattern.split(/\s+/);
    const meaningfulParts = parts.filter(part =>
      part.length > 2 && // Ignore short words
      !/^\d+$/.test(part) // Ignore pure numbers
    );

    // Return first 2-3 meaningful words
    return meaningfulParts.slice(0, 3).join(' ');
  }

  /**
   * Extract vendor name from transaction description
   */
  private extractVendorName(description: string): string {
    // Remove common prefixes
    const cleaned = description
      .replace(/^(payment to|payment from|purchase at|pos)\s*/i, '')
      .trim();

    // Take first word/phrase (usually the vendor)
    const parts = cleaned.split(/\s+/);
    return parts.slice(0, 2).join(' ');
  }

  /**
   * Update rule match count (for confidence scoring over time)
   */
  async incrementRuleMatchCount(ruleId: string): Promise<void> {
    try {
      const rules = await this.bankToLedgerService.getAllMappingRules();
      const rule = rules.find(r => r.id === ruleId);

      if (rule && rule.metadata) {
        const currentCount = rule.metadata.matchCount || 1;

        await this.bankToLedgerService.saveMappingRule({
          ...rule,
          metadata: {
            ...rule.metadata,
            matchCount: currentCount + 1,
            lastMatched: new Date().toISOString(),
          },
        });

        console.log(`📊 Rule ${ruleId} match count updated: ${currentCount} → ${currentCount + 1}`);
      }
    } catch (error) {
      console.error('Failed to update rule match count:', error);
    }
  }

  /**
   * Get learning statistics
   */
  async getLearningStats(): Promise<{
    totalRules: number;
    aiAssistedRules: number;
    userCreatedRules: number;
    avgConfidence: number;
    mostUsedRules: Array<{ pattern: string; matchCount: number }>;
  }> {
    const rules = await this.bankToLedgerService.getAllMappingRules();

    const aiAssistedRules = rules.filter(r => r.metadata?.source === 'ai-assisted');
    const userCreatedRules = rules.filter(r => r.metadata?.source === 'user-created');

    const avgConfidence = aiAssistedRules.reduce((sum, r) =>
      sum + (r.metadata?.aiConfidence || 0), 0
    ) / (aiAssistedRules.length || 1);

    const mostUsedRules = rules
      .filter(r => r.metadata?.matchCount)
      .sort((a, b) => (b.metadata?.matchCount || 0) - (a.metadata?.matchCount || 0))
      .slice(0, 10)
      .map(r => ({
        pattern: r.pattern,
        matchCount: r.metadata?.matchCount || 0,
      }));

    return {
      totalRules: rules.length,
      aiAssistedRules: aiAssistedRules.length,
      userCreatedRules: userCreatedRules.length,
      avgConfidence,
      mostUsedRules,
    };
  }

  /**
   * Clean up unused rules (rules with 0 matches after 90 days)
   */
  async cleanupUnusedRules(daysThreshold: number = 90): Promise<number> {
    const rules = await this.bankToLedgerService.getAllMappingRules();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    let deletedCount = 0;

    for (const rule of rules) {
      const createdAt = new Date(rule.metadata?.approvedAt || rule.createdAt);
      const matchCount = rule.metadata?.matchCount || 0;

      // Delete if: created > 90 days ago AND never matched
      if (createdAt < cutoffDate && matchCount === 0) {
        await this.bankToLedgerService.deleteMappingRule(rule.id);
        deletedCount++;
        console.log(`🗑️  Deleted unused rule: ${rule.pattern} (created ${createdAt.toDateString()})`);
      }
    }

    console.log(`🧹 Cleanup complete: ${deletedCount} unused rules deleted`);
    return deletedCount;
  }
}
