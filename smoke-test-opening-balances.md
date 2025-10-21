# Smoke Test Guide: Opening Balances Feature

## Prerequisites
- Dev server running (`npm run dev`)
- Company with chart of accounts set up
- At least one fiscal period created
- Admin or Financial Admin role

## Test Scenario: Orlicron Go-Live on October 4, 2024

### Test Data (Example)
```
Go-Live Date: October 4, 2024
Fiscal Period: 2024-10 (October 2024)

Opening Balances:
- Bank Account (1000):           R50,000.00
- Accounts Receivable (1100):    R75,000.00
- Equipment (1500):              R200,000.00
- Accounts Payable (2000):      -R30,000.00  (credit)
- Loan Payable (2500):          -R100,000.00 (credit)
- Retained Earnings (3500):     AUTO-CALCULATED

Expected Balance:
Total Debits:  R325,000.00
Total Credits: R325,000.00
Retained Earnings: R195,000.00 (credit)
```

## Test 1: Access Opening Balances Page (2 minutes)

### Steps:
1. Navigate to `/workspace/{companyId}/setup/opening-balances`
2. Verify page loads without errors

### Expected Results:
- ✅ Page title: "Opening Balances Setup"
- ✅ Description explains purpose
- ✅ Fiscal period dropdown populated
- ✅ Effective date field shows period start date
- ✅ Chart of accounts table displays all accounts
- ✅ Accounts grouped by type (Assets, Liabilities, Equity, Revenue, Expense)
- ✅ Amount input fields for each account
- ✅ Retained earnings account shows "Auto-balanced" badge
- ✅ Retained earnings input is disabled
- ✅ Totals section shows R0.00 / R0.00

## Test 2: Enter Opening Balances (5 minutes)

### Steps:
1. Select fiscal period from dropdown (e.g., "2024-10")
2. Set effective date (e.g., "2024-10-04")
3. Enter balances for accounts:
   - **1000 Bank Account**: Enter `50000`
   - **1100 Accounts Receivable**: Enter `75000`
   - **1500 Equipment**: Enter `200000`
   - **2000 Accounts Payable**: Enter `30000` (system treats as credit)
   - **2500 Loan Payable**: Enter `100000` (system treats as credit)
4. Observe totals section update in real-time

### Expected Results:
- ✅ As you type, amounts update immediately
- ✅ Totals section shows:
  - Total Debits: R325,000.00 (green)
  - Total Credits: R325,000.00 (red)
  - Retained Earnings (balancing): R195,000.00
  - Status: ✅ Balanced (with green checkmark)
- ✅ "Preview Entry" button becomes enabled
- ✅ "Post Opening Balances" button becomes enabled

## Test 3: Preview Journal Entry (3 minutes)

### Steps:
1. Click "Preview Entry" button
2. Review the preview dialog

### Expected Results:
- ✅ Dialog opens with title "Preview Opening Balance Entry"
- ✅ Shows date and reference (e.g., "OB-2024-10")
- ✅ Table shows all journal lines:
  - 1000 Bank Account: Debit R50,000.00
  - 1100 Accounts Receivable: Debit R75,000.00
  - 1500 Equipment: Debit R200,000.00
  - 2000 Accounts Payable: Credit R30,000.00
  - 2500 Loan Payable: Credit R100,000.00
  - 3500 Retained Earnings: Credit R195,000.00 (with "Balancing Entry" badge)
- ✅ Footer shows totals match (R325,000.00 = R325,000.00)
- ✅ "Close" button works

## Test 4: Post Opening Balances (3 minutes)

### Steps:
1. Click "Post Opening Balances" button
2. Wait for processing
3. Observe success message

### Expected Results:
- ✅ Button shows "Posting..." with spinner
- ✅ Success toast appears:
  - "Opening balances posted successfully!"
  - Shows debits and credits totals
- ✅ Redirects to Journal page after 2 seconds
- ✅ Can see the new journal entry in the journal list

## Test 5: Verify in Firestore (2 minutes)

### Steps:
1. Open Firebase Console
2. Navigate to Firestore Database
3. Check collections:
   - `journal_entries`
   - `general_ledger`

### Expected Results:
- ✅ **journal_entries** collection contains:
  - Document ID: `opening_balance_{companyId}_{timestamp}`
  - Fields:
    - `source`: "opening_balance"
    - `reference`: "OB-2024-10"
    - `status`: "posted"
    - `lines`: Array with 6 entries
    - `tenantId`: Company ID
    - `fiscalPeriodId`: Selected period ID
- ✅ **general_ledger** collection contains 6 documents:
  - Each with correct accountId, debit, credit
  - All with `source`: "opening_balance"
  - All with matching `journalEntryId`

## Test 6: Prevent Duplicate Entry (2 minutes)

### Steps:
1. Go back to `/workspace/{companyId}/setup/opening-balances`
2. Try to enter balances again for the same fiscal period

### Expected Results:
- ✅ Red warning alert appears:
  - "Opening balance already exists for this fiscal period..."
- ✅ "Post Opening Balances" button is disabled
- ✅ Shows entry ID of existing entry

## Test 7: Balance Validation (3 minutes)

### Steps:
1. Create a new fiscal period (if possible) or use a different company
2. Go to opening balances page
3. Enter unbalanced amounts:
   - 1000 Bank Account: `50000`
   - 1100 Accounts Receivable: `25000`
   - (Don't enter liabilities)

### Expected Results:
- ✅ Totals show:
  - Total Debits: R75,000.00
  - Total Credits: R75,000.00
  - Retained Earnings: R75,000.00 (balancing credit)
  - Status: ✅ Balanced
- ✅ System automatically balances via retained earnings

## Test 8: Currency Display (1 minute)

### Steps:
1. Verify all currency amounts use company's default currency

### Expected Results:
- ✅ If company currency is ZAR: Shows "R" symbol
- ✅ If company currency is USD: Shows "$" symbol
- ✅ All amounts formatted correctly (e.g., R50,000.00)

## Test 9: Edge Cases (5 minutes)

### Test 9a: Zero Balances
1. Leave all amounts as 0.00
2. Try to post

**Expected**: "Please enter at least one account balance" error

### Test 9b: Negative Amounts (Contra Accounts)
1. Enter `-50000` for Bank Account (contra entry)
2. Observe how system handles it

**Expected**: System creates a credit instead of debit

### Test 9c: Decimal Amounts
1. Enter `1234.56` for an account
2. Verify precision preserved

**Expected**: Shows R1,234.56 correctly

### Test 9d: No Fiscal Periods
1. Test on company with no fiscal periods

**Expected**: Dropdown shows "No fiscal periods found" or similar

## Test 10: Journal Integration (3 minutes)

### Steps:
1. Navigate to `/workspace/{companyId}/journal`
2. Find the opening balance entry
3. Click to view details

### Expected Results:
- ✅ Entry appears in journal list
- ✅ Source shows "Opening Balance" or similar
- ✅ Reference shows "OB-{periodId}"
- ✅ Status shows "Posted"
- ✅ Can view all lines
- ✅ Cannot edit (opening balances should be locked)

## Test 11: Reports Verification (3 minutes)

### Steps:
1. Navigate to `/workspace/{companyId}/reports`
2. Run Trial Balance report for the period
3. Verify opening balances appear

### Expected Results:
- ✅ All accounts show correct opening balances
- ✅ Total debits = Total credits
- ✅ Report includes opening balance entry

## Common Issues & Solutions

### Issue: "Account not found" error
**Check**: Ensure chart of accounts is set up for company

### Issue: "Retained earnings account not found"
**Solution**:
1. Create account code 3500 or
2. Mark an equity account as retained earnings

### Issue: Decimal places not preserved
**Check**: Input type is "number" with step="0.01"

### Issue: Can't redirect after posting
**Check**: Journal page exists at `/workspace/{companyId}/journal`

## Quick Verification Checklist

After running all tests, verify:

- [ ] ✅ Can access opening balances page
- [ ] ✅ Can select fiscal period
- [ ] ✅ Can enter account balances
- [ ] ✅ Totals calculate correctly in real-time
- [ ] ✅ Auto-balancing via retained earnings works
- [ ] ✅ Preview shows correct journal entry
- [ ] ✅ Can post to ledger successfully
- [ ] ✅ Prevents duplicate entries
- [ ] ✅ Creates journal entry with source = "opening_balance"
- [ ] ✅ Creates GL entries correctly
- [ ] ✅ Currency displays correctly (ZAR = R, USD = $)
- [ ] ✅ Redirects to journal after posting
- [ ] ✅ Entry appears in journal list
- [ ] ✅ Firestore documents created correctly

## Time to Complete
**Total: ~30 minutes for comprehensive testing**

## Pass Criteria
- All expected results checked (✅)
- No console errors
- Data correctly stored in Firestore
- Balances appear in reports
- UI is responsive and user-friendly

---

**Status**: Ready for testing
**Last Updated**: 2025-10-21
**Feature**: Opening Balances Entry
