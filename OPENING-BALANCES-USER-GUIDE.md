# Opening Balances - User Guide

## Overview

The Opening Balances feature allows you to set starting balances for all accounts in your chart of accounts when beginning to use the system mid-period.

**Location**: `/workspace/{companyId}/setup/opening-balances`

---

## How It Works

### Step 1: Select Fiscal Period

The page automatically loads all fiscal periods for your company and selects the first one. The effective date is set to the period's start date.

### Step 2: Enter Account Balances

The page displays **your complete chart of accounts**, organized by account type:

```
┌─────────────────────────────────────────────────────────────┐
│ ASSETS                                                      │
├──────────┬────────────────────────┬──────┬─────────────────┤
│ Code     │ Account Name           │ Type │ Amount (ZAR)    │
├──────────┼────────────────────────┼──────┼─────────────────┤
│ 1000     │ Cash on Hand           │ asset│ [    50,000.00] │
│ 1100     │ Bank - Current Account │ asset│ [   125,000.00] │
│ 1200     │ Accounts Receivable    │ asset│ [    75,000.00] │
│ 1300     │ Inventory              │ asset│ [   100,000.00] │
│ 1500     │ Fixed Assets           │ asset│ [   500,000.00] │
├──────────┴────────────────────────┴──────┴─────────────────┤
│ LIABILITIES                                                 │
├──────────┬────────────────────────┬──────┬─────────────────┤
│ 2000     │ Accounts Payable       │ liab │ [    45,000.00] │
│ 2100     │ Bank Loan              │ liab │ [   200,000.00] │
│ 2200     │ Tax Payable            │ liab │ [    15,000.00] │
├──────────┴────────────────────────┴──────┴─────────────────┤
│ EQUITY                                                      │
├──────────┬────────────────────────┬──────┬─────────────────┤
│ 3000     │ Share Capital          │ equity│[   300,000.00] │
│ 3500     │ Retained Earnings      │ equity│ Auto-balanced   │
└──────────┴────────────────────────┴──────┴─────────────────┘
```

### Step 3: Real-Time Balance Validation

As you enter amounts, the system automatically calculates:

```
Total Debits:                R850,000.00
Total Credits:               R560,000.00
Retained Earnings (auto):    R290,000.00
────────────────────────────────────────
Status:                      ✓ Balanced
```

**The system automatically calculates the Retained Earnings balancing entry** so you don't have to!

### Step 4: Preview & Post

1. Click **"Preview Entry"** to see the journal entry before posting
2. Click **"Post Opening Balances"** to save to the ledger

---

## Example: Setting Up Opening Balances

### Scenario
You're starting to use the system on **2025-01-01** and your company has the following balances:

**Assets**:
- Cash: R50,000
- Bank: R125,000
- Accounts Receivable: R75,000
- Inventory: R100,000
- Fixed Assets: R500,000
- **Total Assets**: R850,000

**Liabilities**:
- Accounts Payable: R45,000
- Bank Loan: R200,000
- Tax Payable: R15,000
- **Total Liabilities**: R260,000

**Equity**:
- Share Capital: R300,000
- Retained Earnings: ? (auto-calculated)

### Steps

1. **Navigate to Opening Balances**:
   - Go to Dashboard
   - Click "Opening Balances" quick action (admin-only)
   - Or navigate to `/workspace/{companyId}/setup/opening-balances`

2. **Select Fiscal Period**:
   - Fiscal period is auto-selected (e.g., "FY 2025")
   - Effective date is set to period start (2025-01-01)

3. **Enter Asset Balances**:
   ```
   1000 - Cash on Hand           →  50,000.00
   1100 - Bank - Current Account →  125,000.00
   1200 - Accounts Receivable    →  75,000.00
   1300 - Inventory              →  100,000.00
   1500 - Fixed Assets           →  500,000.00
   ```

4. **Enter Liability Balances**:
   ```
   2000 - Accounts Payable       →  45,000.00
   2100 - Bank Loan              →  200,000.00
   2200 - Tax Payable            →  15,000.00
   ```

5. **Enter Equity Balances**:
   ```
   3000 - Share Capital          →  300,000.00
   3500 - Retained Earnings      →  (auto-calculated = R290,000)
   ```

6. **Check Balance**:
   - Total Debits: R850,000 (assets)
   - Total Credits: R560,000 (liabilities + equity)
   - Balancing Entry: R290,000 to Retained Earnings
   - Status: ✓ **Balanced**

7. **Preview & Post**:
   - Click "Preview Entry" to review
   - Click "Post Opening Balances"
   - Success! Opening balances are now in your ledger

---

## What Happens When You Post?

The system creates:

1. **Journal Entry** in `journal_entries` collection:
   ```
   Reference: OB-{fiscalPeriodId}
   Date: 2025-01-01
   Source: opening_balance
   Status: posted
   ```

2. **Journal Lines** (one per account):
   ```
   1000 - Cash on Hand          DR   50,000.00
   1100 - Bank - Current        DR  125,000.00
   1200 - AR                    DR   75,000.00
   1300 - Inventory             DR  100,000.00
   1500 - Fixed Assets          DR  500,000.00
   2000 - AP                    CR   45,000.00
   2100 - Bank Loan             CR  200,000.00
   2200 - Tax Payable           CR   15,000.00
   3000 - Share Capital         CR  300,000.00
   3500 - Retained Earnings     CR  290,000.00 ← AUTO
   ─────────────────────────────────────────────
   TOTAL                        DR  850,000.00
   TOTAL                        CR  850,000.00
   ```

3. **GL Entries** (one per account) in `general_ledger` collection

---

## Key Features

### ✅ Automatic Chart of Accounts Loading

The page **automatically loads your entire chart of accounts** - you don't need to manually add accounts. Just enter the amounts!

### ✅ Grouped by Account Type

Accounts are organized by type for easy data entry:
- Assets
- Liabilities
- Equity
- Revenue (typically $0 for opening balances)
- Expense (typically $0 for opening balances)

### ✅ Auto-Balancing to Retained Earnings

You **don't** need to calculate Retained Earnings manually. The system:
1. Sums all your debits (assets)
2. Sums all your credits (liabilities + equity - retained earnings)
3. Calculates the difference
4. Automatically applies it to Retained Earnings (3500)

**Formula**:
```
Retained Earnings = Total Assets - Total Liabilities - Other Equity
```

### ✅ Real-Time Validation

As you type, the system shows:
- ✓ **Balanced** (green) - Ready to post
- ✗ **Unbalanced** (red) - Debits ≠ Credits

### ✅ Duplicate Prevention

Once opening balances are posted for a fiscal period, you **cannot post again** for the same period. This prevents accidental duplicates.

### ✅ Currency-Aware

All amounts display in your company's default currency (ZAR, USD, EUR, etc.)

---

## FAQ

### Q: Which accounts should I enter balances for?

**A**: Typically, you'll enter balances for:
- ✅ **Assets**: Cash, bank accounts, receivables, inventory, fixed assets
- ✅ **Liabilities**: Payables, loans, accruals
- ✅ **Equity**: Share capital, other equity accounts

You usually **won't** enter:
- ❌ **Revenue accounts**: These should be $0 at period start
- ❌ **Expense accounts**: These should be $0 at period start
- ❌ **Retained Earnings**: This is auto-calculated!

### Q: What if my entry doesn't balance?

**A**: The system will show "Unbalanced" in red and the "Post" button will be disabled. Check:
1. Did you enter all asset balances?
2. Did you enter all liability balances?
3. Did you enter share capital correctly?
4. The system calculates retained earnings automatically - don't enter it manually

### Q: Can I edit opening balances after posting?

**A**: No. Opening balances are permanent once posted. If you made a mistake:
1. Create an adjustment journal entry manually
2. Or contact support to reverse the opening balance entry

### Q: What if I don't have a Retained Earnings account?

**A**: The system looks for:
- Account code `3500`, OR
- Any equity account with "retained earnings" in the name

Make sure you have this account in your chart of accounts before posting opening balances.

### Q: Do I need to enter all accounts?

**A**: No! You only need to enter accounts with non-zero balances. Accounts you leave at 0.00 won't be included in the journal entry.

---

## Best Practices

1. **Prepare Your Data First**:
   - Export your trial balance from your old system
   - Verify all amounts balance before entering

2. **Double-Check Your Entries**:
   - Use the "Preview Entry" button to review before posting
   - Verify account codes and amounts match your trial balance

3. **Start Fresh**:
   - Only post opening balances at the very beginning of a fiscal period
   - Don't use this for mid-period adjustments (use journal entries instead)

4. **Keep Documentation**:
   - Save your trial balance export for future reference
   - Note the effective date you used

---

## Troubleshooting

### "Opening balance already exists for this period"

**Problem**: You've already posted opening balances for this fiscal period.

**Solution**: Opening balances can only be posted once per period. If you need to make changes, create a manual journal entry to adjust.

### "Failed to load chart of accounts"

**Problem**: Chart of accounts not loading.

**Solution**:
1. Ensure your company has accounts set up in the chart of accounts
2. Check that you have permission to view accounts
3. Try refreshing the page

### "Post" button is disabled

**Possible reasons**:
1. ❌ Entry is not balanced (debits ≠ credits)
2. ❌ No accounts have balances entered (all are $0)
3. ❌ Opening balances already exist for this period
4. ❌ Currently posting (wait for operation to complete)

---

## Summary

The Opening Balances feature:

✅ **Loads your chart of accounts automatically** - No manual account selection needed!
✅ **Groups accounts by type** - Easy to navigate and enter
✅ **Auto-calculates Retained Earnings** - No manual balancing required
✅ **Real-time validation** - See if entry balances as you type
✅ **Currency-aware** - Respects company default currency
✅ **Duplicate prevention** - Can't accidentally post twice

**It's designed to make setting up opening balances as easy as possible!**
