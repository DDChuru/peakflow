import { INDUSTRY_TEMPLATES, type COATemplate, type IndustryTemplate } from './industry-knowledge-base';

export const BANK_TERMS = [
  { term: 'bank', label: 'Bank' },
  { term: 'cash', label: 'Cash' },
  { term: 'checking', label: 'Checking' },
  { term: 'savings', label: 'Savings' },
  { term: 'operating', label: 'Operating' },
  { term: 'payroll', label: 'Payroll' },
  { term: 'treasury', label: 'Treasury' },
  { term: 'clearing', label: 'Clearing' },
  { term: 'stripe', label: 'Stripe' },
  { term: 'square', label: 'Square' },
  { term: 'paypal', label: 'PayPal' },
  { term: 'merchant', label: 'Merchant' },
  { term: 'processor', label: 'Processor' },
  { term: 'payment', label: 'Payments' },
  { term: 'deposit', label: 'Deposits' },
  { term: 'pos', label: 'POS' },
  { term: 'till', label: 'Till' },
  { term: 'drawer', label: 'Drawer' },
  { term: 'online', label: 'Online' },
  { term: 'gateway', label: 'Gateway' },
  { term: 'credit card', label: 'Credit Card' },
];

export type AccountType = COATemplate['type'];

export interface IndustryShowcaseAccountRow {
  code: string;
  name: string;
  type: AccountType;
  subType?: string;
  description?: string;
  normalBalance: 'debit' | 'credit';
  isRequired: boolean;
  isCommon: boolean;
  taxRelevant?: boolean;
  typicalTransactionVolume?: COATemplate['typicalTransactionVolume'];
  mappingKeywords: string[];
  parentCode?: string;
  depth: number;
  tags: string[];
  bankLinked: boolean;
}

export interface IndustryShowcaseStats {
  totalAccounts: number;
  requiredAccounts: number;
  commonAccounts: number;
  byType: Record<AccountType, number>;
  bankLinkedCount: number;
  bankTags: string[];
}

export interface IndustryShowcaseDataset {
  industry: Pick<IndustryTemplate, 'id' | 'name' | 'description' | 'category'>;
  accounts: IndustryShowcaseAccountRow[];
  bankLinkedAccounts: IndustryShowcaseAccountRow[];
  stats: IndustryShowcaseStats;
}

function collectBankTags(name: string, keywords: string[] = []): string[] {
  const haystack = `${name} ${keywords.join(' ')}`.toLowerCase();

  const tags = BANK_TERMS.filter(({ term }) => haystack.includes(term)).map(({ label }) => label);

  return Array.from(new Set(tags));
}

function flattenAccounts(
  accounts: COATemplate[],
  depth = 0,
  parentCode?: string
): IndustryShowcaseAccountRow[] {
  return accounts.flatMap((account) => {
    const mappingKeywords = account.mappingKeywords ?? [];
    const tags = collectBankTags(account.name, mappingKeywords);

    const row: IndustryShowcaseAccountRow = {
      code: account.code,
      name: account.name,
      type: account.type,
      subType: account.subType,
      description: account.description,
      normalBalance: account.normalBalance,
      isRequired: account.isRequired,
      isCommon: account.isCommon,
      taxRelevant: account.taxRelevant,
      typicalTransactionVolume: account.typicalTransactionVolume,
      mappingKeywords,
      parentCode,
      depth,
      tags,
      bankLinked: tags.length > 0,
    };

    const children = account.children ? flattenAccounts(account.children, depth + 1, account.code) : [];

    return [row, ...children];
  });
}

function computeStats(accounts: IndustryShowcaseAccountRow[]): IndustryShowcaseStats {
  const byType = accounts.reduce<Record<AccountType, number>>((acc, account) => {
    acc[account.type] = (acc[account.type] ?? 0) + 1;
    return acc;
  }, { asset: 0, liability: 0, equity: 0, revenue: 0, expense: 0 });

  const bankLinkedAccounts = accounts.filter((account) => account.bankLinked);

  return {
    totalAccounts: accounts.length,
    requiredAccounts: accounts.filter((account) => account.isRequired).length,
    commonAccounts: accounts.filter((account) => account.isCommon).length,
    byType,
    bankLinkedCount: bankLinkedAccounts.length,
    bankTags: Array.from(new Set(bankLinkedAccounts.flatMap((account) => account.tags))).sort(),
  };
}

export function prepareIndustryShowcaseData(industryId: string): IndustryShowcaseDataset {
  const template = INDUSTRY_TEMPLATES[industryId];

  if (!template) {
    throw new Error(`Industry template not found: ${industryId}`);
  }

  const accounts = flattenAccounts(template.chartOfAccounts);

  const stats = computeStats(accounts);

  return {
    industry: {
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
    },
    accounts,
    bankLinkedAccounts: accounts.filter((account) => account.bankLinked),
    stats,
  };
}

export function getAllIndustryShowcaseData(): IndustryShowcaseDataset[] {
  return Object.keys(INDUSTRY_TEMPLATES).map((industryId) => prepareIndustryShowcaseData(industryId));
}

export function formatAccountType(account: IndustryShowcaseAccountRow): string {
  if (!account.subType) {
    return account.type.charAt(0).toUpperCase() + account.type.slice(1);
  }

  return `${account.subType.charAt(0).toUpperCase() + account.subType.slice(1)} ${account.type}`;
}

export function formatNormalBalance(balance: 'debit' | 'credit'): string {
  return balance.charAt(0).toUpperCase() + balance.slice(1);
}
