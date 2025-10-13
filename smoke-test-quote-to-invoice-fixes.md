# 🧪 Smoke Test: Quote-to-Invoice Conversion Fixes

## 📋 Overview
This smoke test verifies two critical fixes to the quote-to-invoice conversion process:
1. **PO Number Capture** - Field now available to optionally capture Purchase Order Number
2. **Tax Rate Preservation** - Document-level tax rate now correctly passed to invoice and displayed in PDF

**Commit:** 65fea05 - fix: add PO Number field and document-level tax rate to quote-to-invoice conversion

---

## 🎯 What Was Fixed

### Issue 1: Missing PO Number Field ✅ FIXED
**Problem:** No way to capture Purchase Order Number during conversion
**Solution:** Added optional PO Number field in invoice settings step
**Impact:** Users can now record client PO numbers for invoice tracking

### Issue 2: Tax Rate Shows 0% in PDF ✅ FIXED
**Problem:** Invoice PDF showed "Tax Rate: 0%" even when quote had taxes
**Solution:**
- Calculate average tax rate from quote line items
- Add Tax Rate field in settings (pre-populated with calculated value)
- Pass document-level taxRate to invoice creation
**Impact:** Invoice PDFs now correctly display tax rate and match quote values

---

## 🧪 Test Scenarios

### Test 1: Quote-to-Invoice with PO Number
**Objective:** Verify PO Number can be captured and appears in invoice

**Prerequisites:**
- Logged in as admin/financial_admin
- Have at least one quote in "sent" or "accepted" status
- Quote should have line items with tax rates

**Steps:**
1. Navigate to **Quotes** page
2. Find a quote with status "Sent" or "Accepted"
3. Click the quote to view details
4. Click **"Convert to Invoice"** button

**Step 1: Review Items**
- ✅ Verify all quote line items are displayed
- ✅ Verify all items are checked (included) by default
- ✅ Verify totals match the original quote
- Click **Continue** →

**Step 2: Invoice Settings**
- ✅ Verify **Invoice Date** field (pre-filled with today)
- ✅ Verify **Payment Terms** field (default 30 days)
- ✅ **NEW**: Verify **Purchase Order Number** field is visible
  - Should be labeled "Purchase Order Number"
  - Should have placeholder "Optional"
  - Should be empty by default
- ✅ **NEW**: Verify **Tax Rate (%)** field is visible
  - Should be labeled "Tax Rate (%)"
  - Should be pre-filled with average tax rate from quote line items
  - For example, if quote items have 15% tax, should show "15"
- ✅ Enter a PO Number: e.g., "PO-2025-001"
- ✅ Verify Tax Rate shows correct percentage (not 0%)
- ✅ Check **Invoice Preview** card shows:
  - Customer name
  - Invoice date
  - Due date
  - **PO Number** (should show the value you entered)
  - **Tax Rate** (should show calculated percentage)
  - Items count
  - Total amount
- Click **Continue** →

**Step 3: Confirm**
- ✅ Review conversion summary
- ✅ Click **Convert to Invoice**
- ✅ Wait for success message
- ✅ Verify redirect to invoices page

**Verification:**
1. Find the newly created invoice in the invoices list
2. Click to view invoice details
3. ✅ Verify PO Number appears in invoice details
4. ✅ Click **Download PDF**
5. Open the PDF and verify:
   - ✅ PO Number appears in "INVOICE DETAILS" section
   - ✅ Tax Rate appears and is NOT 0%
   - ✅ Tax Rate matches the value from quote (e.g., 15%)
   - ✅ Tax amount is calculated correctly

**Expected Results:**
- ✅ PO Number captured during conversion
- ✅ PO Number displays in invoice details
- ✅ PO Number appears in PDF
- ✅ Tax Rate shows correct percentage (not 0%)
- ✅ Tax calculations match quote values

---

### Test 2: Quote-to-Invoice without PO Number
**Objective:** Verify conversion works when PO Number is left empty

**Steps:**
1. Navigate to **Quotes** page
2. Select another quote
3. Click **Convert to Invoice**
4. In Invoice Settings step:
   - Leave **Purchase Order Number** field empty
   - Verify **Tax Rate** is pre-filled correctly
5. Complete conversion

**Expected Results:**
- ✅ Conversion succeeds without PO Number
- ✅ Invoice created successfully
- ✅ PO Number field in PDF is omitted (not shown as blank)
- ✅ Tax Rate still displays correctly in PDF

---

### Test 3: Quote with Mixed Tax Rates
**Objective:** Verify tax rate calculation when line items have different tax rates

**Prerequisites:**
- Create a quote with multiple line items having DIFFERENT tax rates:
  - Item 1: 15% tax
  - Item 2: 15% tax
  - Item 3: 0% tax (tax-exempt item)

**Steps:**
1. Convert this quote to invoice
2. In Invoice Settings:
   - ✅ Verify Tax Rate field shows **average** of line item tax rates
   - For example: (15% + 15% + 0%) / 3 = 10%
   - You can adjust this value if needed
3. Complete conversion
4. Check PDF:
   - ✅ Verify document-level Tax Rate shows the value you set
   - ✅ Verify line items still show their individual tax rates

**Expected Results:**
- ✅ Tax Rate calculated as average of all line item tax rates
- ✅ User can adjust tax rate if needed
- ✅ Document-level tax rate appears in PDF
- ✅ Line item taxes remain accurate

---

### Test 4: Edit Tax Rate During Conversion
**Objective:** Verify tax rate can be manually adjusted

**Steps:**
1. Start quote-to-invoice conversion
2. In Invoice Settings:
   - Note the pre-filled Tax Rate (e.g., 15%)
   - Manually change it to a different value (e.g., 14%)
3. Complete conversion
4. Check invoice PDF

**Expected Results:**
- ✅ Tax Rate field accepts manual input
- ✅ PDF displays the manually entered tax rate
- ✅ Line item taxes remain as originally calculated
- ✅ No errors during conversion

---

### Test 5: Quote with Zero Tax
**Objective:** Verify conversion works for tax-exempt quotes

**Prerequisites:**
- Create a quote with all line items having 0% tax rate

**Steps:**
1. Convert quote to invoice
2. In Invoice Settings:
   - ✅ Verify Tax Rate shows 0%
3. Complete conversion
4. Check PDF

**Expected Results:**
- ✅ Tax Rate field shows 0%
- ✅ Conversion succeeds
- ✅ PDF shows "Tax Rate: 0%" (not omitted)
- ✅ Tax Amount line shows R 0.00

---

## 🔍 Edge Cases to Test

### Edge Case 1: Very Long PO Number
**Test:** Enter PO Number with 50+ characters
**Expected:** Field accepts long input, PDF displays correctly (may wrap)

### Edge Case 2: Special Characters in PO Number
**Test:** Enter PO Number with special chars: "PO-2025/001-REV#2"
**Expected:** Accepts special characters, displays correctly in PDF

### Edge Case 3: Decimal Tax Rate
**Test:** Enter tax rate with decimals: 14.75%
**Expected:** Accepts decimal values, calculates correctly

### Edge Case 4: Quote Without Line Items
**Test:** Try to convert a quote with no line items
**Expected:** Validation error prevents conversion

---

## ✅ Verification Checklist

### UI Elements
- [ ] PO Number field visible in Invoice Settings step
- [ ] PO Number field labeled correctly
- [ ] PO Number field has "Optional" placeholder
- [ ] Tax Rate field visible in Invoice Settings step
- [ ] Tax Rate field labeled "Tax Rate (%)"
- [ ] Tax Rate field accepts numeric input (0-100)
- [ ] Tax Rate field allows decimals (step 0.01)
- [ ] Invoice Preview shows PO Number when entered
- [ ] Invoice Preview shows Tax Rate percentage

### Functionality
- [ ] Tax Rate auto-calculated from quote line items
- [ ] Tax Rate calculation is average of all line items
- [ ] PO Number included in invoice creation request
- [ ] Tax Rate included in invoice creation request
- [ ] Conversion succeeds with PO Number
- [ ] Conversion succeeds without PO Number
- [ ] Manual tax rate adjustment works

### Data Persistence
- [ ] PO Number saved to invoice document
- [ ] Tax Rate saved to invoice document
- [ ] PO Number appears in invoice details view
- [ ] Tax Rate appears in invoice details view

### PDF Generation
- [ ] PO Number appears in PDF "INVOICE DETAILS" section
- [ ] Tax Rate appears in PDF "INVOICE DETAILS" section
- [ ] Tax Rate displays as percentage (e.g., "15%")
- [ ] Tax Rate NOT 0% when quote had taxes
- [ ] PO Number omitted from PDF when not provided (not shown as blank)
- [ ] Tax calculations match quote values
- [ ] PDF layout remains professional and clean

---

## 🐛 Common Issues to Check

### Issue: Tax Rate Shows 0% in PDF
**Check:**
- Was Tax Rate field filled in during conversion?
- Does invoice document in Firestore have taxRate field?
- Is taxRate being passed to PDF generation?

**Debug:**
```typescript
// Check invoice object in console
console.log('Invoice taxRate:', selectedInvoice.taxRate);
```

### Issue: PO Number Not Appearing in PDF
**Check:**
- Was PO Number entered during conversion?
- Does invoice document have purchaseOrderNumber field?
- Is PDF template checking for purchaseOrderNumber?

**Debug:**
```typescript
// Check invoice object in console
console.log('Invoice PO Number:', selectedInvoice.purchaseOrderNumber);
```

### Issue: Tax Rate Not Pre-Populated
**Check:**
- Do quote line items have taxRate values?
- Is useEffect calculating average correctly?
- Check browser console for calculation errors

**Debug:**
```typescript
// Check quote line items
console.log('Quote line items:', quote.lineItems.map(item => item.taxRate));
```

---

## 📊 Test Results Template

**Test Date:** _______________
**Tester:** _______________
**Environment:** Production / Staging / Local

| Test Scenario | Status | Notes |
|--------------|--------|-------|
| Test 1: PO Number Capture | ⬜ Pass / ⬜ Fail | |
| Test 2: Without PO Number | ⬜ Pass / ⬜ Fail | |
| Test 3: Mixed Tax Rates | ⬜ Pass / ⬜ Fail | |
| Test 4: Edit Tax Rate | ⬜ Pass / ⬜ Fail | |
| Test 5: Zero Tax | ⬜ Pass / ⬜ Fail | |
| Edge Case 1: Long PO Number | ⬜ Pass / ⬜ Fail | |
| Edge Case 2: Special Chars | ⬜ Pass / ⬜ Fail | |
| Edge Case 3: Decimal Tax | ⬜ Pass / ⬜ Fail | |

**Overall Result:** ⬜ All Tests Pass / ⬜ Issues Found

**Issues Found:**
1. _______________
2. _______________

**Screenshots Attached:** ⬜ Yes / ⬜ No

---

## 🎯 Success Criteria

The fixes are considered successful when:

✅ **PO Number Field:**
- Field appears in Invoice Settings step
- Optional - conversion works with or without it
- Value saved to invoice document
- Appears in invoice details view
- Displays correctly in PDF

✅ **Tax Rate Field:**
- Field appears in Invoice Settings step
- Pre-populated with calculated average from quote line items
- Accepts manual adjustments
- Value saved to invoice document
- Displays correctly in PDF (NOT 0% when quote had taxes)

✅ **No Regressions:**
- Quote conversion still works normally
- All existing fields still function
- PDF generation not broken
- Line item taxes still calculated correctly
- No console errors during conversion

---

## 📝 Notes

### Code Changes Summary:
**File:** `src/components/quotes/QuoteToInvoiceModal.tsx`

**Changes:**
1. Added state variables: `purchaseOrderNumber`, `taxRate`
2. Added tax rate calculation in useEffect from quote line items
3. Added two new input fields in settings step
4. Updated invoiceRequest to include both new fields
5. Updated Invoice Preview card to display both fields

**Lines Changed:**
- State: Lines 59-60
- Calculation: Lines 83-87
- UI Fields: Lines 457-480
- Preview: Lines 519-528
- Invoice Request: Lines 155-156

---

## 🚀 Deployment Notes

**Production Readiness:**
- ✅ Code changes committed (commit 65fea05)
- ✅ No database migrations required
- ✅ No Firebase rule changes needed
- ✅ No environment variables added
- ✅ Backward compatible (optional fields)

**Rollback Plan:**
If issues occur, revert commit 65fea05:
```bash
git revert 65fea05
git push origin main
```

---

## 📞 Support

**Questions or Issues?**
- Check existing invoices to ensure they display correctly
- Review PDF generation logs if PDFs show incorrect data
- Verify Firestore documents have the new fields

**Related Documentation:**
- Invoice PDF Generation: `/app/workspace/[companyId]/invoices/page.tsx` (line 709)
- Invoice Types: `/src/types/accounting/invoice.ts`
- Quote Service: `/src/lib/firebase/quote-service.ts`

---

**Test Status:** 🟡 Pending Initial Test
**Last Updated:** 2025-01-13
**Next Review:** After production testing
