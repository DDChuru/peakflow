# Smoke Test Guide: Company COA Management & Reset System

## Overview
This guide helps you verify the Company Chart of Accounts (COA) Management & Reset System implementation. The system allows users to:
- Edit company information and change industry types
- Reset and re-apply industry COA templates
- Manage Chart of Accounts entries
- Delete and recreate all GL accounts, patterns, and vendor mappings

## Prerequisites
- Development server running (`npm run dev`)
- Firebase emulator running (if using emulators)
- At least one test company created with COA data
- User with `admin` or `developer` role

---

## Test Suite 1: Bug Fix Verification

### Test 1.1: New Company Creation with COA Provisioning
**Purpose**: Verify the critical bug fix in `app/companies/new/page.tsx`

**Steps**:
1. Navigate to `/companies/new`
2. Fill in company details:
   - Name: "Test Retail Company"
   - Type: Client
   - Industry: Select "Retail & E-commerce"
   - Email: test@retail.com
3. Click "Create Company"
4. Observe the toast notifications

**Expected Results**:
- ✅ Company created successfully (no errors)
- ✅ Toast shows "Setting up Chart of Accounts..."
- ✅ Toast shows "Created [X] accounts for Test Retail Company"
- ✅ No console errors about `applyTemplate` method not found
- ✅ Redirected to companies list

**Common Issues**:
- ❌ Error: "applyTemplate is not a function" → Bug not fixed properly
- ❌ No accounts created → Template service instantiation issue

---

## Test Suite 2: Company Edit Page

### Test 2.1: Access Company Edit Page
**Purpose**: Verify edit page exists and loads correctly

**Steps**:
1. Go to `/companies`
2. Find any company card
3. Click "Edit Company" button (new button with Edit icon)
4. Verify page loads

**Expected Results**:
- ✅ Edit page loads at `/companies/[id]/edit`
- ✅ Form is pre-populated with current company data
- ✅ All fields show existing values (name, industry, email, etc.)
- ✅ Industry dropdown shows current selection
- ✅ Back button works (returns to `/companies`)

**Common Issues**:
- ❌ 404 error → File not created at correct location
- ❌ Form fields empty → Data loading issue
- ❌ Edit button not visible → Import or markup issue

---

### Test 2.2: Update Company Basic Information (No Industry Change)
**Purpose**: Verify basic company updates work without triggering COA reset

**Steps**:
1. On edit page, change:
   - Name to "Updated Company Name"
   - Email to "newemail@company.com"
   - Phone to "+1 (555) 999-8888"
2. Keep industry the same
3. Click "Update Company"

**Expected Results**:
- ✅ Toast: "Company updated successfully"
- ✅ Redirected to `/companies`
- ✅ Company card shows updated information
- ✅ No COA reset modal appears
- ✅ Chart of Accounts unchanged

**Common Issues**:
- ❌ Error on save → Service method issue
- ❌ Data not persisting → Firebase write failure

---

### Test 2.3: Change Industry Type (Shows Reset Modal)
**Purpose**: Verify industry change triggers reset warning

**Steps**:
1. Edit a company
2. Change industry from current to a different one (e.g., "Hospitality & Tourism")
3. Note the warning text "(Changing from [Old Industry])"
4. Click "Update Company"

**Expected Results**:
- ✅ Warning text shows old industry name
- ✅ Toast: "Company updated. Reset COA to apply new industry template."
- ✅ Reset modal appears automatically
- ✅ Modal shows correct template information:
   - Number of accounts to be deleted
   - Number of accounts to be created
   - Number of patterns and vendors
- ✅ "This action cannot be undone!" warning visible

**Common Issues**:
- ❌ Modal doesn't appear → State management issue
- ❌ Incorrect template counts → Template lookup issue

---

## Test Suite 3: COA Reset Functionality

### Test 3.1: Reset COA from Edit Page
**Purpose**: Verify complete COA deletion and re-application

**Steps**:
1. Navigate to edit page of a company with existing COA data
2. Click "Reset & Re-apply Template" button
3. Verify modal content
4. Click "Reset COA" button in modal
5. Wait for completion

**Expected Results**:
- ✅ Modal shows deletion warning
- ✅ Toast: "Resetting Chart of Accounts..." (loading state)
- ✅ After completion, success toast shows:
   - "COA Reset Complete!"
   - "Deleted: [X] accounts"
   - "Created: [Y] accounts"
- ✅ Redirected to `/companies`
- ✅ Process takes 5-15 seconds for large templates

**Verification Steps** (After reset):
1. Go to `/workspace/[companyId]/chart-of-accounts`
2. Verify accounts match new industry template
3. Check transaction patterns in bank import page
4. Verify vendor mappings exist

**Common Issues**:
- ❌ Deletion incomplete → Batch operation issue
- ❌ Error during creation → Template application bug
- ❌ Some old data remains → Deletion logic incomplete
- ❌ Timeout errors → Firestore batch limits exceeded

---

### Test 3.2: Cancel COA Reset
**Purpose**: Verify modal cancellation works

**Steps**:
1. Open reset modal
2. Click "Cancel" button

**Expected Results**:
- ✅ Modal closes
- ✅ No changes made to COA
- ✅ User remains on edit page

---

### Test 3.3: Reset with Large Industry Template
**Purpose**: Verify batch operation handling for templates with many accounts

**Steps**:
1. Edit a company
2. Change industry to one with many accounts (e.g., "Healthcare & Medical Services")
3. Perform reset
4. Monitor console for errors

**Expected Results**:
- ✅ Reset completes successfully even with 100+ accounts
- ✅ No "batch too large" errors
- ✅ All accounts created
- ✅ No console errors

**Common Issues**:
- ❌ Firestore batch limit error → Need to chunk operations
- ❌ Some accounts missing → Incomplete batch commit

---

## Test Suite 4: Service Layer Methods

### Test 4.1: listAccounts Method
**Purpose**: Verify listing all accounts for a company

**Open Browser Console** and run:
```javascript
// Replace with actual companyId
const companyId = 'YOUR_COMPANY_ID';
const service = new IndustryTemplateService(companyId);
const accounts = await service.listAccounts();
console.log('Accounts:', accounts.length, accounts);
```

**Expected Results**:
- ✅ Returns array of AccountRecord objects
- ✅ Accounts sorted by code (ascending)
- ✅ Each account has: id, code, name, type, normalBalance, etc.

---

### Test 4.2: deleteAllCOAData Method
**Purpose**: Verify complete data deletion (WARNING: Destructive!)

**Console Test** (Use test company only):
```javascript
const companyId = 'TEST_COMPANY_ID';
const service = new IndustryTemplateService(companyId);
const result = await service.deleteAllCOAData();
console.log('Deletion result:', result);
```

**Expected Results**:
- ✅ `result.accountsDeleted` > 0
- ✅ `result.patternsDeleted` >= 0
- ✅ `result.vendorsDeleted` >= 0
- ✅ `result.errors` is empty array (or contains only non-critical errors)

---

### Test 4.3: resetAndApplyTemplate Method
**Purpose**: Verify end-to-end reset and application

**Console Test**:
```javascript
const companyId = 'TEST_COMPANY_ID';
const userId = 'YOUR_USER_ID';
const service = new IndustryTemplateService(companyId);
const result = await service.resetAndApplyTemplate({
  companyId,
  industryId: 'retail',
  includePatterns: true,
  includeVendors: true,
  createdBy: userId
});
console.log('Reset result:', result);
```

**Expected Results**:
- ✅ `result.deleted.accountsDeleted` > 0
- ✅ `result.created.accountsCreated` > 0
- ✅ `result.created.patternsCreated` > 0
- ✅ `result.created.vendorsCreated` > 0
- ✅ `result.errors` is empty

---

## Test Suite 5: Edge Cases & Error Handling

### Test 5.1: Edit Non-Existent Company
**Steps**:
1. Navigate to `/companies/invalid-id-12345/edit`

**Expected Results**:
- ✅ Toast: "Company not found"
- ✅ Redirected to `/companies`

---

### Test 5.2: Reset COA with No Existing Data
**Purpose**: Verify reset works on company with no COA

**Steps**:
1. Create new company without industry (if possible)
2. Navigate to edit page
3. Select an industry
4. Click reset

**Expected Results**:
- ✅ Reset completes successfully
- ✅ New COA created
- ✅ No errors about missing data

---

### Test 5.3: Concurrent Reset Operations
**Purpose**: Verify system handles simultaneous resets

**Steps**:
1. Open edit page for Company A in Tab 1
2. Open edit page for Company B in Tab 2
3. Initiate reset in both tabs simultaneously

**Expected Results**:
- ✅ Both resets complete independently
- ✅ No data corruption
- ✅ Each company has correct template

---

## Test Suite 6: Integration Tests

### Test 6.1: Reset COA → Bank Import
**Purpose**: Verify reset integrates with bank-to-ledger system

**Steps**:
1. Reset a company's COA to "Retail" template
2. Navigate to `/workspace/[companyId]/bank-import`
3. Upload a bank statement CSV
4. Check transaction suggestions

**Expected Results**:
- ✅ GL accounts from new template appear in dropdowns
- ✅ Transaction patterns match new industry
- ✅ Vendor mappings work correctly

---

### Test 6.2: Reset COA → Financial Reports
**Purpose**: Verify reset doesn't break existing journal entries

**Steps**:
1. Note existing journal entries for a company
2. Reset the company's COA
3. Navigate to financial dashboard
4. Check if reports still render

**Expected Results**:
- ⚠️ **Expected Behavior**: Old journal entries may reference old GL account codes
- ✅ System doesn't crash
- ✅ User is informed of potential data inconsistencies

**Note**: This is a known limitation - COA reset should ideally be done on companies without historical transactions.

---

## Verification Checklist

### Phase 1: Bug Fixes ✅
- [ ] Company creation applies COA template without errors
- [ ] IndustryTemplateService instantiated correctly
- [ ] No console errors about missing methods

### Phase 2: UI Components ✅
- [ ] Edit button visible on company cards
- [ ] Edit page loads and displays correctly
- [ ] Form pre-populates with company data
- [ ] Industry change shows warning text
- [ ] Reset modal displays correctly
- [ ] All buttons and links functional

### Phase 3: Service Methods ✅
- [ ] `listAccounts()` returns correct data
- [ ] `deleteAllCOAData()` removes all data
- [ ] `resetAndApplyTemplate()` works end-to-end
- [ ] `getAllMappingRules()` returns all rules
- [ ] `deleteMappingRule()` removes specific rule

### Phase 4: Data Integrity ✅
- [ ] Reset deletes all accounts
- [ ] Reset creates new accounts from template
- [ ] Patterns and vendors recreated
- [ ] Industry configuration updated
- [ ] No orphaned data remains

### Phase 5: Error Handling ✅
- [ ] Invalid company ID handled gracefully
- [ ] Firestore errors caught and reported
- [ ] User receives clear error messages
- [ ] Console shows detailed error logs

---

## Known Limitations

1. **Historical Data**: Resetting COA on a company with existing journal entries may cause reference issues. Recommend using only on new companies or with full data migration plan.

2. **Firestore Limits**: Very large templates (500+ accounts) may need batch chunking improvements.

3. **Rollback**: There is no "undo" for COA reset. Always backup or test on development/staging first.

4. **Concurrent Users**: If multiple users edit the same company simultaneously, last write wins.

---

## Troubleshooting

### Issue: "applyTemplate is not a function"
**Solution**: Ensure `IndustryTemplateService` class is properly imported and instantiated with `new IndustryTemplateService(companyId)`.

### Issue: Accounts not deleted completely
**Solution**: Check Firestore security rules. Ensure batch write permissions exist for the user's role.

### Issue: Reset takes too long / times out
**Solution**: Check template size. Consider adding progress indicators or chunking large operations.

### Issue: Old patterns still appearing
**Solution**: Verify `getAllMappingRules()` and `deleteMappingRule()` methods work correctly. Check Firestore indexes.

---

## Success Criteria

All tests pass with:
- ✅ No console errors
- ✅ All CRUD operations functional
- ✅ Data integrity maintained
- ✅ User experience smooth and intuitive
- ✅ Error handling graceful and informative

---

## Next Steps After Testing

1. ✅ **Verify all tests pass**
2. ✅ **Update modernization-roadmap.md** with completion status
3. 🔄 **Consider Phase 3**: Connect COA page to real data (currently uses mock data in some places)
4. 🔄 **Consider Phase 4**: Add full CRUD for individual accounts via AccountFormModal
5. 📝 **Document any issues** found during testing
6. 🚀 **Deploy to staging** for user acceptance testing

---

## Contact & Support

If you encounter issues not covered in this guide:
1. Check console logs for detailed error messages
2. Verify Firebase emulator or production DB connection
3. Check Firestore security rules
4. Review the implementation files for potential issues

**Implementation Files**:
- `/app/companies/[id]/edit/page.tsx` - Company edit page
- `/src/lib/accounting/industry-template-service.ts` - Service layer
- `/src/lib/accounting/bank-to-ledger-service.ts` - Mapping rules
- `/app/companies/new/page.tsx` - Bug fix location

---

**Test Date**: _____________
**Tester Name**: _____________
**Result**: ✅ Pass / ❌ Fail / ⚠️ Partial
