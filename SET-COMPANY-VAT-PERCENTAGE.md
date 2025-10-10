# How to Set Company VAT Percentage

**Issue:** Tax rate showing 0% or using fallback 15% default

---

## Quick Fix - Set in Firebase Console

Since you're showing 0%, your company document doesn't have `vatPercentage` set. Here's how to fix it:

### Option 1: Firebase Console (Quick)

1. Open Firebase Console: https://console.firebase.google.com/
2. Go to your project → Firestore Database
3. Navigate to `companies` collection
4. Find your company document
5. Click "Edit"
6. Add field:
   - **Field name:** `vatPercentage`
   - **Type:** number
   - **Value:** `15` (or your country's VAT %)
7. Save

**Result:** Tax rate will now pre-fill with 15% (or whatever you set)

---

## Option 2: Update via Code (If you have Company Edit Page)

If you have a company settings/edit page, add this field:

```typescript
<div>
  <Label htmlFor="vatPercentage">VAT Percentage (%)</Label>
  <Input
    id="vatPercentage"
    type="number"
    value={company.vatPercentage || 15}
    onChange={(e) => updateCompany({ vatPercentage: parseFloat(e.target.value) })}
    min="0"
    max="100"
    step="0.01"
  />
  <p className="text-xs text-gray-500 mt-1">
    Default tax rate for quotes and invoices (e.g., 15 for South Africa)
  </p>
</div>
```

---

## Option 3: Run Script (Bulk Update)

If you have multiple companies, create a script:

```typescript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

async function setCompanyVAT(companyId: string, vatPercentage: number) {
  const companyRef = doc(db, 'companies', companyId);
  await updateDoc(companyRef, {
    vatPercentage: vatPercentage
  });
  console.log(`✓ Updated company ${companyId} with VAT ${vatPercentage}%`);
}

// Usage:
await setCompanyVAT('your-company-id', 15);
```

---

## Current Behavior (After Fix)

### Before Setting VAT Percentage:
```
Tax Rate field shows: 15%
Helper text: "Using default 15% (set company VAT % in Company Settings)"
```

### After Setting VAT Percentage:
```
Tax Rate field shows: 15%  (or whatever you set)
Helper text: "Pre-filled from company settings (15%)"
```

---

## Why This Matters

### Tax Rate Hierarchy:
```
Country Law (15% VAT)
    ↓
Company Settings (vatPercentage: 15)
    ↓
Quote Tax Rate (pre-filled: 15%)
    ↓
Can override for special cases (e.g., 0% for exports)
```

### Business Logic:
- **Company Level:** Set once in company settings
- **Quote Level:** Pre-populated from company, can override
- **Line Item Level:** Uses quote-level tax rate

---

## VAT Rates by Country (Reference)

| Country       | Standard VAT Rate |
|---------------|-------------------|
| South Africa  | 15%              |
| UK            | 20%              |
| EU (most)     | 19-25%           |
| USA           | 0% (state sales tax varies) |
| Zimbabwe      | 14.5%            |

---

## Verification

After setting `vatPercentage`:

1. **Check Console:**
   ```javascript
   // Open browser console, click "New Quote"
   // You should see:
   Company VAT Percentage: 15
   Using Tax Rate: 15
   ```

2. **Check UI:**
   - Tax Rate field shows: `15`
   - Helper text shows: "Pre-filled from company settings (15%)"

3. **Test Override:**
   - Change to 0% for export quote
   - Change to 10% for reduced-rate items
   - System should accept override

---

## Summary

**Fix:** Set `vatPercentage: 15` in your company document (Firebase Console)

**Result:** Tax rate pre-fills automatically on all new quotes

**Fallback:** If not set, system defaults to 15% (South Africa standard)
