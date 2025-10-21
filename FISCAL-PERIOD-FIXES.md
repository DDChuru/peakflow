# Fiscal Period Fixes

## Issues Fixed

### 1. ✅ "current" Fiscal Period Not Resolved

**Problem**: Code was passing literal string `'current'` as fiscalPeriodId, but there was no logic to resolve it to an actual period ID like "2025-01".

**Error**:
```
[PostingService] Fiscal period not found, proceeding without period validation current
```

**Fix** (`bank-to-ledger-service.ts:332-347`):
- Added automatic resolution of `'current'` to actual fiscal period ID
- Looks up fiscal period based on transaction date
- Falls back to generating period ID from date if no period exists

**How It Works**:
```typescript
// Before posting each transaction:
if (fiscalPeriodId === 'current') {
  const period = await fiscalPeriodService.getPeriodForDate(
    this.companyId,
    transactionDate
  );

  if (period) {
    fiscalPeriodId = period.id; // e.g., "2025-01"
  } else {
    // Fallback: generate from date
    fiscalPeriodId = `${year}-${month}`; // e.g., "2025-01"
  }
}
```

---

### 2. ✅ Multi-Year Fiscal Period Creation

**Problem**: `createPeriodsForYear()` only creates 12 months (1 year). To create 2+ years, you had to call it multiple times manually.

**Fix** (`fiscal-period-service.ts:139-167`):
- Added new method `createPeriodsForMultipleYears()`
- Creates periods for any number of years in one call
- Handles overlapping periods gracefully

**Usage**:
```typescript
// Create 2 years of fiscal periods
await fiscalPeriodService.createPeriodsForMultipleYears(
  companyId,
  2024,     // Start year
  2,        // Number of years
  1         // Fiscal year start month (January)
);

// Result: Creates 24 periods (2024-01 through 2025-12)
```

---

## How to Use

### Method 1: Via Script (Recommended)

**Create multiple years at once:**

```bash
# Syntax
tsx scripts/create-fiscal-periods.ts <companyId> <startYear> <numberOfYears> [fiscalYearStartMonth]

# Example: Create 2024 and 2025 (calendar year)
tsx scripts/create-fiscal-periods.ts my-company-id 2024 2 1

# Example: Create 2023-2025 (fiscal year starting July)
tsx scripts/create-fiscal-periods.ts my-company-id 2023 3 7
```

### Method 2: Programmatically

**In your code:**

```typescript
import { fiscalPeriodService } from '@/lib/accounting/fiscal-period-service';

// Create multiple years
const periods = await fiscalPeriodService.createPeriodsForMultipleYears(
  'company-123',
  2024,  // Start year
  3,     // Create 2024, 2025, 2026
  1      // January start (calendar year)
);

console.log(`Created ${periods.length} periods`); // 36 periods
```

---

## Understanding Fiscal Periods

### Period ID Format
Periods are identified by `YYYY-MM` format:
- `2024-01` = January 2024
- `2024-12` = December 2024
- `2025-01` = January 2025

### Fiscal Year Start Month
- `1` = January (calendar year)
- `7` = July (July-June fiscal year)
- Any month 1-12

### Period Status
- `open` - Can post transactions
- `closed` - No new transactions (can reopen)
- `locked` - Completely immutable (admin only can unlock)

---

## Testing

### 1. Verify Periods Were Created

**Check in Firebase Console:**
1. Go to Firestore Database
2. Open `fiscal_periods` collection
3. Filter by `tenantId == 'your-company-id'`
4. Should see periods for all requested years

### 2. Test Bank Import Posting

**Now when you import bank transactions:**

```typescript
// Before (caused warning)
fiscalPeriodId: 'current'

// Now automatically resolves to (example)
fiscalPeriodId: '2025-01'  // Based on transaction date
```

**Expected behavior:**
- ✅ No more "[PostingService] Fiscal period not found" warning
- ✅ Transactions post to correct fiscal period based on transaction date
- ✅ If period doesn't exist, uses fallback ID and proceeds

---

## Common Scenarios

### Scenario 1: New Company Setup
```bash
# Create 2 years of periods for new company
tsx scripts/create-fiscal-periods.ts company-abc 2024 2 1
```

### Scenario 2: Year-End Rollover
```bash
# Add next year's periods
tsx scripts/create-fiscal-periods.ts company-abc 2026 1 1
```

### Scenario 3: Fiscal Year Company (July-June)
```bash
# Create fiscal years 2024-2025 and 2025-2026
tsx scripts/create-fiscal-periods.ts company-xyz 2024 2 7
```

### Scenario 4: Historical Data Import
```bash
# Create periods for past 3 years
tsx scripts/create-fiscal-periods.ts company-123 2022 3 1
```

---

## Troubleshooting

### "Fiscal period not found" Warning Still Appears

**Possible causes:**
1. Periods haven't been created yet for that date
2. Transaction date is outside created period range
3. Company ID mismatch

**Solution:**
```bash
# Check what years you need
# Then create periods for those years
tsx scripts/create-fiscal-periods.ts <companyId> <year> <numberOfYears>
```

### Periods Already Exist Error

**This is normal!** The script skips existing periods automatically.

```
Error: Fiscal period 2024-01 already exists
```

The script will continue creating other periods that don't exist yet.

### Script Syntax Error

Make sure you're using `tsx` (TypeScript executor):
```bash
# Install if needed
npm install -g tsx

# Then run
tsx scripts/create-fiscal-periods.ts ...
```

---

## Files Modified

1. **`src/lib/accounting/bank-to-ledger-service.ts`**
   - Added import for `fiscalPeriodService`
   - Added logic to resolve 'current' to actual period ID (line 332-347)

2. **`src/lib/accounting/fiscal-period-service.ts`**
   - Added `createPeriodsForMultipleYears()` method (line 139-167)

3. **`scripts/create-fiscal-periods.ts`** *(NEW)*
   - Helper script for easy multi-year period creation

---

## Next Steps

1. ✅ **Create fiscal periods** for your company using the script
2. ✅ **Test bank import** - posting should work without warnings
3. ✅ **Verify** periods exist in Firestore Console
4. 🔄 **Year-end**: Remember to create next year's periods before year-end

---

## Related Documentation

- Fiscal Period Service: `src/lib/accounting/fiscal-period-service.ts`
- Bank-to-Ledger Service: `src/lib/accounting/bank-to-ledger-service.ts`
- Posting Service: `src/lib/accounting/posting-service.ts`
