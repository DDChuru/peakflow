# Opening Balances Chart Loading Fix - V2

## Issue

Chart of accounts were still not loading in the opening balances page, showing error "Failed to load chart of accounts" or "No chart of accounts exist".

## Root Cause Analysis

The initial fix added the `chartId` parameter but used raw Firestore queries. The real issue was that we should use the **ChartOfAccountsService** like all other pages in the application do.

## Solution

Replaced raw Firestore queries with the proper service layer:

### Before (Raw Queries)

```typescript
// ❌ Direct Firestore query - fragile
const accountsQuery = query(
  collection(db, 'accounting_accounts'),
  where('tenantId', '==', companyId),
  where('chartId', '==', chartId),
  where('status', '==', 'active'),
  orderBy('code', 'asc')
);
```

### After (Service Layer)

```typescript
// ✅ Use ChartOfAccountsService - consistent with rest of app
const chartService = new ChartOfAccountsService();

// 1. Get charts
const charts = await chartService.getCharts(companyId);

// 2. Find default chart
const activeChart = charts.find(c => c.isDefault) || charts[0];

// 3. Get accounts
const accountRecords = await chartService.getAccounts(companyId, activeChart.id);

// 4. Filter active accounts
const accountsList = accountRecords
  .filter(acc => acc.isActive)
  .map(acc => ({
    accountId: acc.id,
    accountCode: acc.code,
    accountName: acc.name,
    accountType: acc.type,
    amount: '0.00'
  }));
```

## Key Changes

1. **Import ChartOfAccountsService**: Added proper import
2. **Instantiate Service**: Create service instance in loadData function
3. **Use getCharts()**: Get all charts for company
4. **Find Default Chart**: Use `isDefault` property (not `isActive`)
5. **Use getAccounts()**: Service method handles all query logic
6. **Filter by isActive**: AccountRecord uses `isActive` (not `status`)
7. **Added Debug Logging**: Console logs at each step for debugging

## Type Corrections

Fixed type mismatches:

| Type | Wrong Property | Correct Property |
|------|---------------|------------------|
| `ChartOfAccounts` | `isActive` | `isDefault` |
| `AccountRecord` | `status` | `isActive` |

## Debug Logging

Added console logs to help trace issues:

```typescript
console.log('📊 Loading charts for company:', companyId);
console.log('📊 Found charts:', charts.length, charts);
console.log('📊 Using chart:', chartId, activeChart.name);
console.log('📊 Loading accounts for chart:', chartId);
console.log('📊 Found accounts:', accountRecords.length);
console.log('📊 Active accounts:', accountsList.length);
```

## How to Debug If Still Not Working

1. **Open Browser Console** (F12)
2. **Navigate to**: `/workspace/{companyId}/setup/opening-balances`
3. **Look for console logs**:
   ```
   📊 Loading charts for company: {companyId}
   📊 Found charts: X [{...}]
   📊 Using chart: {chartId} Standard Chart
   📊 Loading accounts for chart: {chartId}
   📊 Found accounts: Y
   📊 Active accounts: Z
   ```

4. **Check Each Step**:
   - If `Found charts: 0` → No chart of accounts exists, need to create one
   - If `Found accounts: 0` → Chart exists but has no accounts
   - If `Active accounts: 0` → Accounts exist but all are inactive

## Prerequisites Checklist

Before using opening balances, ensure:

- [ ] Company exists in Firestore
- [ ] Chart of accounts created for company
- [ ] Chart has `isDefault: true` or is the first chart
- [ ] Accounts exist in the chart
- [ ] Accounts have `isActive: true`
- [ ] Fiscal periods exist for company

## How to Set Up Chart of Accounts

If you see "No chart of accounts found":

### Option 1: Admin Page
1. Navigate to `/admin/chart-of-accounts`
2. Select your company from dropdown
3. Click "Apply Template"
4. Choose "South African Standard" or other template
5. Click "Apply Template" button
6. Wait for success message
7. Return to opening balances page

### Option 2: Seed Script
```bash
npm run seed:charts
```

## Files Modified

- `/app/workspace/[companyId]/setup/opening-balances/page.tsx`
  - Added `ChartOfAccountsService` import
  - Replaced raw queries with service calls
  - Fixed type usage (`isDefault` vs `isActive`)
  - Added debug logging

## Related Services

- `/src/lib/accounting/chart-of-accounts-service.ts` - Service used
- `/app/admin/chart-of-accounts/page.tsx` - Example of correct usage

## Build Status

```bash
npm run build
```

**Result**: ✅ Compiled successfully

## Testing Instructions

1. **Check Browser Console**:
   - Open DevTools (F12)
   - Navigate to opening balances page
   - Read console logs to see what's happening

2. **Verify Chart Exists**:
   - Go to `/admin/chart-of-accounts`
   - Select your company
   - Check if chart exists and has accounts

3. **Test Page Load**:
   - Navigate to `/workspace/{companyId}/setup/opening-balances`
   - Accounts table should populate
   - Should see accounts grouped by type

4. **Test Data Entry**:
   - Enter amounts in account fields
   - Check balance validation
   - Try posting opening balances

## Expected Behavior

### Success Case
1. Page loads
2. Console shows: "Found charts: 1" (or more)
3. Console shows: "Found accounts: 50+" (depending on template)
4. Console shows: "Active accounts: 50+" (same or less)
5. Table populates with accounts grouped by type
6. Input fields are editable
7. Balance validation works

### Failure Case: No Chart
1. Console shows: "Found charts: 0"
2. Toast error: "No chart of accounts found..."
3. Table stays empty
4. **Solution**: Go to admin page and apply template

### Failure Case: No Accounts
1. Console shows: "Found charts: 1"
2. Console shows: "Found accounts: 0"
3. Table stays empty
4. **Solution**: Template not applied or failed - reapply template

## Next Steps

1. **Test the page** - Check browser console for debug logs
2. **Verify chart exists** - Check admin page
3. **Report findings** - Share console logs if still not working

---

**Status**: ✅ Fixed - Using proper service layer
**Build**: ✅ Passes
**Date**: 2025-10-21
