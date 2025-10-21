# Bank Import UI Currency Fix - Complete

## Issues Fixed

### 1. ✅ Backend (Ledger Posting) - ALREADY FIXED
**File**: `src/lib/accounting/bank-to-ledger-service.ts`
- Journal entries now use company currency from Firestore
- Reads `defaultCurrency` from company document
- Falls back to USD if not set

### 2. ✅ Frontend (UI Display) - NEWLY FIXED
**File**: `src/components/banking/BankToLedgerImport.tsx`
- Updated `formatBalance()` function to accept currency parameter
- Gets company currency from Auth context
- All balance displays now show correct currency symbol

---

## Changes Made

### File 1: `bank-to-ledger-service.ts`
**Lines 89-131**: Added currency fetching and caching
```typescript
private companyCurrency: SupportedCurrency = 'USD';

private async initializeCurrency(): Promise<void> {
  const companyRef = doc(db, 'companies', this.companyId);
  const companySnap = await getDoc(companyRef);
  if (companySnap.exists()) {
    this.companyCurrency = companyData.defaultCurrency || 'USD';
  }
}
```

**Line 435**: Uses company currency in journal entries
```typescript
const currency = await this.getCurrency();
// Applied to all journal lines
```

### File 2: `BankToLedgerImport.tsx`
**Line 76**: Updated formatBalance function signature
```typescript
function formatBalance(value?: number | string | null, currency: string = 'USD'): string {
  // Uses currency parameter instead of hardcoded 'USD'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,  // ✅ Dynamic!
    minimumFractionDigits: 2,
  }).format(value);
}
```

**Line 136**: Gets currency from Auth context
```typescript
const companyCurrency = company?.defaultCurrency || 'USD';
```

**Lines 1224, 1228, 1305, 1309**: Pass currency to all formatBalance calls
```typescript
// Before
{formatBalance(summary?.openingBalance)}

// After
{formatBalance(summary?.openingBalance, companyCurrency)}  ✅
```

---

## How It Works

### Data Flow

```
1. Company Document (Firestore)
   ↓
   companies/{id}.defaultCurrency = "ZAR"

2. Auth Context
   ↓
   const { company } = useAuth();
   companyCurrency = company?.defaultCurrency || 'USD'

3. UI Display
   ↓
   formatBalance(amount, companyCurrency)
   → Shows "R 1,000.00" instead of "$1,000.00"

4. Backend Posting
   ↓
   BankToLedgerService.getCurrency()
   → Journal entries saved with "ZAR"
```

---

## Testing

### Test 1: Verify Company Currency is Set

**In Firebase Console:**
1. Go to `companies` collection
2. Find your company
3. Check `defaultCurrency` field exists
4. Should be: `"ZAR"`, `"EUR"`, etc.

### Test 2: Check UI Display

**In Bank Import:**
1. Go to Workspace → Bank Import
2. Select a bank statement
3. Look at Opening/Closing balances
4. Should show: `R 1,000.00` (not `$1,000.00`)

**Console log:**
```
[BankToLedger] Using company currency: ZAR
```

### Test 3: Verify Posted Entries

**In Firestore:**
1. Go to `general_ledger` collection
2. Find recent entries
3. Check `currency` field
4. Should match company currency: `"ZAR"`

---

## Currency Symbols

| Currency | Symbol | Example |
|----------|--------|---------|
| USD | $ | $1,000.00 |
| ZAR | R | R 1,000.00 |
| EUR | € | €1.000,00 |
| ZWD | Z$ | Z$1,000.00 |
| ZIG | ZiG | ZiG 1,000.00 |

---

## Before vs After

### Before (Wrong)
```
Opening Balance: $5,000.00  ❌
Closing Balance: $10,000.00  ❌

Journal Entry:
  currency: "USD"  ❌
```

### After (Correct for ZAR company)
```
Opening Balance: R 5,000.00  ✅
Closing Balance: R 10,000.00  ✅

Journal Entry:
  currency: "ZAR"  ✅
```

---

## Troubleshooting

### Issue: Still showing $

**Possible causes:**
1. Company `defaultCurrency` not set in Firestore
2. Auth context not loaded yet
3. Browser cache

**Solution:**
```bash
# 1. Check Firestore
# companies/{id}.defaultCurrency should be set

# 2. Restart dev server
npm run dev

# 3. Hard refresh browser
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (Mac)
```

### Issue: Different currency in ledger vs UI

**Possible cause:** Mixed data - some entries posted before fix

**Solution:**
- Old entries will have old currency
- New entries will use correct currency
- This is normal for mixed data

### Issue: Currency not available in dropdown

**Solution:** Add to SupportedCurrency type:
```typescript
// In src/types/auth.ts
export type SupportedCurrency = 'USD' | 'ZAR' | 'EUR' | 'ZWD' | 'ZIG' | 'GBP';  // Added GBP
```

---

## Files Modified

| File | Purpose | Lines Changed |
|------|---------|---------------|
| `bank-to-ledger-service.ts` | Backend currency | 21, 92-131, 435 |
| `BankToLedgerImport.tsx` | UI currency display | 76-107, 136, 1224, 1228, 1305, 1309 |

---

## Summary

✅ **Backend**: Journal entries use company currency
✅ **Frontend**: UI displays company currency
✅ **Consistent**: Both use `company.defaultCurrency`
✅ **Fallback**: Defaults to USD if not set
✅ **Performance**: Currency cached in memory

---

## Next Steps

1. ✅ Set company currency in Firestore
2. ✅ Restart dev server
3. ✅ Test bank import UI
4. ✅ Verify posted transactions
5. ✅ Check ledger entries in Firestore

**Everything should now respect the workspace currency!** 🎉
