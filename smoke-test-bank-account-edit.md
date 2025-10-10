# Smoke Test Guide: Bank Account Edit Functionality

**Feature:** Bank Account Editing Capability
**Session:** 2025-10-10
**Estimated Time:** 5 minutes

## Overview

This guide tests the newly added edit functionality for bank accounts in the admin panel.

---

## Prerequisites

- ✅ User with admin or developer role logged in
- ✅ At least one company with bank accounts created
- ✅ Navigate to `/admin/bank-accounts`

---

## Test 1: Edit Button Visibility (1 minute)

### Steps:
1. Navigate to `/admin/bank-accounts`
2. Select a company with existing bank accounts
3. Locate the Actions column in the bank accounts table
4. Look for a pencil icon (Edit button)

### Expected Results:
- ✅ Edit button (pencil icon) appears as first button in Actions column
- ✅ Edit button has tooltip "Edit account" on hover
- ✅ Edit button appears for ALL accounts (active, inactive, closed)
- ✅ Edit button is clickable

### Common Issues:
- ❌ No Edit button → Check user has admin/developer role
- ❌ Button disabled → Check for console errors

---

## Test 2: Edit Dialog Opens with Pre-populated Data (2 minutes)

### Steps:
1. Click Edit button (pencil icon) on any bank account
2. Observe the dialog that opens
3. Check all form fields

### Expected Results:
- ✅ Dialog opens immediately
- ✅ Dialog title: **"Edit bank account"**
- ✅ Submit button text: **"Update account"**
- ✅ All fields pre-populated with current account data:
  - Account name shows current name
  - Account number shows current number
  - Account type dropdown shows current type (e.g., "Checking")
  - Bank name shows current bank
  - Branch shows current branch (or empty)
  - **Branch Code shows current code (or empty)** ← NEW field
  - Country shows current country (or empty)
  - GL Account dropdown shows current selection
  - Currency shows current currency
  - Opening balance shows current ledger balance
  - Available balance shows current available (or empty)
  - Balance as of shows current date
  - Approval threshold shows current threshold (or empty)
  - Primary account checkbox reflects current isPrimary status

### Common Issues:
- ❌ Empty fields → Check `handleEditAccount` data transformation
- ❌ Wrong values → Check form state population logic
- ❌ Dialog doesn't open → Check console for errors

---

## Test 3: Edit and Save Changes (1 minute)

### Steps:
1. With edit dialog open, make the following changes:
   - Change **Account name** to "Edited Test Account"
   - Change **Branch Code** to "999888" (or add if empty)
2. Click **"Update account"** button
3. Observe the result

### Expected Results:
- ✅ Green success toast: "Bank account updated successfully"
- ✅ Dialog closes automatically
- ✅ Table refreshes
- ✅ Updated account name shows in table: "Edited Test Account"
- ✅ No console errors

### Verification:
1. Click Edit on same account again
2. ✅ Account name shows "Edited Test Account"
3. ✅ Branch code shows "999888"

---

## Test 4: Validation on Required Fields (1 minute)

### Steps:
1. Edit any bank account
2. Clear the **Account name** field (make it empty)
3. Click **"Update account"**

### Expected Results:
- ✅ Red border appears on Account name field
- ✅ Error message below field: "Account name is required"
- ✅ Red toast: "Please fill in required fields: Account name"
- ✅ Dialog STAYS OPEN (doesn't close)
- ✅ Account NOT updated in database

### Test Multiple Required Fields:
1. Also clear **Account number** and **Bank name**
2. Click "Update account"
3. ✅ Toast shows: "Please fill in required fields: Account name, Account number, Bank name"
4. ✅ All three fields have red borders

---

## Test 5: Cancel Edit (30 seconds)

### Steps:
1. Edit any bank account
2. Change **Account name** to "Should Not Save"
3. Change **Branch** to "Should Not Save Branch"
4. Click **"Cancel"** button

### Expected Results:
- ✅ Dialog closes immediately
- ✅ No success toast
- ✅ No changes saved

### Verification:
1. Edit same account again
2. ✅ Original account name still present
3. ✅ Original branch (or empty) still present

---

## Test 6: Edit Optional Fields (30 seconds)

### Steps:
1. Edit an account that has **no branch code**
2. Add Branch Code: "250655"
3. Add Country: "South Africa"
4. Click "Update account"

### Expected Results:
- ✅ Success toast
- ✅ Changes saved

### Verification:
1. Edit same account
2. ✅ Branch code shows "250655"
3. ✅ Country shows "South Africa"

### Clear Optional Field:
1. Clear the Branch Code field (make empty)
2. Click "Update account"
3. Edit same account again
4. ✅ Branch code is empty (not showing previous value)

---

## Verification Checklist

After completing all tests, verify:

- ✅ Edit button visible in all bank account rows
- ✅ Edit dialog opens with correct title
- ✅ All fields pre-populated correctly
- ✅ Submit button says "Update account"
- ✅ Changes save to database
- ✅ Table refreshes after update
- ✅ Success toast appears
- ✅ Validation works (red borders, error messages, toast)
- ✅ Required fields enforced
- ✅ Optional fields work (can add, change, clear)
- ✅ Branch code field supported (NEW)
- ✅ Cancel works without saving
- ✅ No console errors

---

## Field Coverage Test

Edit an account and verify you can change:

**Text Fields:**
- ✅ Account name
- ✅ Account number (auto-masks last 4 digits)
- ✅ Bank name
- ✅ Branch
- ✅ **Branch Code** ← NEW
- ✅ Country
- ✅ Currency

**Dropdowns:**
- ✅ Account type (checking, savings, cash, etc.)
- ✅ GL Account (asset accounts)

**Numbers:**
- ✅ Opening balance (ledger)
- ✅ Available balance
- ✅ Approval threshold

**Date:**
- ✅ Balance as of

**Checkbox:**
- ✅ Set as primary account

---

## Edge Cases

### Empty Optional Fields:
1. Edit account with branch code "250655"
2. Clear branch code field
3. Save
4. ✅ No error, branch code removed (not undefined)

### Large Numbers:
1. Edit account
2. Set approval threshold: "999999999"
3. Save
4. ✅ Number saves correctly (not truncated)

### Special Characters:
1. Edit account name: "Test & Company's Account"
2. Save
3. ✅ Special characters preserved (&, ')

### Date Selection:
1. Edit balance as of: "2024-01-01"
2. Save
3. Edit again
4. ✅ Date shows "2024-01-01" (not today's date)

---

## Success Criteria

✅ **PASS** if:
- All 6 tests complete without errors
- Edit button visible and functional
- Dialog pre-populates correctly
- Updates save successfully
- Validation works as expected
- Optional fields handle empty/populated states
- Branch code field fully functional

❌ **FAIL** if:
- Edit button missing or non-functional
- Fields not pre-populated
- Updates don't save
- Validation broken
- Console errors appear
- Optional fields cause errors

---

## Known Limitations

**Phase 5 Scope:**
1. ❌ Cannot delete accounts (Phase 6)
2. ❌ No duplicate account number prevention (Phase 6)
3. ❌ No automatic primary account enforcement (Phase 6)
4. ❌ No edit history/audit trail display (Phase 6)

**These are expected limitations** - not bugs.

---

## Troubleshooting

### Edit Dialog Won't Open
**Fix:** Check browser console, verify admin role

### Fields Not Pre-populating
**Fix:** Check `handleEditAccount` function, verify account data exists

### Update Not Saving
**Fix:** Check console for Firestore errors, verify required fields filled

### Branch Code Not Saving
**Fix:** Verify conditional inclusion logic, check Firestore write succeeded

---

**Last Updated:** 2025-10-10
**Related Documentation:** `/BANK-ACCOUNT-EDIT-FEATURE.md`
