# Opening Balances Guide

## The Problem

When a company starts using PeakFlow on **October 4th, 2024** (mid-period), they already have:
- Bank account balances
- Outstanding customer invoices (Accounts Receivable)
- Unpaid supplier bills (Accounts Payable)
- Existing assets, liabilities, and equity
- Year-to-date income and expenses

**Question**: How do we capture these existing balances?

## Current System Status

### ✅ What EXISTS:
1. **Journal Source Types** (in `/src/types/accounting/journal.ts`):
   - `'manual'` - Manual journal entries
   - `'bank_import'` - Bank statement imports
   - `'adjustment'` - Accounting adjustments
   - Others: `'bank_transfer'`, `'accounts_receivable'`, `'accounts_payable'`, `'accrual'`, `'revaluation'`

2. **Account Balance Snapshots** (in `/src/types/accounting/chart-of-accounts.ts`):
   ```typescript
   interface AccountBalanceSnapshot {
     openingBalance: number;
     closingBalance: number;
     debits: number;
     credits: number;
   }
   ```

### ❌ What's MISSING:
1. **No dedicated opening balance journal source**
2. **No UI for entering opening balances**
3. **No opening balance entry workflow**
4. **No fiscal year setup wizard**

## The Solution: Opening Balance Journal Entry

### Standard Accounting Practice

In double-entry accounting, opening balances are entered via a **special journal entry** with source `'opening_balance'`:

```
Date: October 1, 2024 (start of fiscal period)
Source: Opening Balance
Reference: OB-2024-10

ASSETS (Debits):
  Bank Account (1000)           DR  R50,000.00
  Accounts Receivable (1100)    DR  R75,000.00
  Equipment (1500)              DR R200,000.00

LIABILITIES (Credits):
  Accounts Payable (2000)       CR  R30,000.00
  Loan Payable (2500)           CR R100,000.00

EQUITY (Credit - balancing entry):
  Retained Earnings (3500)      CR R195,000.00
                                   ─────────────
  TOTAL                         DR R325,000.00
                                CR R325,000.00
```

### Why This Works

1. **Balances the books** - Total debits = Total credits
2. **Sets starting point** - All accounts have correct opening balances
3. **Maintains audit trail** - Clear source = 'opening_balance'
4. **Historical accuracy** - Posted to the start of the fiscal period
5. **Allows reconciliation** - Bank balances can be reconciled from day 1

## Implementation Plan

### Phase 1: Add Opening Balance Support (Immediate)

#### Step 1: Update Journal Source Type
Add `'opening_balance'` to journal sources:

```typescript
// src/types/accounting/journal.ts
export type JournalSource =
  | 'manual'
  | 'bank_import'
  | 'bank_transfer'
  | 'accounts_receivable'
  | 'accounts_payable'
  | 'accrual'
  | 'revaluation'
  | 'adjustment'
  | 'opening_balance';  // ← NEW
```

#### Step 2: Create Opening Balance Entry UI

Create `/app/workspace/[companyId]/setup/opening-balances/page.tsx`:

**Features**:
- List all accounts from chart of accounts
- Input field for opening balance (debit or credit) per account
- Auto-calculate balancing entry (typically Retained Earnings)
- Show if balanced
- Preview journal entry before posting
- Post to ledger with source = 'opening_balance'

**UI Mockup**:
```
┌─────────────────────────────────────────────────────────┐
│ Opening Balances Setup                                  │
│ Enter balances as of: Oct 1, 2024                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ASSETS                                                   │
│ ─────────────────────────────────────────────────────── │
│ 1000 - Bank Account                    R [50,000.00  ] │
│ 1100 - Accounts Receivable             R [75,000.00  ] │
│ 1500 - Equipment                       R [200,000.00 ] │
│                                                          │
│ LIABILITIES                                              │
│ ─────────────────────────────────────────────────────── │
│ 2000 - Accounts Payable                R [30,000.00  ] │
│ 2500 - Loan Payable                    R [100,000.00 ] │
│                                                          │
│ EQUITY                                                   │
│ ─────────────────────────────────────────────────────── │
│ 3500 - Retained Earnings (auto)        R [195,000.00 ] │
│                                                          │
│ ─────────────────────────────────────────────────────── │
│ Total Debits:  R325,000.00                               │
│ Total Credits: R325,000.00                               │
│ Status: ✅ Balanced                                      │
│                                                          │
│ [Preview Entry]  [Post Opening Balances]                │
└─────────────────────────────────────────────────────────┘
```

#### Step 3: Create Opening Balance Service

```typescript
// src/lib/accounting/opening-balance-service.ts

export interface OpeningBalanceInput {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  amount: number;  // Positive = debit for assets, credit for liabilities
}

export class OpeningBalanceService {
  async postOpeningBalances(
    companyId: string,
    fiscalPeriodId: string,
    effectiveDate: Date,
    balances: OpeningBalanceInput[],
    retainedEarningsAccountId: string,
    createdBy: string
  ): Promise<JournalEntry> {
    // 1. Calculate total assets, liabilities, equity
    // 2. Calculate balancing entry (retained earnings)
    // 3. Create journal entry with source = 'opening_balance'
    // 4. Post to ledger
  }
}
```

### Phase 2: Fiscal Year Setup Wizard (Future Enhancement)

Create a guided setup wizard when company is first created:

**Wizard Steps**:
1. **Company Details** - Name, currency, fiscal year
2. **Chart of Accounts** - Select industry template or import custom
3. **Opening Balances** - Enter account balances
4. **Bank Accounts** - Link bank accounts with opening balances
5. **Customers & Suppliers** - Import existing debtors/creditors with balances
6. **Review & Confirm** - Preview all setup data
7. **Complete Setup** - Post opening balances and activate system

## Immediate Workaround (Until UI is Built)

### Option 1: Manual Journal Entry

Users can create a manual journal entry through the existing journal entry UI:

1. Go to **Workspace → Journal**
2. Create new journal entry
3. Date: Start of fiscal period
4. Source: Manual (or we add 'opening_balance' first)
5. Add lines for all accounts with balances
6. Post to ledger

**Advantages**:
- Works immediately with existing UI
- Full control over entry

**Disadvantages**:
- Manual and error-prone
- No guided workflow
- User must understand double-entry accounting

### Option 2: Import via Bank Import (Partial Solution)

For **bank accounts only**:

1. Get bank statement from Oct 1st showing opening balance
2. Import via Bank Import feature
3. Create adjustment entry if needed

**Advantages**:
- Leverages existing import workflow
- Gets bank balances correct

**Disadvantages**:
- Only handles bank accounts
- Doesn't set up AR, AP, or other balances

### Option 3: Script-Based Import (Admin Only)

Create a one-time script to post opening balances:

```javascript
// scripts/post-opening-balances.js
const openingBalances = [
  { account: '1000', amount: 50000, type: 'debit' },
  { account: '1100', amount: 75000, type: 'debit' },
  // ... etc
];

// Creates and posts journal entry with source = 'opening_balance'
```

**Advantages**:
- Fast for bulk setup
- Can be reused for multiple companies

**Disadvantages**:
- Requires technical knowledge
- No UI
- Risk of errors

## Best Practice Recommendations

### For New Companies:

1. **Set Go-Live Date** - Choose fiscal period start (e.g., Oct 1, 2024)
2. **Prepare Trial Balance** - Export from old system as of Sep 30, 2024
3. **Enter Opening Balances** - All accounts with non-zero balances
4. **Reconcile** - Ensure total debits = total credits
5. **Verify Bank** - Bank account balance matches bank statement
6. **Test Period** - Run parallel with old system for 1 month
7. **Go Live** - Fully transition to PeakFlow

### For Existing Companies Mid-Period:

1. **Choose Cutover Date** - E.g., Oct 4, 2024
2. **Complete Old System** - Process all transactions through Oct 3
3. **Extract Balances** - As of end of Oct 3
4. **Post Opening Balances** - Dated Oct 4, 2024
5. **Resume Operations** - Start recording new transactions in PeakFlow

### What to Include in Opening Balances:

#### ✅ INCLUDE:
- **Bank account balances** - Must match bank statement
- **Accounts Receivable** - Outstanding customer invoices
- **Accounts Payable** - Unpaid supplier bills
- **Fixed Assets** - Equipment, vehicles, buildings (at book value)
- **Inventory** - Stock on hand
- **Loans** - Outstanding loan balances
- **Owner's Equity** - Capital, retained earnings

#### ❌ DO NOT INCLUDE:
- **Individual transactions** - Only the net balances
- **Closed accounts** - Zero balance accounts
- **Future transactions** - Only balances as of cutover date

## Technical Implementation Checklist

- [ ] Add `'opening_balance'` to `JournalSource` type
- [ ] Create `OpeningBalanceService` class
- [ ] Create `/setup/opening-balances` page UI
- [ ] Add balance input fields for all accounts
- [ ] Implement auto-balancing calculation
- [ ] Add validation (must balance)
- [ ] Add preview before posting
- [ ] Prevent duplicate opening balance entries
- [ ] Add audit trail / logging
- [ ] Create smoke test guide
- [ ] Update user documentation

## Example: Orlicron October 4, 2024 Cutover

```
Opening Balance Journal Entry
Date: 2024-10-04
Reference: OB-2024-10-04
Source: opening_balance
Description: Opening balances as of October 4, 2024

DEBIT:
1000 Current Assets                      R 238,249.19
1100 Accounts Receivable                 R  75,000.00
1500 Equipment                           R 200,000.00
                                         ──────────────
                                         R 513,249.19

CREDIT:
2000 Accounts Payable                    R  30,000.00
2500 Loan Payable                        R 100,000.00
3500 Retained Earnings (balancing)       R 383,249.19
                                         ──────────────
                                         R 513,249.19

✅ BALANCED
```

## Summary

**Current State**: No formal opening balance process exists.

**Immediate Need**: Add `'opening_balance'` journal source and create entry UI.

**Workaround**: Use manual journal entry until dedicated UI is built.

**Best Practice**: Always enter opening balances dated at the start of the fiscal period or go-live date.

**Future Enhancement**: Full fiscal year setup wizard with guided opening balance entry.

---

**Status**: 📋 Planned - Not yet implemented
**Priority**: 🔴 High - Required for proper company setup
**Estimated Effort**: 2-3 days for full implementation
