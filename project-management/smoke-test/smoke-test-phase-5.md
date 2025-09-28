# Phase 5 - Bank & Cash Management Smoke Test Guide

## Overview
This guide provides step-by-step verification for all Phase 5 features implemented. Follow these steps to ensure everything is working correctly.

## Prerequisites
1. Ensure the development server is running: `npm run dev`
2. Login with admin/super_admin credentials
3. Have at least one company created in the system
4. Have a chart of accounts set up (from Phase 1)

## 1. Bank Account Management

### Test Bank Account Creation
1. Navigate to `/admin/bank-accounts`
2. Click "New Bank Account"
3. Fill in the form:
   - Account Name: "Primary Checking"
   - Account Number: "1234567890"
   - Bank Name: "Test Bank"
   - Branch: "Main Branch"
   - Currency: "USD"
   - Link to a GL Account (should show dropdown from chart of accounts)
   - Set Opening Balance: 10000
   - Mark as Primary Account
4. Add at least one signatory:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Role: "Approver"
   - Approval Limit: 5000
5. Click "Save"
6. **Expected Result**: Account should appear in the list with correct details

### Test Bank Account Editing
1. Click on the account you just created
2. Modify some fields (e.g., change branch name)
3. Add another signatory
4. Save changes
5. **Expected Result**: Changes should persist and display correctly

### Test Account Status Management
1. Find the account in the list
2. Change status from "Active" to "Inactive"
3. **Expected Result**: Status badge should update immediately

## 2. Bank Statement Reconciliation

### Test Bank Statement Upload
1. Navigate to `/dashboard/bank-statements/[companyId]`
2. Click "Upload Statement"
3. Upload a PDF bank statement (or use a test file)
4. **Expected Result**:
   - Statement should process via Gemini
   - Transactions should be extracted and displayed
   - Summary should show opening/closing balances

`### Test Auto-Match Algorithm
1. After uploading a statement, click "Start Reconciliation"
2. You'll be redirected to the reconciliation workspace at `/companies/[companyId]/reconciliations/[sessionId]`
3. In the "Match Progress" card (green card on the right), click the **"Run Auto-Match"** button
   - It's a purple gradient button with a sparkle icon (✨)
4. **Expected Result**:
   - Loading toast message "Running auto-match algorithm..."
   - Success message showing: "Auto-match complete! Found X matches (Y% match rate)"
   - The match count in "Match Progress" card will update
   - Suggested matches will appear in the manual matching interface
   - Each match will have a confidence score (0-100%)
   - You can then review, confirm, or reject the suggested matches
`
### Test Manual Matching
1. In the reconciliation workspace, find unmatched transactions
2. Test drag-and-drop:
   - Drag a bank transaction onto a ledger entry
   - **Expected Result**: Should show as "Pending Match" with confidence score
3. Test click selection:
   - Click a bank transaction, then click a ledger entry
   - Click "Match Selected"
   - **Expected Result**: Match should be created
4. Confirm pending matches:
   - Review pending matches
   - Click "Confirm All" or confirm individually
   - **Expected Result**: Matches should move to "Confirmed" status

### Test Match Management
1. Find a confirmed match
2. Click "Unmatch"
3. **Expected Result**: Transaction should return to unmatched state
4. Delete a match completely
5. **Expected Result**: Match should be removed from the list

## 3. Adjustment Entries

### Test Creating Adjustments
1. In the reconciliation workspace, click "Add Adjustment"
2. Create a bank fee adjustment:
   - Type: "Fee"
   - Description: "Monthly maintenance fee"
   - Amount: -25.00
   - Select expense account from dropdown
3. Click "Create Adjustment"
4. **Expected Result**:
   - Adjustment should appear in the list
   - Journal entry should be created automatically
   - Balance difference should update

### Test Quick Adjustments
1. Click "Quick Adjustment"
2. Select a template (e.g., "Bank Interest")
3. Enter amount: 5.00
4. **Expected Result**: Adjustment should be created with pre-filled account mappings

### Test Adjustment Reversal
1. Find an adjustment you created
2. Click "Reverse"
3. Enter reason: "Entered incorrectly"
4. Confirm reversal
5. **Expected Result**:
   - Original adjustment should show as reversed
   - Reversal journal entry should be created
   - Balance should adjust accordingly

### Test Balance Validation
1. Create adjustments that should balance the reconciliation
2. Check the reconciliation summary
3. **Expected Result**:
   - Should show "Reconciliation Balanced" when difference is < $0.01
   - Should show warning if adjustments don't balance

## 4. Bank Transfers

### Test Internal Transfer
1. Go to bank accounts admin page
2. Click "New Transfer"
3. Create internal transfer:
   - From Account: Select one account
   - To Account: Select another account
   - Amount: 1000
   - Description: "Test transfer"
4. Submit transfer
5. **Expected Result**:
   - Transfer should show as "Pending" if above approval threshold
   - Transfer should show as "Completed" if below threshold
   - Account balances should update (if auto-approved)

### Test Transfer Approval
1. Create a transfer above the approval threshold
2. Switch to an approver user (or simulate)
3. Go to transfers list
4. Find pending transfer and click "Approve"
5. **Expected Result**:
   - Transfer status should change to "Approved"
   - If sufficient approvals, should execute automatically
   - Journal entries should be created

### Test External Transfer
1. Create external transfer:
   - Type: "Wire"
   - Beneficiary Name: "External Company"
   - Beneficiary Account: "987654321"
   - Amount: 5000
2. Add wire details (if prompted)
3. Submit transfer
4. **Expected Result**: Should create transfer record with external details

## 5. Cash Flow Forecasting

### Test Cash Position Dashboard
1. Navigate to cash flow dashboard (if implemented in UI)
2. **Expected Result**:
   - Current cash position should display
   - Should show breakdown by account
   - Multi-currency should be consolidated to base currency

### Test 13-Week Forecast
1. View the forecast chart
2. **Expected Result**:
   - Should show daily projections for 91 days
   - Should include known inflows/outflows
   - Confidence bands should be visible
   - Should highlight dates where cash goes negative

### Test Payment Prioritization
1. View payment prioritization list
2. **Expected Result**:
   - Payments should be scored and ranked
   - Critical payments should be highlighted
   - Should show impact of deferring payments
   - Early payment discounts should be flagged

### Test Cash Alerts
1. Check for cash alerts
2. **Expected Result**:
   - Low balance warnings should appear if applicable
   - Large outflow alerts for significant payments
   - Threshold breach notifications

## 6. Integration Tests

### Test Chart of Accounts Integration
1. When creating bank accounts, verify GL accounts link properly
2. Check that only asset accounts are available for selection
3. **Expected Result**: Proper filtering and validation

### Test Multi-Currency Support
1. Create accounts in different currencies
2. Create transfers between different currency accounts
3. **Expected Result**:
   - Exchange rates should be applied
   - Conversion should be shown in UI
   - Both currencies should be tracked

### Test Audit Trail
1. Make various changes (create, edit, delete)
2. Check activity logs (if visible in UI)
3. **Expected Result**:
   - All actions should be logged
   - User and timestamp should be recorded
   - Reversal reasons should be stored

## 7. Error Handling Tests

### Test Validation Errors
1. Try to create bank account with duplicate account number
2. Try to create transfer with insufficient funds
3. Try to match transactions with very different amounts
4. **Expected Result**: Clear error messages should appear

### Test Permission Checks
1. Login as non-admin user
2. Try to access `/admin/bank-accounts`
3. **Expected Result**: Should be redirected or see permission denied

### Test Data Integrity
1. Create a reconciliation session
2. Refresh the page mid-process
3. **Expected Result**: Data should persist, no loss of work

## Common Issues to Check

### Performance
- [ ] Large lists (100+ transactions) should load without lag
- [ ] Drag-and-drop should be smooth
- [ ] Auto-match should complete within 5 seconds for typical datasets

### UI/UX
- [ ] All loading states should show spinners
- [ ] Error messages should be user-friendly
- [ ] Success toasts should appear for actions
- [ ] Empty states should have helpful messages

### Data Consistency
- [ ] Account balances should always be accurate
- [ ] Journal entries should always balance (debits = credits)
- [ ] Reconciliation math should be precise
- [ ] Multi-tab usage shouldn't cause conflicts

## Verification Checklist

### Bank Accounts
- [ ] Create new account
- [ ] Edit existing account
- [ ] Add/remove signatories
- [ ] Change account status
- [ ] Link to GL account

### Reconciliation
- [ ] Upload bank statement
- [ ] Run auto-match
- [ ] Manual drag-and-drop matching
- [ ] Confirm/reject matches
- [ ] Create adjustments
- [ ] Reverse adjustments
- [ ] Balance reconciliation

### Transfers
- [ ] Internal transfer
- [ ] External transfer
- [ ] Transfer approval
- [ ] Transfer cancellation

### Cash Flow
- [ ] View current position
- [ ] View 13-week forecast
- [ ] Check payment priorities
- [ ] Review cash alerts

## Final System Health Check

Run these commands to ensure no build/type errors:
```bash
npm run lint
npm run build
```

Check browser console for any errors during testing.

## Reporting Issues

If any test fails:
1. Note the exact steps to reproduce
2. Check browser console for errors
3. Take screenshots if relevant
4. Check network tab for failed API calls
5. Document expected vs actual behavior

## Sign-off
- [ ] All core features tested and working
- [ ] No console errors during testing
- [ ] UI is responsive and professional
- [ ] Data persists correctly
- [ ] Performance is acceptable
- [ ] Ready for next phase

---
*Test Date: ___________*
*Tested By: ___________*
*Phase 5 Status: ___________*