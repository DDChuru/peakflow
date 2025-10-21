# Smoke Test Guide: Staging Review

## Prerequisites
- Dev server running (`npm run dev`)
- Company created with bank account configured
- Chart of accounts set up

## Test 1: Basic Staging Flow (5 minutes)

### Steps:
1. Navigate to `/workspace/{companyId}/bank-import`
2. Go to "Import Transactions" tab
3. Select a bank account from dropdown
4. Add 2-3 sample transactions with GL mappings
5. Click "**Post to Staging Ledger**" button

### Expected Results:
- ✅ Success toast: "Posted X transactions to staging ledger..."
- ✅ Shows "Debits: $XXX, Credits: $XXX"
- ✅ Shows "✅ Balanced" in toast
- ✅ Automatically redirects to "Staging Review" tab
- ✅ Session card appears with summary

## Test 2: Balance Verification Display (2 minutes)

### Steps:
1. On "Staging Review" tab, look at the session card

### Expected Results:
- ✅ Badge shows "✓ Balanced" in green
- ✅ Total Debits shown in green text
- ✅ Total Credits shown in red text
- ✅ Numbers match (equal debits and credits)
- ✅ Journal entry count is correct
- ✅ GL entry count is correct (2x journal entries)

## Test 3: Detail Views (3 minutes)

### Steps:
1. Click on the session card to select it
2. Scroll down to see journal entries table
3. Click "View GL Entries" button
4. Review the GL entries in the dialog
5. Close the dialog

### Expected Results:
- ✅ Journal entries table shows all transactions
- ✅ Each row shows date, reference, description, debits, credits
- ✅ Dialog opens with GL entries
- ✅ Each GL line shows account code, account name, debit/credit
- ✅ Dialog can be closed with X button

## Test 4: Post to Production (3 minutes)

### Steps:
1. Click "Post to Ledger" button on session card
2. Review the confirmation dialog
3. Check the balance verification section
4. Click "Post to Ledger" to confirm
5. Wait for success toast

### Expected Results:
- ✅ Dialog shows session summary
- ✅ Shows total debits and credits
- ✅ Shows "✓ Balanced" badge in dialog
- ✅ No warning alert appears (for balanced import)
- ✅ Success toast: "Posted X journal entries and X GL entries..."
- ✅ Session badge changes from "Staged" to "Posted"
- ✅ "Post to Ledger" button disappears or becomes disabled

## Test 5: Data Verification (2 minutes)

### Steps:
1. Open Firebase Console
2. Navigate to Firestore Database
3. Check the following collections:
   - `staging_journal_entries`
   - `staging_general_ledger`
   - `companies/{companyId}/bankImportSessions`
   - `journal_entries` (production)
   - `general_ledger` (production)

### Expected Results:
- ✅ Staging collections contain entries with `status: "posted"`
- ✅ Session document has `staging` object with balance data
- ✅ Session document has `production` object with entry IDs
- ✅ Production collections contain the posted entries
- ✅ Staging entries have `productionJournalId` and `productionGLId` links

## Test 6: Unbalanced Import Warning (Optional, 3 minutes)

### Steps:
1. Manually modify staging data to create unbalanced session, OR
2. Create test data with mismatched debits/credits
3. View in "Staging Review" tab
4. Try to post to production

### Expected Results:
- ✅ Badge shows "✗ Unbalanced" in red
- ✅ Post dialog shows warning alert
- ✅ Warning text: "This import is not balanced. Posting unbalanced entries may cause discrepancies..."
- ✅ Can still post (warning only, not blocking)

## Test 7: Refresh Functionality (1 minute)

### Steps:
1. Click "Refresh" button on Staging Review tab
2. Verify data reloads

### Expected Results:
- ✅ Refresh button shows loading spinner
- ✅ Sessions reload from Firestore
- ✅ Selected session remains selected
- ✅ Data is current

## Common Issues & Solutions

### Issue: No staging sessions appear
**Check:**
- Session status is "staged" or "posted"
- Session has `staging` field in Firestore
- Company ID matches

### Issue: Balance shows as unbalanced
**Check:**
- Verify total debits = total credits in Firestore
- Check for floating point precision issues
- Review account mappings

### Issue: Post to production fails
**Check:**
- Browser console for errors
- Firestore security rules allow writes
- User has proper permissions
- Network connectivity

### Issue: Auto-navigation doesn't work
**Check:**
- `handleImportComplete` is being called
- `setActiveTab('staging')` is executed
- No errors in console

## Quick Verification Checklist

After running all tests, verify:

- [ ] ✓ Can import and stage transactions
- [ ] ✓ Balance indicator shows correctly
- [ ] ✓ Debits and credits are color-coded
- [ ] ✓ Detail views work
- [ ] ✓ Can post to production
- [ ] ✓ Status changes after posting
- [ ] ✓ Data persists in Firestore
- [ ] ✓ Warning appears for unbalanced imports
- [ ] ✓ Refresh works
- [ ] ✓ UI is responsive and clear

## Time to Complete
**Total: ~15-20 minutes**

## Pass Criteria
- All expected results checked (✅)
- No console errors
- Data correctly stored in Firestore
- UI updates properly after actions

---

**Status**: Ready for testing
**Last Updated**: 2025-10-21
