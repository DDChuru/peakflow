/**
 * Pharmaceutical & Healthcare Industry Templates
 * Pharmacies, medical supplies, healthcare services, and medical practices
 */

import { IndustryTemplate, COATemplate, TransactionPattern, VendorMapping } from './industry-knowledge-base';

/**
 * Pharmaceutical/Pharmacy Template
 * Covers: Retail pharmacies, compounding pharmacies, medical supply stores
 */
export const PHARMACY_TEMPLATE: IndustryTemplate = {
  id: 'pharmacy',
  name: 'Pharmacy & Medical Supply',
  description: 'Retail pharmacies, compounding pharmacies, medical supply stores, and pharmaceutical services',
  category: 'healthcare',
  typicalRevenueSources: ['Prescription Sales', 'OTC Sales', 'Medical Supplies', 'Insurance Reimbursements', 'Vaccination Services'],
  typicalExpenseCategories: ['Drug Purchases', 'Pharmacist Salaries', 'Insurance Processing', 'Compliance', 'Storage'],

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
        { code: '1020', name: 'Controlled Substance Safe', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SAFE', 'CONTROLLED'] },
        { code: '1030', name: 'Credit Card Clearing', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CREDIT CARD', 'MERCHANT'] },
        { code: '1100', name: 'Accounts Receivable', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RECEIVABLE'] },
        { code: '1110', name: 'Insurance Receivables', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['INSURANCE CLAIM', 'PBM'] },
        { code: '1120', name: 'Medicare/Medicaid Receivables', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['MEDICARE', 'MEDICAID', 'CMS'] },
        { code: '1130', name: 'Copay Receivables', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['COPAY', 'PATIENT'] },
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
        { code: '1310', name: 'Prescription Drug Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RX INVENTORY', 'PRESCRIPTION', 'DRUG'] },
        { code: '1320', name: 'Generic Drug Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['GENERIC', 'DRUG'] },
        { code: '1330', name: 'Brand Drug Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['BRAND', 'DRUG'] },
        { code: '1340', name: 'Controlled Substance Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CONTROLLED', 'SCHEDULE', 'DEA'] },
        { code: '1350', name: 'OTC Product Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['OTC', 'OVER THE COUNTER'] },
        { code: '1360', name: 'Medical Supply Inventory', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['MEDICAL SUPPLY', 'DME', 'DEVICE'] },
        { code: '1370', name: 'Compounding Supplies', type: 'asset', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['COMPOUND', 'RAW MATERIAL'] },
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
        { code: '1510', name: 'Pharmacy Equipment', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['EQUIPMENT', 'COUNTER', 'SCALE'] },
        { code: '1520', name: 'Compounding Equipment', type: 'asset', isRequired: false, isCommon: true, normalBalance: 'debit', mappingKeywords: ['COMPOUND EQUIPMENT', 'HOOD'] },
        { code: '1530', name: 'Refrigeration Equipment', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['REFRIGERATOR', 'FREEZER', 'COLD STORAGE'] },
        { code: '1540', name: 'Security Systems', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SECURITY', 'CAMERA', 'ALARM', 'SAFE'] },
        { code: '1550', name: 'Pharmacy Software', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SOFTWARE', 'POS', 'RX SYSTEM'] },
        { code: '1560', name: 'Furniture & Fixtures', type: 'asset', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['FURNITURE', 'SHELVING', 'FIXTURE'] },
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
        { code: '2100', name: 'Accounts Payable', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['PAYABLE'] },
        { code: '2110', name: 'Drug Wholesaler Payable', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['WHOLESALER', 'MCKESSON', 'CARDINAL'] },
        { code: '2200', name: 'Insurance Claim Adjustments', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['CLAWBACK', 'ADJUSTMENT', 'CHARGEBACK'] },
        { code: '2300', name: 'Sales Tax Payable', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', taxRelevant: true, mappingKeywords: ['SALES TAX'] },
        { code: '2400', name: 'Patient Refunds Payable', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['REFUND', 'PATIENT'] },
        { code: '2500', name: 'DIR Fees Payable', type: 'liability', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['DIR FEE', 'PBM FEE'] },
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
        { code: '4100', name: 'Prescription Sales - Cash', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['RX SALE', 'PRESCRIPTION', 'CASH'] },
        { code: '4110', name: 'Prescription Sales - Insurance', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['INSURANCE PAYMENT', 'PBM', 'CLAIM'] },
        { code: '4120', name: 'Prescription Copays', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['COPAY', 'PATIENT PAY'] },
        { code: '4200', name: 'OTC Product Sales', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['OTC', 'OVER COUNTER', 'RETAIL'] },
        { code: '4300', name: 'Medical Supply Sales', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['DME', 'MEDICAL SUPPLY', 'DEVICE'] },
        { code: '4400', name: 'Vaccination Services', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['VACCINE', 'IMMUNIZATION', 'FLU SHOT'] },
        { code: '4500', name: 'MTM Services', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['MTM', 'MEDICATION THERAPY'] },
        { code: '4600', name: 'Compounding Revenue', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['COMPOUND', 'CUSTOM'] },
        { code: '4700', name: '340B Program Revenue', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['340B', 'DISCOUNT PROGRAM'] },
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
        { code: '5100', name: 'Prescription Drug Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['DRUG COST', 'RX PURCHASE'] },
        { code: '5110', name: 'Generic Drug Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['GENERIC COST'] },
        { code: '5120', name: 'Brand Drug Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['BRAND COST'] },
        { code: '5130', name: 'Controlled Substance Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CONTROLLED', 'DEA'] },
        { code: '5200', name: 'OTC Product Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['OTC COST'] },
        { code: '5300', name: 'Medical Supply Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SUPPLY COST', 'DME COST'] },
        { code: '5400', name: 'Vaccine Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['VACCINE COST'] },
        { code: '5500', name: 'Wholesaler Fees', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['WHOLESALER FEE', 'DELIVERY FEE'] },
        { code: '5600', name: 'DIR Fees', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['DIR', 'DIRECT INDIRECT'] },
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
        { code: '6100', name: 'Pharmacist Salaries', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['PHARMACIST', 'RPH SALARY'] },
        { code: '6110', name: 'Pharmacy Tech Wages', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['TECH', 'TECHNICIAN'] },
        { code: '6120', name: 'Cashier/Clerk Wages', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CASHIER', 'CLERK'] },
        { code: '6200', name: 'Pharmacy Rent', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['RENT', 'LEASE'] },
        { code: '6300', name: 'Professional Liability Insurance', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['LIABILITY', 'MALPRACTICE', 'E&O'] },
        { code: '6400', name: 'DEA Registration & Licenses', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['DEA', 'LICENSE', 'REGISTRATION', 'BOARD'] },
        { code: '6500', name: 'Pharmacy Software', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['SOFTWARE', 'PIONEER', 'COMPUTER RX'] },
        { code: '6600', name: 'PBM Processing Fees', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['PBM FEE', 'PROCESSING', 'TRANSACTION'] },
        { code: '6700', name: 'Compliance & Audits', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['AUDIT', 'COMPLIANCE', 'INSPECTION'] },
        { code: '6800', name: 'Continuing Education', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CE', 'EDUCATION', 'TRAINING'] },
        { code: '6900', name: 'Waste Disposal', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['WASTE', 'DISPOSAL', 'HAZARDOUS', 'SHARPS'] },
      ]
    }
  ],

  transactionPatterns: [
    {
      id: 'drug-wholesaler',
      pattern: 'MCKESSON|CARDINAL|AMERISOURCE|MORRIS.*DICKSON',
      patternType: 'regex',
      suggestedAccount: '5100',
      confidence: 0.98,
      frequency: 'daily',
      description: 'Drug wholesaler purchases',
      examples: ['MCKESSON DRUG', 'CARDINAL HEALTH', 'AMERISOURCEBERGEN'],
      averageAmount: { min: 5000, max: 50000 }
    },
    {
      id: 'insurance-payment',
      pattern: 'EXPRESS SCRIPTS|CVS CAREMARK|OPTUM RX|ANTHEM|BCBS',
      patternType: 'regex',
      suggestedAccount: '4110',
      confidence: 0.95,
      frequency: 'weekly',
      description: 'Insurance/PBM payments',
      examples: ['EXPRESS SCRIPTS PAYMENT', 'CVS CAREMARK REMIT'],
      averageAmount: { min: 10000, max: 100000 }
    },
    {
      id: 'medicare-payment',
      pattern: 'MEDICARE|CMS|PART D|MEDICAID',
      patternType: 'regex',
      suggestedAccount: '4110',
      confidence: 0.96,
      frequency: 'monthly',
      description: 'Medicare/Medicaid payments',
      examples: ['MEDICARE PART D', 'MEDICAID PAYMENT'],
      averageAmount: { min: 5000, max: 50000 }
    },
    {
      id: 'pharmacy-software',
      pattern: 'PIONEER|COMPUTER RX|LIBERTY|QS1|MICRO MERCHANT',
      patternType: 'regex',
      suggestedAccount: '6500',
      confidence: 0.94,
      frequency: 'monthly',
      description: 'Pharmacy management software',
      examples: ['PIONEER RX', 'COMPUTER RX MONTHLY'],
      averageAmount: { min: 200, max: 2000 }
    },
    {
      id: 'dea-license',
      pattern: 'DEA|STATE BOARD|PHARMACY BOARD|LICENSE',
      patternType: 'regex',
      suggestedAccount: '6400',
      confidence: 0.92,
      frequency: 'yearly',
      description: 'Licensing and registration fees',
      examples: ['DEA REGISTRATION', 'STATE BOARD LICENSE'],
      averageAmount: { min: 500, max: 3000 }
    },
    {
      id: 'dir-fees',
      pattern: 'DIR FEE|DIRECT.*INDIRECT|PBM FEE|CLAWBACK',
      patternType: 'regex',
      suggestedAccount: '5600',
      confidence: 0.90,
      frequency: 'monthly',
      description: 'DIR fees and PBM clawbacks',
      examples: ['DIR FEE ADJUSTMENT', 'PBM CLAWBACK'],
      averageAmount: { min: 1000, max: 10000 }
    },
    {
      id: 'vaccine-purchase',
      pattern: 'VACCINE|MERCK VACCINE|SANOFI|GLAXO|PFIZER VAX',
      patternType: 'regex',
      suggestedAccount: '5400',
      confidence: 0.93,
      frequency: 'monthly',
      description: 'Vaccine purchases',
      examples: ['MERCK VACCINE ORDER', 'FLU VACCINE PURCHASE'],
      averageAmount: { min: 1000, max: 10000 }
    },
    {
      id: 'waste-disposal',
      pattern: 'STERICYCLE|WASTE MANAGEMENT|SHARPS|HAZARDOUS',
      patternType: 'regex',
      suggestedAccount: '6900',
      confidence: 0.91,
      frequency: 'monthly',
      description: 'Medical waste disposal',
      examples: ['STERICYCLE', 'SHARPS DISPOSAL SERVICE'],
      averageAmount: { min: 100, max: 500 }
    }
  ],

  commonVendors: [
    // Drug Wholesalers
    { vendorName: 'MCKESSON', alternateNames: ['MCKESSON DRUG', 'MCKESSON CORP'], defaultAccount: '5100', vendorType: 'Drug Wholesaler', isRecurring: true, paymentFrequency: 'daily' },
    { vendorName: 'CARDINAL HEALTH', alternateNames: ['CARDINAL'], defaultAccount: '5100', vendorType: 'Drug Wholesaler', isRecurring: true, paymentFrequency: 'daily' },
    { vendorName: 'AMERISOURCEBERGEN', alternateNames: ['AMERISOURCE', 'ABC'], defaultAccount: '5100', vendorType: 'Drug Wholesaler', isRecurring: true, paymentFrequency: 'daily' },
    { vendorName: 'MORRIS DICKSON', alternateNames: ['MD', 'MORRIS & DICKSON'], defaultAccount: '5100', vendorType: 'Drug Wholesaler', isRecurring: true, paymentFrequency: 'weekly' },

    // PBMs/Insurance
    { vendorName: 'EXPRESS SCRIPTS', alternateNames: ['ESI', 'CIGNA EXPRESS'], defaultAccount: '4110', vendorType: 'PBM', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'CVS CAREMARK', alternateNames: ['CAREMARK', 'CVS HEALTH'], defaultAccount: '4110', vendorType: 'PBM', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'OPTUM RX', alternateNames: ['OPTUM', 'UNITED HEALTH'], defaultAccount: '4110', vendorType: 'PBM', isRecurring: true, paymentFrequency: 'weekly' },

    // Software Vendors
    { vendorName: 'PIONEER RX', alternateNames: ['PIONEER'], defaultAccount: '6500', vendorType: 'Software', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'COMPUTER RX', alternateNames: ['CRX'], defaultAccount: '6500', vendorType: 'Software', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'LIBERTY SOFTWARE', alternateNames: ['LIBERTY'], defaultAccount: '6500', vendorType: 'Software', isRecurring: true, paymentFrequency: 'monthly' },

    // Other Services
    { vendorName: 'STERICYCLE', defaultAccount: '6900', vendorType: 'Waste Disposal', isRecurring: true, paymentFrequency: 'monthly' },
    { vendorName: 'DEA', alternateNames: ['DRUG ENFORCEMENT'], defaultAccount: '6400', vendorType: 'Government', isRecurring: true, paymentFrequency: 'yearly' },
  ],

  kpis: [
    {
      name: 'Gross Margin',
      formula: '((Revenue - COGS) / Revenue) * 100',
      accounts: ['4000', '5000'],
      benchmarkRange: { min: 20, max: 25 },
      importance: 'critical'
    },
    {
      name: 'Generic Dispensing Rate',
      formula: '(Generic Scripts / Total Scripts) * 100',
      accounts: ['5110', '5100'],
      benchmarkRange: { min: 85, max: 95 },
      importance: 'critical'
    },
    {
      name: 'Inventory Turnover',
      formula: 'COGS / Average Inventory',
      accounts: ['5000', '1310'],
      benchmarkRange: { min: 10, max: 15 },
      importance: 'critical'
    },
    {
      name: 'DIR Fee Impact',
      formula: '(DIR Fees / Gross Profit) * 100',
      accounts: ['5600', '4000'],
      benchmarkRange: { min: 5, max: 15 },
      importance: 'important'
    },
    {
      name: 'Cash to Insurance Ratio',
      formula: 'Cash Sales / Insurance Sales',
      accounts: ['4100', '4110'],
      benchmarkRange: { min: 0.1, max: 0.3 },
      importance: 'important'
    },
    {
      name: 'Scripts per Day',
      formula: 'Total Prescriptions / Operating Days',
      accounts: [],
      benchmarkRange: { min: 100, max: 300 },
      importance: 'critical'
    }
  ],

  reportingRequirements: [
    'Daily Script Count Report',
    'Insurance Aging Report',
    'Controlled Substance Log',
    'Inventory Valuation Report',
    'DIR Fee Reconciliation',
    'Expired Drug Report',
    'PBM Audit Report',
    '340B Program Report'
  ],

  regulatoryCompliance: [
    'DEA Registration',
    'State Board of Pharmacy License',
    'Controlled Substance Compliance',
    'HIPAA Compliance',
    'USP 795/797/800 Standards',
    'Medicare Part D Compliance',
    'DSCSA Track and Trace',
    '340B Program Compliance'
  ]
};

/**
 * Medical Practice Template
 * For clinics, doctor offices, and healthcare providers
 */
export const MEDICAL_PRACTICE_TEMPLATE: IndustryTemplate = {
  id: 'medical-practice',
  name: 'Medical Practice & Clinic',
  description: 'Medical practices, clinics, urgent care, and healthcare providers',
  category: 'healthcare',
  typicalRevenueSources: ['Patient Services', 'Insurance Billing', 'Lab Services', 'Procedures', 'Telemedicine'],
  typicalExpenseCategories: ['Medical Staff', 'Medical Supplies', 'Equipment', 'Insurance', 'Lab Costs'],

  chartOfAccounts: [
    // Revenue accounts specific to medical practices
    {
      code: '4000',
      name: 'Revenue',
      type: 'revenue',
      isRequired: true,
      isCommon: true,
      normalBalance: 'credit',
      children: [
        { code: '4100', name: 'Patient Service Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['PATIENT', 'VISIT', 'CONSULTATION'] },
        { code: '4110', name: 'Insurance Reimbursements', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['INSURANCE', 'CLAIM', 'REIMBURSEMENT'] },
        { code: '4120', name: 'Medicare Reimbursements', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['MEDICARE', 'CMS'] },
        { code: '4130', name: 'Medicaid Reimbursements', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['MEDICAID'] },
        { code: '4200', name: 'Lab Service Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['LAB', 'TEST', 'DIAGNOSTIC'] },
        { code: '4300', name: 'Procedure Revenue', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['PROCEDURE', 'SURGERY', 'TREATMENT'] },
        { code: '4400', name: 'Telemedicine Revenue', type: 'revenue', isRequired: false, isCommon: true, normalBalance: 'credit', mappingKeywords: ['TELEHEALTH', 'VIRTUAL', 'REMOTE'] },
        { code: '4500', name: 'Vaccine Administration', type: 'revenue', isRequired: true, isCommon: true, normalBalance: 'credit', mappingKeywords: ['VACCINE', 'IMMUNIZATION'] },
      ]
    },

    // Medical-specific expenses
    {
      code: '6000',
      name: 'Operating Expenses',
      type: 'expense',
      isRequired: true,
      isCommon: true,
      normalBalance: 'debit',
      children: [
        { code: '6100', name: 'Physician Salaries', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['PHYSICIAN', 'DOCTOR', 'MD'] },
        { code: '6110', name: 'Nurse Salaries', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['NURSE', 'RN', 'LPN'] },
        { code: '6120', name: 'Medical Assistant Wages', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['MA', 'MEDICAL ASSISTANT'] },
        { code: '6200', name: 'Medical Supplies', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['MEDICAL SUPPLY', 'GLOVES', 'SYRINGES'] },
        { code: '6300', name: 'Lab Costs', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['LAB', 'LABCORP', 'QUEST'] },
        { code: '6400', name: 'Medical Malpractice Insurance', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['MALPRACTICE', 'LIABILITY'] },
        { code: '6500', name: 'EMR/EHR Software', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['EMR', 'EHR', 'EPIC', 'CERNER'] },
        { code: '6600', name: 'Medical Equipment Lease', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['EQUIPMENT LEASE', 'XRAY', 'ULTRASOUND'] },
        { code: '6700', name: 'Medical Waste Disposal', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['BIOHAZARD', 'MEDICAL WASTE', 'SHARPS'] },
        { code: '6800', name: 'CME/Training', type: 'expense', isRequired: true, isCommon: true, normalBalance: 'debit', mappingKeywords: ['CME', 'CONTINUING MEDICAL', 'TRAINING'] },
      ]
    }
  ],

  transactionPatterns: [
    {
      id: 'insurance-eob',
      pattern: 'ANTHEM|UNITED HEALTH|AETNA|CIGNA|HUMANA',
      patternType: 'regex',
      suggestedAccount: '4110',
      confidence: 0.95,
      frequency: 'weekly',
      description: 'Insurance EOB payments',
      examples: ['ANTHEM PAYMENT', 'UNITED HEALTHCARE EOB'],
      averageAmount: { min: 5000, max: 50000 }
    },
    {
      id: 'lab-service',
      pattern: 'LABCORP|QUEST DIAGNOSTICS|REFERENCE LAB',
      patternType: 'regex',
      suggestedAccount: '6300',
      confidence: 0.93,
      frequency: 'weekly',
      description: 'Laboratory service costs',
      examples: ['LABCORP INVOICE', 'QUEST DIAGNOSTICS'],
      averageAmount: { min: 500, max: 5000 }
    },
    {
      id: 'medical-supplies',
      pattern: 'HENRY SCHEIN|MCKESSON MEDICAL|MEDLINE|PSS',
      patternType: 'regex',
      suggestedAccount: '6200',
      confidence: 0.94,
      frequency: 'weekly',
      description: 'Medical supply purchases',
      examples: ['HENRY SCHEIN', 'MCKESSON MEDICAL SURGICAL'],
      averageAmount: { min: 500, max: 5000 }
    }
  ],

  commonVendors: [
    { vendorName: 'LABCORP', alternateNames: ['LABORATORY CORP'], defaultAccount: '6300', vendorType: 'Laboratory', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'QUEST DIAGNOSTICS', alternateNames: ['QUEST'], defaultAccount: '6300', vendorType: 'Laboratory', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'HENRY SCHEIN', defaultAccount: '6200', vendorType: 'Medical Supplies', isRecurring: true, paymentFrequency: 'weekly' },
    { vendorName: 'EPIC SYSTEMS', defaultAccount: '6500', vendorType: 'EMR Software', isRecurring: true, paymentFrequency: 'monthly' },
  ],

  kpis: [
    {
      name: 'Patient Revenue per Visit',
      formula: 'Total Revenue / Number of Visits',
      accounts: ['4100'],
      benchmarkRange: { min: 100, max: 300 },
      importance: 'critical'
    },
    {
      name: 'Collection Rate',
      formula: '(Collected / Billed) * 100',
      accounts: ['4110', '1110'],
      benchmarkRange: { min: 90, max: 98 },
      importance: 'critical'
    },
    {
      name: 'Days in AR',
      formula: 'AR Balance / (Annual Revenue / 365)',
      accounts: ['1110', '4000'],
      benchmarkRange: { min: 30, max: 50 },
      importance: 'critical'
    }
  ],

  reportingRequirements: [
    'Patient Visit Report',
    'Insurance Aging Report',
    'Procedure Analysis',
    'Provider Productivity',
    'Denial Management Report'
  ],

  regulatoryCompliance: [
    'HIPAA Compliance',
    'Medical Licensing',
    'OSHA Compliance',
    'CLIA Certification',
    'Medicare Compliance'
  ]
};

/**
 * Export pharmaceutical industry templates
 */
export const PHARMACEUTICAL_TEMPLATES = {
  'pharmacy': PHARMACY_TEMPLATE,
  'medical-practice': MEDICAL_PRACTICE_TEMPLATE
};