/**
 * Extended Industry Templates
 * Additional industry-specific accounting templates
 */

import { IndustryTemplate, COATemplate, TransactionPattern, VendorMapping } from './industry-knowledge-base';

/**
 * Cleaning Services Template (Janitorial, Commercial, Residential)
 */
export const CLEANING_SERVICES_TEMPLATE: IndustryTemplate = {
  id: 'cleaning-services',
  name: 'Cleaning & Janitorial Services',
  description: 'Commercial cleaning, residential cleaning, and janitorial services',
  category: 'service',
  typicalRevenueSources: ['Contract Cleaning', 'One-time Services', 'Special Projects', 'Supply Sales'],
  typicalExpenseCategories: ['Labor', 'Cleaning Supplies', 'Equipment', 'Vehicle Costs', 'Insurance'],

  chartOfAccounts: [
    // Assets (1000-1999)
    {
      code: '1000',
      name: 'Current Assets',
      type: 'asset',
      subType: 'current',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '1010', name: 'Operating Bank Account', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['BANK', 'CHECKING'] },
        { code: '1020', name: 'Petty Cash', type: 'asset', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CASH', 'PETTY'] },
        { code: '1100', name: 'Accounts Receivable', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RECEIVABLE', 'INVOICE'] },
        { code: '1110', name: 'Contract Receivables', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CONTRACT', 'MONTHLY'] },
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
      children: [
        { code: '1310', name: 'Cleaning Supplies Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SUPPLIES', 'CHEMICAL', 'PRODUCT'] },
        { code: '1320', name: 'Equipment Parts Inventory', type: 'asset', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['PARTS', 'EQUIPMENT'] },
        { code: '1330', name: 'Uniforms Inventory', type: 'asset', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['UNIFORM', 'CLOTHING'] },
      ]
    },
    {
      code: '1500',
      name: 'Fixed Assets',
      type: 'asset',
      subType: 'fixed',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '1510', name: 'Cleaning Equipment', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['EQUIPMENT', 'VACUUM', 'FLOOR', 'MACHINE'] },
        { code: '1520', name: 'Vehicles', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['VEHICLE', 'VAN', 'TRUCK'] },
        { code: '1530', name: 'Office Equipment', type: 'asset', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['COMPUTER', 'OFFICE'] },
        { code: '1580', name: 'Accumulated Depreciation', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'credit' },
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
      children: [
        { code: '4100', name: 'Commercial Cleaning Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['COMMERCIAL', 'OFFICE', 'CONTRACT'] },
        { code: '4200', name: 'Residential Cleaning Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['RESIDENTIAL', 'HOME', 'HOUSE'] },
        { code: '4300', name: 'Special Project Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['PROJECT', 'SPECIAL', 'DEEP CLEAN'] },
        { code: '4400', name: 'Supply Sales Revenue', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['SUPPLY SALE', 'PRODUCT SALE'] },
        { code: '4500', name: 'Emergency Service Revenue', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['EMERGENCY', 'AFTER HOURS'] },
      ]
    },

    // Direct Costs (5000-5999)
    {
      code: '5000',
      name: 'Direct Costs',
      type: 'expense',
      subType: 'cogs',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '5100', name: 'Direct Labor Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', typicalTransactionVolume: 'high', mappingKeywords: ['CLEANER', 'JANITOR', 'LABOR'] },
        { code: '5200', name: 'Cleaning Supplies Used', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CHEMICAL', 'SUPPLIES', 'CLEANING PRODUCT'] },
        { code: '5300', name: 'Equipment Rental', type: 'expense', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RENTAL', 'EQUIPMENT LEASE'] },
        { code: '5400', name: 'Subcontractor Costs', type: 'expense', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SUBCONTRACTOR', 'CONTRACT LABOR'] },
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
        { code: '6100', name: 'Administrative Salaries', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SALARY', 'ADMIN', 'OFFICE'] },
        { code: '6200', name: 'Vehicle Expenses', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['FUEL', 'GAS', 'VEHICLE', 'MILEAGE'] },
        { code: '6210', name: 'Vehicle Insurance', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['AUTO INSURANCE', 'VEHICLE INS'] },
        { code: '6220', name: 'Vehicle Maintenance', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['OIL CHANGE', 'TIRE', 'REPAIR'] },
        { code: '6300', name: 'Insurance', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['LIABILITY', 'BOND', 'INSURANCE'] },
        { code: '6400', name: 'Uniforms & Safety Gear', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['UNIFORM', 'SAFETY', 'PPE'] },
        { code: '6500', name: 'Equipment Maintenance', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['MAINTENANCE', 'REPAIR', 'SERVICE'] },
        { code: '6600', name: 'Marketing & Advertising', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['MARKETING', 'ADVERTISING', 'PROMOTION'] },
        { code: '6700', name: 'Office Rent', type: 'expense', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RENT', 'LEASE', 'OFFICE'] },
        { code: '6800', name: 'Professional Fees', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['ACCOUNTING', 'LEGAL', 'PROFESSIONAL'] },
      ]
    }
  ],

  transactionPatterns: [
    {
      id: 'cleaning-supplies',
      pattern: 'JANITORIAL|CLEANING SUPPLY|CHEMICAL|HD SUPPLY|GRAINGER',
      patternType: 'regex',
      suggestedAccount: '5200',
      confidence: 0.95,
      frequency: 'weekly',
      description: 'Cleaning supply purchases',
      examples: ['HD SUPPLY', 'GRAINGER', 'CLEANING CHEMICAL CO'],
      averageAmount: { min: 100, max: 2000 }
    },
    {
      id: 'client-payment',
      pattern: 'CLEANING SERVICE|CONTRACT PAYMENT|INVOICE.*PAID',
      patternType: 'regex',
      suggestedAccount: '4100',
      confidence: 0.90,
      frequency: 'monthly',
      description: 'Client payments for services',
      examples: ['ABC CORP CLEANING', 'MONTHLY CONTRACT PAYMENT'],
      averageAmount: { min: 500, max: 10000 }
    },
    {
      id: 'fuel-expense',
      pattern: 'SHELL|CHEVRON|EXXON|GAS STATION|FUEL',
      patternType: 'regex',
      suggestedAccount: '6200',
      confidence: 0.93,
      frequency: 'weekly',
      description: 'Vehicle fuel expenses',
      examples: ['SHELL STATION', 'CHEVRON FUEL'],
      averageAmount: { min: 30, max: 150 }
    }
  ],

  commonVendors: [
    { vendorName: 'HD SUPPLY', defaultAccount: '5200', vendorType: 'Supplier', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'GRAINGER', defaultAccount: '5200', vendorType: 'Supplier', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'CINTAS', alternateNames: ['CINTAS UNIFORM'], defaultAccount: '6400', vendorType: 'Uniform Service', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'ADP', alternateNames: ['ADP PAYROLL'], defaultAccount: '5100', vendorType: 'Payroll', isRecurring: true, paymentFrequency: 'biweekly' },
  ],

  kpis: [
    {
      name: 'Gross Margin',
      formula: '((Revenue - Direct Costs) / Revenue) * 100',
      accounts: ['4000', '5000'],
      benchmarkRange: { min: 25, max: 40 },
      importance: 'critical'
    },
    {
      name: 'Labor Cost Percentage',
      formula: '(Direct Labor / Revenue) * 100',
      accounts: ['5100', '4000'],
      benchmarkRange: { min: 45, max: 60 },
      importance: 'critical'
    },
    {
      name: 'Supply Cost Percentage',
      formula: '(Supplies Used / Revenue) * 100',
      accounts: ['5200', '4000'],
      benchmarkRange: { min: 5, max: 15 },
      importance: 'important'
    }
  ],

  reportingRequirements: [
    'Job Costing Report',
    'Employee Productivity Report',
    'Supply Usage Report',
    'Vehicle Mileage Log',
    'Customer Profitability'
  ],

  regulatoryCompliance: [
    'Workers Compensation',
    'General Liability Insurance',
    'Bonding Requirements',
    'OSHA Compliance'
  ]
};

/**
 * Financial Services Template (Accounting, Bookkeeping, Tax)
 */
export const FINANCIAL_SERVICES_TEMPLATE: IndustryTemplate = {
  id: 'financial-services',
  name: 'Financial & Accounting Services',
  description: 'Accounting firms, bookkeeping services, tax preparation, and financial advisory',
  category: 'service',
  typicalRevenueSources: ['Monthly Retainers', 'Project Fees', 'Tax Preparation', 'Consulting', 'Audit Services'],
  typicalExpenseCategories: ['Professional Salaries', 'Software Licenses', 'Continuing Education', 'Professional Insurance'],

  chartOfAccounts: [
    // Assets
    {
      code: '1000',
      name: 'Current Assets',
      type: 'asset',
      subType: 'current',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '1010', name: 'Operating Account', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['BANK', 'CHECKING'] },
        { code: '1020', name: 'Trust Account', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['TRUST', 'CLIENT FUNDS'] },
        { code: '1030', name: 'Money Market Account', type: 'asset', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['MONEY MARKET', 'SAVINGS'] },
        { code: '1100', name: 'Accounts Receivable', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RECEIVABLE'] },
        { code: '1110', name: 'Retainer Receivables', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RETAINER'] },
        { code: '1200', name: 'Work in Progress', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['WIP'] },
      ]
    },

    // Liabilities
    {
      code: '2000',
      name: 'Current Liabilities',
      type: 'liability',
      subType: 'current',
      isRequired: true,
      isCommon: true,
      normalBalance: 'credit',
      children: [
        { code: '2100', name: 'Client Trust Liabilities', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['TRUST LIABILITY'] },
        { code: '2200', name: 'Unearned Revenue', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['UNEARNED', 'PREPAID'] },
        { code: '2210', name: 'Unearned Retainers', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['RETAINER'] },
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
        { code: '4100', name: 'Accounting Services', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['ACCOUNTING', 'BOOKKEEPING'] },
        { code: '4200', name: 'Tax Preparation', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['TAX PREP', 'TAX RETURN'] },
        { code: '4300', name: 'Audit & Assurance', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['AUDIT', 'REVIEW', 'COMPILATION'] },
        { code: '4400', name: 'Consulting Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['CONSULTING', 'ADVISORY'] },
        { code: '4500', name: 'Payroll Services', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['PAYROLL SERVICE'] },
      ]
    },

    // Operating Expenses
    {
      code: '6000',
      name: 'Operating Expenses',
      type: 'expense',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '6100', name: 'Professional Salaries', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SALARY', 'PAYROLL'] },
        { code: '6110', name: 'Partner Draws', type: 'expense', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['PARTNER DRAW'] },
        { code: '6200', name: 'Software Subscriptions', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['QUICKBOOKS', 'SOFTWARE', 'SUBSCRIPTION'] },
        { code: '6300', name: 'Continuing Education', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CPE', 'EDUCATION', 'TRAINING'] },
        { code: '6400', name: 'Professional Insurance', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['E&O', 'LIABILITY', 'MALPRACTICE'] },
        { code: '6500', name: 'Professional Memberships', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['AICPA', 'CPA', 'MEMBERSHIP'] },
        { code: '6600', name: 'Office Rent', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RENT', 'LEASE'] },
      ]
    }
  ],

  transactionPatterns: [
    {
      id: 'client-retainer',
      pattern: 'RETAINER|ADVANCE PAYMENT|CLIENT DEPOSIT',
      patternType: 'regex',
      suggestedAccount: '2210',
      confidence: 0.92,
      frequency: 'monthly',
      description: 'Client retainer deposits',
      examples: ['CLIENT RETAINER', 'ADVANCE PAYMENT'],
      averageAmount: { min: 1000, max: 10000 }
    },
    {
      id: 'software-subscription',
      pattern: 'QUICKBOOKS|XERO|THOMSON REUTERS|CCH|INTUIT',
      patternType: 'regex',
      suggestedAccount: '6200',
      confidence: 0.95,
      frequency: 'monthly',
      description: 'Accounting software subscriptions',
      examples: ['QUICKBOOKS ONLINE', 'CCH PROSYSTEM'],
      averageAmount: { min: 50, max: 500 }
    }
  ],

  commonVendors: [
    { vendorName: 'QUICKBOOKS', alternateNames: ['INTUIT'], defaultAccount: '6200', vendorType: 'Software', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'THOMSON REUTERS', defaultAccount: '6200', vendorType: 'Software', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'AICPA', defaultAccount: '6500', vendorType: 'Professional Org', isRecurring: true, paymentFrequency: 'yearly' },
  ],

  kpis: [
    {
      name: 'Realization Rate',
      formula: '(Collected Revenue / Billable Hours * Standard Rate) * 100',
      accounts: ['4000'],
      benchmarkRange: { min: 85, max: 95 },
      importance: 'critical'
    },
    {
      name: 'Average Revenue per Client',
      formula: 'Total Revenue / Number of Clients',
      accounts: ['4000'],
      benchmarkRange: { min: 5000, max: 25000 },
      importance: 'important'
    }
  ],

  reportingRequirements: [
    'Time & Billing Report',
    'WIP Report',
    'Client Profitability',
    'Realization Report',
    'Trust Account Reconciliation'
  ],

  regulatoryCompliance: [
    'Professional Liability Insurance',
    'Trust Account Compliance',
    'CPE Requirements',
    'Peer Review'
  ]
};

/**
 * Consulting Services Template
 */
export const CONSULTING_TEMPLATE: IndustryTemplate = {
  id: 'consulting',
  name: 'Management & Business Consulting',
  description: 'Management consulting, business advisory, strategy consulting',
  category: 'service',
  typicalRevenueSources: ['Project Fees', 'Hourly Billing', 'Retainers', 'Success Fees'],
  typicalExpenseCategories: ['Consultant Salaries', 'Travel', 'Research', 'Marketing'],

  chartOfAccounts: [
    // Revenue
    {
      code: '4000',
      name: 'Revenue',
      type: 'revenue',
      isRequired: true,
      isCommon: true,
      normalBalance: 'credit',
      children: [
        { code: '4100', name: 'Consulting Fees - Hourly', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['HOURLY', 'TIME'] },
        { code: '4200', name: 'Consulting Fees - Project', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['PROJECT', 'FIXED'] },
        { code: '4300', name: 'Retainer Fees', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['RETAINER'] },
        { code: '4400', name: 'Success Fees', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['SUCCESS', 'PERFORMANCE'] },
        { code: '4500', name: 'Training & Workshop Revenue', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['TRAINING', 'WORKSHOP'] },
      ]
    },

    // Expenses
    {
      code: '6000',
      name: 'Operating Expenses',
      type: 'expense',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '6100', name: 'Consultant Salaries', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SALARY', 'PAYROLL'] },
        { code: '6200', name: 'Contractor Fees', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CONTRACTOR', 'FREELANCE', '1099'] },
        { code: '6300', name: 'Travel & Entertainment', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['TRAVEL', 'FLIGHT', 'HOTEL', 'UBER'] },
        { code: '6310', name: 'Client Entertainment', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['DINNER', 'LUNCH', 'ENTERTAINMENT'] },
        { code: '6400', name: 'Research & Data', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RESEARCH', 'DATA', 'REPORT'] },
        { code: '6500', name: 'Professional Development', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['TRAINING', 'CONFERENCE', 'CERTIFICATION'] },
      ]
    }
  ],

  transactionPatterns: [
    {
      id: 'client-payment-consulting',
      pattern: 'WIRE TRANSFER|ACH CREDIT|CLIENT.*PAYMENT|INVOICE',
      patternType: 'regex',
      suggestedAccount: '4100',
      confidence: 0.90,
      frequency: 'monthly',
      description: 'Client payments',
      examples: ['WIRE FROM CLIENT ABC', 'INVOICE 2024-001 PAYMENT'],
      averageAmount: { min: 10000, max: 100000 }
    },
    {
      id: 'travel-expense',
      pattern: 'AIRLINE|HOTEL|UBER|LYFT|TAXI|RENTAL CAR',
      patternType: 'regex',
      suggestedAccount: '6300',
      confidence: 0.95,
      frequency: 'weekly',
      description: 'Travel expenses',
      examples: ['UNITED AIRLINES', 'MARRIOTT HOTEL', 'UBER TRIP'],
      averageAmount: { min: 50, max: 2000 }
    }
  ],

  commonVendors: [
    { vendorName: 'UNITED AIRLINES', alternateNames: ['UNITED'], defaultAccount: '6300', vendorType: 'Travel', isRecurring: false },
    { vendorName: 'MARRIOTT', alternateNames: ['MARRIOTT HOTEL'], defaultAccount: '6300', vendorType: 'Travel', isRecurring: false },
    { vendorName: 'UBER', alternateNames: ['UBER TRIP'], defaultAccount: '6300', vendorType: 'Transportation', isRecurring: true, paymentFrequency: 'weekly' },
  ],

  kpis: [
    {
      name: 'Utilization Rate',
      formula: '(Billable Hours / Total Available Hours) * 100',
      accounts: [],
      benchmarkRange: { min: 70, max: 85 },
      importance: 'critical'
    },
    {
      name: 'Average Project Value',
      formula: 'Total Project Revenue / Number of Projects',
      accounts: ['4200'],
      benchmarkRange: { min: 25000, max: 250000 },
      importance: 'important'
    }
  ],

  reportingRequirements: [
    'Utilization Report',
    'Project Profitability',
    'Pipeline Report',
    'Time Tracking Report'
  ],

  regulatoryCompliance: [
    'Professional Liability',
    'NDA Compliance',
    'Conflict of Interest'
  ]
};

/**
 * Pest Control Services Template
 */
export const PEST_CONTROL_TEMPLATE: IndustryTemplate = {
  id: 'pest-control',
  name: 'Pest Control Services',
  description: 'Pest control, extermination, and prevention services',
  category: 'service',
  typicalRevenueSources: ['Residential Services', 'Commercial Contracts', 'One-time Treatments', 'Quarterly Service'],
  typicalExpenseCategories: ['Chemicals', 'Equipment', 'Vehicle Costs', 'Licensing', 'Insurance'],

  chartOfAccounts: [
    // Assets
    {
      code: '1300',
      name: 'Inventory',
      type: 'asset',
      subType: 'current',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '1310', name: 'Chemical Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CHEMICAL', 'PESTICIDE', 'INSECTICIDE'] },
        { code: '1320', name: 'Bait & Trap Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['BAIT', 'TRAP'] },
        { code: '1330', name: 'Safety Equipment Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SAFETY', 'PPE', 'PROTECTIVE'] },
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
        { code: '4100', name: 'Residential Service Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['RESIDENTIAL', 'HOME'] },
        { code: '4200', name: 'Commercial Service Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['COMMERCIAL', 'BUSINESS'] },
        { code: '4300', name: 'Termite Treatment Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['TERMITE'] },
        { code: '4400', name: 'Wildlife Control Revenue', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['WILDLIFE', 'ANIMAL'] },
      ]
    },

    // Direct Costs
    {
      code: '5000',
      name: 'Direct Service Costs',
      type: 'expense',
      subType: 'cogs',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '5100', name: 'Chemical Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CHEMICAL', 'PESTICIDE'] },
        { code: '5200', name: 'Technician Labor', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['TECHNICIAN', 'LABOR'] },
        { code: '5300', name: 'Equipment Supplies', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SPRAYER', 'EQUIPMENT'] },
      ]
    },

    // Operating Expenses
    {
      code: '6000',
      name: 'Operating Expenses',
      type: 'expense',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '6100', name: 'Licensing & Permits', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['LICENSE', 'PERMIT', 'CERTIFICATION'] },
        { code: '6200', name: 'Vehicle Expenses', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['FUEL', 'VEHICLE', 'TRUCK'] },
        { code: '6300', name: 'Insurance', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['INSURANCE', 'LIABILITY'] },
        { code: '6400', name: 'Advertising', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['ADVERTISING', 'MARKETING', 'GOOGLE ADS'] },
      ]
    }
  ],

  transactionPatterns: [
    {
      id: 'chemical-supplier',
      pattern: 'UNIVAR|TARGET SPECIALTY|PEST.*SUPPLY',
      patternType: 'regex',
      suggestedAccount: '5100',
      confidence: 0.95,
      frequency: 'weekly',
      description: 'Chemical supplier purchases',
      examples: ['UNIVAR SOLUTIONS', 'TARGET SPECIALTY PRODUCTS'],
      averageAmount: { min: 500, max: 5000 }
    },
    {
      id: 'service-payment',
      pattern: 'PEST CONTROL|SERVICE PAYMENT|QUARTERLY SERVICE',
      patternType: 'regex',
      suggestedAccount: '4100',
      confidence: 0.90,
      frequency: 'monthly',
      description: 'Customer service payments',
      examples: ['MONTHLY PEST SERVICE', 'QUARTERLY PAYMENT'],
      averageAmount: { min: 50, max: 500 }
    }
  ],

  commonVendors: [
    { vendorName: 'UNIVAR', alternateNames: ['UNIVAR SOLUTIONS'], defaultAccount: '5100', vendorType: 'Chemical Supplier', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'TARGET SPECIALTY', defaultAccount: '5100', vendorType: 'Chemical Supplier', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'PEST CONTROL TECHNOLOGY', defaultAccount: '6400', vendorType: 'Trade Publication', isRecurring: true, paymentFrequency: 'yearly' },
  ],

  kpis: [
    {
      name: 'Revenue per Technician',
      formula: 'Total Revenue / Number of Technicians',
      accounts: ['4000'],
      benchmarkRange: { min: 150000, max: 250000 },
      importance: 'critical'
    },
    {
      name: 'Chemical Cost Ratio',
      formula: '(Chemical Costs / Revenue) * 100',
      accounts: ['5100', '4000'],
      benchmarkRange: { min: 8, max: 15 },
      importance: 'important'
    }
  ],

  reportingRequirements: [
    'Route Efficiency Report',
    'Chemical Usage Report',
    'Service Completion Report',
    'Customer Retention Report'
  ],

  regulatoryCompliance: [
    'Pesticide Applicator License',
    'EPA Compliance',
    'State Licensing',
    'Chemical Storage Requirements'
  ]
};

/**
 * Retail Store Template
 */
export const RETAIL_TEMPLATE: IndustryTemplate = {
  id: 'retail',
  name: 'Retail Store Operations',
  description: 'Retail stores, boutiques, and physical product sales',
  category: 'retail',
  typicalRevenueSources: ['In-store Sales', 'Online Sales', 'Gift Cards', 'Layaway'],
  typicalExpenseCategories: ['Cost of Goods', 'Store Rent', 'Employee Wages', 'Marketing', 'Utilities'],

  chartOfAccounts: [
    // Assets
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
        { code: '1310', name: 'Merchandise Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['INVENTORY', 'MERCHANDISE', 'PRODUCT'] },
        { code: '1320', name: 'Consignment Inventory', type: 'asset', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CONSIGNMENT'] },
        { code: '1330', name: 'Supplies Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SUPPLIES', 'BAGS', 'PACKAGING'] },
      ]
    },
    {
      code: '1500',
      name: 'Fixed Assets',
      type: 'asset',
      subType: 'fixed',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '1510', name: 'Store Fixtures', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['FIXTURE', 'DISPLAY', 'SHELVING'] },
        { code: '1520', name: 'POS Equipment', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['POS', 'REGISTER', 'SCANNER'] },
        { code: '1530', name: 'Security Equipment', type: 'asset', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SECURITY', 'CAMERA', 'ALARM'] },
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
      typicalTransactionVolume: 'high',
      children: [
        { code: '4100', name: 'Retail Sales', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['SALES', 'RETAIL', 'POS'] },
        { code: '4110', name: 'Online Sales', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['ONLINE', 'ECOMMERCE', 'WEB'] },
        { code: '4200', name: 'Sales Returns', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RETURN', 'REFUND'] },
        { code: '4300', name: 'Gift Card Sales', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['GIFT CARD'] },
        { code: '4400', name: 'Shipping Revenue', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['SHIPPING', 'DELIVERY'] },
      ]
    },

    // Cost of Goods Sold
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
        { code: '5100', name: 'Product Purchases', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SUPPLIER', 'VENDOR', 'WHOLESALE'] },
        { code: '5200', name: 'Freight In', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['FREIGHT', 'SHIPPING IN', 'DELIVERY'] },
        { code: '5300', name: 'Purchase Discounts', type: 'expense', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['DISCOUNT', 'REBATE'] },
        { code: '5400', name: 'Inventory Shrinkage', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SHRINKAGE', 'THEFT', 'LOSS'] },
      ]
    },

    // Operating Expenses
    {
      code: '6000',
      name: 'Operating Expenses',
      type: 'expense',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '6100', name: 'Store Wages', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['PAYROLL', 'WAGES', 'SALARY'] },
        { code: '6200', name: 'Store Rent', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RENT', 'LEASE', 'CAM'] },
        { code: '6300', name: 'Utilities', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['ELECTRIC', 'GAS', 'WATER'] },
        { code: '6400', name: 'Credit Card Processing', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['MERCHANT', 'PROCESSING', 'SQUARE'] },
        { code: '6500', name: 'Store Supplies', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SUPPLIES', 'BAGS', 'RECEIPT'] },
        { code: '6600', name: 'Marketing & Advertising', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['MARKETING', 'ADVERTISING', 'PROMOTION'] },
        { code: '6700', name: 'Store Insurance', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['INSURANCE', 'LIABILITY'] },
      ]
    }
  ],

  transactionPatterns: [
    {
      id: 'pos-deposit',
      pattern: 'SQUARE|SHOPIFY|CLOVER|POS DEPOSIT|DAILY SALES',
      patternType: 'regex',
      suggestedAccount: '4100',
      confidence: 0.95,
      frequency: 'daily',
      description: 'POS system deposits',
      examples: ['SQUARE DEPOSIT', 'SHOPIFY PAYOUT', 'DAILY SALES DEPOSIT'],
      averageAmount: { min: 500, max: 10000 }
    },
    {
      id: 'supplier-payment',
      pattern: 'WHOLESALE|SUPPLIER|VENDOR|DISTRIBUTOR',
      patternType: 'regex',
      suggestedAccount: '5100',
      confidence: 0.90,
      frequency: 'weekly',
      description: 'Supplier/vendor payments',
      examples: ['ABC WHOLESALE', 'XYZ DISTRIBUTOR'],
      averageAmount: { min: 1000, max: 20000 }
    },
    {
      id: 'store-rent',
      pattern: 'RENT|LEASE|PROPERTY MANAGEMENT|LANDLORD',
      patternType: 'regex',
      suggestedAccount: '6200',
      confidence: 0.95,
      frequency: 'monthly',
      description: 'Store rent payments',
      examples: ['MONTHLY RENT', 'SHOPPING CENTER MGMT'],
      averageAmount: { min: 2000, max: 15000 }
    }
  ],

  commonVendors: [
    { vendorName: 'SQUARE', alternateNames: ['SQUARE INC', 'SQ *'], defaultAccount: '4100', vendorType: 'Payment Processor', isRecurring: true, paymentFrequency: 'daily' },
    { vendorName: 'SHOPIFY', alternateNames: ['SHOPIFY PAYMENTS'], defaultAccount: '4110', vendorType: 'Ecommerce Platform', isRecurring: true, paymentFrequency: 'daily' },
    { vendorName: 'UPS', alternateNames: ['UNITED PARCEL'], defaultAccount: '5200', vendorType: 'Shipping', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'FEDEX', defaultAccount: '5200', vendorType: 'Shipping', isRecurring: true, paymentFrequency: 'weekly' },
  ],

  kpis: [
    {
      name: 'Gross Margin',
      formula: '((Sales - COGS) / Sales) * 100',
      accounts: ['4100', '5000'],
      benchmarkRange: { min: 40, max: 60 },
      importance: 'critical'
    },
    {
      name: 'Inventory Turnover',
      formula: 'COGS / Average Inventory',
      accounts: ['5000', '1310'],
      benchmarkRange: { min: 4, max: 12 },
      importance: 'critical'
    },
    {
      name: 'Sales per Square Foot',
      formula: 'Annual Sales / Store Square Footage',
      accounts: ['4100'],
      benchmarkRange: { min: 200, max: 600 },
      importance: 'important'
    }
  ],

  reportingRequirements: [
    'Daily Sales Report',
    'Inventory Report',
    'Sales by Category',
    'Employee Performance',
    'Shrinkage Report'
  ],

  regulatoryCompliance: [
    'Sales Tax Collection',
    'Business License',
    'Fire Code Compliance',
    'ADA Compliance'
  ]
};

// Import beauty templates
import { BEAUTY_INDUSTRY_TEMPLATES } from './industry-templates-beauty';
// Import pharmaceutical templates
import { PHARMACEUTICAL_TEMPLATES } from './industry-templates-pharmaceutical';

/**
 * Export all extended templates
 */
export const EXTENDED_INDUSTRY_TEMPLATES = {
  'cleaning-services': CLEANING_SERVICES_TEMPLATE,
  'financial-services': FINANCIAL_SERVICES_TEMPLATE,
  'consulting': CONSULTING_TEMPLATE,
  'pest-control': PEST_CONTROL_TEMPLATE,
  'retail': RETAIL_TEMPLATE,
  // Beauty industry templates
  ...BEAUTY_INDUSTRY_TEMPLATES,
  // Pharmaceutical & healthcare templates
  ...PHARMACEUTICAL_TEMPLATES
};