# How Chart of Accounts Selection Works

## The Selection Process

Here's exactly how the opening balances page selects which chart of accounts to show:

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Opens Opening Balances Page                            │
│    /workspace/{companyId}/setup/opening-balances               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Load All Charts for Company                                 │
│                                                                 │
│    const chartService = new ChartOfAccountsService();          │
│    const charts = await chartService.getCharts(companyId);     │
│                                                                 │
│    Query: Firestore 'accounting_charts' collection             │
│           WHERE tenantId == companyId                           │
│           ORDER BY createdAt DESC                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Check If Any Charts Exist                                   │
│                                                                 │
│    if (charts.length === 0) {                                  │
│      ❌ ERROR: "No chart of accounts found..."                 │
│      STOP                                                       │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Select Which Chart to Use                                   │
│                                                                 │
│    const activeChart = charts.find(c => c.isDefault)           │
│                        || charts[0];                            │
│                                                                 │
│    Selection Logic:                                            │
│    1. First: Try to find chart with isDefault: true            │
│    2. Fallback: Use first chart in array (most recent)         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Load Accounts for Selected Chart                            │
│                                                                 │
│    const accountRecords = await chartService.getAccounts(      │
│      companyId,                                                 │
│      activeChart.id                                             │
│    );                                                           │
│                                                                 │
│    Query: Firestore 'accounting_accounts' collection           │
│           WHERE tenantId == companyId                           │
│           WHERE chartId == activeChart.id                       │
│           ORDER BY code                                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Filter Active Accounts Only                                 │
│                                                                 │
│    const accountsList = accountRecords                         │
│      .filter(acc => acc.isActive)                              │
│      .map(acc => ({ ... }));                                   │
│                                                                 │
│    Only accounts with isActive: true are shown                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Display in UI Table                                         │
│                                                                 │
│    Accounts grouped by type:                                   │
│    - Assets                                                     │
│    - Liabilities                                                │
│    - Equity                                                     │
│    - Revenue                                                    │
│    - Expense                                                    │
└─────────────────────────────────────────────────────────────────┘
```

## The Code in Detail

### Line 127-128: Load All Charts
```typescript
const charts = await chartService.getCharts(companyId);
console.log('📊 Found charts:', charts.length, charts);
```

**What this does:**
- Queries Firestore: `accounting_charts` collection
- Filter: `WHERE tenantId == companyId`
- Sort: `ORDER BY createdAt DESC` (most recent first)
- Returns array of all charts for this company

**Example Result:**
```javascript
[
  {
    id: "abc123",
    tenantId: "Na1KU0ogKFLJ5cUzrMrU",
    name: "Standard Chart",
    currency: "ZAR",
    isDefault: true,
    createdAt: Date,
    updatedAt: Date
  }
]
```

### Line 138: Select Which Chart to Use
```typescript
const activeChart = charts.find(c => c.isDefault) || charts[0];
```

**Selection Priority:**
1. **First Priority**: Chart with `isDefault: true`
2. **Fallback**: First chart in array (most recent by `createdAt`)

**Why this logic?**
- Companies can have multiple charts (rare, but possible)
- One chart should be marked as default
- If no default, use the most recent one

### Line 144-145: Load Accounts
```typescript
const accountRecords = await chartService.getAccounts(companyId, chartId);
console.log('📊 Found accounts:', accountRecords.length);
```

**What this does:**
- Queries Firestore: `accounting_accounts` collection
- Filter: `WHERE tenantId == companyId AND chartId == activeChart.id`
- Sort: `ORDER BY code` (account code ascending: 1000, 1100, etc.)
- Returns array of ALL accounts in that chart

### Line 148-156: Filter Active Accounts
```typescript
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

**What this does:**
- Filters out inactive accounts (`isActive: false`)
- Transforms to the format needed by the UI
- Adds default amount of '0.00' for each account

## Database Structure

### accounting_charts Collection
```
accounting_charts/
├─ {chartId1}
│  ├─ tenantId: "companyId"
│  ├─ name: "Standard Chart"
│  ├─ currency: "ZAR"
│  ├─ isDefault: true          ← Used for selection!
│  ├─ createdAt: Timestamp
│  └─ updatedAt: Timestamp
│
└─ {chartId2}  (if company has multiple)
   ├─ tenantId: "companyId"
   ├─ name: "Alternative Chart"
   ├─ isDefault: false
   └─ ...
```

### accounting_accounts Collection
```
accounting_accounts/
├─ {accountId1}
│  ├─ tenantId: "companyId"
│  ├─ chartId: "chartId1"      ← Links to chart!
│  ├─ code: "1000"
│  ├─ name: "Cash"
│  ├─ type: "asset"
│  ├─ isActive: true            ← Used for filtering!
│  └─ ...
│
├─ {accountId2}
│  ├─ tenantId: "companyId"
│  ├─ chartId: "chartId1"
│  ├─ code: "1100"
│  ├─ name: "Bank"
│  ├─ isActive: true
│  └─ ...
```

## Console Output Example

When the page loads successfully, you'll see:

```
📊 Loading charts for company: Na1KU0ogKFLJ5cUzrMrU
📊 Found charts: 1 [{
  id: "abc123",
  tenantId: "Na1KU0ogKFLJ5cUzrMrU",
  name: "Standard Chart",
  currency: "ZAR",
  isDefault: true,
  ...
}]
📊 Using chart: abc123 Standard Chart
📊 Loading accounts for chart: abc123
📊 Found accounts: 68
📊 Active accounts: 68
```

## Scenarios & Behavior

### Scenario 1: Normal Case (1 Chart, isDefault: true)
```javascript
// Database has:
accounting_charts: [
  { id: "chart1", name: "Standard", isDefault: true }
]

// Selection:
activeChart = chart1  // Found by isDefault: true
```

### Scenario 2: Multiple Charts, One Default
```javascript
// Database has:
accounting_charts: [
  { id: "chart1", name: "Old Chart", isDefault: false, createdAt: 2024-01-01 },
  { id: "chart2", name: "New Chart", isDefault: true, createdAt: 2024-06-01 }
]

// Selection:
activeChart = chart2  // Found by isDefault: true (ignores createdAt order)
```

### Scenario 3: Multiple Charts, No Default
```javascript
// Database has:
accounting_charts: [
  { id: "chart2", name: "New Chart", isDefault: false, createdAt: 2024-06-01 },
  { id: "chart1", name: "Old Chart", isDefault: false, createdAt: 2024-01-01 }
]

// Selection:
activeChart = chart2  // First in array (newest by createdAt DESC)
```

### Scenario 4: No Charts
```javascript
// Database has:
accounting_charts: []

// Result:
❌ Error toast: "No chart of accounts found..."
Page stops loading
```

### Scenario 5: Chart Exists, No Accounts
```javascript
// Database has:
accounting_charts: [{ id: "chart1", name: "Empty Chart" }]
accounting_accounts: []  // No accounts for this chart

// Result:
📊 Found charts: 1
📊 Found accounts: 0
📊 Active accounts: 0
Table is empty (no rows shown)
```

### Scenario 6: All Accounts Inactive
```javascript
// Database has:
accounting_accounts: [
  { id: "acc1", chartId: "chart1", isActive: false },
  { id: "acc2", chartId: "chart1", isActive: false }
]

// Result:
📊 Found accounts: 2
📊 Active accounts: 0
Table is empty (filtered out)
```

## How to Control Which Chart is Used

### Method 1: Set Default Chart (Recommended)
```javascript
// Update chart in Firestore
accounting_charts/{chartId}
  isDefault: true  // ← This chart will be selected
```

### Method 2: Delete Other Charts
If you only have one chart, it will always be selected (no choice).

### Method 3: Make It the Newest
Charts are ordered by `createdAt DESC`, so the newest chart is used as fallback.

## Why This Approach?

1. **Predictable**: Always follows the same logic (default → newest)
2. **Flexible**: Supports multiple charts per company
3. **Backwards Compatible**: Works even if no chart has `isDefault`
4. **User Friendly**: Most companies have 1 chart, so it "just works"

## Troubleshooting

### "No chart of accounts found"
**Problem**: `charts.length === 0`

**Check**:
1. Does chart exist? Query: `accounting_charts WHERE tenantId == companyId`
2. Is tenantId correct? Check companyId in URL
3. Created via admin page? Go to `/admin/chart-of-accounts` and apply template

### "Table is empty but no error"
**Problem**: `accountRecords.length === 0` OR all `isActive: false`

**Check**:
1. Do accounts exist for this chart? Query: `accounting_accounts WHERE chartId == {chartId}`
2. Are accounts active? Check `isActive: true`
3. Was template applied? Go to admin page and apply template

### "Wrong chart is being used"
**Problem**: Multiple charts, wrong one selected

**Check**:
1. Which chart has `isDefault: true`?
2. If none have `isDefault`, newest chart (by createdAt) is used
3. Update correct chart: Set `isDefault: true`

---

**Key Takeaway**: The page selects charts in this order:
1. Chart with `isDefault: true`
2. First chart (newest by `createdAt`)
