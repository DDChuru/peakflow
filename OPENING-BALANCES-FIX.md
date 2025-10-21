# Opening Balances Chart of Accounts Loading Fix

## Issue

The opening balances page was showing an empty table with no chart of accounts displayed.

**Screenshot Evidence**: User reported seeing empty table with headers but no account rows.

## Root Cause

The query was missing the `chartId` parameter. The database structure requires:

```typescript
// ❌ WRONG - Missing chartId
query(
  collection(db, 'accounting_accounts'),
  where('tenantId', '==', companyId),
  where('status', '==', 'active')
)

// ✅ CORRECT - Includes chartId
query(
  collection(db, 'accounting_accounts'),
  where('tenantId', '==', companyId),
  where('chartId', '==', chartId),  // ← Required!
  where('status', '==', 'active')
)
```

## Database Structure

```
accounting_charts (collection)
├─ {chartId}
   ├─ tenantId: "companyId"
   ├─ name: "Standard Chart"
   ├─ isActive: true
   └─ ...

accounting_accounts (collection)
├─ {accountId}
   ├─ tenantId: "companyId"
   ├─ chartId: "chartId"  ← Links to specific chart
   ├─ code: "1000"
   ├─ name: "Cash"
   ├─ type: "asset"
   └─ status: "active"
```

## Solution

Updated `/app/workspace/[companyId]/setup/opening-balances/page.tsx`:

### Before

```typescript
// Load chart of accounts
const accountsQuery = query(
  collection(db, 'accounting_accounts'),
  where('tenantId', '==', companyId),
  where('status', '==', 'active'),
  orderBy('code', 'asc')
);
```

### After

```typescript
// First, get the company's active chart of accounts
const chartsQuery = query(
  collection(db, 'accounting_charts'),
  where('tenantId', '==', companyId),
  where('isActive', '==', true)
);

const chartsSnapshot = await getDocs(chartsQuery);
if (chartsSnapshot.empty) {
  toast.error('No active chart of accounts found. Please set up a chart of accounts first.');
  setLoading(false);
  return;
}

const activeChart = chartsSnapshot.docs[0];
const chartId = activeChart.id;

// Load chart of accounts using the chartId
const accountsQuery = query(
  collection(db, 'accounting_accounts'),
  where('tenantId', '==', companyId),
  where('chartId', '==', chartId),  // ✅ Now includes chartId
  where('status', '==', 'active'),
  orderBy('code', 'asc')
);
```

## What Changed

1. **Added Chart Lookup**: First queries `accounting_charts` to find the active chart
2. **Added Validation**: Shows error if no active chart exists
3. **Added chartId Filter**: Includes `chartId` in accounts query
4. **Better Error Handling**: User-friendly message if chart not found

## Testing Steps

1. Navigate to `/workspace/{companyId}/setup/opening-balances`
2. Wait for page to load
3. **Expected**: Chart of accounts table should now populate with all active accounts
4. **Expected**: Accounts grouped by type (Asset, Liability, Equity, Revenue, Expense)
5. **Expected**: Input fields for each account to enter opening balances

## Prerequisites

Before using opening balances, ensure:

1. ✅ Company has an active chart of accounts
2. ✅ Chart has accounts created
3. ✅ Accounts have status='active'
4. ✅ Fiscal periods exist for the company

## How to Set Up Chart of Accounts (If Missing)

If you get "No active chart of accounts found" error:

1. Navigate to `/admin/chart-of-accounts`
2. Select your company
3. Click "Apply Template"
4. Choose a template (e.g., "South African Standard")
5. Click "Apply Template"
6. Wait for accounts to be created
7. Return to opening balances page

## Build Status

```bash
npm run build
```

**Result**: ✅ Compiled successfully

## Files Modified

- `/app/workspace/[companyId]/setup/opening-balances/page.tsx` (lines 123-161)

## Related Files

- `/src/lib/accounting/chart-of-accounts-service.ts` - Service that manages charts
- `/app/admin/chart-of-accounts/page.tsx` - Admin page for chart management

---

**Status**: ✅ Fixed and Ready for Testing
**Date**: 2025-10-21
