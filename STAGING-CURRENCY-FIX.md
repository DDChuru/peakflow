# Staging Review Currency Fix

## Issue
The Staging Review component was displaying hardcoded `$` (USD) for all currency amounts instead of using the company's configured currency.

## Root Cause
The `formatCurrency` function in `StagingReview.tsx` had a hardcoded `currency: 'USD'` parameter:

```typescript
// BEFORE (Wrong)
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',  // ❌ Hardcoded!
    minimumFractionDigits: 2,
  }).format(value);
};
```

## Solution

### Changes Made to `/src/components/banking/StagingReview.tsx`

1. **Added imports**:
```typescript
import { doc, getDoc } from 'firebase/firestore';
import { SupportedCurrency } from '@/types/auth';
```

2. **Added state for company currency**:
```typescript
const [companyCurrency, setCompanyCurrency] = useState<SupportedCurrency>('USD');
```

3. **Added function to load company currency**:
```typescript
const loadCompanyCurrency = async () => {
  try {
    const companyRef = doc(db, 'companies', companyId);
    const companySnap = await getDoc(companyRef);

    if (companySnap.exists()) {
      const companyData = companySnap.data();
      setCompanyCurrency(companyData.defaultCurrency || 'USD');
    }
  } catch (error) {
    console.error('[StagingReview] Failed to load company currency:', error);
    // Keep default USD
  }
};
```

4. **Load currency on component mount**:
```typescript
useEffect(() => {
  loadCompanyCurrency();
  loadStagingSessions();
}, [companyId]);
```

5. **Updated formatCurrency to use dynamic currency**:
```typescript
// AFTER (Correct)
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: companyCurrency,  // ✅ Dynamic!
    minimumFractionDigits: 2,
  }).format(value);
};
```

## Impact

Now all currency displays in Staging Review will show the correct currency symbol:

### Example Before:
```
Total Debits: $238,249.19
Total Credits: $238,249.19
```

### Example After (for ZAR company):
```
Total Debits: R238,249.19
Total Credits: R238,249.19
```

### Supported Currencies

The component now respects all currencies defined in `SupportedCurrency` type:
- USD ($)
- ZAR (R)
- EUR (€)
- GBP (£)
- And any others defined in the type

## Affected Areas

All currency displays in the Staging Review component:
- ✅ Session card total debits/credits
- ✅ Journal entries table
- ✅ GL entries detail dialog
- ✅ Post confirmation dialog

## Testing

To verify the fix:

1. **For USD company**:
   - Should still show `$` symbol
   - No visual change

2. **For ZAR company**:
   - Should now show `R` symbol instead of `$`
   - Example: `R238,249.19`

3. **For EUR company**:
   - Should show `€` symbol
   - Example: `€238,249.19`

## Files Modified
- ✅ `/src/components/banking/StagingReview.tsx`

## Status
✅ Complete - Build passes with no errors

---

**Implementation Date**: 2025-10-21
**Related**: STAGING-REVIEW-IMPLEMENTATION.md
