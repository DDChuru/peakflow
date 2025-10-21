# Financial Reports Deletion Scope - Quick Reference

## The Bottom Line

**Financial reports are NOT stored in Firestore. They are computed on-the-fly.**

When you delete ledger entries, reports automatically reflect those changes. No additional cleanup needed.

---

## What Gets Deleted (Source Data)

```
DELETE:
├── general_ledger entries
│   ├── Trial balance automatically updates
│   ├── Balance sheet automatically updates
│   ├── Income statement automatically updates
│   ├── Cash flow statement automatically updates
│   └── GL account reports automatically update
│
└── journal_entries
    ├── Journal entries report automatically updates
    └── Related general_ledger entries deleted (cascade)
```

---

## What Does NOT Get Deleted (No Report Storage)

```
NO DELETION NEEDED:
├── reports (collection DOES NOT EXIST)
├── trial_balance (collection DOES NOT EXIST)
├── balance_sheet (collection DOES NOT EXIST)
├── income_statements (collection DOES NOT EXIST)
├── cash_flow_statements (collection DOES NOT EXIST)
├── report_cache (collection DOES NOT EXIST)
├── report_snapshots (collection DOES NOT EXIST)
├── report_archives (collection DOES NOT EXIST)
└── account_balances (collection DOES NOT EXIST)
```

---

## Report Services (All Compute-Only)

### 1. GL Reports Service
- Trial Balance Report
- GL by Account Report
- Journal Entries Report
- **Source:** general_ledger + journal_entries + accounting_accounts
- **Storage:** None

### 2. Financial Statements Service
- Income Statement (P&L)
- Balance Sheet
- Cash Flow Statement
- **Source:** general_ledger + accounting_accounts
- **Storage:** None

### 3. AP/AR Reports Service
- Aged Receivables
- Aged Payables
- AR Summary by Customer
- AP Summary by Vendor
- **Source:** invoices + vendorBills collections
- **Storage:** None

---

## Data Flow

```
User requests report
    ↓
Query Firestore collections (general_ledger, journal_entries, etc.)
    ↓
Compute aggregates in memory
    ↓
Return result to UI
    ↓
Display in browser
(Nothing written to Firestore)
```

---

## Firestore Collections Involved

### Primary Source Collections (Read by Reports)
- ✅ general_ledger
- ✅ journal_entries
- ✅ accounting_accounts (chart of accounts)
- ✅ companies/{companyId}/invoices (for AR reports)
- ✅ companies/{companyId}/vendorBills (for AP reports)

### Metadata Collections (Not Report Storage)
- ✅ fiscal_periods (metadata only: name, dates, status)
- ✅ companies/{companyId}/statements (customer/supplier statements, not financial reports)
- ✅ companies/{companyId}/cashFlowForecasts (forecasts, not actual cash flow reports)

### Report Storage Collections
- ❌ NONE - Reports are ephemeral, computed on-demand

---

## Key Files

```
/src/lib/reporting/
├── gl-reports-service.ts          (Trial balance, GL by account, journal entries)
├── financial-statements-service.ts (Income statement, balance sheet, cash flow)
├── ap-ar-reports-service.ts       (Aged receivables, aged payables)
└── index.ts                       (Public exports)

/app/workspace/[companyId]/reports/page.tsx
└── UI that calls these services to generate reports on-demand

/firestore.rules
└── Confirms NO report collection definitions
```

---

## Implementation Pattern

Reports follow a consistent pattern:

```typescript
async generateReport(date: Date): Promise<ReportType> {
  // Step 1: Query source data from Firestore
  const data = await this.querySourceData(date);
  
  // Step 2: Compute aggregates in memory
  const computed = this.computeAggregates(data);
  
  // Step 3: Return result (NO write to Firestore)
  return computed;
}
```

---

## FAQ

**Q: If I delete general_ledger entries, do reports become stale?**
A: No. Reports are generated fresh each time from current ledger data.

**Q: Do I need to purge report archives?**
A: No archives exist. Reports are not stored.

**Q: Are there cached report balances I need to invalidate?**
A: No caching layer exists. Each report generation queries fresh data.

**Q: Do fiscal periods store pre-calculated balances?**
A: No. Fiscal periods only store metadata (dates, names, status).

**Q: What if I delete invoices - do aged receivables reports break?**
A: They'll show fewer lines (those invoices won't appear), which is correct behavior.

**Q: Is there any async batch report generation?**
A: No. All report generation is on-demand, synchronous, and ephemeral.

---

## Summary Table

| Report Type | Storage | Query Source | Always Current |
|-------------|---------|--------------|-----------------|
| Trial Balance | ❌ None | general_ledger | ✅ Yes |
| Balance Sheet | ❌ None | general_ledger | ✅ Yes |
| Income Statement | ❌ None | general_ledger | ✅ Yes |
| Cash Flow | ❌ None | general_ledger | ✅ Yes |
| GL by Account | ❌ None | general_ledger | ✅ Yes |
| Journal Entries | ❌ None | journal_entries | ✅ Yes |
| Aged Receivables | ❌ None | invoices | ✅ Yes |
| Aged Payables | ❌ None | vendorBills | ✅ Yes |

---

**Conclusion: Zero additional cleanup required when deleting ledger data.**
