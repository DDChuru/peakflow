# Smoke Test Guide: Quotes Page

**Date:** 2025-10-09
**Feature:** Complete Quotes Management with Document-Level Tax, Customer Details, and Company Branding

---

## Overview

This guide verifies the complete Quotes page functionality including:
- ✅ Quote creation with document-level tax calculation
- ✅ Quote editing with tax rate updates
- ✅ Customer detail population (name, email, address, phone)
- ✅ Company branding in quote view (logo, details)
- ✅ Professional invoice-style layout
- ✅ Form validation with visual feedback
- ✅ Firestore permissions for multi-tenant access

---

## Prerequisites

1. **Firebase Authentication:** Logged in user
2. **Company Setup:** At least one company with VAT percentage configured
3. **Customers:** At least 2-3 customers created in the workspace
4. **Chart of Accounts:** Revenue accounts available for line items

---

## Test 1: Create New Quote with Tax

### Steps
1. Navigate to `/workspace/[companyId]/quotes`
2. Click **"+ Create Quote"** button
3. Fill in the form:
   - **Customer:** Select from dropdown
   - **Quote Date:** Today's date
   - **Validity Period:** 30 days
   - **Currency:** ZAR (or your default)
   - **Tax Rate:** Should pre-fill from company VAT (e.g., 15%)
   - **Line Items:** Add 2-3 items with descriptions, quantities, prices, GL accounts
   - **Notes:** Optional
   - **Terms:** Optional

### Expected Results
✅ **Tax rate pre-fills** from company.vatPercentage
✅ **Totals calculate in real-time:**
   - Subtotal = Sum of all line item amounts
   - Tax = Subtotal × Tax Rate
   - Total = Subtotal + Tax
✅ **All line items require:** description, quantity > 0, unitPrice ≥ 0, GL account
✅ **Validation errors** show with red borders and error messages
✅ **On submit:** Success toast, dialog closes, quote appears in list
✅ **Quote number auto-generated:** e.g., QUO-2025-001

### Console Logs to Check
```
📝 Form submission started
✅ No validation errors
🔄 Creating quote with data: {...}
✅ Quote created successfully
```

---

## Test 2: Edit Existing Quote

### Steps
1. From the quotes list, find a quote with status "draft"
2. Click the **Edit** button (pencil icon)
3. Verify the **Edit Dialog opens** with:
   - Customer pre-selected
   - Quote date, validity, currency populated
   - **Tax rate loaded correctly**
   - All line items displayed with correct values
   - Notes and terms populated if they exist
4. Make changes:
   - Change customer
   - Update tax rate (e.g., from 15% to 20%)
   - Modify a line item quantity
   - Add a new line item
   - Remove a line item
5. Watch **totals recalculate in real-time**
6. Click **"Update Quote"**

### Expected Results
✅ **Dialog opens** with all fields pre-populated
✅ **Tax rate loaded** from quote data (not just company default)
✅ **Line items editable** with add/remove buttons
✅ **Real-time calculations** update as you type
✅ **Validation prevents** empty fields or invalid values
✅ **On submit:** Success toast, dialog closes, list refreshes
✅ **Updated quote** shows new values in list

### Console Logs to Check
```
🔧 Opening edit dialog for quote: [id] [quoteNumber]
Quote data: {...}
📝 handleEdit called with data: {...}
✅ Quote updated successfully
```

---

## Test 3: View Quote with Customer & Company Details

### Steps
1. From the quotes list, click **View** button (eye icon)
2. Examine the **View Dialog** layout

### Expected Results

#### Company Header (Top Section)
✅ **Company logo** displayed (if configured)
✅ **Company name** in bold
✅ **Company address, email, phone** displayed
✅ **Quote number** large and prominent (right side)
✅ **Status badge** with color coding

#### Customer "BILL TO" Section
✅ **"BILL TO" label** in small gray font
✅ **Customer name** in bold
✅ **Customer address** (if available)
✅ **Customer email** (if available)
✅ **Customer phone** (if available)
✅ **Gray background box** for professional look

#### Quote Details
✅ **Quote Date** formatted clearly
✅ **Valid Until** calculated correctly
✅ **Validity Period** in days
✅ **Currency** displayed

#### Line Items Table
✅ **4-column layout:** Description | Quantity | Unit Price | Amount
✅ **No per-line-item tax column** (removed)
✅ **All line items** listed with correct values
✅ **Table footer** with:
   - Subtotal row
   - Tax row with percentage (e.g., "Tax (15%)")
   - Total row in bold

#### Financial Summary (Right Side)
✅ **Subtotal** matches sum of line items
✅ **Tax Amount** = Subtotal × Tax Rate
✅ **Total Amount** = Subtotal + Tax
✅ **All amounts** show 2 decimal places
✅ **Currency symbol** prefixed

### Visual Quality Check
✅ Professional invoice-style layout
✅ Clean spacing and typography
✅ Color-coded status badges
✅ Responsive layout

---

## Test 4: Quote List Display

### Steps
1. Review the quotes table on the main page

### Expected Results
✅ **Customer name** displayed in list (not just ID)
✅ **Quote number** clickable
✅ **Quote date** formatted
✅ **Valid until** date shown
✅ **Status** with color-coded badge
✅ **Total amount** with currency
✅ **Action buttons:** View, Edit, Delete

---

## Test 5: Form Validation

### Steps
1. Click **"+ Create Quote"**
2. Try to submit with:
   - Empty line item description
   - Quantity of 0 or negative
   - No GL account selected
   - Completely empty form

### Expected Results
✅ **Red borders** appear on invalid fields
✅ **Error messages** show below fields
✅ **Toast notification** explains validation failure
✅ **Form does not submit** until valid
✅ **Console logs** show validation errors:
```
❌ Validation failed: Empty or invalid line item fields
```

---

## Test 6: Tax Rate Flexibility

### Steps
1. Create a quote, change tax rate from company default
2. Edit the quote, change tax rate again
3. View the quote

### Expected Results
✅ **Create:** Can override company default tax rate
✅ **Edit:** Tax rate persists and can be changed
✅ **View:** Shows the quote's tax rate, not company default
✅ **Calculations:** Always use the quote's tax rate

---

## Test 7: Multi-Company Access (Firestore Permissions)

### Steps
1. As an admin/developer, access **Workspace A**
2. Create a quote in Workspace A
3. Switch to **Workspace B**
4. Create a quote in Workspace B
5. Go back to Workspace A and verify quote is still there

### Expected Results
✅ **Quotes scoped to company** (companies/[id]/quotes)
✅ **Can create quotes** in any workspace you access
✅ **Cannot see quotes** from other companies in the list
✅ **Firestore permissions** allow authenticated users to create

---

## Test 8: Line Item Management

### Steps
1. Create or edit a quote
2. Add 5 line items
3. Remove the 3rd item
4. Add another item
5. Modify quantities and prices
6. Watch calculations update

### Expected Results
✅ **"+ Add Line Item"** button works
✅ **Remove buttons** delete correct items
✅ **Calculations update** immediately
✅ **Item order preserved** after removal
✅ **No duplicate line item IDs**

---

## Test 9: Status Workflow

### Steps
1. Create a quote (status: "draft")
2. View the quote, check status badge
3. Future: Test status transitions (sent, accepted, converted)

### Expected Results
✅ **Draft status** when created
✅ **Status badge** colored correctly
✅ **Status updates** reflected in list and view

---

## Test 10: Currency and Formatting

### Steps
1. Create quotes with different currencies (ZAR, USD, EUR)
2. Create quotes with various amounts (small, large, decimals)

### Expected Results
✅ **Currency symbol** displays correctly (R, $, €)
✅ **Two decimal places** always shown
✅ **Large numbers** formatted with commas
✅ **Decimal calculations** accurate (no rounding errors)

---

## Common Issues to Check

### Issue: Edit Dialog Not Opening
**Symptom:** Clicking Edit does nothing
**Check:**
- Console for errors
- `isEditDialogOpen` state
- `openEditDialog()` function called
- Dialog component rendered in JSX

### Issue: Tax Not Calculating
**Symptom:** Tax amount is 0 or NaN
**Check:**
- Tax rate is a number (not string)
- Subtotal calculated correctly
- Watch() value updates in real-time

### Issue: Customer Details Missing
**Symptom:** Quote view shows customer ID instead of name
**Check:**
- Customer fetched before quote creation
- customerName, customerEmail, etc. saved to Firestore
- View dialog displays customer fields

### Issue: Validation Not Working
**Symptom:** Form submits with invalid data
**Check:**
- Line item validation logic runs before submit
- hasEmptyFields check is correct
- Toast and error messages display

### Issue: Firestore Permission Denied
**Symptom:** "Missing or insufficient permissions"
**Check:**
- firestore.rules allows authenticated users to create
- companyId matches collection path
- User is authenticated

---

## Quick 2-Minute Verification

1. ✅ Click "Create Quote" - dialog opens
2. ✅ Select customer, add 2 line items, submit - quote created
3. ✅ Click "Edit" on the new quote - dialog opens with data
4. ✅ Change tax rate, update - quote updates
5. ✅ Click "View" - see company logo, customer details, totals

**If all 5 pass: ✅ Quotes feature is working correctly**

---

## Known Limitations

- ❌ No quote conversion to invoice/sales order yet
- ❌ No email sending functionality yet
- ❌ No PDF export yet
- ❌ No approval workflow yet
- ❌ No quote versioning/revisions yet

These features are defined in the Quote types but not yet implemented.

---

## Success Criteria

✅ Can create quotes with document-level tax
✅ Can edit quotes with tax rate changes
✅ Can view quotes with professional layout
✅ Customer details populate automatically
✅ Company branding displays in view
✅ Form validation prevents invalid submissions
✅ Multi-company access works correctly
✅ Real-time calculations accurate
✅ Console logging aids debugging

---

## Next Steps After Verification

1. Test with real company data
2. Test with multiple users in same company
3. Test quote conversion to invoice (when implemented)
4. Test PDF generation (when implemented)
5. Load test with 100+ quotes

---

**Tester Name:** _______________
**Date Tested:** _______________
**Result:** ✅ PASS / ❌ FAIL
**Notes:**
