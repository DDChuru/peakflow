# Bank Import Currency Fix

## Issue Fixed

**Problem**: Bank import was hardcoding currency as 'USD' for all transactions, ignoring the company's configured default currency.

**Impact**:
- Companies using ZAR, EUR, ZWD, or ZIG saw transactions posted with wrong currency
- Ledger entries showed USD amounts instead of actual company currency
- Multi-currency support was broken for bank imports

---

## Solution

### Changes Made

**File**: `src/lib/accounting/bank-to-ledger-service.ts`

1. **Added currency property** (line 92):
   ```typescript
   private companyCurrency: SupportedCurrency = 'USD'; // Default fallback
   ```

2. **Added currency initialization** (lines 101-120):
   - Fetches company data from Firestore on service creation
   - Reads `defaultCurrency` from company document
   - Falls back to USD if company not found or no currency set

3. **Added getCurrency() method** (lines 125-131):
   - Returns the company currency
   - Re-fetches if needed (lazy initialization)

4. **Updated createJournalEntry()** (line 435):
   - Fetches company currency before creating journal lines
   - Uses actual currency instead of hardcoded 'USD'
   - All 4 journal lines now use correct currency

---

## Supported Currencies

The system supports these currencies (defined in `src/types/auth.ts`):

| Code | Currency |
|------|----------|
| USD  | US Dollar (default) |
| ZAR  | South African Rand |
| EUR  | Euro |
| ZWD  | Zimbabwe Dollar |
| ZIG  | Zimbabwe Gold |

---

## How It Works

### 1. Service Initialization

```typescript
// When BankToLedgerService is created:
const service = new BankToLedgerService(companyId);

// Automatically fetches company currency:
// - Reads from companies/{companyId}
// - Gets defaultCurrency field
// - Stores in memory for fast access
```

### 2. Transaction Posting

```typescript
// Before (hardcoded):
currency: 'USD'  // ❌ Wrong for non-USD companies

// After (dynamic):
const currency = await this.getCurrency();  // ✅ Uses company currency
currency: currency  // e.g., 'ZAR', 'EUR', etc.
```

### 3. Journal Entry Creation

```typescript
// Example: Company with ZAR currency
const journalEntry = {
  lines: [
    {
      debit: 1000,
      credit: 0,
      currency: 'ZAR'  // ✅ Correct!
    },
    {
      debit: 0,
      credit: 1000,
      currency: 'ZAR'  // ✅ Correct!
    }
  ]
}
```

---

## Setting Company Currency

### Method 1: Firebase Console

1. Go to Firestore Database
2. Open `companies` collection
3. Find your company document
4. Add/update field:
   - Field: `defaultCurrency`
   - Type: `string`
   - Value: `ZAR` (or `EUR`, `USD`, etc.)
5. Save

### Method 2: Company Settings UI

1. Go to Workspace → Settings
2. Find "Default Currency" field
3. Select currency from dropdown
4. Save changes

### Method 3: Programmatically

```typescript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

await updateDoc(doc(db, 'companies', companyId), {
  defaultCurrency: 'ZAR'
});
```

---

## Testing

### Test 1: Verify Currency is Loaded

**Check browser console** when importing bank statement:

```
[BankToLedger] Using company currency: ZAR
```

If you see:
```
[BankToLedger] Company xxx not found, using USD as default
```
→ Company doesn't exist or no currency set

### Test 2: Verify Posted Transactions

**In Firestore Console:**

1. Go to `general_ledger` collection
2. Find recent entries for your company
3. Check the `currency` field on ledger entries
4. Should match your company's `defaultCurrency`

**Expected**:
```javascript
{
  accountCode: "1000",
  debit: 5000,
  credit: 0,
  currency: "ZAR",  // ✅ Correct!
  ...
}
```

---

## Fallback Behavior

The system has intelligent fallbacks:

1. **Company has currency set**: Uses that currency ✅
2. **Company exists, no currency**: Uses USD as default
3. **Company doesn't exist**: Uses USD, logs warning
4. **Fetch error**: Uses USD, logs error

**Console logging helps debug:**
```javascript
// Success
[BankToLedger] Using company currency: ZAR

// Warning (company not found)
[BankToLedger] Company abc-123 not found, using USD as default

// Error (Firestore issue)
[BankToLedger] Error fetching company currency: [error details]
```

---

## Migration Notes

### For Existing Companies

**If you have existing transactions with wrong currency:**

1. **Option A**: Update currency field in posted entries
   ```typescript
   // Bulk update general_ledger entries
   // (requires admin script - contact support)
   ```

2. **Option B**: Document as historical discrepancy
   - Note in company records
   - Future entries will use correct currency

### For New Companies

✅ No action needed! Just set `defaultCurrency` when creating company.

---

## Related Files

| File | Changes |
|------|---------|
| `src/lib/accounting/bank-to-ledger-service.ts` | Added currency fetching and usage |
| `src/types/auth.ts` | Defines SupportedCurrency type |
| `src/lib/firebase/companies-service.ts` | Company data access (no changes) |

---

## Common Issues

### Issue: Still seeing USD in ledger entries

**Possible causes:**
1. Company `defaultCurrency` not set
2. Browser cache (dev server needs restart)
3. Service created before currency was set

**Solution:**
1. Verify currency in Firestore: `companies/{id}.defaultCurrency`
2. Restart dev server: `npm run dev`
3. Clear browser cache / hard refresh

### Issue: Console shows "Company not found"

**Possible causes:**
1. Wrong company ID
2. Company document doesn't exist
3. Firestore permissions issue

**Solution:**
1. Check company ID is correct
2. Verify company exists in Firestore
3. Check Firestore rules allow reading companies

### Issue: Want to add new currency

**Steps:**
1. Add to `SupportedCurrency` type in `src/types/auth.ts`
2. Update company settings UI dropdown
3. Deploy and test

**Example:**
```typescript
// In src/types/auth.ts
export type SupportedCurrency = 'USD' | 'ZAR' | 'EUR' | 'ZWD' | 'ZIG' | 'GBP'; // Added GBP
```

---

## Performance Notes

### Currency Fetching

- **First call**: Fetches from Firestore (~50-100ms)
- **Subsequent calls**: Returns cached value (instant)
- **Async initialization**: Doesn't block service creation

### Impact

- ✅ Minimal performance impact
- ✅ Single Firestore read per service instance
- ✅ Cached in memory for transaction posting

---

## Future Enhancements

### Potential Improvements

1. **Currency conversion**
   - Support multi-currency transactions
   - Automatic exchange rate lookup
   - Historical rate tracking

2. **Currency validation**
   - Validate amounts match expected currency
   - Alert on currency mismatches
   - Suggest currency corrections

3. **Reporting**
   - Multi-currency financial reports
   - Currency-specific dashboards
   - Exchange gain/loss tracking

---

## Verification Checklist

Before marking as complete:

- [x] Currency fetched from company document
- [x] Fallback to USD if not set
- [x] All 4 journal lines use correct currency
- [x] Console logging for debugging
- [x] No hardcoded 'USD' strings (except default)
- [x] Tested with ZAR company
- [ ] Updated company settings UI (if needed)
- [ ] Smoke tests pass

---

## Support

**Questions or issues?**

1. Check console logs for currency messages
2. Verify company `defaultCurrency` in Firestore
3. Test with different currencies
4. Report bugs with console output

**Success criteria:**
- ✅ Bank imports use company currency
- ✅ Ledger entries show correct currency
- ✅ Multi-currency companies work correctly
