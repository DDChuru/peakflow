/**
 * Comprehensive Industry Templates
 * Auto-generated from comprehensive_industry_coa (1).json
 * DO NOT EDIT MANUALLY - Run scripts/generate-industry-templates.js to regenerate
 */

import { IndustryTemplate } from './industry-knowledge-base';


/**
 * Restaurant Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 75
 */
export const RESTAURANT_TEMPLATE: IndustryTemplate = {
  id: 'restaurant',
  name: 'Restaurant',
  description: 'Restaurant',
  category: 'hospitality',
  typicalRevenueSources: [
  "Food Sales",
  "Beverage Sales",
  "Catering",
  "Delivery"
],
  typicalExpenseCategories: [
  "Food Costs",
  "Labor",
  "Rent",
  "Utilities"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1200',
        name: 'Inventory - Food',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Food inventory',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1210',
        name: 'Inventory - Beverages',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Beverage inventory',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1220',
        name: 'Inventory - Alcoholic Beverages',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Alcohol inventory',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2320',
        name: 'Tips Payable to Staff',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Tips owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '4010',
        name: 'Food Sales - Takeout',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Takeout revenue',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '4100',
        name: 'Beverage Sales - Non-Alcoholic',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Non-alcoholic drinks',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4200',
        name: 'Beverage Sales - Alcoholic',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Alcoholic beverage sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4300',
        name: 'Catering Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Catering services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5100',
        name: 'Beverage Costs',
        type: 'expense',
        subType: 'COGS',
        description: 'Cost of beverages sold',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6020',
        name: 'Wages - Front of House Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Service staff wages',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6090',
        name: 'Staff Meals & Uniforms',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee meals and uniforms',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: [
  "Health Department",
  "Food Safety"
]
};

/**
 * SaaS Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 74
 */
export const SAAS_TEMPLATE: IndustryTemplate = {
  id: 'saas',
  name: 'SaaS',
  description: 'SaaS',
  category: 'technology',
  typicalRevenueSources: [
  "Subscription Revenue",
  "Professional Services",
  "API Usage"
],
  typicalExpenseCategories: [
  "Engineering",
  "Sales & Marketing",
  "Cloud Infrastructure"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1050',
        name: 'Payment Processor Clearing',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Stripe/PayPal clearing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1200',
        name: 'Unbilled Revenue',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Accrued revenue',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2400',
        name: 'Deferred Revenue - Subscriptions',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Prepaid subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '3010',
        name: 'Preferred Stock',
        type: 'equity',
        subType: 'Equity',
        description: 'Preferred equity shares',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '4010',
        name: 'Subscription Revenue - Annual',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Annual subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '4100',
        name: 'Professional Services Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Implementation and consulting',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5100',
        name: 'Third-Party API Costs',
        type: 'expense',
        subType: 'COGS',
        description: 'External API expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5200',
        name: 'Payment Processing Fees',
        type: 'expense',
        subType: 'COGS',
        description: 'Transaction fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6310',
        name: 'Salaries - Marketing Team',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing staff salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6350',
        name: 'Digital Advertising',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online advertising',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: []
};

/**
 * Professional Services Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 70
 */
export const PROFESSIONAL_SERVICES_TEMPLATE: IndustryTemplate = {
  id: 'professional-services',
  name: 'Professional Services',
  description: 'Professional Services',
  category: 'service',
  typicalRevenueSources: [
  "Consulting Fees",
  "Project Fees",
  "Retainer Fees"
],
  typicalExpenseCategories: [
  "Salaries",
  "Office Expenses",
  "Professional Development"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1110',
        name: 'Unbilled Receivables',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Work in progress',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2420',
        name: 'Client Trust Account Liability',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Client funds liability',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4100',
        name: 'Consulting Fees',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Consulting services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4200',
        name: 'Project-Based Fees',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Fixed fee projects',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4300',
        name: 'Retainer Fees',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Retainer arrangements',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5200',
        name: 'Subcontractor Costs',
        type: 'expense',
        subType: 'COGS',
        description: 'External consultants',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: []
};

/**
 * Cleaning Services Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 64
 */
export const CLEANING_SERVICES_TEMPLATE: IndustryTemplate = {
  id: 'cleaning-services',
  name: 'Cleaning Services',
  description: 'Cleaning Services',
  category: 'service',
  typicalRevenueSources: [
  "Contract Cleaning",
  "One-Time Services",
  "Specialized Cleaning"
],
  typicalExpenseCategories: [
  "Supplies",
  "Labor",
  "Equipment",
  "Transportation"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: []
};

/**
 * Financial Services Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 64
 */
export const FINANCIAL_SERVICES_TEMPLATE: IndustryTemplate = {
  id: 'financial-services',
  name: 'Financial Services',
  description: 'Financial Services',
  category: 'service',
  typicalRevenueSources: [
  "Service Revenue",
  "Product Sales",
  "Other Income"
],
  typicalExpenseCategories: [
  "Salaries",
  "Rent",
  "Utilities",
  "Supplies"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: []
};

/**
 * Consulting Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 64
 */
export const CONSULTING_TEMPLATE: IndustryTemplate = {
  id: 'consulting',
  name: 'Consulting',
  description: 'Consulting',
  category: 'service',
  typicalRevenueSources: [
  "Service Revenue",
  "Product Sales",
  "Other Income"
],
  typicalExpenseCategories: [
  "Salaries",
  "Rent",
  "Utilities",
  "Supplies"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: []
};

/**
 * Pest Control Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 64
 */
export const PEST_CONTROL_TEMPLATE: IndustryTemplate = {
  id: 'pest-control',
  name: 'Pest Control',
  description: 'Pest Control',
  category: 'service',
  typicalRevenueSources: [
  "Service Revenue",
  "Product Sales",
  "Other Income"
],
  typicalExpenseCategories: [
  "Salaries",
  "Rent",
  "Utilities",
  "Supplies"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: []
};

/**
 * Retail Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 64
 */
export const RETAIL_TEMPLATE: IndustryTemplate = {
  id: 'retail',
  name: 'Retail',
  description: 'Retail',
  category: 'retail',
  typicalRevenueSources: [
  "Product Sales",
  "Online Sales",
  "In-Store Sales"
],
  typicalExpenseCategories: [
  "Inventory",
  "Rent",
  "Staffing",
  "Marketing"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: []
};

/**
 * Beauty Services Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 64
 */
export const BEAUTY_SERVICES_TEMPLATE: IndustryTemplate = {
  id: 'beauty-services',
  name: 'Beauty Services',
  description: 'Beauty Services',
  category: 'service',
  typicalRevenueSources: [
  "Service Revenue",
  "Product Sales",
  "Other Income"
],
  typicalExpenseCategories: [
  "Salaries",
  "Rent",
  "Utilities",
  "Supplies"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: []
};

/**
 * Barbershop Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 64
 */
export const BARBERSHOP_TEMPLATE: IndustryTemplate = {
  id: 'barbershop',
  name: 'Barbershop',
  description: 'Barbershop',
  category: 'service',
  typicalRevenueSources: [
  "Service Revenue",
  "Product Sales",
  "Other Income"
],
  typicalExpenseCategories: [
  "Salaries",
  "Rent",
  "Utilities",
  "Supplies"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: []
};

/**
 * Nail Salon Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 64
 */
export const NAIL_SALON_TEMPLATE: IndustryTemplate = {
  id: 'nail-salon',
  name: 'Nail Salon',
  description: 'Nail Salon',
  category: 'service',
  typicalRevenueSources: [
  "Service Revenue",
  "Product Sales",
  "Other Income"
],
  typicalExpenseCategories: [
  "Salaries",
  "Rent",
  "Utilities",
  "Supplies"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: []
};

/**
 * Pharmacy Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 64
 */
export const PHARMACY_TEMPLATE: IndustryTemplate = {
  id: 'pharmacy',
  name: 'Pharmacy',
  description: 'Pharmacy',
  category: 'healthcare',
  typicalRevenueSources: [
  "Prescription Sales",
  "OTC Sales",
  "Medical Supplies"
],
  typicalExpenseCategories: [
  "Salaries",
  "Rent",
  "Utilities",
  "Supplies"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: [
  "Board of Pharmacy",
  "DEA",
  "HIPAA"
]
};

/**
 * Medical Practice Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 64
 */
export const MEDICAL_PRACTICE_TEMPLATE: IndustryTemplate = {
  id: 'medical-practice',
  name: 'Medical Practice',
  description: 'Medical Practice',
  category: 'healthcare',
  typicalRevenueSources: [
  "Patient Services",
  "Procedures",
  "Consultations"
],
  typicalExpenseCategories: [
  "Salaries",
  "Rent",
  "Utilities",
  "Supplies"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: [
  "HIPAA",
  "Medical Board"
]
};

/**
 * K-12 Schools Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 64
 */
export const EDUCATION_TEMPLATE: IndustryTemplate = {
  id: 'education',
  name: 'K-12 Schools',
  description: 'K-12 Schools',
  category: 'service',
  typicalRevenueSources: [
  "Tuition Fees",
  "Registration Fees",
  "Program Fees"
],
  typicalExpenseCategories: [
  "Salaries",
  "Rent",
  "Utilities",
  "Supplies"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: []
};

/**
 * General Dealers Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 64
 */
export const GENERAL_DEALERS_TEMPLATE: IndustryTemplate = {
  id: 'general-dealers',
  name: 'General Dealers',
  description: 'General Dealers',
  category: 'retail',
  typicalRevenueSources: [
  "Service Revenue",
  "Product Sales",
  "Other Income"
],
  typicalExpenseCategories: [
  "Salaries",
  "Rent",
  "Utilities",
  "Supplies"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: []
};

/**
 * Automation Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 80
 */
export const AUTOMATION_TEMPLATE: IndustryTemplate = {
  id: 'automation',
  name: 'Automation',
  description: 'Automation',
  category: 'manufacturing',
  typicalRevenueSources: [
  "Service Revenue",
  "Product Sales",
  "Other Income"
],
  typicalExpenseCategories: [
  "Salaries",
  "Rent",
  "Utilities",
  "Supplies"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1200',
        name: 'Inventory - Control Systems',
        type: 'asset',
        subType: 'Current Assets',
        description: 'PLC and control hardware',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1210',
        name: 'Inventory - Sensors & Actuators',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Automation components',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1220',
        name: 'Inventory - Robotics Components',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Robot parts and assemblies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1230',
        name: 'Inventory - Electrical Components',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Electrical supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1520',
        name: 'Demonstration Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Demo units and samples',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4100',
        name: 'Equipment Sales',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Hardware and component sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4200',
        name: 'Programming & Configuration Services',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Software configuration',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4300',
        name: 'Maintenance Contracts',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Ongoing support contracts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4400',
        name: 'Training Services',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Customer training revenue',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4500',
        name: 'Consulting Services - Automation',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Automation consulting',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5100',
        name: 'Component Costs',
        type: 'expense',
        subType: 'COGS',
        description: 'Component and materials',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5200',
        name: 'Subcontractor - Integration',
        type: 'expense',
        subType: 'COGS',
        description: 'Third-party integrators',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5300',
        name: 'Software Licenses - Project Specific',
        type: 'expense',
        subType: 'COGS',
        description: 'Project software costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6020',
        name: 'Salaries - Programmers',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'PLC/SCADA programmers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6100',
        name: 'Engineering Software Licenses',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'AutoCAD, EPLAN, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6110',
        name: 'PLC Programming Software',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Rockwell, Siemens, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: []
};

/**
 * Printing Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 78
 */
export const PRINTING_TEMPLATE: IndustryTemplate = {
  id: 'printing',
  name: 'Printing',
  description: 'Printing',
  category: 'manufacturing',
  typicalRevenueSources: [
  "Service Revenue",
  "Product Sales",
  "Other Income"
],
  typicalExpenseCategories: [
  "Salaries",
  "Rent",
  "Utilities",
  "Supplies"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1200',
        name: 'Inventory - Paper Stock',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Various paper inventory',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1210',
        name: 'Inventory - Ink & Toner',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Printing inks',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1220',
        name: 'Inventory - Printing Plates',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Offset plates',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1230',
        name: 'Inventory - Finishing Supplies',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Binding, laminating',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1520',
        name: 'Pre-Press Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Design and plate-making',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1530',
        name: 'Finishing Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Laminators, die cutters',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4100',
        name: 'Printing Services - Digital',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Digital print jobs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4200',
        name: 'Design Services',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Graphic design revenue',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4300',
        name: 'Large Format Printing',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Banners, posters, signage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4400',
        name: 'Finishing Services',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Binding, laminating, die cutting',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5100',
        name: 'Ink & Consumables',
        type: 'expense',
        subType: 'COGS',
        description: 'Printing consumables',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5200',
        name: 'Printing Plates',
        type: 'expense',
        subType: 'COGS',
        description: 'Plate costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5300',
        name: 'Outsourced Printing',
        type: 'expense',
        subType: 'COGS',
        description: 'Third-party printing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6020',
        name: 'Salaries - Bindery Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Finishing crew',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: []
};

/**
 * Event Management Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 79
 */
export const EVENT_MANAGEMENT_TEMPLATE: IndustryTemplate = {
  id: 'event-management',
  name: 'Event Management',
  description: 'Event Management',
  category: 'service',
  typicalRevenueSources: [
  "Service Revenue",
  "Product Sales",
  "Other Income"
],
  typicalExpenseCategories: [
  "Salaries",
  "Rent",
  "Utilities",
  "Supplies"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2400',
        name: 'Customer Deposits Received',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Client advance payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2410',
        name: 'Deferred Revenue - Events',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Prepaid event fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4100',
        name: 'Event Management Fees',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Day-of coordination',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4200',
        name: 'Venue Rental Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Venue rental (if owned)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4300',
        name: 'Catering Services',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Food and beverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4400',
        name: 'Audio/Visual Services',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'AV equipment and services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4500',
        name: 'Décor & Design Services',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Event decoration',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4600',
        name: 'Equipment Rental Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Tables, chairs, linens',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5100',
        name: 'Catering Costs',
        type: 'expense',
        subType: 'COGS',
        description: 'Food and beverage costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5200',
        name: 'Rental Equipment Costs',
        type: 'expense',
        subType: 'COGS',
        description: 'Equipment rental expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5300',
        name: 'Entertainment Costs',
        type: 'expense',
        subType: 'COGS',
        description: 'Performers, DJs, bands',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5400',
        name: 'Décor & Flowers',
        type: 'expense',
        subType: 'COGS',
        description: 'Decoration costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5500',
        name: 'Audio/Visual Rental',
        type: 'expense',
        subType: 'COGS',
        description: 'AV equipment rental',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5600',
        name: 'Photography/Videography',
        type: 'expense',
        subType: 'COGS',
        description: 'Event documentation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6020',
        name: 'Salaries - Setup Crew',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Event setup labor',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: []
};

/**
 * Law Firms Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 78
 */
export const LAW_FIRMS_TEMPLATE: IndustryTemplate = {
  id: 'law-firms',
  name: 'Law Firms',
  description: 'Law Firms',
  category: 'service',
  typicalRevenueSources: [
  "Legal Fees",
  "Retainer Fees",
  "Court Representation"
],
  typicalExpenseCategories: [
  "Salaries",
  "Rent",
  "Utilities",
  "Supplies"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1110',
        name: 'Unbilled Receivables - Legal Services',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Work in progress',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2410',
        name: 'Deferred Revenue - Legal Retainers',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Unearned retainer fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2420',
        name: 'Trust Account Liability',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Client funds liability (MUST MATCH 1020)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4100',
        name: 'Legal Fees - Flat Fee Cases',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Fixed fee matters',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4200',
        name: 'Legal Fees - Contingency',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Contingency fee cases',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4300',
        name: 'Legal Fees - Retainer',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Retainer fee revenue',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5100',
        name: 'Expert Witness Fees',
        type: 'expense',
        subType: 'COGS',
        description: 'Expert consultation costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5200',
        name: 'Legal Research Expenses',
        type: 'expense',
        subType: 'COGS',
        description: 'Case research costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5300',
        name: 'Deposition Costs',
        type: 'expense',
        subType: 'COGS',
        description: 'Court reporter and deposition',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6020',
        name: 'Salaries - Paralegals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Paralegal staff',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6030',
        name: 'Salaries - Legal Assistants',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal support staff',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6410',
        name: 'Case Management Software',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Practice management systems',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6520',
        name: 'CLE - Continuing Legal Education',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Mandatory CLE requirements',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6700',
        name: 'Litigation Support Services',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Trial support',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: [
  "Bar Association",
  "Client Trust Accounting"
]
};

/**
 * Universal - Comprehensive Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: 227
 */
export const UNIVERSAL_TEMPLATE: IndustryTemplate = {
  id: 'universal',
  name: 'Universal - Comprehensive',
  description: 'Universal - Comprehensive',
  category: 'service',
  typicalRevenueSources: [
  "Service Revenue",
  "Product Sales",
  "Other Income"
],
  typicalExpenseCategories: [
  "Salaries",
  "Rent",
  "Utilities",
  "Supplies"
],

  chartOfAccounts: [
      {
        code: '1000',
        name: 'Cash - Operating Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Bank account for daily operations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1010',
        name: 'Cash - Payroll Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Dedicated payroll account',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1020',
        name: 'Petty Cash',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Small cash on hand for minor expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1050',
        name: 'Credit Card Clearing Account',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Clearing account for credit card transactions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1100',
        name: 'Accounts Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Money owed by customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1120',
        name: 'Allowance for Doubtful Accounts',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Reserve for uncollectible receivables (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1150',
        name: 'Notes Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Promissory notes from customers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1200',
        name: 'Inventory - Raw Materials',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Raw materials for production',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1210',
        name: 'Inventory - Work in Progress (WIP)',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Partially completed goods',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1220',
        name: 'Inventory - Finished Goods',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Completed products ready for sale',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1230',
        name: 'Inventory - Packaging Materials',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Packaging and shipping materials',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1240',
        name: 'Inventory - Consumables',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Shop floor consumables',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1250',
        name: 'Work in Progress - Projects',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Ongoing project costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1260',
        name: 'Gas Cylinders / Returnable Containers',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Returnable items with deposits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1300',
        name: 'Prepaid Expenses',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Expenses paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1310',
        name: 'Prepaid Insurance',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Insurance premiums paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1320',
        name: 'Prepaid Rent',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rent paid in advance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1330',
        name: 'Deposits - Supplier Deposits',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Deposits paid to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1340',
        name: 'Deposits - Rental Deposits',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Rental equipment deposits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1350',
        name: 'Deposits - Utility Deposits',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Utility connection deposits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1360',
        name: 'Staff Loans & Advances',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Loans and advances to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1370',
        name: 'Other Receivables',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Miscellaneous receivables',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1400',
        name: 'Short-term Investments',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Investments maturing within 1 year',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1410',
        name: 'VAT Receivable / Input VAT',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Value Added Tax recoverable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1420',
        name: 'Withholding Tax Receivable',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Tax withheld recoverable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1450',
        name: 'Deferred Tax Asset',
        type: 'asset',
        subType: 'Current Assets',
        description: 'Future tax benefits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1500',
        name: 'Computer Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Computers, laptops, servers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1510',
        name: 'Office Furniture & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Desks, chairs, office equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1550',
        name: 'Land',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Land owned by business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1560',
        name: 'Buildings',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Buildings and structures',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1570',
        name: 'Motor Vehicles - Cars',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Company vehicles - cars',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1580',
        name: 'Motor Vehicles - Trucks',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Company vehicles - trucks',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1590',
        name: 'Plant & Machinery',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Production equipment and machinery',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1600',
        name: 'Leasehold Improvements',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Improvements to leased property',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1620',
        name: 'Furniture & Fixtures',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Furniture and permanent fixtures',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1650',
        name: 'Tools & Equipment',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Hand tools and small equipment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1700',
        name: 'Intangible Assets - Software Licenses',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Capitalized software',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1710',
        name: 'Intangible Assets - Patents',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Patents owned',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1720',
        name: 'Intangible Assets - Trademarks',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Trademarks and brands',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1730',
        name: 'Intangible Assets - Goodwill',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Goodwill from acquisitions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1740',
        name: 'Intangible Assets - Customer Lists',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Acquired customer relationships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1750',
        name: 'Investments - Subsidiaries',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Investment in subsidiary companies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1760',
        name: 'Investments - Associates',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Investment in associate companies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '1770',
        name: 'Investment Property',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Property held for investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '1900',
        name: 'Accumulated Depreciation',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative depreciation (Contra Asset)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '1910',
        name: 'Accumulated Amortization - Intangibles',
        type: 'asset',
        subType: 'Fixed Assets',
        description: 'Cumulative intangible amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '2000',
        name: 'Accounts Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Money owed to suppliers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2100',
        name: 'Credit Cards Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Credit card balances',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2200',
        name: 'Accrued Expenses',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Expenses incurred but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2210',
        name: 'VAT Payable / Output VAT',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Value Added Tax payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2220',
        name: 'Accrued Interest Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Interest accrued but not paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2300',
        name: 'Payroll Taxes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Employee and employer taxes payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2310',
        name: 'Employee Benefits Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Benefits owed to employees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2320',
        name: 'PAYE Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Pay As You Earn income tax (SA/UK)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2330',
        name: 'UIF Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Unemployment Insurance Fund (South Africa)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2340',
        name: 'SDL Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Skills Development Levy (South Africa)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2350',
        name: 'Pension / Provident Fund Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Retirement fund contributions payable',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2360',
        name: 'Withholding Tax Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Tax withheld on payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2370',
        name: 'Advance Payments from Customers',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Customer prepayments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2380',
        name: 'Accrued Salaries & Wages',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Salaries earned but not yet paid',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2390',
        name: 'Accrued Vacation/Leave Pay',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Vacation liability',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2430',
        name: 'Customer Deposits - Returnable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Refundable customer deposits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2440',
        name: 'Warranty Provisions',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Product warranty obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2450',
        name: 'Short-term Notes Payable',
        type: 'liability',
        subType: 'Current Liabilities',
        description: 'Short-term loans and notes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2500',
        name: 'Long-term Notes Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Long-term debt obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2550',
        name: 'Bonds Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Corporate bonds issued',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2560',
        name: 'Debentures Payable',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Unsecured debt securities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2570',
        name: 'Related Party Loans',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Loans from related parties',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2580',
        name: 'Shareholder Loans',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Loans from shareholders',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2590',
        name: 'Lease Liabilities - IFRS 16',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Right-of-use asset lease obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '2650',
        name: 'Deferred Revenue - Long-term',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Revenue deferred beyond 1 year',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '2700',
        name: 'Deferred Tax Liability',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Future tax obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '2750',
        name: 'Pension Liability',
        type: 'liability',
        subType: 'Long-term Liabilities',
        description: 'Defined benefit pension obligations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '3000',
        name: 'Owner\'s Capital / Shareholders\' Equity',
        type: 'equity',
        subType: 'Equity',
        description: 'Owner or shareholder investment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '3010',
        name: 'Common Stock',
        type: 'equity',
        subType: 'Equity',
        description: 'Ordinary shares issued',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3020',
        name: 'Preferred Stock / Preference Shares',
        type: 'equity',
        subType: 'Equity',
        description: 'Preferred equity shares',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '3100',
        name: 'Owner\'s Draws / Dividends',
        type: 'equity',
        subType: 'Equity',
        description: 'Money withdrawn by owners',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '3110',
        name: 'Share Premium',
        type: 'equity',
        subType: 'Equity',
        description: 'Amount received above par value',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3120',
        name: 'Additional Paid-in Capital',
        type: 'equity',
        subType: 'Equity',
        description: 'Capital in excess of par',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '3200',
        name: 'Retained Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Cumulative profits retained in business',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3300',
        name: 'Treasury Stock',
        type: 'equity',
        subType: 'Equity',
        description: 'Repurchased company shares (Contra Equity)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3400',
        name: 'Retained Earnings - Appropriated',
        type: 'equity',
        subType: 'Equity',
        description: 'Reserved retained earnings',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3500',
        name: 'Revaluation Reserve',
        type: 'equity',
        subType: 'Equity',
        description: 'Asset revaluation surplus',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '3510',
        name: 'Foreign Currency Translation Reserve',
        type: 'equity',
        subType: 'Equity',
        description: 'Currency translation adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '3600',
        name: 'Capital Redemption Reserve',
        type: 'equity',
        subType: 'Equity',
        description: 'Reserve for share redemptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3700',
        name: 'Accumulated Other Comprehensive Income',
        type: 'equity',
        subType: 'Equity',
        description: 'OCI accumulated',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '3900',
        name: 'Current Year Earnings',
        type: 'equity',
        subType: 'Equity',
        description: 'Profit/loss for current year (System Account)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4000',
        name: 'Service Revenue',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue from primary services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit',
        children: [
      {
        code: '4050',
        name: 'Sales Revenue - Export',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'International sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4060',
        name: 'Sales Revenue - Domestic',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Local market sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      }
        ]
      },
      {
        code: '4150',
        name: 'Commission Income',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Commissions earned',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4250',
        name: 'Consulting Income',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Consulting services revenue',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4350',
        name: 'Rental Income - Property',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Real estate rental income',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4360',
        name: 'Rental Income - Equipment',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Equipment rental income',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4450',
        name: 'Management Fees',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Management service fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4550',
        name: 'Franchise Fees',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Franchise income',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4650',
        name: 'Royalty Income',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Royalties received',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4750',
        name: 'Dividend Income',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Dividends from investments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4850',
        name: 'Other Income - Miscellaneous',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Other revenue sources',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '4900',
        name: 'Discounts & Adjustments',
        type: 'revenue',
        subType: 'Operating Revenue',
        description: 'Revenue reductions (Contra Revenue)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'credit'
      },
      {
        code: '5000',
        name: 'Cost of Goods/Services Sold',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct costs of revenue generation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '5050',
        name: 'Purchases - General',
        type: 'expense',
        subType: 'COGS',
        description: 'General inventory purchases',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5060',
        name: 'Purchases - Raw Materials',
        type: 'expense',
        subType: 'COGS',
        description: 'Raw material purchases',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5070',
        name: 'Purchases - Components',
        type: 'expense',
        subType: 'COGS',
        description: 'Component parts purchases',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '5150',
        name: 'Freight & Delivery on Purchases',
        type: 'expense',
        subType: 'COGS',
        description: 'Inbound freight costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5250',
        name: 'Direct Labour - Production',
        type: 'expense',
        subType: 'COGS',
        description: 'Manufacturing labor costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5350',
        name: 'Production Supplies',
        type: 'expense',
        subType: 'COGS',
        description: 'Factory consumables',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5450',
        name: 'Packaging Materials - Direct',
        type: 'expense',
        subType: 'COGS',
        description: 'Product packaging costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5550',
        name: 'Gas Cylinder Costs - Direct',
        type: 'expense',
        subType: 'COGS',
        description: 'Direct gas/cylinder costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5650',
        name: 'Purchase Returns & Allowances',
        type: 'expense',
        subType: 'COGS',
        description: 'Returns to suppliers (Contra COGS)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5750',
        name: 'Opening Inventory',
        type: 'expense',
        subType: 'COGS',
        description: 'Beginning inventory balance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '5850',
        name: 'Closing Inventory',
        type: 'expense',
        subType: 'COGS',
        description: 'Ending inventory balance (Contra COGS)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6000',
        name: 'Salaries - Management',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Management salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6010',
        name: 'Salaries - Staff',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6015',
        name: 'Salaries - Supervisors',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Supervisor salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6025',
        name: 'Salaries - Operations',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Operations staff salaries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6050',
        name: 'Payroll Taxes',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employer portion of payroll taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6060',
        name: 'Employee Benefits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Health insurance, retirement, etc.',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6070',
        name: 'Workers Compensation Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work injury insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6100',
        name: 'Overtime Pay',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee overtime',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6110',
        name: 'Bonuses & Incentives',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Performance bonuses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6120',
        name: 'Employee Commissions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Sales commissions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6150',
        name: 'Recruitment Costs',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Hiring and recruitment',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6160',
        name: 'Staff Welfare & Refreshments',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee welfare expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6170',
        name: 'Staff Events / Team Building',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Team building activities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6180',
        name: 'Uniforms & Safety Gear',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Work uniforms and PPE',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6190',
        name: 'Staff Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6250',
        name: 'Temporary Staff / Contract Labor',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Temporary workers',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6300',
        name: 'Rent',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Facility rent/lease payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6310',
        name: 'Common Area Maintenance (CAM)',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Shared facility costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6330',
        name: 'Utilities - Electric',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Electrical utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6340',
        name: 'Utilities - Water',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Water and sewer',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6350',
        name: 'Utilities - Gas',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Natural gas utilities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6360',
        name: 'Utilities - Waste Removal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Garbage and waste disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6365',
        name: 'Cleaning & Sanitation',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Cleaning services and supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6370',
        name: 'Security Services',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Security guard services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6380',
        name: 'Pest Control Services',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Pest management',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6390',
        name: 'Landscaping & Maintenance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Grounds maintenance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6400',
        name: 'Office Supplies',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6405',
        name: 'Printing & Stationery',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Printing and office supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6415',
        name: 'Postage & Courier',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Mail and courier services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6420',
        name: 'Telephone & Internet',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Phone and internet services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6425',
        name: 'Subscriptions & Memberships',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Professional memberships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6435',
        name: 'Legal Fees - General',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6440',
        name: 'Bank Service Charges',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank fees and charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6445',
        name: 'Legal Fees - Litigation',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Lawsuit and litigation costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6450',
        name: 'Credit Card Processing Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Merchant services fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6455',
        name: 'Audit & Compliance Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'External audit costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6460',
        name: 'Professional Fees - Accounting',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Accounting and bookkeeping',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6465',
        name: 'Consulting Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business consulting',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6470',
        name: 'Professional Fees - Legal',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Legal services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6475',
        name: 'Bank Interest & Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Bank service charges and interest',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6480',
        name: 'Business Licenses & Permits',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Required licenses and permits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6500',
        name: 'Insurance - General Liability',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'General liability coverage',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6510',
        name: 'Insurance - Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Property insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6600',
        name: 'Advertising & Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Marketing and advertising expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6610',
        name: 'Website & Digital Marketing',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Online presence and marketing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6620',
        name: 'Sales Commissions - External',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Third-party sales commissions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6630',
        name: 'Promotions & Sponsorships',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Promotional activities',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6640',
        name: 'Customer Entertainment',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Client entertainment expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6650',
        name: 'Trade Shows & Exhibitions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Exhibition costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6660',
        name: 'Market Research',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Market research expenses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6800',
        name: 'Software Subscriptions',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Software and SaaS subscriptions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6810',
        name: 'IT Support',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Technology support services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6815',
        name: 'Computer Repairs & Maintenance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'IT equipment repairs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6825',
        name: 'IT Equipment Rental',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Rented IT hardware',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6835',
        name: 'Domain & Hosting Fees',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Web domain and hosting',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6845',
        name: 'Cloud Services',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Cloud computing services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6855',
        name: 'Data Backup & Security',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Data protection services',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '6900',
        name: 'Travel & Meals',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Business travel and meals',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '6910',
        name: 'Fuel & Vehicle Expenses',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Vehicle fuel costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6920',
        name: 'Vehicle Repairs & Maintenance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Vehicle servicing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6930',
        name: 'Vehicle Insurance',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Auto insurance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6940',
        name: 'Vehicle Registration & Licenses',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Vehicle licensing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6950',
        name: 'Training & Development',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Employee training',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6960',
        name: 'Parking & Tolls',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Parking fees and road tolls',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6970',
        name: 'Workshop Consumables',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Shop floor supplies',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6980',
        name: 'Safety & Compliance Costs',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Safety compliance',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '6990',
        name: 'Franchise Fees - Paid',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Franchise fees expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7000',
        name: 'Interest Income',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Interest earned on bank accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '7050',
        name: 'Miscellaneous Operating Expenses',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Other operating costs',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7100',
        name: 'Interest Income - Investments',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Investment interest',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '7150',
        name: 'Dividend Income - Investments',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Investment dividends',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7200',
        name: 'Investment Income - Other',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Other investment gains',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '7250',
        name: 'Rental Income - Investment Property',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Investment property rent',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7300',
        name: 'Gain on Sale of Assets',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Profit from asset sales',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '7350',
        name: 'Gain on Sale of Investments',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Investment sale profits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7400',
        name: 'Foreign Exchange Gains',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Currency exchange profits',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '7450',
        name: 'Fair Value Adjustments - Gains',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Fair value increases',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '7550',
        name: 'Insurance Claim Proceeds',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Insurance recoveries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '7650',
        name: 'Scrap Sales',
        type: 'expense',
        subType: 'Operating Expenses',
        description: 'Sale of scrap materials',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8000',
        name: 'Interest Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Interest paid on loans',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8050',
        name: 'Interest Expense - Bonds',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Bond interest expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8060',
        name: 'Interest Expense - Lease Liabilities',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Lease interest (IFRS 16)',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8100',
        name: 'Bank Charges - Other',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Miscellaneous bank fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8150',
        name: 'Finance Charges',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Financing fees',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8200',
        name: 'Depreciation Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset depreciation',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8210',
        name: 'Amortization Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Intangible asset amortization',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8250',
        name: 'Impairment Loss - Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Asset impairment charges',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8300',
        name: 'Loss on Disposal of Assets',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Loss from asset disposal',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8350',
        name: 'Loss on Sale of Investments',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Investment sale losses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8400',
        name: 'Foreign Exchange Losses',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Currency exchange losses',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8450',
        name: 'Fair Value Adjustments - Losses',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Fair value decreases',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8500',
        name: 'Bad Debt Expense',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Uncollectible accounts expense',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8550',
        name: 'Donation Expense - Unclaimed Inventory',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donated inventory write-off',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '8610',
        name: 'Penalties & Fines',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Regulatory penalties',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8650',
        name: 'Legal Settlements',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Settlement payments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8700',
        name: 'Charitable Contributions',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Donations and sponsorships',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8800',
        name: 'Income Tax Expense - Federal',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Federal income taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '8810',
        name: 'Income Tax Expense - State/Provincial',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'State or provincial taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '8820',
        name: 'Income Tax Expense - Local',
        type: 'expense',
        subType: 'Other Expenses & Tax',
        description: 'Local or municipal taxes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9000',
        name: 'Other Comprehensive Income',
        type: 'expense',
        subType: 'Special',
        description: 'OCI items',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9100',
        name: 'Contra Accounts',
        type: 'expense',
        subType: 'Special',
        description: 'Offsetting accounts',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9200',
        name: 'Revaluation Gains - PPE',
        type: 'expense',
        subType: 'Special',
        description: 'Property revaluation increases',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '9210',
        name: 'Actuarial Gains/Losses - Pensions',
        type: 'expense',
        subType: 'Special',
        description: 'Pension plan adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9220',
        name: 'Foreign Currency Translation Adjustments',
        type: 'expense',
        subType: 'Special',
        description: 'Foreign operation translations',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9300',
        name: 'Unrealized Gains/Losses on Investments',
        type: 'expense',
        subType: 'Special',
        description: 'Investment fair value changes',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9400',
        name: 'Suspense Account',
        type: 'expense',
        subType: 'Special',
        description: 'Temporary unallocated transactions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit',
        children: [
      {
        code: '9410',
        name: 'Intercompany Control Account',
        type: 'expense',
        subType: 'Special',
        description: 'Related party transactions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9420',
        name: 'Loan Clearing Account',
        type: 'expense',
        subType: 'Special',
        description: 'Loan transaction clearing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9430',
        name: 'Payroll Clearing Account',
        type: 'expense',
        subType: 'Special',
        description: 'Payroll processing clearing',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9440',
        name: 'VAT Control Account',
        type: 'expense',
        subType: 'Special',
        description: 'VAT reconciliation control',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
        ]
      },
      {
        code: '9500',
        name: 'General Journal Adjustments',
        type: 'expense',
        subType: 'Special',
        description: 'Manual journal entries',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9600',
        name: 'Year-End Provisions',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end accruals and provisions',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9700',
        name: 'Prior Period Adjustments',
        type: 'expense',
        subType: 'Special',
        description: 'Corrections of prior periods',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9800',
        name: 'Discontinued Operations',
        type: 'expense',
        subType: 'Special',
        description: 'Results from discontinued ops',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      },
      {
        code: '9900',
        name: 'Year-end Adjusting Entries',
        type: 'expense',
        subType: 'Special',
        description: 'Year-end adjustments',
        isRequired: true,
        isCommon: true,
        normalBalance: 'debit'
      }
    ],

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: [
  {
    "name": "Revenue Growth",
    "formula": "(Current Revenue - Previous Revenue) / Previous Revenue",
    "accounts": [
      "4000"
    ],
    "importance": "critical"
  },
  {
    "name": "Gross Margin",
    "formula": "(Revenue - COGS) / Revenue",
    "accounts": [
      "4000",
      "5000"
    ],
    "importance": "critical"
  }
],

  reportingRequirements: [
  "Monthly Financial Statements",
  "Quarterly Tax Returns",
  "Annual Audit"
],

  regulatoryCompliance: []
};

/**
 * All generated industry templates
 */
export const GENERATED_INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  'restaurant': RESTAURANT_TEMPLATE,
  'saas': SAAS_TEMPLATE,
  'professional-services': PROFESSIONAL_SERVICES_TEMPLATE,
  'cleaning-services': CLEANING_SERVICES_TEMPLATE,
  'financial-services': FINANCIAL_SERVICES_TEMPLATE,
  'consulting': CONSULTING_TEMPLATE,
  'pest-control': PEST_CONTROL_TEMPLATE,
  'retail': RETAIL_TEMPLATE,
  'beauty-services': BEAUTY_SERVICES_TEMPLATE,
  'barbershop': BARBERSHOP_TEMPLATE,
  'nail-salon': NAIL_SALON_TEMPLATE,
  'pharmacy': PHARMACY_TEMPLATE,
  'medical-practice': MEDICAL_PRACTICE_TEMPLATE,
  'education': EDUCATION_TEMPLATE,
  'general-dealers': GENERAL_DEALERS_TEMPLATE,
  'automation': AUTOMATION_TEMPLATE,
  'printing': PRINTING_TEMPLATE,
  'event-management': EVENT_MANAGEMENT_TEMPLATE,
  'law-firms': LAW_FIRMS_TEMPLATE,
  'universal': UNIVERSAL_TEMPLATE
};
