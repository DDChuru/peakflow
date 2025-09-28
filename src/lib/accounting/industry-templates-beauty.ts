/**
 * Beauty & Personal Care Industry Templates
 * Hair salons, barbershops, spas, nail salons, and beauty services
 */

import { IndustryTemplate, COATemplate, TransactionPattern, VendorMapping } from './industry-knowledge-base';

/**
 * Beauty & Personal Care Services Template
 * Covers: Hair Salons, Barbershops, Nail Salons, Spas, Beauty Services
 */
export const BEAUTY_SERVICES_TEMPLATE: IndustryTemplate = {
  id: 'beauty-services',
  name: 'Beauty & Personal Care Services',
  description: 'Hair salons, barbershops, nail salons, spas, beauty parlors, and personal care services',
  category: 'service',
  typicalRevenueSources: ['Service Revenue', 'Product Sales', 'Membership/Packages', 'Gift Certificates', 'Rental Income'],
  typicalExpenseCategories: ['Stylist Commissions', 'Product Costs', 'Rent', 'Supplies', 'Equipment', 'Marketing'],

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
        { code: '1010', name: 'Business Checking Account', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['BANK', 'CHECKING'] },
        { code: '1020', name: 'Cash Drawer', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CASH', 'TILL', 'DRAWER'] },
        { code: '1030', name: 'Credit Card Clearing', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SQUARE', 'STRIPE', 'PAYMENT'] },
        { code: '1040', name: 'Tips Clearing Account', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['TIPS', 'GRATUITY'] },
        { code: '1100', name: 'Accounts Receivable', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RECEIVABLE', 'INVOICE'] },
        { code: '1110', name: 'Gift Certificate Receivables', type: 'asset', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['GIFT', 'CERTIFICATE'] },
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
        { code: '1310', name: 'Retail Product Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RETAIL', 'PRODUCT', 'SHAMPOO', 'CONDITIONER'] },
        { code: '1320', name: 'Professional Product Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['COLOR', 'CHEMICAL', 'TREATMENT', 'PROFESSIONAL'] },
        { code: '1330', name: 'Supplies Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SUPPLIES', 'TOWELS', 'FOILS', 'DISPOSABLE'] },
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
        { code: '1510', name: 'Salon Equipment', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CHAIR', 'STATION', 'DRYER', 'EQUIPMENT'] },
        { code: '1520', name: 'Furniture & Fixtures', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['FURNITURE', 'FIXTURE', 'MIRROR', 'RECEPTION'] },
        { code: '1530', name: 'Small Tools & Equipment', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SCISSORS', 'CLIPPER', 'IRON', 'TOOLS'] },
        { code: '1540', name: 'Leasehold Improvements', type: 'asset', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['IMPROVEMENT', 'RENOVATION', 'BUILD OUT'] },
        { code: '1550', name: 'POS System', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['POS', 'COMPUTER', 'SOFTWARE'] },
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
        { code: '2200', name: 'Accrued Commissions', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['COMMISSION', 'STYLIST PAY'] },
        { code: '2210', name: 'Tips Payable', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['TIPS OWED', 'GRATUITY'] },
        { code: '2300', name: 'Sales Tax Payable', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', taxRelevant: true, mappingKeywords: ['SALES TAX'] },
        { code: '2400', name: 'Gift Certificates Outstanding', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['GIFT CERT', 'GIFT CARD'] },
        { code: '2500', name: 'Prepaid Services', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['PACKAGE', 'MEMBERSHIP', 'PREPAID'] },
      ]
    },

    // Revenue (4000-4999)
    {
      code: '4000',
      name: 'Service Revenue',
      type: 'revenue',
      isRequired: true,
      isCommon: true,
      normalBalance: 'credit',
      typicalTransactionVolume: 'high',
      children: [
        { code: '4100', name: 'Hair Service Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['HAIRCUT', 'COLOR', 'STYLE', 'BLOWDRY'] },
        { code: '4110', name: 'Chemical Service Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['PERM', 'RELAXER', 'KERATIN', 'TREATMENT'] },
        { code: '4120', name: 'Color Service Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['COLOR', 'HIGHLIGHTS', 'BALAYAGE', 'TINT'] },
        { code: '4200', name: 'Nail Service Revenue', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['MANICURE', 'PEDICURE', 'NAIL', 'POLISH'] },
        { code: '4300', name: 'Spa Service Revenue', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['FACIAL', 'MASSAGE', 'SPA', 'TREATMENT'] },
        { code: '4400', name: 'Retail Product Sales', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['PRODUCT SALE', 'RETAIL', 'SHAMPOO SALE'] },
        { code: '4500', name: 'Chair Rental Income', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['CHAIR RENTAL', 'BOOTH RENTAL', 'STATION'] },
        { code: '4600', name: 'Package/Membership Revenue', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['PACKAGE', 'MEMBERSHIP', 'SUBSCRIPTION'] },
      ]
    },

    // Cost of Services/Goods (5000-5999)
    {
      code: '5000',
      name: 'Cost of Services',
      type: 'expense',
      subType: 'cogs',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '5100', name: 'Stylist Commissions', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', typicalTransactionVolume: 'high', mappingKeywords: ['COMMISSION', 'STYLIST PAY', 'CONTRACTOR'] },
        { code: '5110', name: 'Assistant Wages', type: 'expense', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['ASSISTANT', 'SHAMPOO TECH'] },
        { code: '5200', name: 'Professional Product Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['COLOR COST', 'CHEMICAL', 'TREATMENT PRODUCT'] },
        { code: '5300', name: 'Retail Product Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RETAIL COST', 'PRODUCT PURCHASE'] },
        { code: '5400', name: 'Service Supplies', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['FOILS', 'TOWELS', 'CAPES', 'DISPOSABLE'] },
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
        { code: '6100', name: 'Salon Rent', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RENT', 'LEASE', 'OCCUPANCY'] },
        { code: '6200', name: 'Utilities', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['ELECTRIC', 'WATER', 'GAS', 'UTILITY'] },
        { code: '6210', name: 'Laundry & Linen Service', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['LAUNDRY', 'LINEN', 'TOWEL SERVICE'] },
        { code: '6300', name: 'Insurance', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['LIABILITY', 'INSURANCE', 'COVERAGE'] },
        { code: '6400', name: 'Marketing & Advertising', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['MARKETING', 'ADVERTISING', 'PROMOTION', 'SOCIAL MEDIA'] },
        { code: '6500', name: 'Education & Training', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['EDUCATION', 'TRAINING', 'CLASS', 'SEMINAR'] },
        { code: '6600', name: 'Professional Licenses', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['LICENSE', 'PERMIT', 'CERTIFICATION', 'STATE BOARD'] },
        { code: '6700', name: 'Credit Card Processing', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['MERCHANT FEE', 'PROCESSING', 'SQUARE FEE'] },
        { code: '6800', name: 'Equipment Maintenance', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['REPAIR', 'MAINTENANCE', 'SERVICE'] },
        { code: '6900', name: 'Professional Fees', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['ACCOUNTING', 'LEGAL', 'BOOKKEEPING'] },
      ]
    }
  ],

  transactionPatterns: [
    {
      id: 'square-deposit',
      pattern: 'SQUARE.*DEPOSIT|SQ.*TRANSFER|SQUARE INC',
      patternType: 'regex',
      suggestedAccount: '4100',
      confidence: 0.95,
      frequency: 'daily',
      description: 'Daily credit card deposits',
      examples: ['SQUARE DEPOSIT', 'SQ TRANSFER', 'SQUARE INC PMT'],
      averageAmount: { min: 200, max: 3000 }
    },
    {
      id: 'product-distributor',
      pattern: 'COSMOPROF|SALON CENTRIC|BEAUTY SUPPLY|PAUL MITCHELL|REDKEN|LOREAL',
      patternType: 'regex',
      suggestedAccount: '5200',
      confidence: 0.93,
      frequency: 'weekly',
      description: 'Professional product purchases',
      examples: ['COSMOPROF', 'SALON CENTRIC', 'STATE BEAUTY SUPPLY'],
      averageAmount: { min: 200, max: 2000 }
    },
    {
      id: 'commission-payment',
      pattern: 'COMMISSION|STYLIST PAY|CONTRACTOR PAY',
      patternType: 'regex',
      suggestedAccount: '5100',
      confidence: 0.95,
      frequency: 'weekly',
      description: 'Stylist commission payments',
      examples: ['STYLIST COMMISSION', 'WEEKLY COMMISSION PAY'],
      averageAmount: { min: 500, max: 5000 }
    },
    {
      id: 'booth-rental',
      pattern: 'BOOTH RENT|CHAIR RENTAL|STATION.*RENT',
      patternType: 'regex',
      suggestedAccount: '4500',
      confidence: 0.92,
      frequency: 'monthly',
      description: 'Chair/booth rental income',
      examples: ['BOOTH RENT PAYMENT', 'CHAIR RENTAL - SMITH'],
      averageAmount: { min: 400, max: 1500 }
    },
    {
      id: 'salon-rent',
      pattern: 'RENT|LEASE PAYMENT|PROPERTY.*MGMT|LANDLORD',
      patternType: 'regex',
      suggestedAccount: '6100',
      confidence: 0.95,
      frequency: 'monthly',
      description: 'Salon rent payment',
      examples: ['MONTHLY RENT', 'SHOPPING CENTER LEASE'],
      averageAmount: { min: 1500, max: 8000 }
    },
    {
      id: 'utilities',
      pattern: 'ELECTRIC|WATER DEPT|GAS COMPANY|UTILITY',
      patternType: 'regex',
      suggestedAccount: '6200',
      confidence: 0.93,
      frequency: 'monthly',
      description: 'Utility payments',
      examples: ['ELECTRIC COMPANY', 'WATER DEPARTMENT'],
      averageAmount: { min: 200, max: 800 }
    },
    {
      id: 'laundry-service',
      pattern: 'LAUNDRY|LINEN SERVICE|CINTAS|ALSCO',
      patternType: 'regex',
      suggestedAccount: '6210',
      confidence: 0.94,
      frequency: 'weekly',
      description: 'Towel and linen service',
      examples: ['CINTAS LAUNDRY', 'ACE LINEN SERVICE'],
      averageAmount: { min: 50, max: 300 }
    },
    {
      id: 'education',
      pattern: 'EDUCATION|TRAINING|SEMINAR|HAIR SHOW|BEAUTY SCHOOL',
      patternType: 'regex',
      suggestedAccount: '6500',
      confidence: 0.90,
      frequency: 'monthly',
      description: 'Education and training expenses',
      examples: ['PIVOT POINT TRAINING', 'HAIR SHOW REGISTRATION'],
      averageAmount: { min: 100, max: 2000 }
    }
  ],

  commonVendors: [
    { vendorName: 'SQUARE', alternateNames: ['SQUARE INC', 'SQ *'], defaultAccount: '1030', vendorType: 'Payment Processor', isRecurring: true, paymentFrequency: 'daily' },
    { vendorName: 'COSMOPROF', alternateNames: ['COSMOPROF BEAUTY'], defaultAccount: '5200', vendorType: 'Product Distributor', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'SALON CENTRIC', alternateNames: ['SALONCENTRIC'], defaultAccount: '5200', vendorType: 'Product Distributor', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'STATE BEAUTY SUPPLY', defaultAccount: '5200', vendorType: 'Product Distributor', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'PAUL MITCHELL', alternateNames: ['JPMS'], defaultAccount: '5200', vendorType: 'Product Brand', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'REDKEN', alternateNames: ['REDKEN 5TH AVE'], defaultAccount: '5200', vendorType: 'Product Brand', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'LOREAL', alternateNames: ['LOREAL PROFESSIONAL'], defaultAccount: '5200', vendorType: 'Product Brand', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'CINTAS', alternateNames: ['CINTAS LAUNDRY'], defaultAccount: '6210', vendorType: 'Laundry Service', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'GROUPON', alternateNames: ['GROUPON MERCHANT'], defaultAccount: '6400', vendorType: 'Marketing Platform', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'FACEBOOK', alternateNames: ['META', 'FB ADS'], defaultAccount: '6400', vendorType: 'Advertising', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'INSTAGRAM', alternateNames: ['IG ADS'], defaultAccount: '6400', vendorType: 'Advertising', isRecurring: true, paymentFrequency: 'monthly' },
  ],

  kpis: [
    {
      name: 'Revenue per Service Ticket',
      formula: 'Total Service Revenue / Number of Clients',
      accounts: ['4100', '4110', '4120'],
      benchmarkRange: { min: 45, max: 150 },
      importance: 'critical'
    },
    {
      name: 'Retail to Service Ratio',
      formula: '(Retail Sales / Service Revenue) * 100',
      accounts: ['4400', '4100'],
      benchmarkRange: { min: 15, max: 30 },
      importance: 'important'
    },
    {
      name: 'Commission Rate',
      formula: '(Stylist Commissions / Service Revenue) * 100',
      accounts: ['5100', '4100'],
      benchmarkRange: { min: 40, max: 60 },
      importance: 'critical'
    },
    {
      name: 'Product Cost Ratio',
      formula: '(Professional Product Costs / Service Revenue) * 100',
      accounts: ['5200', '4100'],
      benchmarkRange: { min: 8, max: 15 },
      importance: 'important'
    },
    {
      name: 'Client Retention Rate',
      formula: '(Returning Clients / Total Clients) * 100',
      accounts: [],
      benchmarkRange: { min: 70, max: 90 },
      importance: 'critical'
    },
    {
      name: 'Average Client Frequency',
      formula: 'Visits per Client per Year',
      accounts: [],
      benchmarkRange: { min: 6, max: 12 },
      importance: 'important'
    }
  ],

  reportingRequirements: [
    'Daily Cash Report',
    'Stylist Commission Report',
    'Service Sales Report',
    'Retail Inventory Report',
    'Client Retention Report',
    'Tips Report',
    'Product Usage Report'
  ],

  regulatoryCompliance: [
    'Cosmetology License',
    'State Board Compliance',
    'Sales Tax Collection',
    'Tip Reporting (Form 8027)',
    'Independent Contractor vs Employee Classification',
    'OSHA Compliance (Chemical Safety)'
  ]
};

/**
 * Barbershop-specific variant
 */
export const BARBERSHOP_TEMPLATE: IndustryTemplate = {
  ...BEAUTY_SERVICES_TEMPLATE,
  id: 'barbershop',
  name: 'Barbershop',
  description: 'Traditional barbershops and mens grooming services',
  chartOfAccounts: [
    ...BEAUTY_SERVICES_TEMPLATE.chartOfAccounts.map(section => {
      if (section.code === '4000') {
        return {
          ...section,
          children: [
            { code: '4100', name: 'Haircut Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['HAIRCUT', 'TRIM', 'CUT'] },
            { code: '4110', name: 'Shave Service Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['SHAVE', 'BEARD', 'RAZOR'] },
            { code: '4120', name: 'Beard Service Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['BEARD TRIM', 'BEARD DESIGN'] },
            { code: '4400', name: 'Product Sales', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['POMADE', 'PRODUCT'] },
            { code: '4500', name: 'Chair Rental Income', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['CHAIR RENTAL', 'BOOTH'] },
          ]
        };
      }
      return section;
    })
  ],
  transactionPatterns: [
    ...BEAUTY_SERVICES_TEMPLATE.transactionPatterns,
    {
      id: 'barber-supply',
      pattern: 'BARBER.*SUPPLY|ANDIS|WAHL|OSTER',
      patternType: 'regex',
      suggestedAccount: '5200',
      confidence: 0.92,
      frequency: 'monthly',
      description: 'Barber equipment and supplies',
      examples: ['BARBER SUPPLY CO', 'ANDIS CLIPPERS'],
      averageAmount: { min: 100, max: 500 }
    }
  ]
};

/**
 * Nail Salon specific variant
 */
export const NAIL_SALON_TEMPLATE: IndustryTemplate = {
  ...BEAUTY_SERVICES_TEMPLATE,
  id: 'nail-salon',
  name: 'Nail Salon',
  description: 'Nail salons, manicure and pedicure services',
  chartOfAccounts: [
    ...BEAUTY_SERVICES_TEMPLATE.chartOfAccounts.map(section => {
      if (section.code === '4000') {
        return {
          ...section,
          children: [
            { code: '4100', name: 'Manicure Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['MANICURE', 'MANI'] },
            { code: '4110', name: 'Pedicure Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['PEDICURE', 'PEDI'] },
            { code: '4120', name: 'Gel/Acrylic Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['GEL', 'ACRYLIC', 'DIPPING'] },
            { code: '4130', name: 'Nail Art Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['NAIL ART', 'DESIGN'] },
            { code: '4200', name: 'Waxing Service Revenue', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['WAXING', 'WAX'] },
          ]
        };
      }
      return section;
    })
  ],
  commonVendors: [
    ...BEAUTY_SERVICES_TEMPLATE.commonVendors,
    { vendorName: 'CND', alternateNames: ['CREATIVE NAIL'], defaultAccount: '5200', vendorType: 'Nail Product', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'OPI', alternateNames: ['OPI PRODUCTS'], defaultAccount: '5200', vendorType: 'Nail Product', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'GELISH', defaultAccount: '5200', vendorType: 'Nail Product', isRecurring: true, paymentFrequency: 'monthly' },
  ]
};

/**
 * Export all beauty industry templates
 */
export const BEAUTY_INDUSTRY_TEMPLATES = {
  'beauty-services': BEAUTY_SERVICES_TEMPLATE,
  'barbershop': BARBERSHOP_TEMPLATE,
  'nail-salon': NAIL_SALON_TEMPLATE
};