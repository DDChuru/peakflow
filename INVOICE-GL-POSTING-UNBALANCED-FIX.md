# Invoice GL Posting Unbalanced Entry Fix

**Date**: 2025-10-15
**Issue**: "Cannot post unbalanced journal entry"

---

## 🐛 Problem

### Error:
```
Error: Cannot post unbalanced journal entry
    at PostingService.post (src/lib/accounting/posting-service.ts:52:13)
    at async InvoicePostingService.postInvoiceToGL
```

### Root Causes:

#### 1. **Wrong Tax Calculation Logic**
The code was trying to access `lineItem.taxAmount` and `lineItem.taxRate`, but these fields **don't exist** in the `InvoiceLineItem` type:

```typescript
// InvoiceLineItem type (src/types/accounting/invoice.ts)
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;  // ← Amount BEFORE tax
  glAccountId: string;
  accountCode?: string;
  // NO taxAmount or taxRate fields!
}
```

The posting service was iterating over `lineItems` and trying to extract tax amounts that don't exist:

```typescript
// ❌ WRONG CODE (lines 214-221)
invoice.lineItems.forEach(lineItem => {
  if (lineItem.taxAmount && lineItem.taxAmount > 0) {  // ← Property doesn't exist!
    const key = `${lineItem.taxRate || 0}`;  // ← Property doesn't exist!
    // ...
  }
});
```

This meant **no tax lines were being created**, causing:
- Debit AR: R 1,150 (total with tax)
- Credit Revenue: R 1,000 (line items)
- Credit Tax: R 0 (no tax lines created!)
- **Unbalanced**: 1,150 ≠ 1,000

#### 2. **Wrong Constructor Parameters**
The invoices page was calling:
```typescript
// ❌ WRONG
new InvoicePostingService(companyId, user.uid);
```

But the constructor expects an options object:
```typescript
// ✅ CORRECT
new InvoicePostingService({
  tenantId: companyId,
  fiscalPeriodId: 'current',
  autoPost: true,
  defaultARAccountId: '1200',
  defaultTaxPayableAccountId: '2200'
});
```

---

## ✅ Solution Applied

### File 1: `/src/lib/accounting/invoice-posting-service.ts`

#### Fixed Tax Line Creation (Lines 209-238)

**Before (❌ BROKEN)**:
```typescript
// Create tax payable credit lines if there are taxes
if (invoice.taxAmount > 0 && this.options.defaultTaxPayableAccountId) {
  // Group tax lines by tax rate/account
  const taxGroups = new Map<string, { amount: number; rate: number }>();

  invoice.lineItems.forEach(lineItem => {
    if (lineItem.taxAmount && lineItem.taxAmount > 0) {  // ← Fields don't exist!
      const key = `${lineItem.taxRate || 0}`;
      const existing = taxGroups.get(key) || { amount: 0, rate: lineItem.taxRate || 0 };
      existing.amount += lineItem.taxAmount;
      taxGroups.set(key, existing);
    }
  });

  // Create tax lines - but taxGroups is always empty!
  Array.from(taxGroups.entries()).forEach(([key, taxGroup], index) => {
    lines.push({
      id: `tax-line-${index + 1}`,
      accountId: this.options.defaultTaxPayableAccountId!,
      accountCode: 'TAX',
      description: `Sales Tax ${taxGroup.rate}% - Invoice ${invoice.invoiceNumber}`,
      debit: 0,
      credit: taxGroup.amount,  // ← Always 0!
      currency: invoice.currency,
      exchangeRate: invoice.exchangeRate
    });
  });
}
```

**After (✅ FIXED)**:
```typescript
// Create tax payable credit lines if there are taxes
if (invoice.taxAmount > 0 && this.options.defaultTaxPayableAccountId) {
  // Use taxLines if available, otherwise create single tax line
  if (invoice.taxLines && invoice.taxLines.length > 0) {
    // Use detailed tax lines from invoice
    invoice.taxLines.forEach((taxLine, index) => {
      lines.push({
        id: `tax-line-${index + 1}`,
        accountId: taxLine.glAccountId || this.options.defaultTaxPayableAccountId!,
        accountCode: 'TAX',
        description: `${taxLine.taxName} ${taxLine.taxRate}% - Invoice ${invoice.invoiceNumber}`,
        debit: 0,
        credit: taxLine.taxAmount,  // ← From taxLines array
        currency: invoice.currency,
        exchangeRate: invoice.exchangeRate
      });
    });
  } else {
    // Fallback: single tax line with document-level tax
    lines.push({
      id: 'tax-line-1',
      accountId: this.options.defaultTaxPayableAccountId,
      accountCode: 'TAX',
      description: `Sales Tax ${invoice.taxRate}% - Invoice ${invoice.invoiceNumber}`,
      debit: 0,
      credit: invoice.taxAmount,  // ← From invoice total
      currency: invoice.currency,
      exchangeRate: invoice.exchangeRate
    });
  }
}
```

**Why This Works**:
- Invoice has `taxLines?: InvoiceTaxLine[]` array with proper tax breakdown
- Fallback uses `invoice.taxAmount` and `invoice.taxRate` from document level
- Both approaches create proper tax credit lines

---

### File 2: `/app/workspace/[companyId]/invoices/page.tsx`

#### Fixed Service Instantiation (Lines 520-542)

**Before (❌ BROKEN)**:
```typescript
const handlePostToGL = async (invoice: Invoice) => {
  if (!user) return;

  try {
    const postingService = new InvoicePostingService(companyId, user.uid);
    //                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //                     Wrong parameters!
    const journalEntryId = await postingService.postInvoiceToGL(invoice);
    // ...
  }
};
```

**After (✅ FIXED)**:
```typescript
const handlePostToGL = async (invoice: Invoice) => {
  if (!user) return;

  try {
    // Use InvoicePostingService with proper options
    const postingService = new InvoicePostingService({
      tenantId: companyId,
      fiscalPeriodId: 'current', // TODO: Get current fiscal period
      autoPost: true,
      defaultARAccountId: '1200', // Accounts Receivable
      defaultTaxPayableAccountId: '2200' // Sales Tax Payable
    });

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

## 📊 Journal Entry Now Balanced

### For Invoice with R 1,150 Total (R 1,000 + R 150 VAT):

**Before Fix (❌ UNBALANCED)**:
```
Debit:  Accounts Receivable    R 1,150.00
Credit: Sales Revenue           R 1,000.00
Credit: VAT Payable             R     0.00  ← No tax line created!
-------------------------------------------
TOTAL:  R 1,150.00 ≠ R 1,000.00  ← Unbalanced!
```

**After Fix (✅ BALANCED)**:
```
Debit:  Accounts Receivable    R 1,150.00
Credit: Sales Revenue           R 1,000.00
Credit: VAT Payable             R   150.00  ← Tax line now created!
-------------------------------------------
TOTAL:  R 1,150.00 = R 1,150.00  ← Balanced! ✅
```

---

## 🎓 Type Safety Lesson

### The Invoice Data Structure:

```typescript
interface Invoice {
  // ... other fields ...

  // Document-level totals
  subtotal: number;      // Sum of lineItems[].amount (before tax)
  taxRate: number;       // Document-level tax %
  taxAmount: number;     // Total tax
  totalAmount: number;   // subtotal + taxAmount

  // Line items (amounts are BEFORE tax)
  lineItems: InvoiceLineItem[];  // amount field is pre-tax

  // Optional detailed tax breakdown
  taxLines?: InvoiceTaxLine[];  // Detailed tax by rate/account
}

interface InvoiceLineItem {
  amount: number;  // ← BEFORE tax
  // NO taxAmount or taxRate!
}

interface InvoiceTaxLine {
  taxName: string;
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  glAccountId: string;
}
```

### Key Points:
1. ✅ `lineItems[].amount` is **before tax**
2. ✅ Tax is at **document level** (`taxAmount`, `taxRate`)
3. ✅ Optional `taxLines[]` array for detailed breakdown
4. ❌ `lineItems[]` have **NO tax fields**

---

## ⚠️ TODO Items

### Hardcoded Account IDs
Currently using hardcoded account IDs:
```typescript
defaultARAccountId: '1200', // Accounts Receivable
defaultTaxPayableAccountId: '2200' // Sales Tax Payable
```

**Should be**:
1. Fetched from company settings
2. Looked up from chart of accounts
3. Configurable per company

### Fiscal Period
Currently hardcoded:
```typescript
fiscalPeriodId: 'current'
```

**Should be**:
- Determined from invoice date
- Looked up from fiscal calendar
- Validated before posting

---

## ✅ Verification Steps

### Test Case 1: Simple Invoice
1. Create invoice with R 1,000 + 15% VAT = R 1,150
2. Click "Post to GL"
3. **Verify**: Success toast shows journal entry ID
4. **Check Firestore**: ledgerEntries collection
5. **Verify journal lines**:
   - 1 Debit line: AR R 1,150
   - 1 Credit line: Revenue R 1,000
   - 1 Credit line: VAT R 150
   - **Total debits = Total credits** ✅

### Test Case 2: Multi-Line Invoice
1. Create invoice with 3 line items
   - Line 1: R 500
   - Line 2: R 300
   - Line 3: R 200
   - Subtotal: R 1,000
   - Tax 15%: R 150
   - Total: R 1,150
2. Click "Post to GL"
3. **Verify journal lines**:
   - 1 Debit line: AR R 1,150
   - 3 Credit lines: Revenue (one per line item)
   - 1 Credit line: VAT R 150
   - **Balanced** ✅

### Test Case 3: Invoice with taxLines
1. Create invoice with detailed tax breakdown
2. Ensure `invoice.taxLines` array is populated
3. Click "Post to GL"
4. **Verify**: Uses tax lines from array (not single line)

---

## 🔍 Related Files

- `/src/types/accounting/invoice.ts` - Invoice type definitions
- `/src/lib/accounting/posting-service.ts` - Base posting service with validation
- `/src/lib/accounting/invoice-posting-service.ts` - Invoice-specific GL posting
- `/app/workspace/[companyId]/invoices/page.tsx` - Invoices UI

---

## ✅ Summary

**Issue**: Unbalanced journal entries due to missing tax lines
**Root Causes**:
1. Code tried to access non-existent `lineItem.taxAmount` fields
2. No tax lines were created
3. Wrong constructor parameters

**Solutions**:
1. ✅ Use `invoice.taxLines[]` array or `invoice.taxAmount`
2. ✅ Create proper tax credit lines
3. ✅ Fix constructor to use options object

**Status**: ✅ **FIXED**

**Impact**: GL posting now works with balanced journal entries
**Files Changed**: 2 files
**Lines Changed**: ~30 lines

---

**Completed**: 2025-10-15
**Type**: Bug Fix - Critical
**Module**: Invoice Management → GL Integration → Journal Entry Creation
