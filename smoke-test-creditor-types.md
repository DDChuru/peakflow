# Smoke Test Guide: Creditor Types Implementation

**Feature**: Creditor Type Classification for Suppliers
**Date**: 2025-10-12
**Status**: ✅ Implementation Complete - Ready for Testing

---

## Overview

The Suppliers page now supports creditor type classification to distinguish between different types of creditors such as SARS (tax authorities), utilities, statutory deductions, and trade suppliers.

### What Changed

1. **TypeScript Interface**: Added `creditorType` field to Creditor interface
2. **UI Form**: Added creditor type dropdown in create/edit supplier dialog
3. **Visual Indicators**: Added color-coded badges for creditor types in table and view dialog
4. **Service Layer**: Updated CreditorService to handle creditorType field

### Creditor Types

| Type | Label | Badge Color | Use Case |
|------|-------|-------------|----------|
| `trade` | Trade Supplier | Indigo | Regular suppliers of goods/services |
| `tax-authority` | Tax Authority | Orange | SARS, VAT, other tax entities |
| `statutory` | Statutory | Purple | UIF, Pension funds, mandatory deductions |
| `utility` | Utility | Blue | Eskom, Municipality, Water, etc. |
| `other` | Other | Gray | Miscellaneous creditors |

---

## Quick Verification (2 minutes)

### ✅ Test 1: Create SARS as Tax Authority
1. Navigate to Suppliers page (`/workspace/[companyId]/suppliers`)
2. Click "Add Supplier" button
3. Verify you see "Creditor Type" dropdown with 5 options
4. Fill in:
   - Supplier Name: `SARS`
   - Creditor Type: `Tax Authority (e.g., SARS)` ← **VERIFY THIS OPTION EXISTS**
   - Payment Terms: `30`
5. Click "Create Supplier"
6. **Expected**: SARS appears in table with ORANGE badge showing "Tax Authority"

### ✅ Test 2: Visual Indicators in Table
1. Look at the SARS entry in the supplier table
2. **Expected**:
   - Orange badge with "Tax Authority" label
   - If category was added, it shows below the badge in gray text
   - Badge has border and colored background

### ✅ Test 3: View Dialog Shows Type
1. Click on SARS entry to open view dialog
2. **Expected**:
   - "Creditor Type" field appears
   - Shows orange "Tax Authority" badge
   - Located near the top of the dialog

---

## Comprehensive Test Suite

### Test Suite 1: Create Creditors of Each Type

#### Test 1.1: Tax Authority (SARS)
```
Navigate: /workspace/[companyId]/suppliers
Action: Add Supplier
Fields:
  - Name: SARS
  - Creditor Type: Tax Authority (e.g., SARS)
  - Tax ID: 9999999999
  - Payment Terms: 30
Expected:
  ✓ Orange "Tax Authority" badge in table
  ✓ Creditor saved successfully
  ✓ Badge visible in view dialog
```

#### Test 1.2: Statutory (UIF)
```
Navigate: /workspace/[companyId]/suppliers
Action: Add Supplier
Fields:
  - Name: UIF - Unemployment Insurance Fund
  - Creditor Type: Statutory (e.g., UIF, Pension)
  - Payment Terms: 7
Expected:
  ✓ Purple "Statutory" badge in table
  ✓ Creditor saved successfully
```

#### Test 1.3: Utility (Eskom)
```
Navigate: /workspace/[companyId]/suppliers
Action: Add Supplier
Fields:
  - Name: Eskom
  - Creditor Type: Utility (e.g., Eskom, Municipality)
  - Category: Electricity
  - Payment Terms: 30
Expected:
  ✓ Blue "Utility" badge in table
  ✓ Category "Electricity" shows below badge
```

#### Test 1.4: Trade Supplier (Default)
```
Navigate: /workspace/[companyId]/suppliers
Action: Add Supplier
Fields:
  - Name: ABC Office Supplies
  - Creditor Type: Trade Supplier (or leave default)
  - Category: Office Supplies
Expected:
  ✓ Indigo "Trade" badge in table
```

### Test Suite 2: Edit Existing Suppliers

#### Test 2.1: Change Creditor Type
```
Navigate: /workspace/[companyId]/suppliers
Action: Edit existing supplier
Steps:
  1. Click on any supplier row
  2. Change creditor type dropdown
  3. Click "Update Supplier"
Expected:
  ✓ Badge color changes immediately
  ✓ Correct label displays
  ✓ Change persists after page refresh
```

#### Test 2.2: Edit Dialog Pre-fills Type
```
Navigate: /workspace/[companyId]/suppliers
Action: Click SARS entry
Expected:
  ✓ Creditor Type dropdown shows "Tax Authority (e.g., SARS)"
  ✓ Dropdown is editable
```

### Test Suite 3: Visual Verification

#### Test 3.1: Badge Colors
```
Navigate: /workspace/[companyId]/suppliers
Verify in table:
  ✓ Tax Authority = Orange badge (bg-orange-100 text-orange-800)
  ✓ Statutory = Purple badge (bg-purple-100 text-purple-800)
  ✓ Utility = Blue badge (bg-blue-100 text-blue-800)
  ✓ Trade = Indigo badge (bg-indigo-100 text-indigo-800)
  ✓ Other = Gray badge (bg-gray-100 text-gray-800)
  ✓ All badges have visible borders
```

#### Test 3.2: Table Layout
```
Navigate: /workspace/[companyId]/suppliers
Verify "Category" column:
  ✓ Creditor type badge appears first (larger, colored)
  ✓ Category appears below in smaller gray text (if present)
  ✓ Bank details icon appears if bank details exist
```

#### Test 3.3: View Dialog Layout
```
Navigate: /workspace/[companyId]/suppliers
Action: Click any supplier
Verify dialog:
  ✓ "Creditor Type" field shows near top
  ✓ Badge matches table badge
  ✓ "Category" field appears separately below
```

### Test Suite 4: Data Persistence

#### Test 4.1: Refresh After Creation
```
Steps:
  1. Create SARS as tax-authority
  2. Hard refresh page (Ctrl+Shift+R)
Expected:
  ✓ SARS still shows orange "Tax Authority" badge
  ✓ creditorType persisted in Firestore
```

#### Test 4.2: Legacy Data Compatibility
```
Navigate: /workspace/[companyId]/suppliers
Action: View suppliers created before this feature
Expected:
  ✓ Old suppliers show "Trade" badge (default)
  ✓ No errors in console
  ✓ Can edit and save old suppliers
```

### Test Suite 5: Form Validation

#### Test 5.1: Required Field
```
Navigate: /workspace/[companyId]/suppliers
Action: Add Supplier (leave Creditor Type empty)
Expected:
  ✓ Form validation should pass (has default 'trade')
  ✓ Creates successfully with 'trade' type
```

#### Test 5.2: All Dropdown Options Work
```
Navigate: /workspace/[companyId]/suppliers
Action: Add Supplier
Test each option:
  1. Select "Trade Supplier" → Create → Verify indigo badge
  2. Edit → Select "Tax Authority" → Update → Verify orange badge
  3. Edit → Select "Statutory" → Update → Verify purple badge
  4. Edit → Select "Utility" → Update → Verify blue badge
  5. Edit → Select "Other" → Update → Verify gray badge
Expected:
  ✓ All options selectable
  ✓ Badges update correctly
```

---

## Edge Cases & Error Handling

### Edge Case 1: Missing creditorType in Firestore
```
Scenario: Old creditor document without creditorType field
Expected Behavior:
  ✓ Defaults to 'trade' type
  ✓ Shows indigo "Trade" badge
  ✓ No console errors
```

### Edge Case 2: Category + Type Combination
```
Scenario: Creditor with both category and type
Example: SARS with category "Tax Authorities"
Expected Behavior:
  ✓ Orange "Tax Authority" badge (primary)
  ✓ Category "Tax Authorities" below in gray
  ✓ Both visible in table
```

### Edge Case 3: Search by Type
```
Scenario: Search for "tax" in suppliers
Expected Behavior:
  ✓ Currently searches name/email/phone/category
  ✓ Does NOT search creditorType (future enhancement)
  Note: This is expected current behavior
```

---

## Console Check

### Expected Logs
```javascript
// When creating SARS
✓ No errors
✓ No warnings
✓ Firestore write includes creditorType: "tax-authority"
```

### Check Network Tab
```
Navigate: Network → Firestore requests
Filter: creditors collection
Verify:
  ✓ POST/PUT includes creditorType field
  ✓ Value is one of: 'trade', 'tax-authority', 'statutory', 'utility', 'other'
```

---

## Files Changed

### `/src/types/financial.ts` - Line 48
```typescript
creditorType: 'trade' | 'tax-authority' | 'statutory' | 'utility' | 'other';
```

### `/app/workspace/[companyId]/suppliers/page.tsx`
- **Line 79**: Added creditorType to form schema
- **Line 129**: Added default value 'trade'
- **Line 217**: Included in handleCreateSupplier
- **Line 281**: Included in handleEditSupplier
- **Line 340**: Included in openEditDialog
- **Line 473-487**: Added getCreditorTypeInfo helper
- **Line 863-899**: Added creditor type dropdown in form
- **Line 704-718**: Updated table to show badges
- **Line 1205-1211**: Added type display in view dialog

### `/src/lib/firebase/creditor-service.ts` - Line 255
```typescript
creditorType: data.creditorType || 'trade',
```

---

## Known Limitations

1. **Search**: Creditor type is not included in search filter (only name, email, phone, category)
2. **Filtering**: No dropdown filter for creditor type yet (could be future enhancement)
3. **Summary Cards**: Total counts don't break down by creditor type yet

---

## Success Criteria

### ✅ All tests pass if:
1. Can create SARS with "Tax Authority" type
2. Orange badge appears in table
3. Badge appears in view dialog
4. Can edit and change creditor types
5. All 5 creditor types work correctly
6. Old suppliers default to "Trade" type
7. No console errors
8. Data persists after refresh

### ⚠️ Report issues if:
- Badge colors don't match specification
- Dropdown options missing or misspelled
- creditorType not saving to Firestore
- Console shows TypeScript errors
- Visual layout broken

---

## Quick Test Checklist

Use this for rapid verification:

```
□ Add Supplier button works
□ Creditor Type dropdown visible
□ 5 options available in dropdown
□ Created SARS with "Tax Authority"
□ Orange badge shows in table
□ View dialog shows orange badge
□ Edit SARS - dropdown pre-filled correctly
□ Changed type - badge updates
□ Page refresh - changes persist
□ No console errors
```

---

## Visual Reference

### Expected Badge Colors

**Tax Authority (SARS)**
```
[  Tax Authority  ]  ← Orange background, orange text, orange border
```

**Statutory (UIF)**
```
[    Statutory    ]  ← Purple background, purple text, purple border
```

**Utility (Eskom)**
```
[     Utility     ]  ← Blue background, blue text, blue border
```

**Trade Supplier**
```
[      Trade      ]  ← Indigo background, indigo text, indigo border
```

**Other**
```
[      Other      ]  ← Gray background, gray text, gray border
```

---

## Integration Notes

### For Future AI Agent Integration
When implementing Phase 6 (AI Agent Debtor/Creditor Integration), the AI will be able to:
- Detect SARS payments and auto-suggest `creditorType: 'tax-authority'`
- Match statutory payments to `creditorType: 'statutory'`
- Match utility payments to `creditorType: 'utility'`
- Use creditorType for smarter creditor matching

Example AI detection:
```typescript
if (description.includes('SARS') || description.includes('Tax')) {
  suggestedCreditorType = 'tax-authority';
}
```

---

## Troubleshooting

### Issue: Dropdown not showing
**Solution**: Check form initialization - ensure creditorType in defaultValues

### Issue: Badge not colored
**Solution**: Verify getCreditorTypeInfo() returns correct color classes

### Issue: Type not saving
**Solution**: Check handleCreateSupplier and handleEditSupplier include creditorType

### Issue: Old suppliers show undefined
**Solution**: Check convertFirestoreToCreditor has fallback: `|| 'trade'`

---

**Test completed by**: _______________ **Date**: _______________
**Status**: ⬜ Pass ⬜ Fail ⬜ Partial

**Notes**:
```




```
