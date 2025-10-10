import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
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
import { GLMappingRule } from './bank-to-ledger-service';
import { AccountRecord } from '@/types/accounting/chart-of-accounts';

/**
 * Company-level Chart of Accounts record structure
 * Stored in companies/{companyId}/chartOfAccounts subcollection
 * This is separate from the formal AccountRecord used in the new accounting system
 */
export interface CompanyAccountRecord {
  id?: string;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subType?: string;
  parentCode?: string;
  description?: string;
  normalBalance: 'debit' | 'credit';
  isActive: boolean;
  isSystemAccount?: boolean;
  metadata?: {
    mappingKeywords?: string[];
    typicalVolume?: string;
    taxRelevant?: boolean;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

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

  constructor(private companyId: string) {
    this.coaService = new ChartOfAccountsService(companyId);
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

    console.log(`[IndustryTemplate] Starting template application for ${template.name}`);
    console.log(`[IndustryTemplate] Company ID: ${this.companyId}`);
    console.log(`[IndustryTemplate] Created by: ${options.createdBy}`);

    const result = {
      accountsCreated: 0,
      patternsCreated: 0,
      vendorsCreated: 0,
      errors: [] as string[]
    };

    try {
      // Step 1: Create Chart of Accounts
      console.log(`[IndustryTemplate] Applying COA for ${template.name}`);
      console.log(`[IndustryTemplate] Template has ${template.chartOfAccounts?.length || 0} top-level accounts`);
      const accountsResult = await this.createAccountsFromTemplate(
        template.chartOfAccounts,
        options.createdBy
      );
      result.accountsCreated = accountsResult.created;
      result.errors.push(...accountsResult.errors);
      console.log(`[IndustryTemplate] Accounts created: ${accountsResult.created}`);

      // Step 2: Create transaction patterns (mapping rules)
      if (options.includePatterns !== false) {
        console.log('[IndustryTemplate] Creating transaction patterns...');
        try {
          const patternsResult = await this.createPatternsFromTemplate(
            template.transactionPatterns,
            template.chartOfAccounts
          );
          result.patternsCreated = patternsResult.created;
          result.errors.push(...patternsResult.errors);
          console.log(`[IndustryTemplate] Patterns created: ${patternsResult.created}`);
        } catch (error: any) {
          console.error('[IndustryTemplate] Failed to create patterns:', error);
          result.errors.push(`Pattern creation failed: ${error?.message || error}. You may need to create mapping rules manually.`);
        }
      }

      // Step 3: Create vendor mappings
      if (options.includeVendors !== false) {
        console.log('[IndustryTemplate] Creating vendor mappings...');
        try {
          const vendorsResult = await this.createVendorMappings(
            template.commonVendors,
            template.chartOfAccounts
          );
          result.vendorsCreated = vendorsResult.created;
          result.errors.push(...vendorsResult.errors);
          console.log(`[IndustryTemplate] Vendors created: ${vendorsResult.created}`);
        } catch (error: any) {
          console.error('[IndustryTemplate] Failed to create vendor mappings:', error);
          result.errors.push(`Vendor mapping creation failed: ${error?.message || error}. You may need to create mappings manually.`);
        }
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
    let accountsQueued = 0;

    const processAccount = (account: COATemplate, parentCode?: string) => {
      try {
        console.log(`Processing account: ${account.code} - ${account.name}`);

        // Build metadata object, only including defined fields
        const metadata: any = {};
        if (account.mappingKeywords !== undefined) {
          metadata.mappingKeywords = account.mappingKeywords;
        }
        if (account.typicalTransactionVolume !== undefined) {
          metadata.typicalVolume = account.typicalTransactionVolume;
        }
        if (account.taxRelevant !== undefined) {
          metadata.taxRelevant = account.taxRelevant;
        }

        // Build account data, only including defined fields
        const accountData: any = {
          code: account.code,
          name: account.name,
          type: account.type,
          description: account.description || `${account.name} account`,
          normalBalance: account.normalBalance,
          isActive: true,
          isSystemAccount: account.isRequired || false,
          createdBy,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        // Only add optional fields if they're defined
        if (account.subType !== undefined) {
          accountData.subType = account.subType;
        }
        if (parentCode !== undefined) {
          accountData.parentCode = parentCode;
        }
        if (Object.keys(metadata).length > 0) {
          accountData.metadata = metadata;
        }

        const docRef = doc(collection(db, `companies/${this.companyId}/chartOfAccounts`));
        batch.set(docRef, accountData);

        accountsQueued++;
        console.log(`Queued account ${account.code}, total queued: ${accountsQueued}`);

        // Process children recursively
        if (account.children) {
          console.log(`Processing ${account.children.length} children of ${account.code}`);
          account.children.forEach(child => processAccount(child, account.code));
        }
      } catch (error) {
        console.error(`Error processing account ${account.code}:`, error);
        result.errors.push(`Failed to queue account ${account.code}: ${error}`);
      }
    };

    // Process all top-level accounts
    console.log(`About to process ${templates?.length || 0} templates`);
    console.log(`Templates array:`, templates);

    if (!templates || templates.length === 0) {
      console.error('No templates to process!');
      result.errors.push('No chart of accounts templates provided');
      return result;
    }

    templates.forEach((account, index) => {
      console.log(`Processing template ${index + 1}/${templates.length}`);
      processAccount(account);
    });

    console.log(`Queued ${accountsQueued} accounts for batch commit`);

    // Commit the batch
    try {
      if (accountsQueued > 0) {
        console.log(`[COA Batch] Attempting to commit ${accountsQueued} accounts to companies/${this.companyId}/chartOfAccounts`);
        await batch.commit();
        result.created = accountsQueued;
        console.log(`[COA Batch] Successfully committed ${accountsQueued} accounts to Firestore`);
      } else {
        console.warn('[COA Batch] No accounts queued for commit');
      }
    } catch (error: any) {
      console.error('[COA Batch] Failed to commit batch:', error);
      console.error('[COA Batch] Error code:', error?.code);
      console.error('[COA Batch] Error message:', error?.message);
      console.error('[COA Batch] Full error:', JSON.stringify(error, null, 2));
      result.errors.push(`Batch commit failed: ${error?.message || error}`);

      // Provide helpful error messages
      if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
        result.errors.push('Permission denied: User must have admin or developer role to create chart of accounts');
      }
    }

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

    // Use batch writes to avoid permission check rate limits
    let batch = writeBatch(db);
    let batchCount = 0;
    let totalQueued = 0;

    console.log(`[GL Patterns] Starting to process ${patterns.length} patterns`);

    for (const pattern of patterns) {
      try {
        const account = findAccount(pattern.suggestedAccount);
        if (!account) {
          result.errors.push(`Account ${pattern.suggestedAccount} not found for pattern ${pattern.id}`);
          continue;
        }

        const ruleId = pattern.pattern.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const ruleData = {
          id: ruleId,
          companyId: this.companyId,
          pattern: pattern.pattern,
          patternType: pattern.patternType === 'regex' ? 'regex' : 'contains',
          glAccountCode: pattern.suggestedAccount,
          glAccountId: `${this.companyId}_${pattern.suggestedAccount}`,
          priority: Math.round((1 - pattern.confidence) * 100),
          isActive: true,
          metadata: {
            description: pattern.description,
            category: pattern.id,
            vendor: pattern.examples?.[0]
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        batch.set(
          doc(db, `companies/${this.companyId}/glMappingRules`, ruleId),
          ruleData
        );
        batchCount++;
        totalQueued++;
        result.created++;

        // Firestore batch limit is 500 operations
        if (batchCount >= 500) {
          console.log(`[GL Patterns Batch] Attempting to commit ${batchCount} pattern rules to companies/${this.companyId}/glMappingRules`);
          await batch.commit();
          console.log(`[GL Patterns Batch] ✅ Successfully committed ${batchCount} pattern rules`);
          batch = writeBatch(db); // Create new batch
          batchCount = 0;
        }
      } catch (error: any) {
        console.error(`[GL Patterns] Error processing pattern ${pattern.id}:`, error);
        result.errors.push(`Failed to create pattern ${pattern.id}: ${error?.message || error}`);
      }
    }

    // Commit remaining patterns
    if (batchCount > 0) {
      try {
        console.log(`[GL Patterns Batch] Attempting to commit final batch of ${batchCount} pattern rules to companies/${this.companyId}/glMappingRules`);
        await batch.commit();
        console.log(`[GL Patterns Batch] ✅ Successfully committed final batch of ${batchCount} pattern rules`);
      } catch (error: any) {
        console.error('[GL Patterns Batch] ❌ Failed to commit final batch:', error);
        console.error('[GL Patterns Batch] Error details:', JSON.stringify(error, null, 2));
        result.errors.push(`Failed to commit pattern batch: ${error?.message || error}`);
      }
    }

    console.log(`[GL Patterns] Queued: ${totalQueued}, Created: ${result.created}, Errors: ${result.errors.length}`);

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

    // Use batch writes to avoid permission check rate limits
    let batch = writeBatch(db);
    let batchCount = 0;
    let totalQueued = 0;

    console.log(`[GL Vendors] Starting to process ${vendors.length} vendors`);

    for (const vendor of vendors) {
      try {
        // Create primary vendor rule
        const primaryRuleId = vendor.vendorName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const primaryRuleData = {
          id: primaryRuleId,
          companyId: this.companyId,
          pattern: vendor.vendorName,
          patternType: 'contains' as const,
          glAccountCode: vendor.defaultAccount,
          glAccountId: `${this.companyId}_${vendor.defaultAccount}`,
          priority: 1,
          isActive: true,
          metadata: {
            description: `${vendor.vendorType} vendor`,
            vendor: vendor.vendorName,
            category: vendor.vendorType
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        batch.set(
          doc(db, `companies/${this.companyId}/glMappingRules`, primaryRuleId),
          primaryRuleData
        );
        batchCount++;
        totalQueued++;
        result.created++;

        // Create rules for alternate names
        if (vendor.alternateNames) {
          for (const altName of vendor.alternateNames) {
            const altRuleId = altName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const altRuleData = {
              id: altRuleId,
              companyId: this.companyId,
              pattern: altName,
              patternType: 'contains' as const,
              glAccountCode: vendor.defaultAccount,
              glAccountId: `${this.companyId}_${vendor.defaultAccount}`,
              priority: 2,
              isActive: true,
              metadata: {
                description: `${vendor.vendorType} vendor (alternate)`,
                vendor: vendor.vendorName,
                category: vendor.vendorType
              },
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };

            batch.set(
              doc(db, `companies/${this.companyId}/glMappingRules`, altRuleId),
              altRuleData
            );
            batchCount++;
            totalQueued++;
            result.created++;
          }
        }

        // Firestore batch limit is 500 operations
        if (batchCount >= 500) {
          console.log(`[GL Vendors Batch] Attempting to commit ${batchCount} vendor rules to companies/${this.companyId}/glMappingRules`);
          await batch.commit();
          console.log(`[GL Vendors Batch] ✅ Successfully committed ${batchCount} vendor rules`);
          batch = writeBatch(db); // Create new batch
          batchCount = 0;
        }
      } catch (error: any) {
        console.error(`[GL Vendors] Error processing vendor ${vendor.vendorName}:`, error);
        result.errors.push(`Failed to create vendor mapping for ${vendor.vendorName}: ${error?.message || error}`);
      }
    }

    // Commit remaining vendors
    if (batchCount > 0) {
      try {
        console.log(`[GL Vendors Batch] Attempting to commit final batch of ${batchCount} vendor rules to companies/${this.companyId}/glMappingRules`);
        await batch.commit();
        console.log(`[GL Vendors Batch] ✅ Successfully committed final batch of ${batchCount} vendor rules`);
      } catch (error: any) {
        console.error('[GL Vendors Batch] ❌ Failed to commit final batch:', error);
        console.error('[GL Vendors Batch] Error details:', JSON.stringify(error, null, 2));
        result.errors.push(`Failed to commit vendor batch: ${error?.message || error}`);
      }
    }

    console.log(`[GL Vendors] Queued: ${totalQueued}, Created: ${result.created}, Errors: ${result.errors.length}`);

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
          await this.saveMappingRule({
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

  /**
   * List all accounts for this company
   */
  async listAccounts(): Promise<CompanyAccountRecord[]> {
    const accountsRef = collection(db, `companies/${this.companyId}/chartOfAccounts`);
    const q = query(accountsRef, orderBy('code', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        code: data.code,
        name: data.name,
        type: data.type,
        subType: data.subType,
        parentCode: data.parentCode,
        description: data.description,
        normalBalance: data.normalBalance,
        isActive: data.isActive ?? true,
        isSystemAccount: data.isSystemAccount ?? false,
        metadata: data.metadata,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as CompanyAccountRecord;
    });
  }

  /**
   * Get a single account by ID
   */
  async getAccount(accountId: string): Promise<CompanyAccountRecord | null> {
    const accountRef = doc(db, `companies/${this.companyId}/chartOfAccounts`, accountId);
    const accountDoc = await getDoc(accountRef);

    if (!accountDoc.exists()) {
      return null;
    }

    const data = accountDoc.data();
    return {
      id: accountDoc.id,
      code: data.code,
      name: data.name,
      type: data.type,
      subType: data.subType,
      parentCode: data.parentCode,
      description: data.description,
      normalBalance: data.normalBalance,
      isActive: data.isActive ?? true,
      isSystemAccount: data.isSystemAccount ?? false,
      metadata: data.metadata,
      createdBy: data.createdBy,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as CompanyAccountRecord;
  }

  /**
   * Save a GL mapping rule
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
   * Get all mapping rules (including inactive) for deletion
   */
  async getAllMappingRules(): Promise<GLMappingRule[]> {
    const rulesQuery = query(
      collection(db, `companies/${this.companyId}/glMappingRules`)
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
   * Delete a mapping rule
   */
  async deleteMappingRule(ruleId: string): Promise<void> {
    await deleteDoc(doc(db, `companies/${this.companyId}/glMappingRules`, ruleId));
  }

  /**
   * Delete all COA entries, patterns, and vendor mappings for a company
   */
  async deleteAllCOAData(): Promise<{
    accountsDeleted: number;
    patternsDeleted: number;
    vendorsDeleted: number;
    errors: string[];
  }> {
    const result = {
      accountsDeleted: 0,
      patternsDeleted: 0,
      vendorsDeleted: 0,
      errors: [] as string[]
    };

    try {
      // 1. Delete all Chart of Accounts entries
      const accountsRef = collection(db, `companies/${this.companyId}/chartOfAccounts`);
      const accountsSnapshot = await getDocs(accountsRef);

      const deleteBatch = writeBatch(db);
      accountsSnapshot.docs.forEach(docSnap => {
        deleteBatch.delete(docSnap.ref);
        result.accountsDeleted++;
      });

      // Commit in batches of 500 (Firestore limit)
      if (accountsSnapshot.docs.length > 0) {
        await deleteBatch.commit();
      }

      // 2. Delete all GL mapping rules (patterns and vendors)
      const mappingRules = await this.getAllMappingRules();
      for (const rule of mappingRules) {
        try {
          await this.deleteMappingRule(rule.id);
          if (rule.metadata?.vendor) {
            result.vendorsDeleted++;
          } else {
            result.patternsDeleted++;
          }
        } catch (error) {
          result.errors.push(`Failed to delete mapping rule ${rule.id}: ${error}`);
        }
      }

      // 3. Delete industry configuration
      try {
        const configDoc = doc(db, `companies/${this.companyId}/configuration`, 'industry');
        await deleteDoc(configDoc);
      } catch (error) {
        // Configuration might not exist, ignore this error
        console.log('Industry configuration not found (may not exist yet)');
      }

    } catch (error) {
      result.errors.push(`Critical error during deletion: ${error}`);
    }

    return result;
  }

  /**
   * Reset COA: Delete all existing data and apply new industry template
   */
  async resetAndApplyTemplate(options: IndustrySetupOptions): Promise<{
    deleted: { accountsDeleted: number; patternsDeleted: number; vendorsDeleted: number };
    created: { accountsCreated: number; patternsCreated: number; vendorsCreated: number };
    errors: string[];
  }> {
    // Step 1: Delete all existing data
    const deleteResult = await this.deleteAllCOAData();

    // Step 2: Apply new template
    const createResult = await this.applyIndustryTemplate(options);

    return {
      deleted: {
        accountsDeleted: deleteResult.accountsDeleted,
        patternsDeleted: deleteResult.patternsDeleted,
        vendorsDeleted: deleteResult.vendorsDeleted
      },
      created: {
        accountsCreated: createResult.accountsCreated,
        patternsCreated: createResult.patternsCreated,
        vendorsCreated: createResult.vendorsCreated
      },
      errors: [...deleteResult.errors, ...createResult.errors]
    };
  }
}

// Export singleton instance
export const industryTemplateService = new IndustryTemplateService();