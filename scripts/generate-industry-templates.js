#!/usr/bin/env node

/**
 * Generate TypeScript Industry Templates from comprehensive_industry_coa (1).json
 *
 * This script converts the JSON COA data into TypeScript IndustryTemplate format
 * that can be used by the industry-template-service.ts
 *
 * Usage: node scripts/generate-industry-templates.js
 */

const fs = require('fs');
const path = require('path');

// Load the comprehensive JSON
const jsonPath = path.join(process.cwd(), 'comprehensive_industry_coa (1).json');
const coaData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

/**
 * Map account type from JSON to TypeScript enum
 */
function mapAccountType(accountType) {
  const mapping = {
    'Asset': 'asset',
    'Liability': 'liability',
    'Equity': 'equity',
    'Revenue': 'revenue',
    'Cost of Goods Sold': 'expense',
    'Operating Expense': 'expense',
    'Other Expense': 'expense',
    'Special Accounts': 'expense'
  };
  return mapping[accountType] || 'expense';
}

/**
 * Get normal balance based on account type
 */
function getNormalBalance(type) {
  return ['asset', 'expense'].includes(type) ? 'debit' : 'credit';
}

/**
 * Get parent account number (e.g., 1010 -> 1000)
 */
function getParentAccountNumber(accountNumber) {
  const num = parseInt(accountNumber);
  const parent = Math.floor(num / 100) * 100;
  return parent === num ? null : parent.toString().padStart(4, '0');
}

/**
 * Build hierarchical account tree
 */
function buildAccountTree(accounts) {
  // Group accounts by parent
  const accountMap = new Map();
  const rootAccounts = [];

  // First pass: create all account objects
  accounts.forEach(account => {
    const type = mapAccountType(account.accountType);
    const parentNumber = getParentAccountNumber(account.accountNumber);

    const accountObj = {
      code: account.accountNumber,
      name: account.accountName,
      type: type,
      description: account.description || '',
      isRequired: true,
      isCommon: true,
      normalBalance: getNormalBalance(type),
      children: []
    };

    // Add category as subType if available
    if (account.category) {
      accountObj.subType = account.category;
    }

    accountMap.set(account.accountNumber, {
      ...accountObj,
      parentNumber
    });
  });

  // Second pass: build hierarchy
  accountMap.forEach((account, code) => {
    if (!account.parentNumber) {
      // Root account
      rootAccounts.push(account);
    } else {
      // Child account - add to parent
      const parent = accountMap.get(account.parentNumber);
      if (parent) {
        parent.children.push(account);
      } else {
        // Parent doesn't exist, treat as root
        rootAccounts.push(account);
      }
    }
  });

  // Remove parentNumber from final output
  const cleanAccount = (acc) => {
    const { parentNumber, ...clean } = acc;
    if (clean.children && clean.children.length > 0) {
      clean.children = clean.children.map(cleanAccount);
    } else {
      delete clean.children;
    }
    return clean;
  };

  return rootAccounts.map(cleanAccount);
}

/**
 * Generate TypeScript code for an industry template
 */
function generateIndustryTemplate(industryId, industryData) {
  const accountTree = buildAccountTree(industryData.accounts);

  // Convert to TypeScript code
  const templateName = industryId.toUpperCase().replace(/-/g, '_') + '_TEMPLATE';

  let tsCode = `
/**
 * ${industryData.name} Industry Template
 * Generated from comprehensive_industry_coa (1).json
 * Total accounts: ${industryData.accounts.length}
 */
export const ${templateName}: IndustryTemplate = {
  id: '${industryId}',
  name: '${industryData.name}',
  description: '${industryData.description || industryData.name}',
  category: '${getCategoryForIndustry(industryId)}',
  typicalRevenueSources: ${JSON.stringify(getTypicalRevenue(industryId), null, 2)},
  typicalExpenseCategories: ${JSON.stringify(getTypicalExpenses(industryId), null, 2)},

  chartOfAccounts: ${formatAccountTree(accountTree, 2)},

  transactionPatterns: [
    // Transaction patterns can be added here based on industry-specific needs
  ],

  commonVendors: [
    // Common vendors can be added here based on industry-specific needs
  ],

  kpis: ${JSON.stringify(getKPIsForIndustry(industryId), null, 2)},

  reportingRequirements: ${JSON.stringify(getReportingRequirements(industryId), null, 2)},

  regulatoryCompliance: ${JSON.stringify(getRegulatoryCompliance(industryId), null, 2)}
};
`;

  return tsCode;
}

/**
 * Format account tree as TypeScript code
 */
function formatAccountTree(accounts, indent = 2) {
  const indentStr = '  '.repeat(indent);
  const childIndentStr = '  '.repeat(indent + 1);

  const formatAccount = (acc) => {
    let code = `${childIndentStr}{\n`;
    code += `${childIndentStr}  code: '${acc.code}',\n`;
    code += `${childIndentStr}  name: '${acc.name.replace(/'/g, "\\'")}',\n`;
    code += `${childIndentStr}  type: '${acc.type}',\n`;

    if (acc.subType) {
      code += `${childIndentStr}  subType: '${acc.subType.replace(/'/g, "\\'")}',\n`;
    }

    if (acc.description) {
      code += `${childIndentStr}  description: '${acc.description.replace(/'/g, "\\'")}',\n`;
    }

    code += `${childIndentStr}  isRequired: ${acc.isRequired},\n`;
    code += `${childIndentStr}  isCommon: ${acc.isCommon},\n`;
    code += `${childIndentStr}  normalBalance: '${acc.normalBalance}'`;

    if (acc.children && acc.children.length > 0) {
      code += `,\n${childIndentStr}  children: [\n`;
      code += acc.children.map(formatAccount).join(',\n');
      code += `\n${childIndentStr}  ]`;
    }

    code += `\n${childIndentStr}}`;
    return code;
  };

  return `[\n${accounts.map(formatAccount).join(',\n')}\n${indentStr}]`;
}

/**
 * Get category for industry (map to existing categories)
 */
function getCategoryForIndustry(industryId) {
  const categoryMap = {
    'restaurant': 'hospitality',
    'saas': 'technology',
    'professional-services': 'service',
    'cleaning-services': 'service',
    'financial-services': 'service',
    'consulting': 'service',
    'pest-control': 'service',
    'retail': 'retail',
    'beauty-services': 'service',
    'barbershop': 'service',
    'nail-salon': 'service',
    'pharmacy': 'healthcare',
    'medical-practice': 'healthcare',
    'education': 'service',
    'general-dealers': 'retail',
    'automation': 'manufacturing',
    'printing': 'manufacturing',
    'event-management': 'service',
    'law-firms': 'service',
    'universal': 'service'
  };
  return categoryMap[industryId] || 'service';
}

/**
 * Get typical revenue sources based on industry
 */
function getTypicalRevenue(industryId) {
  const revenueMap = {
    'restaurant': ['Food Sales', 'Beverage Sales', 'Catering', 'Delivery'],
    'saas': ['Subscription Revenue', 'Professional Services', 'API Usage'],
    'professional-services': ['Consulting Fees', 'Project Fees', 'Retainer Fees'],
    'cleaning-services': ['Contract Cleaning', 'One-Time Services', 'Specialized Cleaning'],
    'retail': ['Product Sales', 'Online Sales', 'In-Store Sales'],
    'pharmacy': ['Prescription Sales', 'OTC Sales', 'Medical Supplies'],
    'medical-practice': ['Patient Services', 'Procedures', 'Consultations'],
    'education': ['Tuition Fees', 'Registration Fees', 'Program Fees'],
    'law-firms': ['Legal Fees', 'Retainer Fees', 'Court Representation'],
    'default': ['Service Revenue', 'Product Sales', 'Other Income']
  };
  return revenueMap[industryId] || revenueMap['default'];
}

/**
 * Get typical expense categories based on industry
 */
function getTypicalExpenses(industryId) {
  const expenseMap = {
    'restaurant': ['Food Costs', 'Labor', 'Rent', 'Utilities'],
    'saas': ['Engineering', 'Sales & Marketing', 'Cloud Infrastructure'],
    'professional-services': ['Salaries', 'Office Expenses', 'Professional Development'],
    'cleaning-services': ['Supplies', 'Labor', 'Equipment', 'Transportation'],
    'retail': ['Inventory', 'Rent', 'Staffing', 'Marketing'],
    'default': ['Salaries', 'Rent', 'Utilities', 'Supplies']
  };
  return expenseMap[industryId] || expenseMap['default'];
}

/**
 * Get KPIs for industry
 */
function getKPIsForIndustry(industryId) {
  return [
    {
      name: 'Revenue Growth',
      formula: '(Current Revenue - Previous Revenue) / Previous Revenue',
      accounts: ['4000'],
      importance: 'critical'
    },
    {
      name: 'Gross Margin',
      formula: '(Revenue - COGS) / Revenue',
      accounts: ['4000', '5000'],
      importance: 'critical'
    }
  ];
}

/**
 * Get reporting requirements for industry
 */
function getReportingRequirements(industryId) {
  return [
    'Monthly Financial Statements',
    'Quarterly Tax Returns',
    'Annual Audit'
  ];
}

/**
 * Get regulatory compliance for industry
 */
function getRegulatoryCompliance(industryId) {
  const complianceMap = {
    'restaurant': ['Health Department', 'Food Safety'],
    'pharmacy': ['Board of Pharmacy', 'DEA', 'HIPAA'],
    'medical-practice': ['HIPAA', 'Medical Board'],
    'law-firms': ['Bar Association', 'Client Trust Accounting'],
    'default': []
  };
  return complianceMap[industryId] || complianceMap['default'];
}

/**
 * Main execution
 */
function main() {
  console.log('🏭 Generating Industry Templates from JSON...\n');

  let output = `/**
 * Comprehensive Industry Templates
 * Auto-generated from comprehensive_industry_coa (1).json
 * DO NOT EDIT MANUALLY - Run scripts/generate-industry-templates.js to regenerate
 */

import { IndustryTemplate } from './industry-knowledge-base';

`;

  const templateNames = [];

  // Generate each industry template
  Object.entries(coaData.industries).forEach(([industryId, industryData]) => {
    console.log(`Generating ${industryId} (${industryData.accounts.length} accounts)...`);
    output += generateIndustryTemplate(industryId, industryData);
    templateNames.push(industryId.toUpperCase().replace(/-/g, '_') + '_TEMPLATE');
  });

  // Generate export object
  output += `\n/**
 * All generated industry templates
 */
export const GENERATED_INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
`;

  Object.keys(coaData.industries).forEach((industryId, index) => {
    const templateName = industryId.toUpperCase().replace(/-/g, '_') + '_TEMPLATE';
    output += `  '${industryId}': ${templateName}`;
    if (index < Object.keys(coaData.industries).length - 1) {
      output += ',';
    }
    output += '\n';
  });

  output += '};\n';

  // Write to file
  const outputPath = path.join(process.cwd(), 'src/lib/accounting/industry-templates-generated.ts');
  fs.writeFileSync(outputPath, output);

  console.log(`\n✅ Generated ${Object.keys(coaData.industries).length} industry templates`);
  console.log(`📁 Output: ${outputPath}`);
  console.log('\nTemplates generated:');
  Object.entries(coaData.industries).forEach(([id, data]) => {
    console.log(`  - ${id.padEnd(25)} : ${data.name.padEnd(35)} (${data.accounts.length} accounts)`);
  });
}

main();
