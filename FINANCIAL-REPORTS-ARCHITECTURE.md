# Financial Reports Data Architecture Investigation

## Executive Summary

**KEY FINDING: All financial reports in PeakFlow are COMPUTED ON-THE-FLY - there are NO stored report collections in Firestore.**

Reports are generated dynamically from the primary source data (general ledger and journal entries) whenever requested. This means:
- **Deleting journal_entries and general_ledger entries automatically cleans up all reports**
- **No additional cleanup of report data is needed**
- **Reports always reflect the current state of the ledger**

---

## Report Architecture Overview

### Report Generation Services

PeakFlow has THREE dedicated reporting services in `/src/lib/reporting/`:

1. **GL Reports Service** (`gl-reports-service.ts`)
   - Trial Balance Report
   - General Ledger by Account Report
   - Journal Entries Report

2. **Financial Statements Service** (`financial-statements-service.ts`)
   - Income Statement (P&L)
   - Balance Sheet
   - Cash Flow Statement

3. **AP/AR Reports Service** (`ap-ar-reports-service.ts`)
   - Aged Receivables Report
   - Aged Payables Report
   - AR Summary by Customer
   - AP Summary by Vendor

### Key Characteristic: Pure Computation

Each service:
- Queries Firestore for raw transaction data
- Computes aggregates in-memory
- Returns calculated results WITHOUT storing them
- Has NO write operations to Firestore

---

## Data Flow: Reports Are Always Computed

### Trial Balance Generation Example

```typescript
// From GLReportsService.generateTrialBalance()
async generateTrialBalance(asOfDate: Date): Promise<TrialBalanceReport> {
  // STEP 1: Query general_ledger collection
  const balances = await this.getAccountBalances(asOfDate);
  
  // STEP 2: Query chart of accounts
  const chartMap = await this.getChartOfAccounts();
  
  // STEP 3: Compute totals in memory
  balances.forEach((balance, accountCode) => {
    const netBalance = this.calculateBalance(
      balance.debit,
      balance.credit,
      accountType
    );
    accounts.push({ accountCode, ...netBalance });
  });
  
  // STEP 4: Return computed result (NOT stored)
  return {
    companyId,
    asOfDate,
    generatedAt: new Date(),
    accounts,
    totalDebits,
    totalCredits,
    balanced: totalDebits === totalCredits
  };
}
```

**Result:** A `TrialBalanceReport` object returned to the UI. Zero writes to Firestore.

### Balance Sheet Generation Example

```typescript
// From FinancialStatementsService.generateBalanceSheet()
async generateBalanceSheet(asOfDate: Date): Promise<BalanceSheet> {
  // Query all general_ledger entries up to asOfDate
  const balances = await this.getAccountBalances([], undefined, asOfDate);
  
  // Group and compute sections in memory
  const currentAssets = this.groupAccountsByRange(balances, '1000', '1399');
  const liabilities = this.groupAccountsByRange(balances, '2000', '2999');
  const equity = this.groupAccountsByRange(balances, '3000', '3999');
  
  // Compute totals
  const totalAssets = currentAssets.subtotal + nonCurrentAssets.subtotal;
  const totalLiabilities = currentLiabilities.subtotal + nonCurrentLiabilities.subtotal;
  
  // Verify balance equation
  const balanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;
  
  // Return WITHOUT storing
  return {
    companyId,
    asOfDate,
    assets: { currentAssets, nonCurrentAssets, totalAssets },
    liabilities: { currentLiabilities, nonCurrentLiabilities, totalLiabilities },
    equity,
    balanced
  };
}
```

---

## Data Source Analysis

### Primary Firestore Collections Used by Reports

1. **general_ledger** (Read-only)
   - Contains all individual journal line postings
   - Queried for all account balance calculations
   - Schema:
     ```
     {
       tenantId: string,
       accountCode: string,
       accountName: string,
       debit: number,
       credit: number,
       transactionDate: Timestamp,
       journalEntryId: string,
       source: string,
       ...
     }
     ```

2. **journal_entries** (Read-only)
   - Contains aggregate journal entry records
   - Used for journal entries report generation
   - Linked to general_ledger via journalEntryId

3. **accounting_accounts** (Read-only)
   - Chart of Accounts metadata (codes, names, types)
   - Used to populate account information in reports

4. **companies/{companyId}/invoices** (Read-only)
   - AR aging report queries this for invoice status/amounts
   - Not stored with report data

5. **companies/{companyId}/vendorBills** (Read-only)
   - AP aging report queries this for bill status/amounts
   - Not stored with report data

### Collections That DO NOT Exist

The following DO NOT have Firestore collections (verified via firestore.rules and codebase):
- `reports`
- `trial_balance`
- `balance_sheet`
- `income_statements`
- `cash_flow_statements`
- `financial_reports`
- `report_cache`
- `report_snapshots`
- `report_history`
- `account_balances` (cached)
- `period_snapshots`
- `report_archives`

---

## Firestore Rules Confirmation

From `firestore.rules`, these collections are defined:

**Global Collections (top-level):**
- ✅ fiscal_periods - Contains period metadata ONLY (no balances)
- ✅ general_ledger - Source data for all reports
- ✅ journal_entries - Source data for journal reports
- ✅ accounting_accounts - Chart metadata

**Company-Scoped Collections (companies/{companyId}/):**
- ✅ invoices - Source for AR aging
- ✅ vendorBills - Source for AP aging
- ✅ statements - Customer/supplier statements (NOT financial reports)
- ✅ cashFlowForecasts - Forecasts (separate from actual cash flow statements)

**No Report Storage Collections Defined**

---

## Fiscal Period Storage

The `fiscal_periods` collection stores metadata ONLY:

```typescript
// From fiscal-period-service.ts
interface FiscalPeriod {
  id: string;
  tenantId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: FiscalPeriodStatus;    // 'open' | 'closed' | 'pending' | 'locked'
  lockedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // NO stored balances, NO cached account totals
}
```

Fiscal periods DO NOT store:
- Account balances
- Trial balance snapshots
- Period-end snapshots
- Computed financial statement data

---

## Report Generation UI Integration

### Reports Page (`app/workspace/[companyId]/reports/page.tsx`)

The reports page is a client component that:

```typescript
// Generates reports on-demand when user selects date/period
const handleGenerateTrialBalance = async () => {
  const service = createGLReportsService(companyId, userId);
  const report = await service.generateTrialBalance(selectedDate);
  // Display report (no persistence)
  setReport(report);
};

const handleGenerateBalanceSheet = async () => {
  const service = createFinancialStatementsService(companyId, userId);
  const sheet = await service.generateBalanceSheet(selectedDate);
  // Display report (no persistence)
  setSheet(sheet);
};
```

**User Workflow:**
1. User selects report type and date range
2. Application queries Firestore for source data
3. Report service computes aggregates
4. Results displayed in UI
5. Nothing stored in Firestore

---

## Impact on Data Deletion

### Scenario: Deleting Ledger Entries

**When you delete general_ledger entries:**

1. ✅ Trial Balance automatically updates (reflects new GL state)
2. ✅ Balance Sheet automatically updates (reflects new GL state)
3. ✅ Income Statement automatically updates (reflects new GL state)
4. ✅ Cash Flow Statement automatically updates (reflects new GL state)
5. ✅ AP/AR aging reports automatically update (invoice/bill status remains)
6. ❌ No orphaned report data left behind
7. ❌ No additional cleanup needed

**When you delete journal_entries:**

1. ✅ Journal Entries Report automatically updates
2. ✅ Related GL entries also deleted (cascade)
3. ✅ All dependent reports automatically consistent
4. ❌ No additional cleanup needed

---

## Performance Implications

### Report Generation Performance

Since reports are computed on-demand:

**Advantages:**
- Always current (no stale data)
- No storage overhead for report cache
- Simple deletion semantics (delete source = clean up all reports)
- No risk of report/ledger inconsistency

**Trade-offs:**
- Larger datasets require longer computation time
- Real-time report generation depends on GL size
- Complex reports (cash flow categorization) require full GL scan

### Optimization Pattern (If Needed)

The service supports date range filtering to reduce computation scope:

```typescript
// Generate report for a specific period, not all-time
const report = await service.generateTrialBalance(endOfMonthDate);
```

---

## API Architecture

### No Report Storage APIs

Verified all API routes in `/app/api/`:
- No report saving endpoints
- No report caching endpoints
- No report archival endpoints
- Only AI/analysis utilities

Reports are purely client-side computed and displayed.

---

## Conclusion

### Clear Answer to Original Question

**Q: Do we need to clean up report data when deleting ledger entries?**

**A: NO.** Reports are NOT stored in Firestore. They are computed on-the-fly from the general ledger and journal entries. Deleting ledger entries automatically makes reports reflect those deletions since the reports recalculate from the updated source data.

### Data Deletion Scope

**Minimal Scope Required:**
- Delete from `general_ledger` collection
- Delete from `journal_entries` collection
- Optionally: Delete related `invoices` or `vendorBills` for AR/AP consistency

**No Additional Cleanup:**
- No report collections to clean
- No cached balances to invalidate
- No snapshots or archives to purge
- No fiscal period balance updates needed

---

## Service Implementation Details

### GL Reports Service Methods

| Method | Data Source | Computation |
|--------|-------------|-------------|
| generateTrialBalance | general_ledger + accounting_accounts | Sum debits/credits per account |
| generateGLByAccount | general_ledger (filtered by account) | Running balance for transactions |
| generateJournalEntriesReport | journal_entries + general_ledger | Group by entry, calculate totals |

### Financial Statements Service Methods

| Method | Data Source | Computation |
|--------|-------------|-------------|
| generateIncomeStatement | general_ledger (4xxx, 5xxx) | Group by subsection, calculate net income |
| generateBalanceSheet | general_ledger (1xxx, 2xxx, 3xxx) | Group by asset/liability/equity, verify balance |
| generateCashFlowStatement | general_ledger (1000-1099) | Categorize by activity type |

### AP/AR Reports Service Methods

| Method | Data Source | Computation |
|--------|-------------|-------------|
| generateAgedReceivables | invoices collection | Calculate aging buckets, total outstanding |
| generateAgedPayables | vendorBills collection | Calculate aging buckets, total outstanding |
| getARSummaryByCustomer | invoices collection | Group by customer, aggregate statistics |
| getAPSummaryByVendor | vendorBills collection | Group by vendor, aggregate statistics |

---

## Firestore Schema Summary

### Collections Storing SOURCE DATA (needed for reports):
- ✅ general_ledger (required)
- ✅ journal_entries (required)
- ✅ accounting_accounts (required for metadata)
- ✅ companies/{companyId}/invoices (for AR reports)
- ✅ companies/{companyId}/vendorBills (for AP reports)

### Collections Storing REPORT DATA:
- ❌ NONE - Reports are computed on-the-fly

---

## Related Files Reference

**Report Service Files:**
- `/src/lib/reporting/gl-reports-service.ts` - Trial balance, GL by account, journal entries
- `/src/lib/reporting/financial-statements-service.ts` - Income statement, balance sheet, cash flow
- `/src/lib/reporting/ap-ar-reports-service.ts` - Aged receivables, aged payables
- `/src/lib/reporting/index.ts` - Public exports

**UI Integration:**
- `/app/workspace/[companyId]/reports/page.tsx` - Reports dashboard

**Rules & Configuration:**
- `/firestore.rules` - No report collection definitions
- `/src/types/accounting/fiscal-period.ts` - No balance storage

