# Smoke Test Guide: Phase 7 - Customer Statements & Credit Notes

**Date Created**: 2025-10-15
**Phase**: 7 - Customer & Supplier Account Management
**Features**: Customer Statements, Credit Notes, Allocation UI, PDF Generation

## Overview

This guide provides step-by-step verification procedures for the newly implemented customer statements and credit notes features, including multi-invoice allocation and PDF generation capabilities.

---

## Prerequisites

Before testing, ensure:
- ✅ Development server is running (`npm run dev`)
- ✅ You're logged in with a user account that has access to a company
- ✅ The company has at least one customer/debtor with invoices
- ✅ Browser console is open (F12) to check for errors

---

## Test Section 1: Customer Statements Generation

### 1.1 Access Statements Page
**Steps**:
1. Navigate to the workspace: `/workspace/[companyId]/statements`
2. Verify the page loads without errors
3. Check that the spinner dismisses after loading

**Expected Results**:
- ✅ Page loads successfully
- ✅ No console errors related to AuthProvider or hooks
- ✅ Navigation shows "Statements" link with "NEW" badge in sidebar
- ✅ Loading spinner dismisses within 2-3 seconds

**Common Issues**:
- ❌ Spinner never dismisses → Check browser console for hook errors
- ❌ 404 error → Verify route exists in app directory
- ❌ AuthProvider errors → Import should be from `@/contexts/AuthContext`

---

### 1.2 Generate New Statement
**Steps**:
1. Click "Generate Statement" button
2. In the dialog that opens:
   - Select a customer from the dropdown
   - Choose period type (Monthly, Quarterly, or Custom)
   - If Monthly/Quarterly: select the period
   - If Custom: select start and end dates
   - Set "As of date" (defaults to today)
3. Click "Generate" button
4. Wait for generation to complete (toast notification)

**Expected Results**:
- ✅ Dialog opens with all form fields visible
- ✅ Customer dropdown shows list of customers with outstanding balances
- ✅ Period selection works (Monthly shows months, Quarterly shows quarters)
- ✅ Date pickers function correctly
- ✅ Generation completes within 3-5 seconds
- ✅ Success toast: "Statement generated successfully"
- ✅ New statement appears in the list

**Common Issues**:
- ❌ No customers in dropdown → Add invoices for customers first
- ❌ Generation hangs → Check console for Firestore errors
- ❌ "Customer not found" error → Ensure customer exists in debtors collection

---

### 1.3 Preview Generated Statement
**Steps**:
1. Find the newly generated statement in the list
2. Click "Preview" button (eye icon)
3. Review the preview dialog content:
   - Customer information section
   - Account summary (opening balance, charges, payments, closing balance)
   - Aged analysis table (Current, 30, 60, 90, 120+ days)
   - Transaction details with running balance

**Expected Results**:
- ✅ Preview dialog opens immediately
- ✅ Customer info displays correctly (name, account number)
- ✅ All monetary amounts format correctly with currency symbol
- ✅ Aged analysis shows breakdown by aging buckets
- ✅ Overdue amounts (60+ days) display in orange/red
- ✅ Transaction table shows all activity in period
- ✅ Running balance calculates correctly for each transaction
- ✅ "Close" button dismisses dialog

**Common Issues**:
- ❌ Amounts show as NaN → Check that invoice amounts are valid numbers
- ❌ Missing transactions → Verify date range includes transaction dates
- ❌ Wrong aged analysis → Check invoice due dates and aging calculation

---

### 1.4 Download Statement as PDF
**Steps**:
1. Click "Download PDF" button (download icon) for any statement
2. Wait for PDF generation
3. Check that PDF downloads to your downloads folder
4. Open the PDF and review:
   - Company logo and header (if configured)
   - Professional formatting
   - All sections from preview are present
   - Print-friendly layout

**Expected Results**:
- ✅ PDF generates within 2-3 seconds
- ✅ File downloads with name format: `statement-CUST001-2025-10.pdf`
- ✅ PDF opens without errors in PDF viewer
- ✅ All content is readable and properly formatted
- ✅ Page breaks appropriately for long transaction lists
- ✅ Colors render correctly (aged analysis highlighting)
- ✅ No console errors about SSR or "vfs undefined"

**Common Issues**:
- ❌ "PDF generation not available on server side" → PDF generation attempted during SSR (should not happen)
- ❌ "vfs undefined" error → pdfmake not properly lazy-loaded
- ❌ Missing logo → Company logo not configured (expected behavior)
- ❌ Garbled text → Font issues with pdfmake vfs

---

### 1.5 Filter and Sort Statements
**Steps**:
1. Generate statements for multiple customers and periods
2. Test status filter dropdown:
   - Select "All"
   - Select "Generated"
   - Select "Sent"
   - Select "Reconciled"
3. Click table column headers to sort:
   - Sort by Customer
   - Sort by Period
   - Sort by Total Amount

**Expected Results**:
- ✅ Filter dropdown opens without errors
- ✅ NO Radix UI errors about SelectTrigger in console
- ✅ Filtering updates the list immediately
- ✅ Sorting toggles between ascending/descending
- ✅ Empty state shows when no statements match filter

**Common Issues**:
- ❌ "SelectTrigger must be used within Select" → Filter icon incorrectly placed inside SelectTrigger
- ❌ Filter doesn't work → Check that filterStatus state is connected to data fetching

---

## Test Section 2: Credit Notes Management

### 2.1 Access Credit Notes Page
**Steps**:
1. Navigate to: `/workspace/[companyId]/credit-notes`
2. Verify page loads without errors
3. Check navigation and layout

**Expected Results**:
- ✅ Page loads successfully
- ✅ "Credit Notes" link visible in sidebar with "NEW" badge
- ✅ List shows existing credit notes (if any)
- ✅ "Create Credit Note" button visible
- ✅ No console errors

---

### 2.2 View Credit Note Details
**Steps**:
1. If credit notes exist, select one from the list
2. Review the displayed information:
   - Credit note number and date
   - Customer information
   - Line items with descriptions and amounts
   - Total amount and tax breakdown
   - Allocation status (allocated vs unallocated amounts)

**Expected Results**:
- ✅ All credit note fields display correctly
- ✅ Status badge shows appropriate color (draft/issued/allocated/void)
- ✅ Amounts format with currency symbols
- ✅ Allocation summary shows how much is allocated vs available

---

### 2.3 Allocate Credit Note to Invoices
**Steps**:
1. Find a credit note with status "issued" and unallocated amount > 0
2. Click "Allocate" button
3. In the allocation dialog:
   - Review credit note summary card (shows total and available amounts)
   - Check that outstanding invoices load for the customer
   - Select an invoice by clicking its checkbox
   - Verify that allocation amount input appears
   - Enter an amount (less than both invoice balance and available credit)
   - Click "Max" button to auto-fill maximum allocable amount
   - Select multiple invoices with different amounts
   - Check that "Remaining Credit" updates in real-time
4. Click "Apply Allocations"
5. Wait for allocation to complete

**Expected Results**:
- ✅ Dialog opens with credit note details
- ✅ Outstanding invoices load within 2 seconds
- ✅ Only invoices with status "sent" or "partial" appear
- ✅ Checkbox selection works smoothly
- ✅ Amount input appears when invoice is selected
- ✅ "Max" button fills correct maximum amount
- ✅ Can select multiple invoices simultaneously
- ✅ Remaining credit calculates correctly: `available - sum(allocations)`
- ✅ Cannot allocate more than remaining credit (validation)
- ✅ Cannot allocate more than invoice amount due (validation)
- ✅ Success toast: "Credit note allocated to X invoice(s)"
- ✅ Credit note status updates to "partially_allocated" or "fully_allocated"
- ✅ Allocated invoices show reduced balance

**Common Issues**:
- ❌ No invoices appear → Customer has no outstanding invoices
- ❌ Allocation fails → Check Firestore transaction errors in console
- ❌ Over-allocation allowed → Validation logic not working
- ❌ Remaining credit shows negative → Calculation error in state management

---

### 2.4 Verify Allocation Integrity
**Steps**:
1. After allocating a credit note, check:
   - Credit note's `amountUnallocated` decreased correctly
   - Invoice's `amountDue` decreased correctly
   - Allocation records created in credit note's `allocations` array
2. Navigate to the invoices page
3. Find the allocated invoice
4. Verify it shows the allocation in its payment history

**Expected Results**:
- ✅ Credit note unallocated amount = original amount - sum of allocations
- ✅ Invoice amount due reduced by allocation amount
- ✅ Allocation records contain correct amounts and references
- ✅ Invoice status changes to "partially_paid" if not fully allocated
- ✅ Changes persist after page refresh (Firestore transaction succeeded)

**Common Issues**:
- ❌ Amounts don't update → Firestore transaction failed
- ❌ Invoice still shows full balance → Invoice update not included in transaction
- ❌ Data inconsistent after refresh → Race condition in state updates

---

## Test Section 3: Integration Testing

### 3.1 End-to-End Statement Flow
**Steps**:
1. Create a new invoice for a customer
2. Generate a statement for that customer for the current period
3. Verify the new invoice appears in the statement
4. Download the statement PDF
5. Verify the invoice is in the PDF

**Expected Results**:
- ✅ New invoice included in statement generation
- ✅ Invoice amount contributes to total balance
- ✅ Invoice appears in transaction list with correct aging
- ✅ PDF reflects the same data as preview

---

### 3.2 Credit Note to Statement Integration
**Steps**:
1. Create a credit note for a customer
2. Allocate the credit note to an invoice
3. Generate a new statement for that customer
4. Verify the statement shows:
   - The original invoice
   - The credit note allocation as a payment/credit
   - Reduced balance for the invoice

**Expected Results**:
- ✅ Statement includes credit note as a transaction
- ✅ Credit note reduces customer balance
- ✅ Running balance calculation accounts for credit note
- ✅ Aged analysis reflects reduced amounts

---

## Test Section 4: Error Handling & Edge Cases

### 4.1 Network Errors
**Steps**:
1. Open browser DevTools → Network tab
2. Set throttling to "Offline"
3. Try to generate a statement
4. Re-enable network
5. Retry generation

**Expected Results**:
- ✅ Error toast appears: "Failed to generate statement"
- ✅ Application doesn't crash
- ✅ UI remains responsive
- ✅ Retry succeeds after network restored

---

### 4.2 Validation Errors
**Steps**:
1. Try to generate statement without selecting a customer
2. Try to allocate more than available credit
3. Try to allocate negative amounts
4. Try to allocate to a fully paid invoice

**Expected Results**:
- ✅ Form validation prevents submission
- ✅ Clear error messages shown to user
- ✅ No invalid data reaches Firestore

---

### 4.3 Large Data Sets
**Steps**:
1. Generate a statement for a customer with 50+ transactions
2. Download the PDF
3. Check PDF pagination and performance

**Expected Results**:
- ✅ Statement generation completes (may take 5-10 seconds)
- ✅ PDF generates without memory errors
- ✅ PDF has proper page breaks
- ✅ All transactions included

---

## Quick Verification Checklist (2 minutes)

Use this for rapid smoke testing after deployments:

- [ ] Navigate to `/workspace/[companyId]/statements` - page loads
- [ ] Click "Generate Statement" - dialog opens
- [ ] Select customer and period - form works
- [ ] Click "Generate" - statement created successfully
- [ ] Click "Preview" on a statement - preview shows data
- [ ] Click "Download PDF" - PDF downloads without errors
- [ ] Navigate to `/workspace/[companyId]/credit-notes` - page loads
- [ ] Click "Allocate" on a credit note - dialog opens
- [ ] Select an invoice and enter amount - allocation UI works
- [ ] Click "Apply Allocations" - allocation succeeds
- [ ] Check browser console - no errors present

---

## Known Limitations

1. **Email Delivery**: Not yet implemented - requires SMTP configuration
2. **Statement Reconciliation**: UI not implemented (optional feature)
3. **Supplier Statements**: Not implemented (customer statements only for now)
4. **Company Logo**: PDF shows logo only if configured in company settings
5. **Multi-Currency**: Statements show single currency (primary company currency)

---

## Troubleshooting Reference

### Error: Module not found '@/components/auth/AuthProvider'
**Fix**: Import should be `import { useAuth } from '@/contexts/AuthContext'`

### Error: Cannot read properties of undefined (reading 'vfs')
**Fix**: pdfmake must be lazy-loaded only in browser context (already fixed in pdf-service.ts)

### Error: SelectTrigger must be used within Select
**Fix**: Remove any icons or elements from inside `<SelectTrigger>` - only `<SelectValue>` allowed

### Spinner never dismisses
**Fix**: Check hook destructuring: `const { canAccess: hasAccess, loading: accessLoading } = useWorkspaceAccess(companyId)`

### PDF generation fails silently
**Check**: Browser console for pdfmake errors; verify getPdfMake() returns valid instance

---

## Success Criteria

✅ **All tests in sections 1-4 pass**
✅ **No console errors during normal usage**
✅ **PDFs generate and download successfully**
✅ **Allocations persist correctly in Firestore**
✅ **UI is responsive and intuitive**

---

## Reporting Issues

If you encounter issues not covered in this guide:

1. Check browser console for error messages
2. Note the exact steps to reproduce
3. Check Firestore console for data integrity
4. Verify your role permissions allow the action
5. Report with screenshots and error messages

---

**Phase 7 Completion Status**: 85% (Production Ready)
**Last Updated**: 2025-10-15
**Next Phase**: Email delivery implementation (requires SMTP setup)
