/**
 * Industry Knowledge Base
 * Comprehensive industry-specific accounting templates and patterns
 */

export interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  category: 'service' | 'retail' | 'manufacturing' | 'hospitality' | 'healthcare' | 'technology' | 'construction' | 'nonprofit';
  chartOfAccounts: COATemplate[];
  transactionPatterns: TransactionPattern[];
  commonVendors: VendorMapping[];
  kpis: KeyPerformanceIndicator[];
  reportingRequirements: string[];
  regulatoryCompliance?: string[];
  typicalRevenueSources: string[];
  typicalExpenseCategories: string[];
}

export interface COATemplate {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  subType?: string;
  description?: string;
  isRequired: boolean;
  isCommon: boolean;
  normalBalance: 'debit' | 'credit';
  taxRelevant?: boolean;
  mappingKeywords?: string[];
  typicalTransactionVolume?: 'high' | 'medium' | 'low';
  children?: COATemplate[];
}

export interface TransactionPattern {
  id: string;
  pattern: string;
  patternType: 'regex' | 'contains' | 'starts_with' | 'exact';
  suggestedAccount: string;
  confidence: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'sporadic';
  averageAmount?: { min: number; max: number };
  description: string;
  examples: string[];
}

export interface VendorMapping {
  vendorName: string;
  alternateNames?: string[];
  defaultAccount: string;
  vendorType: string;
  isRecurring: boolean;
  paymentFrequency?: string;
}

export interface KeyPerformanceIndicator {
  name: string;
  formula: string;
  accounts: string[];
  benchmarkRange?: { min: number; max: number };
  importance: 'critical' | 'important' | 'informative';
}

/**
 * Restaurant Industry Template
 */
export const RESTAURANT_TEMPLATE: IndustryTemplate = {
  id: 'restaurant',
  name: 'Restaurant & Food Service',
  description: 'Full-service restaurants, QSR, cafes, and food service businesses',
  category: 'hospitality',
  typicalRevenueSources: ['Dine-in Sales', 'Takeout', 'Delivery', 'Catering', 'Bar Sales'],
  typicalExpenseCategories: ['Food Costs', 'Labor', 'Rent', 'Utilities', 'Marketing'],

  chartOfAccounts: [
    // Assets (1000-1999)
    {
      code: '1000',
      name: 'Cash and Cash Equivalents',
      type: 'asset',
      subType: 'current',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '1010', name: 'Operating Cash Account', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['BANK', 'CHECKING'] },
        { code: '1020', name: 'Payroll Account', type: 'asset', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['PAYROLL'] },
        { code: '1030', name: 'Cash Register / Till', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CASH', 'TILL'] },
        { code: '1040', name: 'Online Payment Clearing', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['STRIPE', 'SQUARE', 'PAYPAL'] },
      ]
    },
    {
      code: '1200',
      name: 'Accounts Receivable',
      type: 'asset',
      subType: 'current',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '1210', name: 'Catering Receivables', type: 'asset', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CATERING', 'EVENT'] },
        { code: '1220', name: 'Delivery Platform Receivables', type: 'asset', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['UBEREATS', 'DOORDASH', 'GRUBHUB'] },
      ]
    },
    {
      code: '1300',
      name: 'Inventory',
      type: 'asset',
      subType: 'current',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      typicalTransactionVolume: 'high',
      children: [
        { code: '1310', name: 'Food Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['FOOD', 'PRODUCE', 'MEAT', 'SEAFOOD'] },
        { code: '1320', name: 'Beverage Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['BEVERAGE', 'WINE', 'BEER', 'LIQUOR'] },
        { code: '1330', name: 'Supplies Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SUPPLIES', 'PAPER', 'CLEANING'] },
      ]
    },
    {
      code: '1500',
      name: 'Property and Equipment',
      type: 'asset',
      subType: 'fixed',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '1510', name: 'Kitchen Equipment', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['EQUIPMENT', 'KITCHEN', 'APPLIANCE'] },
        { code: '1520', name: 'Furniture and Fixtures', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['FURNITURE', 'FIXTURE', 'DECOR'] },
        { code: '1530', name: 'POS Systems', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['POS', 'TOAST', 'SQUARE', 'CLOVER'] },
        { code: '1580', name: 'Accumulated Depreciation', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'credit' },
      ]
    },

    // Liabilities (2000-2999)
    {
      code: '2000',
      name: 'Current Liabilities',
      type: 'liability',
      subType: 'current',
      isRequired: true,
      isCommon: true,
      normalBalance: 'credit',
      children: [
        { code: '2100', name: 'Accounts Payable', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['PAYABLE', 'VENDOR'] },
        { code: '2110', name: 'Food Vendors Payable', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['SYSCO', 'US FOODS', 'SUPPLIER'] },
        { code: '2200', name: 'Accrued Expenses', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit' },
        { code: '2210', name: 'Accrued Payroll', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['PAYROLL', 'WAGES'] },
        { code: '2220', name: 'Accrued Tips Payable', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['TIPS'] },
        { code: '2300', name: 'Sales Tax Payable', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', taxRelevant: true, mappingKeywords: ['SALES TAX', 'TAX'] },
        { code: '2400', name: 'Gift Cards Outstanding', type: 'liability', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['GIFT CARD'] },
      ]
    },

    // Revenue (4000-4999)
    {
      code: '4000',
      name: 'Revenue',
      type: 'revenue',
      isRequired: true,
      isCommon: true,
      normalBalance: 'credit',
      typicalTransactionVolume: 'high',
      children: [
        { code: '4100', name: 'Food Sales', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['FOOD SALES', 'DINING'] },
        { code: '4200', name: 'Beverage Sales', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['BEVERAGE', 'BAR', 'ALCOHOL'] },
        { code: '4300', name: 'Delivery Sales', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['DELIVERY', 'UBEREATS', 'DOORDASH'] },
        { code: '4400', name: 'Catering Revenue', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['CATERING', 'EVENT'] },
        { code: '4500', name: 'Gift Card Sales', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['GIFT CARD'] },
      ]
    },

    // Cost of Goods Sold (5000-5999)
    {
      code: '5000',
      name: 'Cost of Goods Sold',
      type: 'expense',
      subType: 'cogs',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      typicalTransactionVolume: 'high',
      children: [
        { code: '5100', name: 'Food Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['FOOD SUPPLIER', 'SYSCO', 'US FOODS', 'PRODUCE'] },
        { code: '5200', name: 'Beverage Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['BEVERAGE DIST', 'WINE', 'BEER', 'LIQUOR SUPPLIER'] },
        { code: '5300', name: 'Paper & Supplies Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SUPPLIES', 'PAPER', 'DISPOSABLE'] },
      ]
    },

    // Operating Expenses (6000-6999)
    {
      code: '6000',
      name: 'Operating Expenses',
      type: 'expense',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '6100', name: 'Payroll Expenses', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', typicalTransactionVolume: 'high', mappingKeywords: ['PAYROLL', 'SALARY', 'WAGES'] },
        { code: '6110', name: 'Management Salaries', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SALARY', 'MANAGER'] },
        { code: '6120', name: 'Hourly Wages', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['WAGES', 'HOURLY'] },
        { code: '6130', name: 'Payroll Taxes', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', taxRelevant: true, mappingKeywords: ['PAYROLL TAX', 'FICA', 'FUTA'] },
        { code: '6140', name: 'Employee Benefits', type: 'expense', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['BENEFITS', 'HEALTH INSURANCE', '401K'] },
        { code: '6200', name: 'Rent Expense', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RENT', 'LEASE'] },
        { code: '6300', name: 'Utilities', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['UTILITY', 'ELECTRIC', 'GAS', 'WATER'] },
        { code: '6400', name: 'Marketing & Advertising', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['MARKETING', 'ADVERTISING', 'PROMOTION', 'FACEBOOK', 'GOOGLE'] },
        { code: '6500', name: 'Delivery Platform Fees', type: 'expense', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['UBEREATS FEE', 'DOORDASH FEE', 'DELIVERY FEE'] },
        { code: '6600', name: 'Credit Card Processing', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CREDIT CARD FEE', 'PROCESSING', 'MERCHANT FEE', 'SQUARE FEE'] },
        { code: '6700', name: 'Insurance', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['INSURANCE', 'LIABILITY', 'PROPERTY INS'] },
        { code: '6800', name: 'Repairs & Maintenance', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['REPAIR', 'MAINTENANCE', 'SERVICE'] },
        { code: '6900', name: 'Professional Services', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['ACCOUNTING', 'LEGAL', 'CONSULTING'] },
      ]
    }
  ],

  transactionPatterns: [
    {
      id: 'food-supplier',
      pattern: 'SYSCO|US FOODS|FOOD.*SUPPLIER|PRODUCE|MEAT|SEAFOOD',
      patternType: 'regex',
      suggestedAccount: '5100',
      confidence: 0.95,
      frequency: 'weekly',
      description: 'Food supplier purchases',
      examples: ['SYSCO FOODS', 'US FOODS PAYMENT', 'ABC PRODUCE CO'],
      averageAmount: { min: 500, max: 5000 }
    },
    {
      id: 'payroll',
      pattern: 'PAYROLL|ADP|PAYCHEX|GUSTO',
      patternType: 'regex',
      suggestedAccount: '6100',
      confidence: 0.98,
      frequency: 'weekly',
      description: 'Payroll processing',
      examples: ['ADP PAYROLL', 'GUSTO PAYROLL PROC'],
      averageAmount: { min: 5000, max: 50000 }
    },
    {
      id: 'pos-deposit',
      pattern: 'SQUARE INC|TOAST INC|CLOVER|POS DEPOSIT',
      patternType: 'regex',
      suggestedAccount: '4100',
      confidence: 0.92,
      frequency: 'daily',
      description: 'POS system deposits',
      examples: ['SQUARE INC DEPOSIT', 'TOAST POS SETTLEMENT'],
      averageAmount: { min: 500, max: 10000 }
    },
    {
      id: 'delivery-platform',
      pattern: 'UBER.*EATS|DOORDASH|GRUBHUB|POSTMATES',
      patternType: 'regex',
      suggestedAccount: '4300',
      confidence: 0.90,
      frequency: 'weekly',
      description: 'Delivery platform settlements',
      examples: ['UBER EATS PAYMENT', 'DOORDASH TRANSFER'],
      averageAmount: { min: 200, max: 5000 }
    },
    {
      id: 'rent',
      pattern: 'RENT|LEASE PAYMENT|PROPERTY MGMT|LANDLORD',
      patternType: 'regex',
      suggestedAccount: '6200',
      confidence: 0.95,
      frequency: 'monthly',
      description: 'Rent or lease payments',
      examples: ['MONTHLY RENT', 'ABC PROPERTY MGMT'],
      averageAmount: { min: 2000, max: 20000 }
    },
    {
      id: 'utilities',
      pattern: 'ELECTRIC|GAS COMPANY|WATER DEPT|UTILITY',
      patternType: 'regex',
      suggestedAccount: '6300',
      confidence: 0.93,
      frequency: 'monthly',
      description: 'Utility payments',
      examples: ['CON EDISON', 'WATER DEPARTMENT'],
      averageAmount: { min: 200, max: 2000 }
    },
    {
      id: 'credit-card-fees',
      pattern: 'CREDIT CARD FEE|MERCHANT FEE|SQUARE FEE|PROCESSING FEE',
      patternType: 'regex',
      suggestedAccount: '6600',
      confidence: 0.96,
      frequency: 'daily',
      description: 'Credit card processing fees',
      examples: ['SQUARE PROCESSING FEE', 'MERCHANT SERVICE FEE'],
      averageAmount: { min: 20, max: 500 }
    }
  ],

  commonVendors: [
    { vendorName: 'SYSCO', alternateNames: ['SYSCO FOODS', 'SYSCO CORP'], defaultAccount: '5100', vendorType: 'Food Supplier', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'US FOODS', alternateNames: ['US FOODSERVICE'], defaultAccount: '5100', vendorType: 'Food Supplier', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'RESTAURANT DEPOT', defaultAccount: '5100', vendorType: 'Food Supplier', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'ADP', alternateNames: ['ADP PAYROLL'], defaultAccount: '6100', vendorType: 'Payroll Service', isRecurring: true, paymentFrequency: 'biweekly' },
    { vendorName: 'SQUARE', alternateNames: ['SQUARE INC', 'SQ *'], defaultAccount: '1040', vendorType: 'Payment Processor', isRecurring: true, paymentFrequency: 'daily' },
    { vendorName: 'UBER EATS', alternateNames: ['UBEREATS', 'UBER TECHNOLOGIES'], defaultAccount: '4300', vendorType: 'Delivery Platform', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'DOORDASH', alternateNames: ['DOOR DASH'], defaultAccount: '4300', vendorType: 'Delivery Platform', isRecurring: true, paymentFrequency: 'weekly' },
  ],

  kpis: [
    {
      name: 'Food Cost Percentage',
      formula: '(Food Costs / Food Sales) * 100',
      accounts: ['5100', '4100'],
      benchmarkRange: { min: 25, max: 35 },
      importance: 'critical'
    },
    {
      name: 'Labor Cost Percentage',
      formula: '(Total Labor Costs / Total Revenue) * 100',
      accounts: ['6100', '6110', '6120', '4000'],
      benchmarkRange: { min: 25, max: 35 },
      importance: 'critical'
    },
    {
      name: 'Prime Cost',
      formula: '(Food Costs + Labor Costs) / Total Revenue * 100',
      accounts: ['5000', '6100', '4000'],
      benchmarkRange: { min: 55, max: 65 },
      importance: 'critical'
    },
    {
      name: 'Average Check Size',
      formula: 'Total Revenue / Number of Transactions',
      accounts: ['4000'],
      benchmarkRange: { min: 15, max: 50 },
      importance: 'important'
    }
  ],

  reportingRequirements: [
    'Daily Sales Report',
    'Weekly P&L',
    'Monthly Food Cost Analysis',
    'Labor Cost Report',
    'Sales Tax Report'
  ],

  regulatoryCompliance: [
    'Sales Tax Filing',
    'Payroll Tax Filing',
    'Health Department Compliance',
    'Liquor License Reporting'
  ]
};

/**
 * Software/SaaS Company Template
 */
export const SAAS_TEMPLATE: IndustryTemplate = {
  id: 'saas',
  name: 'Software as a Service (SaaS)',
  description: 'Subscription-based software companies and cloud services',
  category: 'technology',
  typicalRevenueSources: ['Subscription Revenue', 'Professional Services', 'API Usage', 'Enterprise Licenses'],
  typicalExpenseCategories: ['Engineering Salaries', 'Cloud Infrastructure', 'Sales & Marketing', 'Customer Support'],

  chartOfAccounts: [
    // Assets
    {
      code: '1000',
      name: 'Current Assets',
      type: 'asset',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '1010', name: 'Operating Bank Account', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CHECKING', 'BANK'] },
        { code: '1020', name: 'Stripe/Payment Processor Clearing', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['STRIPE', 'PAYPAL', 'PAYMENT'] },
        { code: '1100', name: 'Accounts Receivable', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RECEIVABLE', 'INVOICE'] },
        { code: '1200', name: 'Prepaid Expenses', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['PREPAID'] },
        { code: '1210', name: 'Prepaid Software Licenses', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['LICENSE', 'SOFTWARE'] },
      ]
    },
    {
      code: '1300',
      name: 'Deferred Costs',
      type: 'asset',
      subType: 'current',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '1310', name: 'Deferred Sales Commissions', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['COMMISSION'] },
        { code: '1320', name: 'Capitalized Development Costs', type: 'asset', isRequired: false, isCommon: true, normalBalance: 'debit' },
      ]
    },

    // Revenue
    {
      code: '4000',
      name: 'Revenue',
      type: 'revenue',
      isRequired: true,
      isCommon: true,
      normalBalance: 'credit',
      children: [
        { code: '4100', name: 'Subscription Revenue - Monthly', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['SUBSCRIPTION', 'MONTHLY', 'MRR'] },
        { code: '4110', name: 'Subscription Revenue - Annual', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['ANNUAL', 'YEARLY'] },
        { code: '4200', name: 'Professional Services Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['CONSULTING', 'IMPLEMENTATION', 'SERVICES'] },
        { code: '4300', name: 'API/Usage-Based Revenue', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['API', 'USAGE', 'OVERAGE'] },
        { code: '4400', name: 'Setup Fees', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['SETUP', 'ONBOARDING'] },
      ]
    },

    // Expenses
    {
      code: '5000',
      name: 'Cost of Revenue',
      type: 'expense',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '5100', name: 'Cloud Infrastructure Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['AWS', 'GOOGLE CLOUD', 'AZURE', 'HOSTING'] },
        { code: '5200', name: 'Third-Party API Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['API', 'INTEGRATION', 'TWILIO', 'SENDGRID'] },
        { code: '5300', name: 'Payment Processing Fees', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['STRIPE FEE', 'PROCESSING', 'MERCHANT'] },
        { code: '5400', name: 'Customer Support Tools', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['ZENDESK', 'INTERCOM', 'SUPPORT'] },
      ]
    },
    {
      code: '6000',
      name: 'Operating Expenses',
      type: 'expense',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '6100', name: 'Salaries - Engineering', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SALARY', 'PAYROLL', 'ENGINEER'] },
        { code: '6110', name: 'Salaries - Sales', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SALES SALARY', 'COMMISSION'] },
        { code: '6120', name: 'Salaries - Marketing', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['MARKETING SALARY'] },
        { code: '6200', name: 'Software Subscriptions', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['GITHUB', 'JIRA', 'SLACK', 'SOFTWARE'] },
        { code: '6300', name: 'Marketing & Advertising', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['GOOGLE ADS', 'FACEBOOK', 'MARKETING'] },
        { code: '6400', name: 'Sales Tools & CRM', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SALESFORCE', 'HUBSPOT', 'CRM'] },
      ]
    }
  ],

  transactionPatterns: [
    // Payment Processing & Revenue
    { id: 'stripe-deposit', pattern: 'STRIPE.*TRANSFER|STRIPE.*PAYOUT', patternType: 'regex', suggestedAccount: '4100', confidence: 0.95, frequency: 'daily', description: 'Stripe payment settlements', examples: ['STRIPE TRANSFER', 'STRIPE PAYOUT'] },
    { id: 'stripe-fee', pattern: 'STRIPE.*FEE', patternType: 'regex', suggestedAccount: '5300', confidence: 0.98, frequency: 'daily', description: 'Stripe processing fees', examples: ['STRIPE FEE'] },
    { id: 'paypal-deposit', pattern: 'PAYPAL.*TRANSFER', patternType: 'regex', suggestedAccount: '4100', confidence: 0.93, frequency: 'weekly', description: 'PayPal settlements', examples: ['PAYPAL TRANSFER'] },
    { id: 'square-deposit', pattern: 'SQUARE.*INC', patternType: 'contains', suggestedAccount: '4100', confidence: 0.92, frequency: 'daily', description: 'Square payment settlements', examples: ['SQUARE INC'] },

    // Cloud Infrastructure
    { id: 'aws-charges', pattern: 'AWS|AMAZON WEB SERVICES', patternType: 'regex', suggestedAccount: '5100', confidence: 0.98, frequency: 'monthly', description: 'AWS infrastructure', examples: ['AWS CHARGES', 'AMAZON WEB SERVICES'] },
    { id: 'google-cloud', pattern: 'GOOGLE.*CLOUD|GCP', patternType: 'regex', suggestedAccount: '5100', confidence: 0.97, frequency: 'monthly', description: 'Google Cloud Platform', examples: ['GOOGLE CLOUD', 'GCP'] },
    { id: 'azure', pattern: 'MICROSOFT.*AZURE|AZURE', patternType: 'regex', suggestedAccount: '5100', confidence: 0.97, frequency: 'monthly', description: 'Microsoft Azure', examples: ['MICROSOFT AZURE'] },
    { id: 'heroku', pattern: 'HEROKU', patternType: 'contains', suggestedAccount: '5100', confidence: 0.96, frequency: 'monthly', description: 'Heroku hosting', examples: ['HEROKU'] },
    { id: 'digitalocean', pattern: 'DIGITALOCEAN|DIGITAL OCEAN', patternType: 'regex', suggestedAccount: '5100', confidence: 0.96, frequency: 'monthly', description: 'DigitalOcean hosting', examples: ['DIGITALOCEAN'] },
    { id: 'vercel', pattern: 'VERCEL', patternType: 'contains', suggestedAccount: '5100', confidence: 0.95, frequency: 'monthly', description: 'Vercel hosting', examples: ['VERCEL'] },
    { id: 'netlify', pattern: 'NETLIFY', patternType: 'contains', suggestedAccount: '5100', confidence: 0.95, frequency: 'monthly', description: 'Netlify hosting', examples: ['NETLIFY'] },

    // Payroll
    { id: 'payroll-gusto', pattern: 'GUSTO', patternType: 'contains', suggestedAccount: '6100', confidence: 0.96, frequency: 'biweekly', description: 'Gusto payroll', examples: ['GUSTO PAYROLL'] },
    { id: 'payroll-rippling', pattern: 'RIPPLING', patternType: 'contains', suggestedAccount: '6100', confidence: 0.96, frequency: 'biweekly', description: 'Rippling payroll', examples: ['RIPPLING'] },
    { id: 'payroll-adp', pattern: 'ADP', patternType: 'contains', suggestedAccount: '6100', confidence: 0.95, frequency: 'biweekly', description: 'ADP payroll', examples: ['ADP PAYROLL'] },
    { id: 'payroll-bamboo', pattern: 'BAMBOOHR', patternType: 'contains', suggestedAccount: '6100', confidence: 0.94, frequency: 'biweekly', description: 'BambooHR payroll', examples: ['BAMBOOHR'] },

    // Software & Tools
    { id: 'github', pattern: 'GITHUB', patternType: 'contains', suggestedAccount: '6200', confidence: 0.97, frequency: 'monthly', description: 'GitHub subscription', examples: ['GITHUB'] },
    { id: 'gitlab', pattern: 'GITLAB', patternType: 'contains', suggestedAccount: '6200', confidence: 0.96, frequency: 'monthly', description: 'GitLab subscription', examples: ['GITLAB'] },
    { id: 'jira', pattern: 'ATLASSIAN|JIRA', patternType: 'regex', suggestedAccount: '6200', confidence: 0.96, frequency: 'monthly', description: 'Atlassian/Jira', examples: ['ATLASSIAN', 'JIRA'] },
    { id: 'slack', pattern: 'SLACK', patternType: 'contains', suggestedAccount: '6200', confidence: 0.96, frequency: 'monthly', description: 'Slack subscription', examples: ['SLACK'] },
    { id: 'notion', pattern: 'NOTION', patternType: 'contains', suggestedAccount: '6200', confidence: 0.95, frequency: 'monthly', description: 'Notion subscription', examples: ['NOTION LABS'] },
    { id: 'figma', pattern: 'FIGMA', patternType: 'contains', suggestedAccount: '6200', confidence: 0.95, frequency: 'monthly', description: 'Figma subscription', examples: ['FIGMA'] },
    { id: 'linear', pattern: 'LINEAR', patternType: 'contains', suggestedAccount: '6200', confidence: 0.94, frequency: 'monthly', description: 'Linear subscription', examples: ['LINEAR'] },

    // Customer Support
    { id: 'zendesk', pattern: 'ZENDESK', patternType: 'contains', suggestedAccount: '5400', confidence: 0.97, frequency: 'monthly', description: 'Zendesk support', examples: ['ZENDESK'] },
    { id: 'intercom', pattern: 'INTERCOM', patternType: 'contains', suggestedAccount: '5400', confidence: 0.96, frequency: 'monthly', description: 'Intercom support', examples: ['INTERCOM'] },
    { id: 'freshdesk', pattern: 'FRESHDESK|FRESHWORKS', patternType: 'regex', suggestedAccount: '5400', confidence: 0.95, frequency: 'monthly', description: 'Freshdesk support', examples: ['FRESHDESK'] },

    // API Services
    { id: 'twilio', pattern: 'TWILIO', patternType: 'contains', suggestedAccount: '5200', confidence: 0.97, frequency: 'monthly', description: 'Twilio API', examples: ['TWILIO'] },
    { id: 'sendgrid', pattern: 'SENDGRID', patternType: 'contains', suggestedAccount: '5200', confidence: 0.96, frequency: 'monthly', description: 'SendGrid email API', examples: ['SENDGRID'] },
    { id: 'mailgun', pattern: 'MAILGUN', patternType: 'contains', suggestedAccount: '5200', confidence: 0.95, frequency: 'monthly', description: 'Mailgun email API', examples: ['MAILGUN'] },
    { id: 'auth0', pattern: 'AUTH0', patternType: 'contains', suggestedAccount: '5200', confidence: 0.95, frequency: 'monthly', description: 'Auth0 authentication', examples: ['AUTH0'] },
    { id: 'algolia', pattern: 'ALGOLIA', patternType: 'contains', suggestedAccount: '5200', confidence: 0.94, frequency: 'monthly', description: 'Algolia search API', examples: ['ALGOLIA'] },

    // Sales & CRM
    { id: 'salesforce', pattern: 'SALESFORCE', patternType: 'contains', suggestedAccount: '6400', confidence: 0.98, frequency: 'monthly', description: 'Salesforce CRM', examples: ['SALESFORCE'] },
    { id: 'hubspot', pattern: 'HUBSPOT', patternType: 'contains', suggestedAccount: '6400', confidence: 0.97, frequency: 'monthly', description: 'HubSpot CRM', examples: ['HUBSPOT'] },
    { id: 'pipedrive', pattern: 'PIPEDRIVE', patternType: 'contains', suggestedAccount: '6400', confidence: 0.95, frequency: 'monthly', description: 'Pipedrive CRM', examples: ['PIPEDRIVE'] },
    { id: 'zoho', pattern: 'ZOHO', patternType: 'contains', suggestedAccount: '6400', confidence: 0.94, frequency: 'monthly', description: 'Zoho CRM', examples: ['ZOHO'] },

    // Marketing & Advertising
    { id: 'google-ads', pattern: 'GOOGLE.*ADS|ADWORDS', patternType: 'regex', suggestedAccount: '6300', confidence: 0.97, frequency: 'monthly', description: 'Google Ads', examples: ['GOOGLE ADS'] },
    { id: 'facebook-ads', pattern: 'FACEBOOK.*ADS|META.*ADS', patternType: 'regex', suggestedAccount: '6300', confidence: 0.96, frequency: 'monthly', description: 'Facebook/Meta Ads', examples: ['FACEBOOK ADS'] },
    { id: 'linkedin-ads', pattern: 'LINKEDIN.*ADS', patternType: 'regex', suggestedAccount: '6300', confidence: 0.95, frequency: 'monthly', description: 'LinkedIn Ads', examples: ['LINKEDIN ADS'] },
    { id: 'mailchimp', pattern: 'MAILCHIMP', patternType: 'contains', suggestedAccount: '6300', confidence: 0.94, frequency: 'monthly', description: 'Mailchimp marketing', examples: ['MAILCHIMP'] },
    { id: 'segment', pattern: 'SEGMENT\.IO|SEGMENT', patternType: 'regex', suggestedAccount: '6200', confidence: 0.93, frequency: 'monthly', description: 'Segment analytics', examples: ['SEGMENT'] },

    // Analytics & Monitoring
    { id: 'datadog', pattern: 'DATADOG', patternType: 'contains', suggestedAccount: '5100', confidence: 0.96, frequency: 'monthly', description: 'Datadog monitoring', examples: ['DATADOG'] },
    { id: 'newrelic', pattern: 'NEW RELIC', patternType: 'contains', suggestedAccount: '5100', confidence: 0.95, frequency: 'monthly', description: 'New Relic monitoring', examples: ['NEW RELIC'] },
    { id: 'sentry', pattern: 'SENTRY', patternType: 'contains', suggestedAccount: '5100', confidence: 0.94, frequency: 'monthly', description: 'Sentry error tracking', examples: ['SENTRY'] },
    { id: 'mixpanel', pattern: 'MIXPANEL', patternType: 'contains', suggestedAccount: '6200', confidence: 0.93, frequency: 'monthly', description: 'Mixpanel analytics', examples: ['MIXPANEL'] },
    { id: 'amplitude', pattern: 'AMPLITUDE', patternType: 'contains', suggestedAccount: '6200', confidence: 0.92, frequency: 'monthly', description: 'Amplitude analytics', examples: ['AMPLITUDE'] },

    // Database & Data
    { id: 'mongodb', pattern: 'MONGODB', patternType: 'contains', suggestedAccount: '5100', confidence: 0.95, frequency: 'monthly', description: 'MongoDB database', examples: ['MONGODB ATLAS'] },
    { id: 'planetscale', pattern: 'PLANETSCALE', patternType: 'contains', suggestedAccount: '5100', confidence: 0.94, frequency: 'monthly', description: 'PlanetScale database', examples: ['PLANETSCALE'] },
    { id: 'supabase', pattern: 'SUPABASE', patternType: 'contains', suggestedAccount: '5100', confidence: 0.93, frequency: 'monthly', description: 'Supabase database', examples: ['SUPABASE'] },
    { id: 'snowflake', pattern: 'SNOWFLAKE', patternType: 'contains', suggestedAccount: '5100', confidence: 0.93, frequency: 'monthly', description: 'Snowflake data warehouse', examples: ['SNOWFLAKE COMPUTING'] },

    // Security & Compliance
    { id: 'okta', pattern: 'OKTA', patternType: 'contains', suggestedAccount: '6200', confidence: 0.95, frequency: 'monthly', description: 'Okta SSO', examples: ['OKTA'] },
    { id: 'cloudflare', pattern: 'CLOUDFLARE', patternType: 'contains', suggestedAccount: '5100', confidence: 0.94, frequency: 'monthly', description: 'Cloudflare CDN/security', examples: ['CLOUDFLARE'] },
    { id: 'vanta', pattern: 'VANTA', patternType: 'contains', suggestedAccount: '6200', confidence: 0.93, frequency: 'monthly', description: 'Vanta compliance', examples: ['VANTA'] },

    // Office & Operations
    { id: 'google-workspace', pattern: 'GOOGLE.*WORKSPACE|G SUITE', patternType: 'regex', suggestedAccount: '6200', confidence: 0.96, frequency: 'monthly', description: 'Google Workspace', examples: ['GOOGLE WORKSPACE'] },
    { id: 'microsoft-365', pattern: 'MICROSOFT 365|OFFICE 365', patternType: 'regex', suggestedAccount: '6200', confidence: 0.96, frequency: 'monthly', description: 'Microsoft 365', examples: ['MICROSOFT 365'] },
    { id: 'zoom', pattern: 'ZOOM\.US|ZOOM', patternType: 'regex', suggestedAccount: '6200', confidence: 0.94, frequency: 'monthly', description: 'Zoom video conferencing', examples: ['ZOOM.US'] },
    { id: 'docusign', pattern: 'DOCUSIGN', patternType: 'contains', suggestedAccount: '6200', confidence: 0.93, frequency: 'monthly', description: 'DocuSign e-signature', examples: ['DOCUSIGN'] }
  ],

  commonVendors: [
    // Cloud Infrastructure
    { vendorName: 'AWS', alternateNames: ['AMAZON WEB SERVICES', 'AMZN'], defaultAccount: '5100', vendorType: 'Infrastructure', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'GOOGLE CLOUD', alternateNames: ['GCP', 'GOOGLE CLOUD PLATFORM'], defaultAccount: '5100', vendorType: 'Infrastructure', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'MICROSOFT AZURE', alternateNames: ['AZURE', 'MSFT AZURE'], defaultAccount: '5100', vendorType: 'Infrastructure', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'HEROKU', alternateNames: ['HEROKU INC'], defaultAccount: '5100', vendorType: 'Infrastructure', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'DIGITALOCEAN', alternateNames: ['DIGITAL OCEAN'], defaultAccount: '5100', vendorType: 'Infrastructure', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'VERCEL', alternateNames: ['VERCEL INC'], defaultAccount: '5100', vendorType: 'Infrastructure', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'NETLIFY', defaultAccount: '5100', vendorType: 'Infrastructure', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'CLOUDFLARE', alternateNames: ['CLOUDFLARE INC'], defaultAccount: '5100', vendorType: 'Infrastructure', isRecurring: true, paymentFrequency: 'monthly' },

    // Payment Processing
    { vendorName: 'STRIPE', alternateNames: ['STRIPE INC', 'STRIPE PAYMENTS'], defaultAccount: '1020', vendorType: 'Payment Processor', isRecurring: true, paymentFrequency: 'daily' },
    { vendorName: 'PAYPAL', alternateNames: ['PAYPAL INC'], defaultAccount: '1020', vendorType: 'Payment Processor', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'SQUARE', alternateNames: ['SQUARE INC', 'BLOCK INC'], defaultAccount: '1020', vendorType: 'Payment Processor', isRecurring: true, paymentFrequency: 'daily' },

    // Payroll & HR
    { vendorName: 'GUSTO', alternateNames: ['GUSTO INC', 'ZEN PAYROLL'], defaultAccount: '6100', vendorType: 'Payroll', isRecurring: true, paymentFrequency: 'biweekly' },
    { vendorName: 'RIPPLING', defaultAccount: '6100', vendorType: 'Payroll', isRecurring: true, paymentFrequency: 'biweekly' },
    { vendorName: 'ADP', alternateNames: ['AUTOMATIC DATA PROCESSING'], defaultAccount: '6100', vendorType: 'Payroll', isRecurring: true, paymentFrequency: 'biweekly' },
    { vendorName: 'BAMBOOHR', alternateNames: ['BAMBOO HR'], defaultAccount: '6100', vendorType: 'HR Software', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'WORKDAY', defaultAccount: '6100', vendorType: 'HR Software', isRecurring: true, paymentFrequency: 'monthly' },

    // Software Development Tools
    { vendorName: 'GITHUB', alternateNames: ['GITHUB INC'], defaultAccount: '6200', vendorType: 'Development Tools', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'GITLAB', alternateNames: ['GITLAB INC'], defaultAccount: '6200', vendorType: 'Development Tools', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'ATLASSIAN', alternateNames: ['JIRA', 'CONFLUENCE', 'BITBUCKET'], defaultAccount: '6200', vendorType: 'Development Tools', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'LINEAR', alternateNames: ['LINEAR APP'], defaultAccount: '6200', vendorType: 'Development Tools', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'FIGMA', alternateNames: ['FIGMA INC'], defaultAccount: '6200', vendorType: 'Design Tools', isRecurring: true, paymentFrequency: 'monthly' },

    // Communication & Collaboration
    { vendorName: 'SLACK', alternateNames: ['SLACK TECHNOLOGIES'], defaultAccount: '6200', vendorType: 'Communication', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'NOTION', alternateNames: ['NOTION LABS'], defaultAccount: '6200', vendorType: 'Collaboration', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'ZOOM', alternateNames: ['ZOOM VIDEO', 'ZOOM.US'], defaultAccount: '6200', vendorType: 'Communication', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'GOOGLE WORKSPACE', alternateNames: ['G SUITE', 'GOOGLE APPS'], defaultAccount: '6200', vendorType: 'Productivity', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'MICROSOFT 365', alternateNames: ['OFFICE 365', 'O365'], defaultAccount: '6200', vendorType: 'Productivity', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'DOCUSIGN', alternateNames: ['DOCUSIGN INC'], defaultAccount: '6200', vendorType: 'E-Signature', isRecurring: true, paymentFrequency: 'monthly' },

    // Customer Support
    { vendorName: 'ZENDESK', alternateNames: ['ZENDESK INC'], defaultAccount: '5400', vendorType: 'Support', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'INTERCOM', alternateNames: ['INTERCOM INC'], defaultAccount: '5400', vendorType: 'Support', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'FRESHDESK', alternateNames: ['FRESHWORKS'], defaultAccount: '5400', vendorType: 'Support', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'HELPSCOUT', alternateNames: ['HELP SCOUT'], defaultAccount: '5400', vendorType: 'Support', isRecurring: true, paymentFrequency: 'monthly' },

    // API Services
    { vendorName: 'TWILIO', alternateNames: ['TWILIO INC'], defaultAccount: '5200', vendorType: 'API Service', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'SENDGRID', alternateNames: ['SEND GRID'], defaultAccount: '5200', vendorType: 'Email API', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'MAILGUN', alternateNames: ['MAILGUN TECHNOLOGIES'], defaultAccount: '5200', vendorType: 'Email API', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'AUTH0', alternateNames: ['AUTH ZERO'], defaultAccount: '5200', vendorType: 'Authentication', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'ALGOLIA', defaultAccount: '5200', vendorType: 'Search API', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'POSTMARK', alternateNames: ['POSTMARK APP'], defaultAccount: '5200', vendorType: 'Email API', isRecurring: true, paymentFrequency: 'monthly' },

    // Sales & CRM
    { vendorName: 'SALESFORCE', alternateNames: ['SALESFORCE.COM'], defaultAccount: '6400', vendorType: 'CRM', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'HUBSPOT', alternateNames: ['HUBSPOT INC'], defaultAccount: '6400', vendorType: 'CRM', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'PIPEDRIVE', defaultAccount: '6400', vendorType: 'CRM', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'ZOHO', alternateNames: ['ZOHO CORPORATION'], defaultAccount: '6400', vendorType: 'CRM', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'CLOSE', alternateNames: ['CLOSE.IO', 'CLOSE CRM'], defaultAccount: '6400', vendorType: 'CRM', isRecurring: true, paymentFrequency: 'monthly' },

    // Marketing & Advertising
    { vendorName: 'GOOGLE ADS', alternateNames: ['GOOGLE ADWORDS', 'GOOGLE ADVERTISING'], defaultAccount: '6300', vendorType: 'Advertising', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'FACEBOOK', alternateNames: ['META', 'FACEBOOK ADS', 'META ADS'], defaultAccount: '6300', vendorType: 'Advertising', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'LINKEDIN', alternateNames: ['LINKEDIN ADS', 'LINKEDIN ADVERTISING'], defaultAccount: '6300', vendorType: 'Advertising', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'MAILCHIMP', alternateNames: ['MAILCHIMP & CO'], defaultAccount: '6300', vendorType: 'Email Marketing', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'ACTIVECAMPAIGN', alternateNames: ['ACTIVE CAMPAIGN'], defaultAccount: '6300', vendorType: 'Marketing Automation', isRecurring: true, paymentFrequency: 'monthly' },

    // Analytics & Monitoring
    { vendorName: 'DATADOG', alternateNames: ['DATADOG INC'], defaultAccount: '5100', vendorType: 'Monitoring', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'NEW RELIC', alternateNames: ['NEWRELIC'], defaultAccount: '5100', vendorType: 'Monitoring', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'SENTRY', alternateNames: ['SENTRY.IO'], defaultAccount: '5100', vendorType: 'Error Tracking', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'MIXPANEL', defaultAccount: '6200', vendorType: 'Analytics', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'AMPLITUDE', alternateNames: ['AMPLITUDE INC'], defaultAccount: '6200', vendorType: 'Analytics', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'SEGMENT', alternateNames: ['SEGMENT.IO', 'SEGMENT.COM'], defaultAccount: '6200', vendorType: 'Analytics', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'LOGROCKET', alternateNames: ['LOG ROCKET'], defaultAccount: '6200', vendorType: 'Session Replay', isRecurring: true, paymentFrequency: 'monthly' },

    // Database & Data
    { vendorName: 'MONGODB', alternateNames: ['MONGODB ATLAS', 'MONGO DB'], defaultAccount: '5100', vendorType: 'Database', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'PLANETSCALE', alternateNames: ['PLANET SCALE'], defaultAccount: '5100', vendorType: 'Database', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'SUPABASE', defaultAccount: '5100', vendorType: 'Database', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'SNOWFLAKE', alternateNames: ['SNOWFLAKE COMPUTING'], defaultAccount: '5100', vendorType: 'Data Warehouse', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'DATABRICKS', defaultAccount: '5100', vendorType: 'Data Platform', isRecurring: true, paymentFrequency: 'monthly' },

    // Security & Compliance
    { vendorName: 'OKTA', alternateNames: ['OKTA INC'], defaultAccount: '6200', vendorType: 'SSO/Identity', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'VANTA', defaultAccount: '6200', vendorType: 'Compliance', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'DRATA', defaultAccount: '6200', vendorType: 'Compliance', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: '1PASSWORD', alternateNames: ['ONE PASSWORD'], defaultAccount: '6200', vendorType: 'Password Management', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'LASTPASS', alternateNames: ['LAST PASS'], defaultAccount: '6200', vendorType: 'Password Management', isRecurring: true, paymentFrequency: 'monthly' }
  ],

  kpis: [
    {
      name: 'Monthly Recurring Revenue (MRR)',
      formula: 'Sum of all monthly subscription revenue',
      accounts: ['4100'],
      benchmarkRange: { min: 10000, max: 1000000 },
      importance: 'critical'
    },
    {
      name: 'Customer Acquisition Cost (CAC)',
      formula: '(Sales + Marketing Expenses) / New Customers',
      accounts: ['6110', '6120', '6300'],
      benchmarkRange: { min: 100, max: 5000 },
      importance: 'critical'
    },
    {
      name: 'Gross Margin',
      formula: '((Revenue - Cost of Revenue) / Revenue) * 100',
      accounts: ['4000', '5000'],
      benchmarkRange: { min: 70, max: 90 },
      importance: 'critical'
    },
    {
      name: 'Burn Rate',
      formula: 'Total Monthly Expenses - Total Monthly Revenue',
      accounts: ['4000', '5000', '6000'],
      importance: 'critical'
    }
  ],

  reportingRequirements: [
    'MRR Report',
    'Churn Analysis',
    'CAC/LTV Report',
    'Cash Flow Forecast',
    'Investor Dashboard'
  ],

  regulatoryCompliance: [
    'Sales Tax Nexus',
    'R&D Tax Credits',
    'Stock Option Reporting (409A)',
    'Data Privacy Compliance'
  ]
};

/**
 * Professional Services Template (Consulting, Legal, Accounting)
 */
export const PROFESSIONAL_SERVICES_TEMPLATE: IndustryTemplate = {
  id: 'professional-services',
  name: 'Professional Services',
  description: 'Consulting firms, law firms, accounting firms, and other professional services',
  category: 'service',
  typicalRevenueSources: ['Client Fees', 'Retainers', 'Project Revenue', 'Hourly Billing'],
  typicalExpenseCategories: ['Professional Salaries', 'Office Rent', 'Professional Insurance', 'Continuing Education'],

  chartOfAccounts: [
    // Abbreviated for space - would include full COA
    {
      code: '4000',
      name: 'Revenue',
      type: 'revenue',
      isRequired: true,
      isCommon: true,
      normalBalance: 'credit',
      children: [
        { code: '4100', name: 'Professional Fees - Hourly', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['CLIENT PAYMENT', 'INVOICE', 'FEES'] },
        { code: '4200', name: 'Professional Fees - Fixed', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['PROJECT', 'RETAINER'] },
        { code: '4300', name: 'Reimbursable Expenses', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['REIMBURSEMENT', 'EXPENSE RECOVERY'] },
      ]
    }
  ],

  transactionPatterns: [
    {
      id: 'client-payment',
      pattern: 'CLIENT.*PAYMENT|INVOICE.*PAID|WIRE.*FROM',
      patternType: 'regex',
      suggestedAccount: '4100',
      confidence: 0.92,
      frequency: 'monthly',
      description: 'Client payments',
      examples: ['CLIENT ABC PAYMENT', 'INVOICE 1234 PAID'],
      averageAmount: { min: 5000, max: 100000 }
    }
  ],

  commonVendors: [],
  kpis: [],
  reportingRequirements: ['Billable Hours Report', 'WIP Report', 'Client Profitability'],
  regulatoryCompliance: ['Professional Liability Insurance', 'Trust Account Compliance']
};

// Import extended templates
import { EXTENDED_INDUSTRY_TEMPLATES } from './industry-templates-extended';

/**
 * Industry template registry
 */
// Import comprehensive generated templates
import { GENERATED_INDUSTRY_TEMPLATES } from './industry-templates-generated';

/**
 * All industry templates (now using comprehensive generated templates)
 * This replaces the old manually maintained templates with auto-generated ones from JSON
 */
export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  ...GENERATED_INDUSTRY_TEMPLATES
};

/**
 * Get recommended COA for an industry
 */
export function getIndustryCOA(industryId: string): COATemplate[] {
  const template = INDUSTRY_TEMPLATES[industryId];
  if (!template) {
    throw new Error(`Industry template not found: ${industryId}`);
  }
  return template.chartOfAccounts;
}

/**
 * Get transaction patterns for an industry
 */
export function getIndustryPatterns(industryId: string): TransactionPattern[] {
  const template = INDUSTRY_TEMPLATES[industryId];
  if (!template) {
    throw new Error(`Industry template not found: ${industryId}`);
  }
  return template.transactionPatterns;
}

/**
 * Find best matching industry for a company based on description
 */
export function suggestIndustry(companyDescription: string): string | null {
  const keywords: Record<string, string[]> = {
    'restaurant': ['restaurant', 'food', 'dining', 'cafe', 'bar', 'catering', 'kitchen'],
    'saas': ['software', 'saas', 'cloud', 'app', 'platform', 'subscription', 'api'],
    'professional-services': ['consulting', 'legal', 'accounting', 'advisory', 'professional', 'firm'],
  };

  const description = companyDescription.toLowerCase();
  let bestMatch: { industry: string; score: number } | null = null;

  for (const [industry, industryKeywords] of Object.entries(keywords)) {
    const score = industryKeywords.filter(keyword => description.includes(keyword)).length;
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { industry, score };
    }
  }

  return bestMatch?.industry || null;
}

/**
 * Generate smart GL suggestions based on transaction and industry
 */
export function generateSmartSuggestions(
  transaction: { description: string; amount: number; type: 'debit' | 'credit' },
  industryId: string
): { account: string; confidence: number; reason: string }[] {
  const template = INDUSTRY_TEMPLATES[industryId];
  if (!template) {
    return [];
  }

  const suggestions: { account: string; confidence: number; reason: string }[] = [];
  const description = transaction.description.toUpperCase();

  // Check transaction patterns
  for (const pattern of template.transactionPatterns) {
    const regex = new RegExp(pattern.pattern, 'i');
    if (regex.test(description)) {
      // Check if amount is within expected range
      let confidence = pattern.confidence;
      if (pattern.averageAmount) {
        const { min, max } = pattern.averageAmount;
        if (transaction.amount >= min && transaction.amount <= max) {
          confidence = Math.min(confidence + 0.05, 1.0);
        } else {
          confidence = Math.max(confidence - 0.1, 0.5);
        }
      }

      suggestions.push({
        account: pattern.suggestedAccount,
        confidence,
        reason: pattern.description
      });
    }
  }

  // Check vendor mappings
  for (const vendor of template.commonVendors) {
    const vendorPatterns = [vendor.vendorName, ...(vendor.alternateNames || [])];
    for (const vendorPattern of vendorPatterns) {
      if (description.includes(vendorPattern.toUpperCase())) {
        suggestions.push({
          account: vendor.defaultAccount,
          confidence: 0.95,
          reason: `Known vendor: ${vendor.vendorName}`
        });
        break;
      }
    }
  }

  // Sort by confidence
  suggestions.sort((a, b) => b.confidence - a.confidence);

  // Return top 3 suggestions
  return suggestions.slice(0, 3);
}