# Smoke Test: Quotes Page Tax Refactoring

## Overview
Applied comprehensive tax refactoring and bug fixes to the Quotes page, following the exact pattern successfully implemented on the Contracts page.

## Changes Summary

### 1. Tax System Refactoring ✅

#### **Removed Per-Line-Item Tax:**
- ❌ Removed "Tax Rate (%)" input field from line items in Create/Edit dialogs
- ❌ Removed `taxRate` from `lineItemSchema` validation
- ❌ Removed `taxRate` from `formLineItems` state initialization
- ❌ Removed `taxRate` from `addLineItem()` function
- ❌ Removed `taxRate` from all line item reset calls

#### **Added Document-Level Tax:**
- ✅ Added `company` state: `const [company, setCompany] = useState<any>(null);`
- ✅ Added `loadCompany()` function to fetch company.vatPercentage
- ✅ Called `loadCompany()` in `loadData()` Promise.all
- ✅ Added `taxRate: 0` to form defaultValues
- ✅ Pre-fills taxRate from company.vatPercentage when creating new quotes
- ✅ Added document-level "Tax Rate (%)" input field in both Create/Edit dialogs
- ✅ Imported `doc, getDoc` from firebase/firestore

### 2. Calculation Updates ✅

**New calculation functions:**
```typescript
const calculateSubtotal = () => {
  return formLineItems.reduce((sum, item) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unitPrice || 0;
    return sum + (quantity * unitPrice);
  }, 0);
};

const calculateTax = () => {
  const subtotal = calculateSubtotal();
  const taxRate = watch('taxRate') || 0;
  return subtotal * (taxRate / 100);
};

const calculateTotal = () => {
  return calculateSubtotal() + calculateTax();
};
```

### 3. Display Updates ✅

**Replaced single "Total" display with breakdown:**
```typescript
<div className="bg-gray-50 p-4 rounded-lg space-y-2">
  <div className="flex justify-between items-center">
    <span className="text-sm font-medium text-gray-600">Subtotal:</span>
    <span className="text-lg font-semibold">R{calculateSubtotal().toFixed(2)}</span>
  </div>
  <div className="flex justify-between items-center">
    <span className="text-sm font-medium text-gray-600">Tax ({watch('taxRate') || 0}%):</span>
    <span className="text-lg font-semibold">R{calculateTax().toFixed(2)}</span>
  </div>
  <div className="flex justify-between items-center pt-2 border-t-2 border-indigo-200">
    <span className="text-lg font-bold">Total Quote Value:</span>
    <span className="text-2xl font-bold text-indigo-600">R{calculateTotal().toFixed(2)}</span>
  </div>
</div>
```

### 4. Fixed Value Calculation Bug ✅

**In handleCreate function:**
Added `amount` field to line items:
```typescript
lineItems: formLineItems.map(item => ({
  description: item.description,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  amount: item.quantity * item.unitPrice, // ← Fixed: Was missing
  glAccountId: item.glAccountId,
}))
```

**Added taxRate to quote data:**
```typescript
if (data.taxRate) quoteData.taxRate = data.taxRate;
```

### 5. Quote Service Updates ✅

**Updated `calculateQuoteAmounts` method:**
- Now accepts optional `documentTaxRate` parameter
- Calculates tax at document level instead of per line item
- Updated all calls to `calculateQuoteAmounts` to pass document tax rate

### 6. UI/UX Fixes ✅

**Main container:**
- ✅ Added `min-h-screen flex flex-col` to main div

**Table Card:**
- ✅ Added `overflow-visible flex-1 flex flex-col` to Card
- ✅ Added `overflow-visible flex-1` to CardContent
- ✅ Changed table wrapper to `overflow-x-auto -mx-6 px-6`

**DropdownMenu:**
- ✅ Added `className="z-50"` to DropdownMenuContent
- ✅ Changed all dropdown `onClick` to `onSelect`

### 7. HTML Validation Fixes ✅

**AlertDialog:**
- ✅ Moved quote details div outside of AlertDialogDescription
- ✅ Fixed nested element structure to pass HTML validation

## Files Modified

1. **`/app/workspace/[companyId]/quotes/page.tsx`**
   - Tax refactoring (removed per-line, added document-level)
   - Calculation updates
   - UI/layout improvements
   - HTML validation fixes

2. **`/src/lib/accounting/quote-service.ts`**
   - Updated `calculateQuoteAmounts()` to support document-level tax
   - Fixed all method calls to pass document tax rate

## Testing Checklist

### Basic Functionality
- [ ] Page loads without errors
- [ ] No console warnings or HTML validation errors
- [ ] Company VAT percentage pre-fills in taxRate field

### Create Quote Flow
- [ ] Click "New Quote" button
- [ ] Tax Rate field appears (after Currency, before Notes)
- [ ] Tax Rate pre-filled from company.vatPercentage
- [ ] No tax rate field in line items
- [ ] Add multiple line items
- [ ] Subtotal displays correctly (sum of line amounts)
- [ ] Tax displays correctly (subtotal × taxRate%)
- [ ] Total displays correctly (subtotal + tax)
- [ ] Create quote successfully
- [ ] Quote saves with correct totalAmount (including tax)

### Edit Quote Flow
- [ ] Click Edit on existing quote
- [ ] Tax Rate field populated correctly
- [ ] Line items display without per-item tax
- [ ] Calculations update reactively
- [ ] Save changes successfully

### View Quote Flow
- [ ] Click View on quote
- [ ] Quote details display correctly
- [ ] Line items table shows properly
- [ ] Subtotal, Tax, Total display in footer

### UI Verification
- [ ] Dropdown menus fully visible (not clipped)
- [ ] Page uses full available height
- [ ] Table scrolls horizontally if needed
- [ ] No overflow/layout issues

### Calculations Verification
- [ ] Create quote with 0% tax → Total = Subtotal
- [ ] Create quote with 15% tax → Total = Subtotal × 1.15
- [ ] Update tax rate → Totals recalculate instantly
- [ ] Multiple line items → Correct subtotal sum

### Edge Cases
- [ ] Quote with no tax rate (0 or undefined)
- [ ] Quote with very high tax rate (e.g., 100%)
- [ ] Quote with decimal tax rate (e.g., 14.5%)
- [ ] Single line item quote
- [ ] Multi-line item quote
- [ ] Edit quote and change tax rate

## Expected Behavior

### Before (Per-Line-Item Tax):
- Each line item had its own tax rate field
- Tax calculated per line item
- Total was showing 0 due to bug
- Dropdown menus were clipped
- HTML validation errors in console

### After (Document-Level Tax):
- Single tax rate at document level
- Tax calculated on subtotal
- Correct display: Subtotal → Tax → Total
- Quotes save with correct totalAmount
- Dropdowns fully visible
- No HTML validation errors
- Full-height page layout

## Common Issues to Check

1. **Tax not calculating:**
   - Verify `watch('taxRate')` is working
   - Check company.vatPercentage is loaded

2. **Total showing 0:**
   - Verify `amount` field in lineItems mapping
   - Check quote service calculation

3. **Dropdown clipped:**
   - Verify `z-50` on DropdownMenuContent
   - Check overflow settings on Card/CardContent

4. **Console errors:**
   - Check for nested `<p>` tags in AlertDialog
   - Verify all imports are correct

## Success Criteria

✅ No per-line-item tax fields in UI
✅ Document-level tax rate field (pre-filled from company)
✅ Calculation shows: Subtotal, Tax, Total
✅ Quotes save with correct totalAmount (including tax)
✅ Dropdown menus fully visible (not clipped)
✅ No HTML validation errors in console
✅ Page uses full available height
✅ Matches Contracts page pattern exactly

## Notes

- This refactoring follows the EXACT pattern from the Contracts page
- All changes are backward compatible (existing quotes will still work)
- Quote service now supports both old (per-line) and new (document-level) tax calculation
- UI is consistent across Quotes and Contracts pages
