import { AccountTemplate } from './chart-of-accounts';

export interface ChartTemplate {
  id: string;
  name: string;
  description: string;
  currency: string;
  accounts: AccountTemplate[];
}

export const BASE_GAAP_TEMPLATE: ChartTemplate = {
  id: 'base-gaap',
  name: 'Base GAAP Template',
  description: 'Standard five-section chart of accounts aligned with US GAAP.',
  currency: 'USD',
  accounts: [
    {
      id: '1000',
      name: 'Cash and Cash Equivalents',
      type: 'asset',
      description: 'Operating cash, petty cash, and short-term equivalents.',
      metadata: {
        normalBalance: 'debit',
        isPostingAllowed: true,
      },
    },
    {
      id: '1100',
      name: 'Accounts Receivable',
      type: 'asset',
      description: 'Trade receivables from customers.',
      metadata: {
        normalBalance: 'debit',
        isPostingAllowed: true,
      },
    },
    {
      id: '1200',
      name: 'Prepaid Expenses',
      type: 'asset',
      metadata: {
        normalBalance: 'debit',
        isPostingAllowed: true,
      },
    },
    {
      id: '2000',
      name: 'Accounts Payable',
      type: 'liability',
      metadata: {
        normalBalance: 'credit',
        isPostingAllowed: true,
      },
    },
    {
      id: '2100',
      name: 'Accrued Expenses',
      type: 'liability',
      metadata: {
        normalBalance: 'credit',
        isPostingAllowed: true,
      },
    },
    {
      id: '3000',
      name: 'Owners Equity',
      type: 'equity',
      metadata: {
        normalBalance: 'credit',
        isPostingAllowed: true,
      },
    },
    {
      id: '3100',
      name: 'Retained Earnings',
      type: 'equity',
      metadata: {
        normalBalance: 'credit',
        isPostingAllowed: true,
      },
    },
    {
      id: '4000',
      name: 'Sales Revenue',
      type: 'revenue',
      metadata: {
        normalBalance: 'credit',
        isPostingAllowed: true,
      },
    },
    {
      id: '4200',
      name: 'Service Revenue',
      type: 'revenue',
      metadata: {
        normalBalance: 'credit',
        isPostingAllowed: true,
      },
    },
    {
      id: '5000',
      name: 'Cost of Goods Sold',
      type: 'expense',
      metadata: {
        normalBalance: 'debit',
        isPostingAllowed: true,
      },
    },
    {
      id: '5100',
      name: 'Operating Expenses',
      type: 'expense',
      metadata: {
        normalBalance: 'debit',
        isPostingAllowed: true,
      },
    },
  ],
};

export const AVAILABLE_CHART_TEMPLATES: ChartTemplate[] = [BASE_GAAP_TEMPLATE];
