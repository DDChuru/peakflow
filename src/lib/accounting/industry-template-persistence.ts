import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  IndustryTemplate,
  COATemplate,
  TransactionPattern,
  VendorMapping,
  KeyPerformanceIndicator,
  INDUSTRY_TEMPLATES
} from './industry-knowledge-base';

/**
 * Industry Template Persistence Service
 *
 * Stores industry templates in Firestore at:
 * - /industryTemplates/{templateId} - Master templates (admin-managed)
 * - /companies/{companyId}/industryConfig - Company-specific configuration
 * - /companies/{companyId}/glMappingRules - Company-specific mapping rules
 * - /companies/{companyId}/chartOfAccounts - Company-specific COA
 */

export interface PersistedIndustryTemplate extends IndustryTemplate {
  version: string;
  isActive: boolean;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  usageCount?: number;
  lastUsed?: Date;
}

export interface CompanyIndustryConfig {
  companyId: string;
  industryTemplateId: string;
  industryName: string;
  appliedAt: Date;
  appliedBy: string;
  customizations?: {
    addedAccounts?: string[];
    removedAccounts?: string[];
    modifiedPatterns?: string[];
    customVendors?: string[];
  };
  learningEnabled: boolean;
  lastLearningUpdate?: Date;
  matchingStats?: {
    totalTransactions: number;
    autoMatched: number;
    manuallyMatched: number;
    matchRate: number;
  };
}

export class IndustryTemplatePersistence {
  private static TEMPLATES_COLLECTION = 'industryTemplates';
  private static COMPANY_CONFIG_PATH = (companyId: string) =>
    `companies/${companyId}/industryConfig`;

  /**
   * Seed all default industry templates to Firestore (admin operation)
   * This should be run once during initial setup or updates
   */
  static async seedIndustryTemplates(adminUserId: string): Promise<{
    seeded: string[];
    errors: string[];
  }> {
    const result = {
      seeded: [] as string[],
      errors: [] as string[]
    };

    const batch = writeBatch(db);

    for (const [templateId, template] of Object.entries(INDUSTRY_TEMPLATES)) {
      try {
        const docRef = doc(db, this.TEMPLATES_COLLECTION, templateId);

        const persistedTemplate: PersistedIndustryTemplate = {
          ...template,
          version: '1.0.0',
          isActive: true,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: adminUserId,
          usageCount: 0
        };

        // Store template metadata
        batch.set(docRef, {
          ...persistedTemplate,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          // Store nested objects as JSON strings for better query performance
          chartOfAccounts: JSON.stringify(persistedTemplate.chartOfAccounts),
          transactionPatterns: JSON.stringify(persistedTemplate.transactionPatterns),
          commonVendors: JSON.stringify(persistedTemplate.commonVendors),
          kpis: JSON.stringify(persistedTemplate.kpis)
        });

        result.seeded.push(templateId);
      } catch (error) {
        result.errors.push(`Failed to seed ${templateId}: ${error}`);
      }
    }

    await batch.commit();
    console.log(`Seeded ${result.seeded.length} industry templates`);

    return result;
  }

  /**
   * Load an industry template from Firestore
   */
  static async loadTemplate(templateId: string): Promise<IndustryTemplate | null> {
    try {
      const docRef = doc(db, this.TEMPLATES_COLLECTION, templateId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        console.warn(`Template ${templateId} not found in Firestore, using in-memory version`);
        return INDUSTRY_TEMPLATES[templateId] || null;
      }

      const data = snapshot.data();

      // Parse JSON strings back to objects
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        chartOfAccounts: JSON.parse(data.chartOfAccounts),
        transactionPatterns: JSON.parse(data.transactionPatterns),
        commonVendors: JSON.parse(data.commonVendors),
        kpis: JSON.parse(data.kpis),
        reportingRequirements: data.reportingRequirements,
        regulatoryCompliance: data.regulatoryCompliance,
        typicalRevenueSources: data.typicalRevenueSources,
        typicalExpenseCategories: data.typicalExpenseCategories
      } as IndustryTemplate;
    } catch (error) {
      console.error(`Error loading template ${templateId}:`, error);
      // Fallback to in-memory template
      return INDUSTRY_TEMPLATES[templateId] || null;
    }
  }

  /**
   * List all available industry templates
   */
  static async listTemplates(): Promise<IndustryTemplate[]> {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, this.TEMPLATES_COLLECTION),
          where('isActive', '==', true)
        )
      );

      if (snapshot.empty) {
        console.warn('No templates found in Firestore, using in-memory templates');
        return Object.values(INDUSTRY_TEMPLATES);
      }

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          category: data.category,
          chartOfAccounts: JSON.parse(data.chartOfAccounts),
          transactionPatterns: JSON.parse(data.transactionPatterns),
          commonVendors: JSON.parse(data.commonVendors),
          kpis: JSON.parse(data.kpis),
          reportingRequirements: data.reportingRequirements,
          regulatoryCompliance: data.regulatoryCompliance,
          typicalRevenueSources: data.typicalRevenueSources,
          typicalExpenseCategories: data.typicalExpenseCategories
        } as IndustryTemplate;
      });
    } catch (error) {
      console.error('Error listing templates:', error);
      return Object.values(INDUSTRY_TEMPLATES);
    }
  }

  /**
   * Save company's industry configuration
   */
  static async saveCompanyIndustryConfig(
    companyId: string,
    config: Omit<CompanyIndustryConfig, 'companyId'>
  ): Promise<void> {
    const docRef = doc(db, this.COMPANY_CONFIG_PATH(companyId), 'config');

    await setDoc(docRef, {
      companyId,
      ...config,
      appliedAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });
  }

  /**
   * Get company's industry configuration
   */
  static async getCompanyIndustryConfig(
    companyId: string
  ): Promise<CompanyIndustryConfig | null> {
    try {
      const docRef = doc(db, this.COMPANY_CONFIG_PATH(companyId), 'config');
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data();
      return {
        ...data,
        appliedAt: data.appliedAt?.toDate() || new Date(),
        lastLearningUpdate: data.lastLearningUpdate?.toDate()
      } as CompanyIndustryConfig;
    } catch (error) {
      console.error('Error loading company industry config:', error);
      return null;
    }
  }

  /**
   * Track template usage for analytics
   */
  static async trackTemplateUsage(
    templateId: string,
    companyId: string
  ): Promise<void> {
    try {
      const templateRef = doc(db, this.TEMPLATES_COLLECTION, templateId);
      const snapshot = await getDoc(templateRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        await setDoc(templateRef, {
          ...data,
          usageCount: (data.usageCount || 0) + 1,
          lastUsed: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // Also track in usage analytics
      const usageRef = doc(
        collection(db, 'industryTemplateUsage'),
        `${templateId}_${companyId}_${Date.now()}`
      );

      await setDoc(usageRef, {
        templateId,
        companyId,
        usedAt: serverTimestamp(),
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error tracking template usage:', error);
      // Non-critical, don't throw
    }
  }

  /**
   * Update company's matching statistics
   */
  static async updateMatchingStats(
    companyId: string,
    stats: {
      totalTransactions: number;
      autoMatched: number;
      manuallyMatched: number;
    }
  ): Promise<void> {
    const configRef = doc(db, this.COMPANY_CONFIG_PATH(companyId), 'config');

    const matchRate = stats.totalTransactions > 0
      ? (stats.autoMatched / stats.totalTransactions) * 100
      : 0;

    await setDoc(configRef, {
      matchingStats: {
        ...stats,
        matchRate
      },
      lastUpdated: serverTimestamp()
    }, { merge: true });
  }

  /**
   * Store learned patterns for a company
   */
  static async storeLearnedPattern(
    companyId: string,
    pattern: {
      pattern: string;
      accountCode: string;
      confidence: number;
      source: 'manual' | 'auto';
      examples: string[];
    }
  ): Promise<void> {
    const patternId = `learned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const docRef = doc(
      db,
      `companies/${companyId}/learnedPatterns`,
      patternId
    );

    await setDoc(docRef, {
      ...pattern,
      createdAt: serverTimestamp(),
      usageCount: 0,
      lastUsed: null,
      isActive: true
    });
  }

  /**
   * Get learned patterns for a company
   */
  static async getLearnedPatterns(
    companyId: string
  ): Promise<TransactionPattern[]> {
    try {
      const snapshot = await getDocs(
        query(
          collection(db, `companies/${companyId}/learnedPatterns`),
          where('isActive', '==', true)
        )
      );

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          pattern: data.pattern,
          patternType: 'regex',
          suggestedAccount: data.accountCode,
          confidence: data.confidence,
          frequency: 'sporadic',
          description: `Learned pattern from ${data.source} input`,
          examples: data.examples || []
        } as TransactionPattern;
      });
    } catch (error) {
      console.error('Error loading learned patterns:', error);
      return [];
    }
  }

  /**
   * Create a custom industry template (for specialized businesses)
   */
  static async createCustomTemplate(
    template: Omit<IndustryTemplate, 'id'>,
    createdBy: string
  ): Promise<string> {
    const templateId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const docRef = doc(db, this.TEMPLATES_COLLECTION, templateId);

    const persistedTemplate: PersistedIndustryTemplate = {
      ...template,
      id: templateId,
      version: '1.0.0',
      isActive: true,
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      usageCount: 0
    };

    await setDoc(docRef, {
      ...persistedTemplate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      chartOfAccounts: JSON.stringify(persistedTemplate.chartOfAccounts),
      transactionPatterns: JSON.stringify(persistedTemplate.transactionPatterns),
      commonVendors: JSON.stringify(persistedTemplate.commonVendors),
      kpis: JSON.stringify(persistedTemplate.kpis)
    });

    return templateId;
  }

  /**
   * Export company's customized template for sharing
   */
  static async exportCompanyTemplate(
    companyId: string
  ): Promise<IndustryTemplate | null> {
    try {
      // Get company's config
      const config = await this.getCompanyIndustryConfig(companyId);
      if (!config) return null;

      // Load base template
      const baseTemplate = await this.loadTemplate(config.industryTemplateId);
      if (!baseTemplate) return null;

      // Get company's actual COA
      const coaSnapshot = await getDocs(
        collection(db, `companies/${companyId}/chartOfAccounts`)
      );

      // Get company's mapping rules
      const rulesSnapshot = await getDocs(
        collection(db, `companies/${companyId}/glMappingRules`)
      );

      // Get learned patterns
      const learnedPatterns = await this.getLearnedPatterns(companyId);

      // Build customized template
      const customTemplate: IndustryTemplate = {
        ...baseTemplate,
        id: `${companyId}_custom`,
        name: `${baseTemplate.name} (Customized)`,
        description: `Customized template based on ${baseTemplate.name}`,

        // Use actual COA if available
        chartOfAccounts: coaSnapshot.empty
          ? baseTemplate.chartOfAccounts
          : coaSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                code: data.code,
                name: data.name,
                type: data.type,
                subType: data.subType,
                description: data.description,
                isRequired: false,
                isCommon: true,
                normalBalance: data.normalBalance,
                mappingKeywords: data.metadata?.mappingKeywords
              } as COATemplate;
            }),

        // Combine base and learned patterns
        transactionPatterns: [
          ...baseTemplate.transactionPatterns,
          ...learnedPatterns
        ]
      };

      return customTemplate;
    } catch (error) {
      console.error('Error exporting company template:', error);
      return null;
    }
  }
}