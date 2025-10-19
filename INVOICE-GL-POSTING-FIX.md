# Invoice GL Posting Fix

**Date**: 2025-10-15
**Issue**: "invoiceService.postToGL is not a function"

---

## 🐛 Problem

### Error:
```
TypeError: invoiceService.postToGL is not a function
    at handlePostToGL (app/workspace/[companyId]/invoices/page.tsx:523:28)
```

### Root Cause:
The invoices page was trying to call `invoiceService.postToGL()`, but this method doesn't exist in the `InvoiceService` class.

The correct service for GL posting is `InvoicePostingService`, which has a `postInvoiceToGL()` method.

---

## ✅ Solution Applied

### File: `/app/workspace/[companyId]/invoices/page.tsx`

#### 1. **Added Import** (Line 44)
```typescript
import { InvoicePostingService } from '@/lib/accounting/invoice-posting-service';
```

#### 2. **Fixed handlePostToGL Function** (Lines 520-534)

**Before (❌ BROKEN)**:
```typescript
const handlePostToGL = async (invoice: Invoice) => {
  if (!user) return;

  try {
    await invoiceService.postToGL(companyId, invoice.id, user.uid);
    //    ^^^^^^^^^^^^^^ Method doesn't exist!
    toast.success('Invoice posted to general ledger');
    await loadInvoices();
  } catch (error: any) {
    console.error('Error posting to GL:', error);
    toast.error(error.message || 'Failed to post to general ledger');
  }
};
```

**After (✅ FIXED)**:
```typescript
const handlePostToGL = async (invoice: Invoice) => {
  if (!user) return;

  try {
    // Use InvoicePostingService to post to GL
    const postingService = new InvoicePostingService(companyId, user.uid);
    const journalEntryId = await postingService.postInvoiceToGL(invoice);

    toast.success(`Invoice posted to GL (Journal Entry: ${journalEntryId})`);
    await loadInvoices();
  } catch (error: any) {
    console.error('Error posting to GL:', error);
    toast.error(error.message || 'Failed to post to general ledger');
  }
};
```

---

## 🎯 What It Does Now

### When User Clicks "Post to GL":

1. **Creates InvoicePostingService** with companyId and userId
2. **Calls `postInvoiceToGL(invoice)`** which:
   - Creates journal entry in Firestore (`ledgerEntries` collection)
   - Posts to Accounts Receivable (debit)
   - Posts to Revenue account (credit)
   - Posts to Tax Payable (credit for VAT)
   - Updates invoice with `journalEntryId`
   - Sets invoice status to reflect GL posting
3. **Shows success toast** with journal entry ID
4. **Reloads invoices** to reflect updated status

---

## 📊 GL Posting Details

### Journal Entry Created:

```typescript
// For an invoice with R1,150 total (R1,000 + R150 VAT):

Journal Entry ID: JE-1729012345678-ABC123

Lines:
1. Debit:  Accounts Receivable    R 1,150.00  (Asset increases)
2. Credit: Sales Revenue           R 1,000.00  (Revenue increases)
3. Credit: VAT Payable             R   150.00  (Liability increases)
```

### Invoice Updates:
- `journalEntryId` field set to journal entry ID
- Can prevent duplicate posting (check if `journalEntryId` exists)
- Provides audit trail

---

## 🔍 Service Architecture

### Service Separation:

```
InvoiceService (invoice-service.ts)
├── CRUD Operations
│   ├── createInvoice()
│   ├── updateInvoice()
│   ├── getInvoice()
│   └── deleteInvoice()
├── Business Logic
│   ├── sendInvoice()
│   ├── markAsPaid()
│   └── calculateTotals()
└── Query Operations
    └── getInvoicesByCustomer()

InvoicePostingService (invoice-posting-service.ts)
├── GL Integration
│   ├── postInvoiceToGL()      ← What we use
│   ├── postPaymentToGL()
│   └── reverseInvoicePosting()
└── Journal Entry Creation
    └── createJournalEntry()
```

### Why Separate Services?

1. **Single Responsibility**: InvoiceService handles CRUD, PostingService handles accounting
2. **Reusability**: PostingService can be used by quotes, recurring invoices, etc.
3. **Testing**: Can test GL logic independently
4. **Maintainability**: Accounting rules in one place

---

## 🎓 Pattern: Service Instantiation

### Current Pattern in invoices page:
```typescript
// Instance created per operation
const postingService = new InvoicePostingService(companyId, user.uid);
const journalEntryId = await postingService.postInvoiceToGL(invoice);
```

### Alternative: Singleton Pattern
```typescript
// Could be exported from accounting index
export const createInvoicePostingService = (companyId: string, userId: string) => {
  return new InvoicePostingService(companyId, userId);
};
```

**Current approach is fine** - service is lightweight and operation-specific.

---

## ✅ Verification Steps

### Test Case 1: Basic GL Posting
1. Create an invoice with status "sent"
2. Click actions menu (three dots)
3. Verify "Post to GL" option appears
4. Click "Post to GL"
5. **Verify**: Success toast shows with journal entry ID
6. **Verify**: "Post to GL" option disappears from menu (already posted)

### Test Case 2: Check Journal Entry
1. After posting invoice
2. Navigate to accounting/ledger entries view
3. Find the journal entry by ID (from toast message)
4. **Verify**:
   - 3 lines created (Debit AR, Credit Revenue, Credit VAT)
   - Amounts match invoice totals
   - Reference includes invoice number

### Test Case 3: Prevent Duplicate Posting
1. Post an invoice to GL
2. Try to post the same invoice again
3. **Verify**: "Post to GL" option not shown (invoice.journalEntryId exists)

### Test Case 4: Error Handling
1. Create invoice with invalid GL account
2. Try to post to GL
3. **Verify**: Error toast appears with message
4. **Verify**: Invoice not updated (transaction rolled back)

---

## 📋 Conditions for "Post to GL" Menu Item

From the invoices page code:
```typescript
{invoice.status !== 'draft' && !invoice.journalEntryId && (
  <DropdownMenuItem onSelect={() => handlePostToGL(invoice)}>
    <Receipt className="h-4 w-4 mr-2" />
    Post to GL
  </DropdownMenuItem>
)}
```

**Conditions**:
1. ✅ Invoice status is not "draft" (sent, partial, overdue, or paid)
2. ✅ Invoice has no `journalEntryId` (not already posted)

**Prevents**:
- Posting draft invoices (not finalized)
- Double-posting (already has journal entry)

---

## 🔄 Related Features

### Payment Recording
When payment is recorded on an invoice, `InvoicePostingService.postPaymentToGL()` is also used to create journal entries for:
- Debit: Bank Account
- Credit: Accounts Receivable

### Credit Notes
Credit notes also use posting services for:
- Debit: Revenue (reversal)
- Credit: Accounts Receivable

---

## 📖 Documentation References

### Service Files:
- `/src/lib/accounting/invoice-posting-service.ts` - GL posting logic
- `/src/lib/accounting/invoice-service.ts` - Invoice CRUD
- `/src/lib/accounting/posting-service.ts` - Base posting service (if exists)

### Related Roadmap Items:
From `modernization-roadmap.md`:
- Line 16: "Full invoicing system with auto-GL posting" ✅
- Line 408: "Invoices Module — Complete rebuild with Create/Edit dialogs, payment recording, GL posting" ✅
- Line 961: "GL Integration — All payments post to General Ledger via InvoicePostingService" ✅

---

## ✅ Summary

**Issue**: Invoices page called non-existent method `invoiceService.postToGL()`
**Root Cause**: Wrong service - should use `InvoicePostingService`
**Solution**:
- Added `InvoicePostingService` import
- Fixed `handlePostToGL()` to instantiate correct service
- Call `postInvoiceToGL()` with invoice object

**Status**: ✅ **FIXED**

**Impact**: GL posting now works correctly from invoices page
**Files Changed**: 1 file, 2 lines added, 1 function updated

---

**Completed**: 2025-10-15
**Type**: Bug Fix
**Module**: Invoice Management → GL Integration
