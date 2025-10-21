# Orlicron Bank Import to Reports - Complete Test Plan

**Company**: Orlicron (ID: `Na1KU0ogKFLJ5cUzrMrU`)
**Goal**: Verify complete workflow from bank statement import → journal entries → general ledger → financial reports
**Status**: Ready for testing (clean slate achieved)

---

## Pre-Test Verification ✅ COMPLETED

- [x] Clean slate confirmed (0 journal entries, 0 GL entries)
- [x] Tenant isolation verified (other companies safe)
- [x] GL mapping rules preserved (182 rules intact)
- [x] Bank statements available (1 statement ready)

---

## Test Workflow Overview

```
┌─────────────────┐
│ 1. Bank Import  │ ← YOU DO THIS
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 2. Verify Data  │ ← CLAUDE CHECKS
│    Creation     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 3. Check        │ ← CLAUDE VERIFIES
│    Journal      │
│    Entries      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 4. Check        │ ← CLAUDE VERIFIES
│    General      │
│    Ledger       │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ 5. Verify       │ ← CLAUDE CHECKS
│    Reports      │
└─────────────────┘
```

---

## Phase 1: Bank Import (USER ACTION)

### What You Need to Do

1. **Navigate to Bank Import**:
   - Go to: `/workspace/[companyId]/bank-import`
   - Or: Dashboard → Banking → Import Statement

2. **Select Statement**:
   - Choose existing statement OR upload new one
   - Click "Start Import" or similar

3. **Map Transactions**:
   - Review auto-mapped transactions (using your 182 rules)
   - Verify mappings look correct
   - Adjust any that need manual mapping

4. **Post to Ledger**:
   - Click "Post to Ledger" or "Complete Import"
   - Wait for success confirmation

5. **Note Key Details**:
   - How many transactions were imported?
   - Any errors or warnings?
   - Timestamp of completion

### Expected Behavior

- Transactions should auto-map based on existing rules
- Should see success messages
- UI should show "posted" status

---

## Phase 2: Verify Import Session (CLAUDE CHECKS)

### What Claude Will Check

```bash
# Run verification script
node scripts/verify-import-session.js "Orlicron"
```

**Verification Points**:
- [ ] Bank import session created
- [ ] Session status is "completed" or "posted"
- [ ] Transaction count matches what you imported
- [ ] No error flags in session
- [ ] Timestamp matches when you completed import

**Data Sources**:
- `companies/{companyId}/bankImportSessions` collection

---

## Phase 3: Verify Journal Entries (CLAUDE CHECKS)

### What Claude Will Check

```bash
# Check journal entries were created
node scripts/verify-journal-entries.js "Orlicron"
```

**Verification Points**:

### 3.1 Entry Count
- [ ] Journal entries exist (count > 0)
- [ ] Count matches number of transactions imported
- [ ] Each entry has unique ID

### 3.2 Entry Structure
- [ ] Each entry has `tenantId` = Orlicron's ID
- [ ] Each entry has `status` = "posted"
- [ ] Each entry has `source` = "bank_import"
- [ ] Each entry has `reference` starting with "BANK-"
- [ ] Each entry has valid `transactionDate`
- [ ] Each entry has valid `postingDate`

### 3.3 Entry Lines (Double-Entry Accounting)
- [ ] Each entry has exactly 2 lines (debit + credit)
- [ ] Debit line has `debit > 0` and `credit = 0`
- [ ] Credit line has `credit > 0` and `debit = 0`
- [ ] **CRITICAL**: Debit amount = Credit amount (balanced)
- [ ] Each line has valid `accountId`, `accountCode`, `accountName`
- [ ] Currency is set (likely "ZAR")

### 3.4 Fiscal Period
- [ ] Each entry has `fiscalPeriodId` (e.g., "2024-11", "2024-12")
- [ ] Fiscal period matches transaction date

### 3.5 Sample Entry Inspection
Claude will show you:
- First 5 journal entries created
- Full details of one sample entry
- Any anomalies or missing fields

**Expected Result**: All journal entries properly formatted, balanced, and posted.

**Data Source**: `journal_entries` collection (root level, filtered by `tenantId`)

---

## Phase 4: Verify General Ledger (CLAUDE CHECKS)

### What Claude Will Check

```bash
# Check general ledger entries
node scripts/verify-gl-entries.js "Orlicron"
```

**Verification Points**:

### 4.1 GL Entry Count
- [ ] GL entries exist (count > 0)
- [ ] **CRITICAL**: Count = Journal entries × 2 (each journal line → 1 GL entry)
- [ ] Example: 100 journal entries → 200 GL entries

### 4.2 GL Entry Structure
- [ ] Each entry has `tenantId` = Orlicron's ID
- [ ] Each entry links to `journalEntryId`
- [ ] Each entry links to `journalLineId`
- [ ] Each entry has valid `accountId`, `accountCode`, `accountName`
- [ ] Each entry has `debit` OR `credit` (not both)
- [ ] Each entry has `transactionDate` and `postingDate`
- [ ] Each entry has `fiscalPeriodId`
- [ ] Each entry has `source` = "bank_import"

### 4.3 Account Distribution
Claude will show:
- Which accounts received entries
- Debit vs Credit breakdown per account
- Top 5 most-used accounts

### 4.4 Balance Verification
- [ ] Sum of all debits = Sum of all credits (system-wide balance)
- [ ] No orphaned GL entries (all link to valid journal entries)

### 4.5 Sample GL Entry Inspection
Claude will show you:
- Sample debit entry
- Sample credit entry
- Verify they link to same journal entry

**Expected Result**: GL entries properly created, balanced, and linked to journal entries.

**Data Source**: `general_ledger` collection (root level, filtered by `tenantId`)

---

## Phase 5: Verify Financial Reports (CLAUDE CHECKS)

### What Claude Will Check

Based on the reports architecture documentation, Claude will verify that reports compute correctly from the GL data.

### 5.1 Trial Balance

**What It Should Show**:
- All accounts that have entries
- Debit and credit totals per account
- **CRITICAL**: Total debits = Total credits

**Verification**:
- [ ] Trial balance shows accounts used in import
- [ ] Balances are non-zero for active accounts
- [ ] System is in balance (debits = credits)
- [ ] No "undefined" or "N/A" accounts

**How Claude Verifies**:
```bash
# Manual query to compute trial balance
node scripts/compute-trial-balance.js "Orlicron"
```

Compare with UI: Navigate to Reports → Trial Balance

### 5.2 General Ledger Report (by Account)

**What It Should Show**:
- Transaction-by-transaction listing per account
- Running balance per account
- Dates, references, descriptions

**Verification**:
- [ ] Can view GL by specific account (e.g., "1000 - Current Assets")
- [ ] Entries show correct dates
- [ ] References start with "BANK-"
- [ ] Descriptions match bank transactions

**How You Verify**: Navigate to Reports → GL by Account → Select an account

### 5.3 Balance Sheet

**What It Should Show**:
- Assets = Liabilities + Equity
- Current Assets (account 1000) should have balance if bank transactions affected it
- Other asset/liability accounts based on mappings

**Verification**:
- [ ] Balance sheet shows accounts with activity
- [ ] **CRITICAL**: Assets = Liabilities + Equity (accounting equation)
- [ ] Numbers match GL balances
- [ ] No negative balances where inappropriate

**How You Verify**: Navigate to Reports → Balance Sheet

### 5.4 Income Statement (P&L)

**What It Should Show**:
- Revenue accounts (if any)
- Expense accounts (6000, 6500, etc. if bank fees/expenses were imported)
- Net Income = Revenue - Expenses

**Verification**:
- [ ] Expense accounts show if bank fees/charges were imported
- [ ] Operating Expenses (6000) has balance if transactions mapped there
- [ ] Bank Charges & Fees (6500) has balance if fees imported
- [ ] Totals compute correctly

**How You Verify**: Navigate to Reports → Income Statement

### 5.5 Journal Entries Report

**What It Should Show**:
- All posted journal entries
- Filtered by date range, status, source
- Should see your bank import entries

**Verification**:
- [ ] Can filter by source = "bank_import"
- [ ] Can filter by date range
- [ ] Shows all imported entries
- [ ] Status shows "posted"
- [ ] Can click to view entry details

**How You Verify**: Navigate to Reports → Journal Entries → Filter by "bank_import"

---

## Phase 6: Data Integrity Checks (CLAUDE VERIFIES)

### Cross-Reference Verification

```bash
node scripts/verify-data-integrity.js "Orlicron"
```

**What Claude Will Check**:

### 6.1 Referential Integrity
- [ ] Every GL entry links to valid journal entry
- [ ] Every GL entry links to valid journal line
- [ ] No orphaned records

### 6.2 Currency Consistency
- [ ] All entries use same currency (ZAR)
- [ ] No currency conversion issues
- [ ] Amounts are properly formatted

### 6.3 Date Consistency
- [ ] Transaction dates are in valid range
- [ ] Posting dates are in valid range
- [ ] Fiscal periods match transaction dates
- [ ] No future dates (unless expected)

### 6.4 Account Validation
- [ ] All account IDs link to valid chart of accounts
- [ ] Account codes are correct
- [ ] Account names match codes
- [ ] No "undefined" accounts used

### 6.5 Double-Entry Balance
- [ ] Each journal entry is balanced (debits = credits)
- [ ] System-wide balance (total debits = total credits)
- [ ] Per-account balances are correct

---

## Phase 7: Report UI Verification (USER + CLAUDE)

### What You Will Check in UI

1. **Navigate to Reports Dashboard**:
   - Go to: `/workspace/[companyId]/reports`

2. **Check Each Report**:

   **Trial Balance**:
   - [ ] Opens without errors
   - [ ] Shows accounts with balances
   - [ ] Totals match
   - [ ] Can export (if feature exists)

   **Balance Sheet**:
   - [ ] Opens without errors
   - [ ] Accounting equation balances
   - [ ] Accounts grouped correctly (Assets, Liabilities, Equity)
   - [ ] Numbers look reasonable

   **Income Statement**:
   - [ ] Opens without errors
   - [ ] Shows revenue/expenses if applicable
   - [ ] Net income calculates
   - [ ] Date range filter works

   **General Ledger**:
   - [ ] Can select account
   - [ ] Shows transactions
   - [ ] Running balance visible
   - [ ] Can filter by date

   **Journal Entries**:
   - [ ] Shows all entries
   - [ ] Can filter by source = "bank_import"
   - [ ] Can view entry details
   - [ ] Status shows "posted"

3. **Screenshot Key Reports**:
   - Take screenshots of Trial Balance and Balance Sheet
   - Share with Claude for verification

---

## Known Issues to Watch For

Based on the documentation, here are potential quirks to check:

### Issue 1: Currency Formatting
**Symptom**: Amounts show as NaN, undefined, or wrong decimal places
**Check**: View any report and verify amounts display correctly
**Fix**: May need to check currency service

### Issue 2: Fiscal Period Mismatch
**Symptom**: Entries don't show in reports for date range
**Check**: Verify fiscal period matches transaction dates
**Fix**: May need to create fiscal periods for date range

### Issue 3: Account Mapping Incorrect
**Symptom**: Transactions posted to wrong accounts
**Check**: Review GL by account - do transactions make sense?
**Fix**: Update GL mapping rules and re-import

### Issue 4: Reports Show Zero Despite Data
**Symptom**: Reports are empty but GL has entries
**Check**: Verify reports are reading from correct collections
**Fix**: May need to debug report service queries

### Issue 5: Unbalanced Entries
**Symptom**: Trial balance doesn't balance
**Check**: Sum debits vs credits in GL
**Fix**: Check journal entry creation logic

---

## Success Criteria

### ✅ Test Passes If:

1. **Data Created**:
   - Journal entries exist and match import count
   - GL entries exist (count = journal entries × 2)
   - All entries have `tenantId` = Orlicron

2. **Data Structured Correctly**:
   - Journal entries are balanced (debits = credits per entry)
   - GL entries link correctly to journal entries
   - All required fields are populated

3. **Reports Display Correctly**:
   - Trial balance balances (total debits = total credits)
   - Balance sheet balances (Assets = Liabilities + Equity)
   - Income statement calculates correctly
   - GL by account shows transactions
   - Journal entries report shows all posted entries

4. **No Errors**:
   - No console errors in browser
   - No "undefined" or "N/A" values
   - No missing account names
   - No negative balances where inappropriate

5. **Performance**:
   - Reports load in reasonable time (< 5 seconds)
   - Can filter and navigate without issues

### ❌ Test Fails If:

- Any journal/GL entries are unbalanced
- Reports show zero despite having data
- Referential integrity is broken
- Other tenants' data was affected
- UI shows errors or crashes

---

## Execution Plan

### Step-by-Step Execution

1. **You**: Import bank statement and post to ledger
2. **You**: Tell Claude "Import complete, please verify"
3. **Claude**: Runs Phase 2-6 verification scripts
4. **Claude**: Reports findings and any issues
5. **You**: Check UI reports (Phase 7)
6. **You**: Share screenshots or describe any issues
7. **Claude + You**: Debug and fix any quirks found
8. **Repeat**: If fixes needed, may need to delete and re-import

### Communication Protocol

**After Import, Tell Claude**:
- "Import complete - I imported [X] transactions"
- "Posted successfully at [time]"
- "Any errors I saw: [describe]"

**Claude Will Respond With**:
- Verification results from scripts
- Data counts and sample entries
- Any anomalies found
- Next steps or issues to investigate

**If Issues Found**:
- Claude will diagnose
- Propose fixes
- May need to delete data and re-test

---

## Verification Scripts to Create

Claude needs to create these scripts before you import:

1. ✅ `verify-import-session.js` - Check bank import session
2. ✅ `verify-journal-entries.js` - Check journal entries
3. ✅ `verify-gl-entries.js` - Check GL entries
4. ✅ `compute-trial-balance.js` - Calculate trial balance from GL
5. ✅ `verify-data-integrity.js` - Cross-reference checks

---

## Ready to Start?

**Current Status**: ✅ Clean slate confirmed, ready for import

**When you're ready**:
1. Perform the bank import (Phase 1)
2. Let Claude know when complete
3. Claude will run all verification phases
4. We'll work through any issues together

**Questions before we start?**
