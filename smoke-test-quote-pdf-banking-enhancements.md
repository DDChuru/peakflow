# Smoke Test Guide: Quote PDF Banking Enhancements

**Feature:** Quote PDF Visual Improvements & Branch Code Support
**Session:** 2025-10-10
**Estimated Time:** 8 minutes

## Overview

This guide tests the enhanced quote PDF generation including:
- 20% larger company logo with hover zoom effect
- Banking details section repositioned above terms & conditions
- Subtle gradient header background for banking section
- Branch code support in bank accounts, quote view, and PDF

---

## Prerequisites

- ✅ User logged in with access to quotes
- ✅ Company with at least one bank account configured
- ✅ Company logo uploaded in company settings
- ✅ At least one quote created with banking details

---

## Test 1: Logo Enhancement (2 minutes)

### Steps:
1. Navigate to `/workspace/{companyId}/quotes`
2. Click "View" on any existing quote
3. Observe the company logo in the quote view dialog
4. Hover your mouse over the logo

### Expected Results:
- ✅ Logo is visibly larger than before (24x24 pixels, 20% bigger)
- ✅ Logo smoothly zooms when hovering (1.1x scale)
- ✅ Zoom transition is smooth with 300ms duration
- ✅ Logo returns to normal size when hover ends

### Common Issues:
- ❌ Logo not visible → Check company has logo uploaded in settings
- ❌ No zoom effect → Check CSS classes include `hover:scale-110`

---

## Test 2: Banking Details Visual Hierarchy (2 minutes)

### Steps:
1. With quote view dialog open, scroll to the bottom section
2. Observe the order of sections
3. Look at the banking details section styling

### Expected Results:
- ✅ **Banking Details** section appears BEFORE "Terms & Conditions"
- ✅ Banking section has a subtle gradient header (indigo-50 to blue-50)
- ✅ Header text "BANKING DETAILS" is in uppercase with indigo-900 color
- ✅ Section has rounded corners with border
- ✅ Content is in a clean 2-column grid layout
- ✅ Left column shows: Bank, Account Name, Branch (if available)
- ✅ Right column shows: Account Number, Branch Code (if available)

### Visual Reference:
```
┌────────────────────────────────────────┐
│ BANKING DETAILS [gradient background] │
├────────────────────────────────────────┤
│ Bank: FNB              Acct #: 123... │
│ Account Name: Main     Branch: 250655 │
│ Branch: Cape Town                      │
└────────────────────────────────────────┘

Terms & Conditions
[terms content...]
```

---

## Test 3: Branch Code in Bank Account Admin (2 minutes)

### Steps:
1. Navigate to `/admin/bank-accounts`
2. Select a company
3. Click "New account" button
4. Scroll to find "Branch Code" field

### Expected Results:
- ✅ "Branch Code (optional)" field appears between "Branch" and "Country"
- ✅ Field has placeholder text: "e.g. 250655"
- ✅ Field is in 2-column grid with "Country" field
- ✅ Can input branch code value
- ✅ Saving account includes branch code in Firestore

### Test Branch Code Persistence:
1. Fill in required fields:
   - Account name: "Test Account"
   - Account number: "9876543210"
   - Bank name: "Test Bank"
   - GL Account: Select any asset account
   - Branch Code: "250655"
2. Click "Create account"
3. Verify account created successfully

**Expected:** Branch code "250655" saved to Firestore

---

## Test 4: Branch Code Display in Quote View (1 minute)

### Steps:
1. Ensure a bank account with branch code exists (from Test 3)
2. Create or view a quote that uses this bank account
3. Open quote view dialog
4. Scroll to banking details section

### Expected Results:
- ✅ Branch Code displays in right column
- ✅ Label: "Branch Code:" in slate-500 color
- ✅ Value: Branch code number in slate-900 bold
- ✅ Only shows if branch code is available
- ✅ Doesn't show blank field if no branch code

---

## Test 5: PDF Generation - Visual Improvements (2 minutes)

### Steps:
1. With quote view dialog open, click "Download PDF"
2. Wait for PDF to generate and download
3. Open the PDF file
4. Examine the visual layout

### Expected Results:
- ✅ **Logo is 20% bigger** (96px width vs previous 80px)
- ✅ **Banking Details section appears BEFORE Terms & Conditions**
- ✅ Banking section header has subtle indigo background (#eef2ff)
- ✅ Header text "BANKING DETAILS" in uppercase, bold, indigo color
- ✅ Banking content in 2-column layout:
  - Left: Bank, Account Name, Branch (if available)
  - Right: Account Number, Branch Code (if available)
- ✅ Branch code displays if available: "Branch Code: 250655"
- ✅ Branch code doesn't show if not set
- ✅ Terms & Conditions appear AFTER banking details

### Visual PDF Layout:
```
[LARGER LOGO - 96px]

QUOTE #12345

[Quote details...]

[Totals table...]

┌────────────────────────────────────────┐
│ BANKING DETAILS [indigo background]   │
├────────────────────────────────────────┤
│ Bank: FNB              Acct #: 123...  │
│ Account Name: Main     Branch: 250655  │
│ Branch: Cape Town                       │
└────────────────────────────────────────┘

Terms & Conditions
[terms text...]
```

---

## Test 6: Conditional Rendering - No Branch Code (1 minute)

### Steps:
1. Create or use a bank account WITHOUT branch code
2. Create/view a quote using this account
3. View the quote dialog and download PDF

### Expected Results:
- ✅ Banking details still display correctly
- ✅ **Branch Code field does NOT appear** in view dialog
- ✅ **Branch Code field does NOT appear** in PDF
- ✅ Layout remains clean without empty fields
- ✅ Other fields (Bank, Account Name, Account Number) display normally

---

## Verification Checklist

After completing all tests, verify:

### Logo Enhancement
- ✅ Logo is 20% bigger in both view and PDF
- ✅ Logo has smooth hover zoom in view dialog
- ✅ Zoom transition works properly

### Banking Details Layout
- ✅ Banking section appears BEFORE terms in view
- ✅ Banking section appears BEFORE terms in PDF
- ✅ Subtle gradient header background in view
- ✅ Subtle indigo background header in PDF
- ✅ 2-column grid layout in both view and PDF

### Branch Code Feature
- ✅ Branch code field in bank account admin form
- ✅ Branch code saves to Firestore correctly
- ✅ Branch code displays in quote view (when available)
- ✅ Branch code displays in PDF (when available)
- ✅ Branch code conditionally hidden (when not available)
- ✅ No undefined Firestore errors with optional field

---

## Common Issues & Troubleshooting

### Logo Not Zooming
**Symptoms:** Logo doesn't zoom on hover
**Fix:**
- Check CSS classes include: `transition-transform duration-300 hover:scale-110`
- Verify Tailwind CSS properly compiling
- Check browser console for CSS errors

### Banking Details Wrong Order
**Symptoms:** Banking appears after terms instead of before
**Fix:**
- In `/app/workspace/[companyId]/quotes/page.tsx`
- Verify banking details JSX appears before terms & conditions JSX
- Check around lines 1836-1891 for view, lines 680-721 for PDF

### Branch Code Not Saving
**Symptoms:** Branch code field filled but not saved to Firestore
**Fix:**
- Check conditional inclusion in `handleCreateAccount`
- Should have: `if (accountForm.branchCode.trim()) accountData.branchCode = accountForm.branchCode.trim();`
- Verify no undefined value errors in console

### PDF Header Background Missing
**Symptoms:** Banking header in PDF has no background color
**Fix:**
- Check pdfmake table layout has `fillColor: () => '#eef2ff'`
- Verify `bankingHeader` style exists in styles object
- Check PDF generation code around line 680-721

### Branch Code Shows When Empty
**Symptoms:** "Branch Code:" label shows with no value
**Fix:**
- Check conditional rendering: `{primaryBankAccount.branchCode && <div>...}</div>}`
- Verify spread operator in PDF: `...(primaryBankAccount.branchCode ? [...] : [])`

---

## Edge Cases

### Multiple Bank Accounts
- Only primary bank account displays in quote
- Branch code from primary account shows if available

### Very Long Branch Codes
- Layout should handle up to 15 characters gracefully
- Text should not overflow or break layout

### Special Characters in Branch Code
- Alpha-numeric characters supported
- Hyphens and spaces should display correctly

---

## Success Criteria

✅ **PASS** if:
- Logo is visibly 20% larger in both view and PDF
- Logo zooms smoothly on hover in view dialog
- Banking details appear BEFORE terms in both view and PDF
- Banking section has distinct styled header in both formats
- Branch code field exists in admin form
- Branch code saves and retrieves correctly
- Branch code displays conditionally in view and PDF
- No Firestore undefined value errors

❌ **FAIL** if:
- Logo size unchanged
- Banking details appear after terms
- No header background/styling on banking section
- Branch code always shows even when empty
- Branch code causes Firestore errors
- Layout broken in view or PDF

---

## Integration Points

### Related Features:
1. **Bank Account Management** (`/admin/bank-accounts`)
   - Branch code field added to form
   - Conditional Firestore inclusion implemented

2. **Quote Management** (`/workspace/[companyId]/quotes`)
   - View dialog enhanced with gradient styling
   - PDF generation reordered and styled

3. **Company Settings**
   - Logo upload affects quote display
   - Primary bank account selection determines quote banking details

---

## Next Steps

After successful testing:
1. ✅ Mark quote PDF enhancements as complete
2. ✅ Update Phase 5 progress in modernization roadmap
3. 📸 Consider taking screenshots for documentation
4. 💡 Consider adding branch code to other bank account displays
5. 🎯 Plan additional PDF styling enhancements for invoices

---

**Last Updated:** 2025-10-10
**Related Documentation:**
- `/QUOTE-PDF-BANKING-ENHANCEMENTS.md` (walkthrough)
- `/project-management/phase-5-bank-and-cash-management.md`
- `/smoke-test-bank-account-management.md`
