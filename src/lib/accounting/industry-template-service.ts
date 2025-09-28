import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  INDUSTRY_TEMPLATES,
  IndustryTemplate,
  COATemplate,
  TransactionPattern,
  VendorMapping,
  suggestIndustry,
  generateSmartSuggestions
} from './industry-knowledge-base';
import { ChartOfAccountsService } from './chart-of-accounts-service';
import { BankToLedgerService, GLMappingRule } from './bank-to-ledger-service';
import { AccountRecord } from '@/types/accounting/chart-of-accounts';

export interface IndustrySetupOptions {
  companyId: string;
  industryId: string;
  customizeAccounts?: boolean;
  includePatterns?: boolean;
  includeVendors?: boolean;
  createdBy: string;
}

export interface IndustryAnalysis {
  suggestedIndustry: string | null;
  confidence: number;
  alternativeIndustries: string[];
  keyIndicators: string[];
}

export class IndustryTemplateService {
  private coaService: ChartOfAccountsService;
  private bankToLedgerService: BankToLedgerService;

  constructor(private companyId: string) {
    this.coaService = new ChartOfAccountsService(companyId);
    this.bankToLedgerService = new BankToLedgerService(companyId);
  }

  /**
   * Analyze company and suggest best industry template
   */
  async analyzeCompany(companyName: string, description?: string): Promise<IndustryAnalysis> {
    const fullDescription = `${companyName} ${description || ''}`;
    const suggestedIndustry = suggestIndustry(fullDescription);

    // Calculate confidence based on keyword matches
    let confidence = 0;
    const keyIndicators: string[] = [];

    if (suggestedIndustry) {
      const template = INDUSTRY_TEMPLATES[suggestedIndustry];

      // Check for industry-specific keywords
      const descLower = fullDescription.toLowerCase();

      // Check revenue sources
      template.typicalRevenueSources.forEach(source => {
        if (descLower.includes(source.toLowerCase())) {
          confidence += 0.15;
          keyIndicators.push(`Revenue: ${source}`);
        }
      });

      // Check expense categories
      template.typicalExpenseCategories.forEach(expense => {
        if (descLower.includes(expense.toLowerCase())) {
          confidence += 0.1;
          keyIndicators.push(`Expense: ${expense}`);
        }
      });

      // Base confidence for finding an industry
      confidence = Math.min(confidence + 0.3, 1.0);
    }

    // Find alternative industries
    const alternatives = Object.keys(INDUSTRY_TEMPLATES)
      .filter(id => id !== suggestedIndustry)
      .slice(0, 2);

    return {
      suggestedIndustry,
      confidence,
      alternativeIndustries: alternatives,
      keyIndicators
    };
  }

  /**
   * Apply an industry template to a company
   */
  async applyIndustryTemplate(options: IndustrySetupOptions): Promise<{
    accountsCreated: number;
    patternsCreated: number;
    vendorsCreated: number;
    errors: string[];
  }> {
    const template = INDUSTRY_TEMPLATES[options.industryId];
    if (!template) {
      throw new Error(`Industry template not found: ${options.industryId}`);
    }

    const result = {
      accountsCreated: 0,
      patternsCreated: 0,
      vendorsCreated: 0,
      errors: [] as string[]
    };

    try {
      // Step 1: Create Chart of Accounts
      console.log(`Applying COA for ${template.name}`);
      const accountsResult = await this.createAccountsFromTemplate(
        template.chartOfAccounts,
        options.createdBy
      );
      result.accountsCreated = accountsResult.created;
      result.errors.push(...accountsResult.errors);

      // Step 2: Create transaction patterns (mapping rules)
      if (options.includePatterns !== false) {
        console.log('Creating transaction patterns...');
        const patternsResult = await this.createPatternsFromTemplate(
          template.transactionPatterns,
          template.chartOfAccounts
        );
        result.patternsCreated = patternsResult.created;
        result.errors.push(...patternsResult.errors);
      }

      // Step 3: Create vendor mappings
      if (options.includeVendors !== false) {
        console.log('Creating vendor mappings...');
        const vendorsResult = await this.createVendorMappings(
          template.commonVendors,
          template.chartOfAccounts
        );
        result.vendorsCreated = vendorsResult.created;
        result.errors.push(...vendorsResult.errors);
      }

      // Step 4: Store industry configuration
      await this.saveIndustryConfiguration(options.industryId, template);

    } catch (error) {
      console.error('Failed to apply industry template:', error);
      result.errors.push(`Critical error: ${error}`);
    }

    return result;
  }

  /**
   * Create chart of accounts from template
   */
  private async createAccountsFromTemplate(
    templates: COATemplate[],
    createdBy: string
  ): Promise<{ created: number; errors: string[] }> {
    const result = { created: 0, errors: [] as string[] };
    const batch = writeBatch(db);

    const processAccount = (account: COATemplate, parentCode?: string) => {
      try {
        const accountData: Omit<AccountRecord, 'id'> = {
          code: account.code,
          name: account.name,
          type: account.type,
          subType: account.subType,
          parentCode: parentCode,
          description: account.description || `${account.name} account`,
          normalBalance: account.normalBalance,
          isActive: true,
          isSystemAccount: account.isRequired,
          metadata: {
            mappingKeywords: account.mappingKeywords,
            typicalVolume: account.typicalTransactionVolume,
            taxRelevant: account.taxRelevant
          },
          createdBy,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const docRef = doc(collection(db, `companies/${this.companyId}/chartOfAccounts`));
        batch.set(docRef, {
          ...accountData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        result.created++;

        // Process children recursively
        if (account.children) {
          account.children.forEach(child => processAccount(child, account.code));
        }
      } catch (error) {
        result.errors.push(`Failed to create account ${account.code}: ${error}`);
      }
    };

    // Process all top-level accounts
    templates.forEach(account => processAccount(account));

    // Commit the batch
    await batch.commit();

    return result;
  }

  /**
   * Create transaction patterns as GL mapping rules
   */
  private async createPatternsFromTemplate(
    patterns: TransactionPattern[],
    coaTemplates: COATemplate[]
  ): Promise<{ created: number; errors: string[] }> {
    const result = { created: 0, errors: [] as string[] };

    // Find account details from templates
    const findAccount = (code: string): COATemplate | undefined => {
      const searchAccounts = (accounts: COATemplate[]): COATemplate | undefined => {
        for (const account of accounts) {
          if (account.code === code) return account;
          if (account.children) {
            const found = searchAccounts(account.children);
            if (found) return found;
          }
        }
        return undefined;
      };
      return searchAccounts(coaTemplates);
    };

    for (const pattern of patterns) {
      try {
        const account = findAccount(pattern.suggestedAccount);
        if (!account) {
          result.errors.push(`Account ${pattern.suggestedAccount} not found for pattern ${pattern.id}`);
          continue;
        }

        const rule: Omit<GLMappingRule, 'id' | 'companyId' | 'createdAt' | 'updatedAt'> = {
          pattern: pattern.pattern,
          patternType: pattern.patternType === 'regex' ? 'regex' : 'contains',
          glAccountCode: pattern.suggestedAccount,
          glAccountId: `${this.companyId}_${pattern.suggestedAccount}`,
          priority: Math.round((1 - pattern.confidence) * 100), // Higher confidence = lower priority number
          isActive: true,
          metadata: {
            description: pattern.description,
            category: pattern.id,
            vendor: pattern.examples?.[0]
          }
        };

        await this.bankToLedgerService.saveMappingRule(rule);
        result.created++;
      } catch (error) {
        result.errors.push(`Failed to create pattern ${pattern.id}: ${error}`);
      }
    }

    return result;
  }

  /**
   * Create vendor-specific mapping rules
   */
  private async createVendorMappings(
    vendors: VendorMapping[],
    coaTemplates: COATemplate[]
  ): Promise<{ created: number; errors: string[] }> {
    const result = { created: 0, errors: [] as string[] };

    for (const vendor of vendors) {
      try {
        // Create primary vendor rule
        const primaryRule: Omit<GLMappingRule, 'id' | 'companyId' | 'createdAt' | 'updatedAt'> = {
          pattern: vendor.vendorName,
          patternType: 'contains',
          glAccountCode: vendor.defaultAccount,
          glAccountId: `${this.companyId}_${vendor.defaultAccount}`,
          priority: 1, // Vendor rules have high priority
          isActive: true,
          metadata: {
            description: `${vendor.vendorType} vendor`,
            vendor: vendor.vendorName,
            category: vendor.vendorType
          }
        };

        await this.bankToLedgerService.saveMappingRule(primaryRule);
        result.created++;

        // Create rules for alternate names
        if (vendor.alternateNames) {
          for (const altName of vendor.alternateNames) {
            const altRule: Omit<GLMappingRule, 'id' | 'companyId' | 'createdAt' | 'updatedAt'> = {
              pattern: altName,
              patternType: 'contains',
              glAccountCode: vendor.defaultAccount,
              glAccountId: `${this.companyId}_${vendor.defaultAccount}`,
              priority: 2,
              isActive: true,
              metadata: {
                description: `${vendor.vendorType} vendor (alternate)`,
                vendor: vendor.vendorName,
                category: vendor.vendorType
              }
            };

            await this.bankToLedgerService.saveMappingRule(altRule);
            result.created++;
          }
        }
      } catch (error) {
        result.errors.push(`Failed to create vendor mapping for ${vendor.vendorName}: ${error}`);
      }
    }

    return result;
  }

  /**
   * Save industry configuration for the company
   */
  private async saveIndustryConfiguration(
    industryId: string,
    template: IndustryTemplate
  ): Promise<void> {
    const configDoc = doc(db, `companies/${this.companyId}/configuration`, 'industry');

    await setDoc(configDoc, {
      industryId,
      industryName: template.name,
      category: template.category,
      appliedAt: serverTimestamp(),
      kpis: template.kpis,
      reportingRequirements: template.reportingRequirements,
      regulatoryCompliance: template.regulatoryCompliance || [],
      metadata: {
        typicalRevenueSources: template.typicalRevenueSources,
        typicalExpenseCategories: template.typicalExpenseCategories
      }
    });
  }

  /**
   * Get available industry templates
   */
  static getAvailableIndustries(): Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    accountCount: number;
    patternCount: number;
  }> {
    return Object.entries(INDUSTRY_TEMPLATES).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      category: template.category,
      accountCount: this.countAccounts(template.chartOfAccounts),
      patternCount: template.transactionPatterns.length
    }));
  }

  /**
   * Count total accounts including children
   */
  private static countAccounts(accounts: COATemplate[]): number {
    let count = 0;
    const countRecursive = (accts: COATemplate[]) => {
      for (const account of accts) {
        count++;
        if (account.children) {
          countRecursive(account.children);
        }
      }
    };
    countRecursive(accounts);
    return count;
  }

  /**
   * Get smart suggestions for a transaction
   */
  async getSmartSuggestions(transaction: {
    description: string;
    amount: number;
    type: 'debit' | 'credit';
  }): Promise<Array<{
    accountCode: string;
    accountName: string;
    confidence: number;
    reason: string;
  }>> {
    // Get company's industry
    const configDoc = await getDocs(
      query(
        collection(db, `companies/${this.companyId}/configuration`),
        where('__name__', '==', 'industry')
      )
    );

    if (configDoc.empty) {
      return [];
    }

    const industryId = configDoc.docs[0].data().industryId;
    const suggestions = generateSmartSuggestions(transaction, industryId);

    // Get account names
    const accounts = await this.coaService.listAccounts();
    const accountMap = new Map(accounts.map(a => [a.code, a.name]));

    return suggestions.map(suggestion => ({
      accountCode: suggestion.account,
      accountName: accountMap.get(suggestion.account) || 'Unknown Account',
      confidence: suggestion.confidence,
      reason: suggestion.reason
    }));
  }

  /**
   * Analyze historical transactions to improve patterns
   */
  async learnFromHistory(
    transactions: Array<{
      description: string;
      amount: number;
      mappedAccount: string;
    }>
  ): Promise<{
    newPatterns: number;
    improvedPatterns: number;
  }> {
    const result = { newPatterns: 0, improvedPatterns: 0 };

    // Group transactions by mapped account
    const accountGroups = new Map<string, typeof transactions>();

    for (const tx of transactions) {
      if (!accountGroups.has(tx.mappedAccount)) {
        accountGroups.set(tx.mappedAccount, []);
      }
      accountGroups.get(tx.mappedAccount)!.push(tx);
    }

    // Analyze each group for common patterns
    for (const [account, txs] of accountGroups) {
      if (txs.length < 3) continue; // Need at least 3 similar transactions

      // Find common words in descriptions
      const words = new Map<string, number>();
      for (const tx of txs) {
        const txWords = tx.description.toUpperCase().split(/\s+/);
        for (const word of txWords) {
          if (word.length > 3) { // Skip short words
            words.set(word, (words.get(word) || 0) + 1);
          }
        }
      }

      // Find words that appear in at least 50% of transactions
      const threshold = txs.length * 0.5;
      const commonWords = Array.from(words.entries())
        .filter(([_, count]) => count >= threshold)
        .map(([word]) => word);

      if (commonWords.length > 0) {
        // Create a new pattern
        const pattern = commonWords.join('|');
        const confidence = Math.min(0.7 + (commonWords.length * 0.1), 0.95);

        try {
          await this.bankToLedgerService.saveMappingRule({
            pattern,
            patternType: 'regex',
            glAccountCode: account,
            glAccountId: `${this.companyId}_${account}`,
            priority: 50, // Medium priority for learned patterns
            isActive: true,
            metadata: {
              description: 'Learned from transaction history',
              category: 'auto-learned'
            }
          });
          result.newPatterns++;
        } catch (error) {
          console.error('Failed to create learned pattern:', error);
        }
      }
    }

    return result;
  }
}