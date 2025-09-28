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
    {
      id: 'stripe-deposit',
      pattern: 'STRIPE.*TRANSFER|STRIPE.*PAYOUT',
      patternType: 'regex',
      suggestedAccount: '4100',
      confidence: 0.95,
      frequency: 'daily',
      description: 'Stripe payment settlements',
      examples: ['STRIPE TRANSFER', 'STRIPE PAYOUT'],
      averageAmount: { min: 1000, max: 50000 }
    },
    {
      id: 'aws-charges',
      pattern: 'AWS|AMAZON WEB SERVICES',
      patternType: 'regex',
      suggestedAccount: '5100',
      confidence: 0.98,
      frequency: 'monthly',
      description: 'Cloud infrastructure costs',
      examples: ['AWS CHARGES', 'AMAZON WEB SERVICES'],
      averageAmount: { min: 500, max: 10000 }
    },
    {
      id: 'payroll-tech',
      pattern: 'GUSTO|RIPPLING|ADP.*PAYROLL',
      patternType: 'regex',
      suggestedAccount: '6100',
      confidence: 0.96,
      frequency: 'biweekly',
      description: 'Payroll processing',
      examples: ['GUSTO PAYROLL', 'RIPPLING PAYROLL'],
      averageAmount: { min: 10000, max: 200000 }
    }
  ],

  commonVendors: [
    { vendorName: 'AWS', alternateNames: ['AMAZON WEB SERVICES'], defaultAccount: '5100', vendorType: 'Infrastructure', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'GOOGLE CLOUD', alternateNames: ['GCP', 'GOOGLE CLOUD PLATFORM'], defaultAccount: '5100', vendorType: 'Infrastructure', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'STRIPE', alternateNames: ['STRIPE INC'], defaultAccount: '1020', vendorType: 'Payment Processor', isRecurring: true, paymentFrequency: 'daily' },
    { vendorName: 'SALESFORCE', defaultAccount: '6400', vendorType: 'CRM', isRecurring: true, paymentFrequency: 'monthly' },
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
export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  'restaurant': RESTAURANT_TEMPLATE,
  'saas': SAAS_TEMPLATE,
  'professional-services': PROFESSIONAL_SERVICES_TEMPLATE,
  // Extended templates
  ...EXTENDED_INDUSTRY_TEMPLATES
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