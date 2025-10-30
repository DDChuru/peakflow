# Chart of Accounts Seeding Guide

## Overview

This project includes a comprehensive industry-specific Chart of Accounts (COA) with 20 pre-configured industries.

## Available Industries

| Industry ID | Industry Name | Account Count |
|-------------|---------------|---------------|
| `restaurant` | Restaurant | 67 accounts |
| `saas` | SaaS | 62 accounts |
| `professional-services` | Professional Services | 62 accounts |
| `cleaning-services` | Cleaning Services | 57 accounts |
| _(+ 16 more industries)_ | | |

## Usage

### 1. List Available Industries

```bash
npm run seed:charts:industry
```

This will show all available industries and their names.

### 2. Seed COA for a Company

```bash
npm run seed:charts:industry <companyId> <industry> [currency]
```

**Examples:**

```bash
# Seed restaurant COA for company ABC123
npm run seed:charts:industry ABC123 restaurant

# Seed SaaS COA with EUR currency
npm run seed:charts:industry XYZ789 saas EUR

# Seed professional services COA
npm run seed:charts:industry PROF456 professional-services ZAR
```

### 3. Direct Script Usage

```bash
node scripts/seed-industry-coa.js <companyId> <industry> [currency]
```

## Account Structure

### Account Numbering (1000-9999)

- **1000-1999**: Assets
  - 1000-1099: Cash & Cash Equivalents
  - 1100-1199: Accounts Receivable
  - 1200-1299: Inventory
  - 1300-1399: Prepaid Expenses
  - 1500-1899: Fixed Assets
  - 1900-1999: Accumulated Depreciation

- **2000-2999**: Liabilities
  - 2000-2099: Accounts Payable
  - 2100-2199: Credit Cards
  - 2200-2399: Accrued Liabilities
  - 2400-2499: Deferred Revenue
  - 2500-2999: Long-term Debt

- **3000-3999**: Equity
  - 3000-3099: Capital/Shareholders' Equity
  - 3100-3199: Draws/Dividends
  - 3200-3299: Retained Earnings
  - 3900: Current Year Earnings (System Account)

- **4000-4999**: Operating Revenue
  - 4000-4099: Primary Service Revenue
  - 4100-4899: Other Revenue Streams
  - 4900-4999: Discounts & Adjustments (Contra Revenue)

- **5000-5999**: Cost of Goods Sold (COGS)
  - Direct costs of revenue generation

- **6000-7999**: Operating Expenses
  - 6000-6099: Payroll & Benefits
  - 6300-6399: Rent & Utilities
  - 6400-6499: Office & Communication
  - 6500-6599: Insurance
  - 6600-6699: Marketing & Advertising
  - 6800-6899: Technology & IT
  - 6900-6999: Travel & Training
  - 7000-7999: Other Income

- **8000-8999**: Other Expenses & Income Tax
  - 8000-8099: Interest & Bank Charges
  - 8200-8299: Depreciation & Amortization
  - 8300-8799: Other Expenses
  - 8800-8899: Income Tax

- **9000-9999**: Special Accounts
  - 9000-9099: OCI (Other Comprehensive Income)
  - 9100-9199: Contra Accounts
  - 9900-9999: Year-end Adjustments

## Account Hierarchy

Accounts are organized hierarchically:

- **Depth 0** (Header accounts): 1000, 2000, 3000, etc.
  - Cannot post transactions directly
  - Summarize child accounts

- **Depth 1** (Sub-accounts): 1010, 1020, 2100, etc.
  - Can post transactions
  - Most commonly used

- **Depth 2** (Detail accounts): 1015, 2105, etc.
  - Granular tracking
  - Optional

## Data Structure

Each account includes:

```typescript
{
  code: "1000",                    // Account number
  name: "Cash - Operating Account", // Account name
  type: "asset",                   // asset|liability|equity|revenue|expense
  description: "Bank account for daily operations",
  category: "Current Assets",      // Stored in metadata.tags
  hierarchy: {
    parentId: null,                // Parent account code
    path: "1000",                  // Full path
    depth: 0                       // Hierarchy level
  },
  metadata: {
    normalBalance: "debit",        // debit|credit
    isPostingAllowed: false,       // Header accounts can't post
    isTaxRelevant: false,
    tags: ["Current Assets"]
  },
  isActive: true
}
```

## Backward Compatibility

✅ **100% backward compatible** with existing COA structure:
- All existing fields preserved
- `category` added as metadata tag
- Account numbering standardized (1000-9999)
- Old seeding script still works: `npm run seed:charts`

## Industry-Specific Features

### Restaurant
- Food & Beverage inventory accounts
- Tip tracking accounts
- Catering revenue
- Kitchen equipment depreciation

### SaaS
- Subscription revenue (monthly/annual)
- Deferred revenue (prepaid subscriptions)
- API costs
- Cloud hosting expenses

### Professional Services
- Unbilled receivables (work in progress)
- Project-based fees
- Retainer arrangements
- Subcontractor costs

### Cleaning Services
- Cleaning supplies inventory
- Equipment maintenance
- Site-specific revenue tracking
- Labor cost tracking

## Customization

After seeding, you can:
1. Add custom accounts via the UI
2. Deactivate unused accounts
3. Modify account names/descriptions
4. Add sub-accounts for granular tracking

## Troubleshooting

### "Industry not found"
Check the industry ID is correct:
```bash
npm run seed:charts:industry
```

### "Chart already exists"
The script will use the existing chart and only add missing accounts.

### "Accounts already exist"
Accounts with matching codes will be skipped (not duplicated).

## Source Data

COA templates are defined in:
```
/comprehensive_industry_coa (1).json
```

This file contains 20 industry templates with 50-70 accounts each.
