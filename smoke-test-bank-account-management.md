# Smoke Test Guide: Bank Account Management

**Feature:** Admin Bank Accounts Page - Navigation, GL Account Loading, Validation, and Creation
**Session:** 2025-10-10
**Estimated Time:** 10 minutes

## Overview

This guide tests the complete bank account management workflow including:
- Navigation access via Admin Panel
- GL account loading from Chart of Accounts
- Form validation with visual feedback
- Bank account creation without Firestore errors

---

## Prerequisites

- ✅ User with admin or developer role logged in
- ✅ At least one company with Chart of Accounts set up
- ✅ Firebase composite index for GL accounts created (type, isActive, code)

---

## Test 1: Navigation Access (2 minutes)

### Steps:
1. Log in as an admin user
2. Locate the sidebar navigation
3. Find "Admin Panel" section
4. Click to expand Admin Panel submenu
5. Look for "Bank Accounts" link with CreditCard icon
6. Click "Bank Accounts"

### Expected Results:
- ✅ "Bank Accounts" appears between "User Management" and "COA Templates"
- ✅ CreditCard icon displayed next to "Bank Accounts"
- ✅ Page navigates to `/admin/bank-accounts`
- ✅ Bank accounts page loads without errors

### Common Issues:
- ❌ Link not visible → Check user has admin/developer role
- ❌ 404 error → Verify route exists at `/app/admin/bank-accounts/page.tsx`

---

## Test 2: GL Account Dropdown Loading (3 minutes)

### Steps:
1. On Bank Accounts page, select a company from "Select company" dropdown
2. Click "New account" button
3. Scroll down to "GL Account" dropdown
4. Click the GL Account dropdown to open it

### Expected Results:
- ✅ Dropdown populates with asset-type GL accounts
- ✅ Accounts show format: "1000 - Bank Account" (code + name)
- ✅ Only asset accounts appear (1000, 1100, 1300, 1500 series)
- ✅ Only active accounts appear
- ✅ Accounts sorted by code
- ✅ Console log shows: `[Bank Accounts] Loaded X GL accounts for company {id}`

### Common Issues:
- ❌ Dropdown empty → Check Chart of Accounts exists for company
- ❌ "Missing index" error → Composite index still building, wait a few minutes
- ❌ Non-asset accounts appear → Filter not working, check query
- ❌ Toast: "Could not load GL accounts" → Check Firestore permissions

### How to Verify GL Accounts Exist:
1. Navigate to `/workspace/{companyId}/chart-of-accounts`
2. Verify asset accounts exist (Type: Asset)
3. If empty, regenerate COA:
   - Go to `/companies/{id}/edit`
   - Click "Reset & Re-apply Template"
   - Confirm and wait for completion

---

## Test 3: Form Validation - Visual Feedback (2 minutes)

### Steps:
1. With "New account" dialog open, leave all fields blank
2. Click "Create account" button at bottom
3. Observe the form

### Expected Results:
- ✅ Red borders appear on invalid required fields
- ✅ Error messages appear below fields:
  - "Account name is required"
  - "Account number is required"
  - "Bank name is required"
  - "GL account is required"
- ✅ Toast notification shows: "Please fill in required fields: Account name, Account number, Bank name, GL account"
- ✅ Toast displays for 5 seconds
- ✅ Form does NOT submit
- ✅ Dialog remains open

### Test Valid Field:
1. Fill in "Account name" field
2. Click "Create account" again
3. Observe that "Account name" field no longer has red border
4. Error message below "Account name" disappears

### Expected Behavior:
- ✅ Valid fields lose red border when filled
- ✅ Invalid fields keep red border until filled
- ✅ Toast shows only remaining missing fields

---

## Test 4: Successful Bank Account Creation (3 minutes)

### Steps:
1. Fill in all required fields:
   - **Account name**: "Main Checking Account"
   - **Account number**: "1234567890"
   - **Bank name**: "First National Bank"
   - **GL Account**: Select "1000 - Bank Account" (or similar asset account)
   - **Currency**: ZAR (default)
   - **Account Type**: checking (default)

2. Optional fields (test conditional inclusion):
   - **Branch**: Leave blank (test undefined handling)
   - **Country**: Leave blank
   - **Available balance**: Leave blank
   - **Approval threshold**: Leave blank

3. Click "Create account" button

### Expected Results:
- ✅ Form submits successfully
- ✅ Toast: "Bank account created successfully"
- ✅ Dialog closes
- ✅ New account appears in the bank accounts list
- ✅ Account shows with:
  - Name: "Main Checking Account"
  - Account Number: ending in "7890" (masked)
  - Bank: "First National Bank"
  - GL Account: "1000 - Bank Account"
  - Currency: ZAR
  - Status: Active

### Console Verification:
- ✅ No Firestore errors about undefined values
- ✅ No error: "Unsupported field value: undefined"
- ✅ Console shows successful creation log

### Common Issues:
- ❌ "Unsupported field value: undefined" → Conditional field inclusion not working
- ❌ Silent failure → Check browser console for errors
- ❌ GL account not selected → Validation should catch this

---

## Test 5: Advanced - Optional Fields (2 minutes)

### Steps:
1. Click "New account" again
2. Fill in required fields PLUS optional fields:
   - **Branch**: "Cape Town CBD"
   - **Country**: "South Africa"
   - **Available balance**: "50000"
   - **Approval threshold**: "10000"

3. Click "Create account"

### Expected Results:
- ✅ Account created successfully
- ✅ Optional fields saved in Firestore (verify in Firebase console)
- ✅ No undefined errors
- ✅ Account details show optional fields when viewed

---

## Test 6: Edge Cases (Optional)

### Test Invalid GL Account Selection:
1. Create account with all valid fields
2. Clear GL account dropdown after selecting
3. Try to submit

**Expected:** Validation catches missing GL account

### Test Duplicate Account Number:
1. Create account with account number "1111111111"
2. Try creating another with same account number

**Expected:** System allows (no uniqueness constraint yet) - note for Phase 6

---

## Verification Checklist

After completing all tests, verify:

- ✅ Bank Accounts accessible via Admin Panel → Bank Accounts
- ✅ GL Account dropdown loads asset accounts from company COA
- ✅ Form validation shows red borders and error messages
- ✅ Toast notifications clearly list missing fields
- ✅ Required fields: Name, Account Number, Bank Name, GL Account
- ✅ Optional fields: Branch, Country, Available Balance, Approval Threshold
- ✅ Bank accounts create successfully without Firestore errors
- ✅ Optional fields conditionally included (no undefined values)
- ✅ Accounts appear in list with correct details
- ✅ Console logs show successful operations

---

## Known Limitations

1. **Composite Index Requirement**: First-time use requires waiting for Firebase to build index for GL account query
2. **No Duplicate Prevention**: System doesn't prevent duplicate account numbers yet (Phase 6 feature)
3. **No Edit/Delete**: CRUD operations incomplete (Phase 6 feature)
4. **Manual Primary Selection**: No automatic primary account designation yet

---

## GL Account Selection Guide

**For primary company bank account:**
- Select: **Current Assets** (1000 series)
- Example: "1000 - Bank Account" or "1020 - Main Checking"

**For credit card accounts:**
- Select: **Liabilities** (2000 series) - NOT shown in current dropdown (assets only)

**For specialized accounts:**
- Payroll Account: Create sub-account under 1000 (e.g., "1040 - Payroll Account")
- Savings Account: Use 1000 series (e.g., "1050 - Business Savings")

**Accounting Principle:**
- Bank accounts = Assets (you own the money)
- Each physical bank account = One GL sub-account
- Keep GL accounts organized by function

---

## Troubleshooting

### GL Dropdown Empty
**Cause:** No Chart of Accounts or index building
**Fix:**
1. Check `/workspace/{companyId}/chart-of-accounts` for accounts
2. If empty, regenerate COA at `/companies/{id}/edit`
3. Wait 2-5 minutes for composite index to build

### "Unsupported field value: undefined"
**Cause:** Conditional field inclusion not working
**Fix:** Verify changes to:
- `/app/admin/bank-accounts/page.tsx` handleCreateAccount
- `/src/lib/firebase/bank-account-service.ts` createBankAccount

### Validation Not Showing
**Cause:** `validationAttempted` state not triggering
**Fix:** Check form state management in handleCreateAccount

### Silent Form Failure
**Cause:** Missing required field not caught
**Fix:** Check all validation logic and error collection in handleCreateAccount

---

## Success Criteria

✅ **PASS** if:
- All 6 tests complete without errors
- Bank accounts create successfully
- No Firestore undefined value errors
- Visual validation works as expected
- GL accounts load from company COA

❌ **FAIL** if:
- Navigation link missing or broken
- GL dropdown doesn't populate
- Validation errors not visible
- Firestore errors on account creation
- Optional fields cause undefined errors

---

## Next Steps

After successful testing:
1. ✅ Mark bank account management as complete in roadmap
2. 🔄 Test with multiple companies to verify multi-tenant isolation
3. ⏳ Wait for Phase 6 for Edit/Delete/Primary selection features
4. 📋 Consider adding duplicate account number prevention
5. 🎯 Plan transfer workflows between accounts (Phase 6)

---

**Last Updated:** 2025-10-10
**Related Documentation:** `/project-management/phase-5-bank-and-cash-management.md`
